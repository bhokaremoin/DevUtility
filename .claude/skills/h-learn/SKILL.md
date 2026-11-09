---
name: h-learn
description: Use when the user corrects you, states how they like things done, a fix took more than one attempt, or a review found a Critical or High issue, so the lesson reaches every future session in every project.
---

# Save a lesson

Save right away and without asking, then mention it in one line. The user can undo it.

1. Decide if it's worth a line in every future session. Skip one-off facts and typos, anything the
   code or git history already shows, and anything a harness rule already says.
2. Decide where it belongs:
   - Only matters to this project: add it to `CLAUDE.project.md` and stop.
   - Already in the lessons printed at session start: run `harness learn --again "<words from it>"`,
     then stop. A lesson that comes back is the signal `h-retro` uses to enforce it.
3. Save it: `harness learn --type mistake "<lesson>"`, or `--type preference` for how the user likes
   things done.

Write one sentence that says what to do, so it works without this session's context, and start with
the action: "Check the route config when adding a page; unknown slugs must return a real 404." Never
include secrets, tokens or customer data.

If `harness` isn't installed (e.g. cloud session), tell the user the lesson instead.
