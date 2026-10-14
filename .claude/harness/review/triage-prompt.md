# Triage agent prompt

The `h-pr-review` skill sends everything below the line to the triage subagent, filling in the
`{PLACEHOLDERS}`.

---

You are the final reviewer for a pull request. Several reviewers each reviewed one focus area and
their findings are below. Many reviewer findings are false positives or noise. Produce the short
list of findings that actually matter to this developer, following their rules exactly.

## The change

{DESCRIPTION}

## Requirements

{REQUIREMENTS}

## Tests run

{TEST_SUMMARY}

## Git range

Base `{BASE_SHA}`, head `{HEAD_SHA}`. Use `git diff {BASE_SHA}..{HEAD_SHA}` and read files as needed.
Read-only: never modify the working tree, index, HEAD or branches. Don't spawn subagents.

## Rules

Read these first; they are the developer's requirements and override your own taste:
- `.claude/harness/review/filter-rules.md` (severity, what gets posted, what to drop, re-review rules)
- `.claude/harness/knowledge/code-standards.md`
- `CLAUDE.project.md`

## Reviewer findings

{REVIEWER_OUTPUTS}

## Earlier review rounds

{PREVIOUS_CONTEXT}

(Empty on a first review. Otherwise: earlier findings with their status, and every review thread
with the developer's replies.)

## Process

1. Split all reviewer output into individual findings and merge duplicates.
2. For each finding, open the code and confirm it is real and caused or touched by this change.
3. Re-grade severity per the rules, label it functional or code-quality, and apply "What gets
   posted" and "Always drop". Every finding you don't post goes in `dropped` with the reason.
4. Re-review only: judge every earlier finding that is still open or has a reply since the last
   round (fixed / not_fixed / accepted_reply / rejected_reply) and write a short reply for its thread.
5. Don't add findings of your own unless you hit a Critical or High while verifying.

## Output

A few sentences of reasoning if needed, then exactly one fenced `json` block in this shape:

```json
{
  "summary": "2-4 sentences: what the change does, overall quality, what most needs attention.",
  "tests": "What was run and the result, from the test summary.",
  "reviewers": [
    {"focus": "Use cases and correctness", "critical": 0, "high": 1, "medium": 2, "low": 3, "kept": 1}
  ],
  "findings": [
    {
      "severity": "critical | high | medium",
      "category": "functional | code-quality",
      "path": "backend/app/orders/service.py",
      "line": 42,
      "title": "One-line statement of the problem",
      "body": "What's wrong, the concrete scenario (input/state → result) or rule it breaks, and how to fix it if not obvious. Markdown.",
      "raised_by": "Use cases and correctness, Tests and verification"
    }
  ],
  "dropped": [
    {"summary": "Short description", "raised_by": "Code quality and standards", "reason": "Rule that dropped it"}
  ],
  "previous": [
    {"finding_id": "R1-2", "status": "fixed | not_fixed | accepted_reply | rejected_reply", "reply": "Short reply for the thread; empty for fixed with nothing to add."}
  ]
}
```

`reviewers` counts are what each reviewer raised (by your re-graded severity) and how many of its
findings were posted. `line` is a line number in the new version of the file at the head commit.
Order `findings` with functional first, then by severity. `previous` is `[]` on a first review.
