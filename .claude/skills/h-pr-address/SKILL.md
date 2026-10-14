---
name: h-pr-address
description: Use when a PR has review comments to work through, e.g. after h-pr-review requested changes ("address the review comments", "fix the PR comments").
---

# Address PR review comments

1. Load the review: `python3 .claude/harness/review/pr_review.py context`. Work through every
   thread with `"resolved": false`, plus findings in the summary that have no thread (status `open`,
   `not_fixed` or `rejected_reply`).
2. For each one, follow `superpowers:receiving-code-review`: check the claim against the code
   before acting. Then either:
   - **Fix it.** Make the change, keeping to the harness code standards. Commit each fix (or a
     tight group of related fixes) with a Conventional Commit message.
   - **Push back.** If the finding is wrong or not worth it, prepare a reply with the technical
     reasoning (what you checked, why the current code is right). Don't fix and don't resolve.
3. Run the project's full test command; everything must pass. Push.
4. Reply in every thread you handled, after pushing so the commit exists on GitHub:
   - fixed: `python3 .claude/harness/review/pr_review.py reply <thread_id> "Fixed in <short sha>: <what changed>"`,
     then `python3 .claude/harness/review/pr_review.py resolve <thread_id>`
   - pushed back: `reply <thread_id> "<reasoning>"` and leave it unresolved; the re-review judges it.
5. Summarize for the user what was fixed and what was pushed back, and offer to re-run `h-pr-review`.
   The re-review reads these replies, won't repeat earlier findings, and reopens a thread only if
   a fix doesn't hold or a pushback isn't convincing.
