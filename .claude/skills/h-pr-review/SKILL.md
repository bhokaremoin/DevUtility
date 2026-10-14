---
name: h-pr-review
description: Use before merging a pull request, when a feature branch is finished and the user wants it reviewed, or to re-review a PR after its comments were addressed ("review this", "review the PR", "re-review", "ready to merge?"). Runs superpowers code reviewers with the harness requirements, a triage agent that filters findings, and posts inline comments plus a summary on the GitHub PR.
---

# PR review

Pipeline: **superpowers reviewers (one per focus area, in parallel) → triage agent → post to the PR.**
You are the coordinator: gather context, dispatch, post. Don't review the diff yourself and don't
change the triage agent's verdicts; if you disagree with one, tell the user separately.

Requirements live in `.claude/harness/review/`:
- `focus-areas.md`: one reviewer per `## ` section
- `filter-rules.md`: severity levels and what the triage agent keeps or drops
- `triage-prompt.md`: the triage agent's instructions and output format
- `pr_review.py`: reads review history from the PR and posts the review (`python3 .claude/harness/review/pr_review.py --help`)

## 1. Gather context

- The work must be committed and pushed, with an open PR. If there's no PR, offer to create one
  (`gh pr create`, Conventional Commit title, body: what changed, why, how it was tested).
- `python3 .claude/harness/review/pr_review.py context` gives the PR number, head commit, and any
  previous rounds: earlier findings with status and every review thread with its replies.
  `previous_round > 0` means this is a **re-review**.
- Range: `BASE_SHA=$(git merge-base origin/main HEAD)`, `HEAD_SHA=$(git rev-parse HEAD)`. On a
  re-review also note `previous_head` (changes since then: `git diff <previous_head>..HEAD`).
- Requirements: the PR description (`gh pr view --json title,body`), any plan or spec in
  `docs/superpowers/` for this work, and what the user told you. Write a short `DESCRIPTION` and
  `REQUIREMENTS` (what it must do, including the user journeys it supports).
- Verification: run the project's full test command (see `CLAUDE.project.md`) and keep a short
  summary of what ran and the result. Reviewers are read-only and don't run tests.

## 2. Dispatch the reviewers (superpowers template)

```sh
ls -d ~/.claude/plugins/cache/*/superpowers/*/skills/requesting-code-review/code-reviewer.md | sort -V | tail -1
```

If the template isn't found, tell the user superpowers isn't installed here and stop.

Read the template and `focus-areas.md`. For **each** focus area, dispatch one `general-purpose`
subagent, **all in one message so they run in parallel**, using the template's prompt with
`[DESCRIPTION]`, `[BASE_SHA]`, `[HEAD_SHA]` filled in and `[PLAN_OR_REQUIREMENTS]` set to your
requirements followed by:

```
## Test results
<summary of the test run>

## Review focus: <focus area title>
You are one of several reviewers; each covers one focus area. Spend your effort on this area and
report issues outside it only if they are Critical or High.
<the focus area's full section from focus-areas.md>

## Severity (overrides the template's Critical/Important/Minor)
Grade every issue Critical, High, Medium or Low as defined in .claude/harness/review/filter-rules.md,
and label each as Functional (breaks or risks behavior) or Code quality. Keep the template's
file:line / what / why / fix format for each issue.

## Standards to review against
Read before reviewing: CLAUDE.project.md, .claude/harness/knowledge/code-standards.md,
.claude/harness/knowledge/working-rules.md, .claude/harness/review/filter-rules.md

<only on a re-review:>
## Earlier review rounds
These findings were already raised (with their status). Don't raise them again. Focus on changes
since <previous_head> and on whether the earlier findings were actually fixed.
<findings list from the context output>
```

## 3. Dispatch the triage agent

When every reviewer has returned, dispatch one `general-purpose` subagent with the prompt in
`triage-prompt.md`, placeholders filled with the range, description, requirements, test summary,
each reviewer's full output labelled by focus area, and (re-review) the full `context` JSON.
Don't summarize or pre-filter reviewer output.

## 4. Post to the PR

Save the JSON block from the triage agent's answer to a temp file and run:

```sh
python3 .claude/harness/review/pr_review.py post <file>
```

It posts each finding as an inline comment on its line (findings outside the diff go into the
summary), one summary comment with the verdict, tests, per-reviewer counts, earlier-findings status
and the filtered-out list, and on a re-review replies in and resolves/reopens earlier threads. The
verdict is computed by the script: **changes requested** while any finding is open, otherwise
**approved**. GitHub doesn't let an account approve its own PR, so in that case the verdict is
posted as a comment review with the verdict in its title.

Tell the user the verdict, the counts, and the review link. If changes were requested, offer to
address them with the `h-pr-address` skill.
