#!/usr/bin/env python3
"""GitHub side of the h-pr-review and h-pr-address skills.

  context [--pr N]                 JSON: PR, previous review round, findings and review threads
  post FINDINGS_JSON [--pr N]      Post a review: inline comments + summary, apply thread actions
  reply THREAD_ID BODY             Reply in a review thread
  resolve THREAD_ID                Mark a review thread resolved
  unresolve THREAD_ID              Reopen a review thread

Review state lives on the PR: the summary comment carries a hidden state marker and each inline
comment carries its finding id, so any session on any machine can continue the review.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile

STATE_MARKER = "h-pr-review-state"
FINDING_MARKER = "h-pr-review-finding"
SEVERITIES = ["critical", "high", "medium", "low"]
OPEN_STATUSES = {"open", "not_fixed", "rejected_reply"}
STATUS_LABELS = {
    "open": "Open",
    "fixed": "Fixed",
    "accepted_reply": "Reply accepted",
    "not_fixed": "Not fixed",
    "rejected_reply": "Reply not accepted",
}
OWN_PR_ERRORS = ("own pull request",)


class GitHubError(Exception):
    pass


# ---------- gh wrappers ----------

def gh(*args, payload=None):
    cmd = ["gh"] + list(args)
    if payload is not None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(payload, f)
        cmd += ["--input", f.name]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise GitHubError((result.stderr + " " + result.stdout).strip())
    return result.stdout


def graphql(query, **variables):
    args = ["api", "graphql", "-f", "query=" + query]
    for key, value in variables.items():
        # -F converts types (needed for Int!) but also reads "@file" values, so strings use -f.
        flag = "-F" if isinstance(value, int) else "-f"
        args += [flag, "%s=%s" % (key, value)]
    return json.loads(gh(*args))["data"]


def current_pr(number=None):
    args = ["pr", "view"] + ([str(number)] if number else []) + ["--json", "number,headRefOid,url"]
    pr = json.loads(gh(*args))
    repo = json.loads(gh("repo", "view", "--json", "owner,name"))
    pr["owner"], pr["repo"] = repo["owner"]["login"], repo["name"]
    return pr


# ---------- pure helpers (unit tested) ----------

def commentable_lines(patch):
    """Line numbers on the new side of a unified diff patch that GitHub accepts comments on."""
    lines, new_line = set(), 0
    for row in (patch or "").splitlines():
        hunk = re.match(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@", row)
        if hunk:
            new_line = int(hunk.group(1))
            continue
        if row.startswith("-") or row.startswith("\\"):
            continue
        if new_line:
            lines.add(new_line)
            new_line += 1
    return lines


def embed_json(marker, data):
    # ">" never appears outside JSON strings, so escaping it keeps "-->" out of the HTML comment.
    return "<!-- %s %s -->" % (marker, json.dumps(data, separators=(",", ":")).replace(">", "\\u003e"))


def extract_json(marker, text):
    match = re.search(r"<!-- %s (.*?) -->" % re.escape(marker), text or "", re.S)
    return json.loads(match.group(1)) if match else None


def extract_finding_id(text):
    match = re.search(r"<!-- %s (\S+) -->" % re.escape(FINDING_MARKER), text or "")
    return match.group(1) if match else None


def severity_label(finding):
    category = "Functional" if finding.get("category") == "functional" else "Code quality"
    return "%s · %s" % (finding["severity"].capitalize(), category)


def inline_body(finding):
    return "**%s**: %s\n\n%s\n\n<sub>Raised by %s · %s</sub>\n%s" % (
        severity_label(finding), finding["title"], finding["body"].strip(),
        finding.get("raised_by", "reviewer"), finding["id"],
        "<!-- %s %s -->" % (FINDING_MARKER, finding["id"]))


def decide_verdict(new_findings, previous):
    still_open = [p for p in previous if p.get("status") in OPEN_STATUSES]
    return "request_changes" if new_findings or still_open else "approve"


def build_review(result, previous_state, head_sha, valid_lines):
    """Turn the triage agent's result into a GitHub review payload and the new state.

    valid_lines maps file path -> set of commentable line numbers.
    """
    round_number = (previous_state or {}).get("round", 0) + 1
    findings = []
    for index, finding in enumerate(result.get("findings", []), start=1):
        finding = dict(finding, id="R%d-%d" % (round_number, index), severity=finding["severity"].lower())
        finding["inline"] = finding.get("line") in valid_lines.get(finding.get("path"), set())
        findings.append(finding)

    previous_updates = {p["finding_id"]: p for p in result.get("previous", [])}
    history = []
    for old in (previous_state or {}).get("findings", []):
        update = previous_updates.get(old["id"])
        history.append(dict(old, status=update["status"]) if update else old)

    verdict = decide_verdict(findings, list(previous_updates.values()))
    comments = [{"path": f["path"], "line": f["line"], "side": "RIGHT", "body": inline_body(f)}
                for f in findings if f["inline"]]
    state = {
        "round": round_number,
        "head": head_sha,
        "findings": history + [
            {key: f.get(key) for key in ("id", "severity", "category", "path", "line", "title")}
            for f in findings
        ],
    }
    for entry in state["findings"][len(history):]:
        entry["status"] = "open"
    body = render_summary(result, findings, history, previous_updates, verdict, round_number, state)
    return {"commit_id": head_sha, "body": body, "event": verdict.upper(), "comments": comments}, findings, verdict


def render_summary(result, findings, history, previous_updates, verdict, round_number, state):
    verdict_text = "Approved" if verdict == "approve" else "Changes requested"
    out = ["## PR review, round %d: %s" % (round_number, verdict_text), ""]
    if result.get("summary"):
        out += [result["summary"].strip(), ""]
    if result.get("tests"):
        out += ["**Tested:** " + result["tests"].strip(), ""]

    reviewers = result.get("reviewers", [])
    if reviewers:
        out += ["### Reviewers", "", "| Focus | Critical | High | Medium | Low | Posted |", "|---|---|---|---|---|---|"]
        for r in reviewers:
            out.append("| %s | %s | %s | %s | %s | %s |" % (
                r.get("focus", "?"), *[r.get(s, 0) for s in SEVERITIES], r.get("kept", 0)))
        out.append("")

    out += ["### New findings (%d)" % len(findings), ""]
    if findings:
        out += ["| ID | Severity | Location | Finding |", "|---|---|---|---|"]
        for f in findings:
            location = "`%s:%s`" % (f.get("path"), f.get("line"))
            if not f["inline"]:
                location += " (below)"
            out.append("| %s | %s | %s | %s |" % (f["id"], severity_label(f), location, f["title"]))
        out.append("")
    else:
        out += ["None.", ""]

    outside = [f for f in findings if not f["inline"]]
    if outside:
        out += ["### Findings outside the diff", ""]
        for f in outside:
            out += ["**%s · %s**: %s (`%s:%s`)" % (f["id"], severity_label(f), f["title"], f.get("path"), f.get("line")),
                    "", f["body"].strip(), ""]

    if history:
        out += ["### Earlier findings", "", "| ID | Finding | Status | Note |", "|---|---|---|---|"]
        for old in history:
            note = previous_updates.get(old["id"], {}).get("reply", "").replace("\n", " ")
            out.append("| %s | %s | %s | %s |" % (
                old["id"], old.get("title", ""), STATUS_LABELS.get(old.get("status"), old.get("status")), note))
        out.append("")

    dropped = result.get("dropped", [])
    if dropped:
        out += ["<details><summary>Filtered out (%d)</summary>" % len(dropped), ""]
        for d in dropped:
            out.append("- %s (%s): %s" % (d.get("summary", ""), d.get("raised_by", "?"), d.get("reason", "")))
        out += ["", "</details>", ""]

    out.append(embed_json(STATE_MARKER, state))
    return "\n".join(out)


def previous_state_from_reviews(reviews):
    for review in reversed(reviews):
        state = extract_json(STATE_MARKER, review.get("body"))
        if state:
            return state
    return None


# ---------- commands ----------

PR_QUERY = """
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviews(last: 50) { nodes { body createdAt } }
      reviewThreads(first: 100) {
        nodes {
          id isResolved isOutdated path line
          comments(first: 50) { nodes { author { login } body createdAt } }
        }
      }
    }
  }
}
"""


def load_context(pr):
    data = graphql(PR_QUERY, owner=pr["owner"], repo=pr["repo"], number=pr["number"])["repository"]["pullRequest"]
    state = previous_state_from_reviews(data["reviews"]["nodes"])
    threads = []
    for node in data["reviewThreads"]["nodes"]:
        comments = node["comments"]["nodes"]
        if not comments:
            continue
        threads.append({
            "thread_id": node["id"],
            "finding_id": extract_finding_id(comments[0]["body"]),
            "path": node["path"],
            "line": node["line"],
            "resolved": node["isResolved"],
            "outdated": node["isOutdated"],
            "comment": comments[0]["body"],
            "replies": [{"author": (c["author"] or {}).get("login"), "body": c["body"]} for c in comments[1:]],
        })
    return state, threads


def cmd_context(args):
    pr = current_pr(args.pr)
    state, threads = load_context(pr)
    print(json.dumps({
        "pr": pr["number"], "url": pr["url"], "head": pr["headRefOid"],
        "previous_round": (state or {}).get("round", 0),
        "previous_head": (state or {}).get("head"),
        "findings": (state or {}).get("findings", []),
        "threads": threads,
    }, indent=2))


def reply(thread_id, body):
    graphql("mutation($id: ID!, $body: String!) { addPullRequestReviewThreadReply("
            "input: {pullRequestReviewThreadId: $id, body: $body}) { comment { id } } }", id=thread_id, body=body)


def set_resolved(thread_id, resolved):
    name = "resolveReviewThread" if resolved else "unresolveReviewThread"
    graphql("mutation($id: ID!) { %s(input: {threadId: $id}) { thread { id } } }" % name, id=thread_id)


def file_lines(pr):
    files = json.loads(gh("api", "--paginate", "--slurp",
                          "repos/%s/%s/pulls/%s/files?per_page=100" % (pr["owner"], pr["repo"], pr["number"])))
    pages = files if files and isinstance(files[0], list) else [files]
    return {f["filename"]: commentable_lines(f.get("patch")) for page in pages for f in page}


def cmd_post(args):
    with open(args.findings) as f:
        result = json.load(f)
    pr = current_pr(args.pr)
    state, threads = load_context(pr)
    payload, findings, verdict = build_review(result, state, pr["headRefOid"], file_lines(pr))

    endpoint = "repos/%s/%s/pulls/%s/reviews" % (pr["owner"], pr["repo"], pr["number"])
    try:
        review = json.loads(gh("api", "-X", "POST", endpoint, payload=payload))
    except GitHubError as error:
        if not any(text in str(error) for text in OWN_PR_ERRORS):
            raise
        payload["event"] = "COMMENT"
        review = json.loads(gh("api", "-X", "POST", endpoint, payload=payload))

    threads_by_finding = {t["finding_id"]: t for t in threads if t["finding_id"]}
    for update in result.get("previous", []):
        thread = threads_by_finding.get(update["finding_id"])
        if not thread:
            continue
        if update.get("reply"):
            reply(thread["thread_id"], update["reply"])
        should_resolve = update["status"] not in OPEN_STATUSES
        if should_resolve != thread["resolved"]:
            set_resolved(thread["thread_id"], should_resolve)

    inline = sum(1 for f in findings if f["inline"])
    print("posted %s review (%s): %d inline comments, %d findings in the summary only"
          % (verdict, payload["event"], inline, len(findings) - inline))
    print(review.get("html_url", pr["url"]))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("context")
    p.add_argument("--pr", type=int)
    p.set_defaults(func=cmd_context)
    p = sub.add_parser("post")
    p.add_argument("findings")
    p.add_argument("--pr", type=int)
    p.set_defaults(func=cmd_post)
    p = sub.add_parser("reply")
    p.add_argument("thread_id")
    p.add_argument("body")
    p.set_defaults(func=lambda a: reply(a.thread_id, a.body))
    p = sub.add_parser("resolve")
    p.add_argument("thread_id")
    p.set_defaults(func=lambda a: set_resolved(a.thread_id, True))
    p = sub.add_parser("unresolve")
    p.add_argument("thread_id")
    p.set_defaults(func=lambda a: set_resolved(a.thread_id, False))
    args = parser.parse_args()
    try:
        args.func(args)
    except GitHubError as error:
        print("error: %s" % error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
