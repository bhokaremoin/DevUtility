---
name: h-retro
description: Use when the user wants to review saved lessons or improve the harness from past work, or the session start says the lessons file is due for review ("run a retro", "clean up the lessons").
---

# Review the lessons

Keep `lessons.md` short and move what has proved itself into the permanent rules. Do the steps below
in the master clone (`harness where`). If `harness` isn't installed (e.g. cloud session), tell the
user this needs their machine and stop.

## 1. Gather evidence

`S` is the `Last retro:` date in `lessons.md`; leave it out on the first retro. Dispatch one agent
for the history, since it can be long, and have it return only repeated corrections and preferences,
each with the words the user used and how many sessions it appeared in.

- What the user typed: `harness history --since S`. Corrections, repeated requests and "no, ..."
  messages matter most. Ignore one-offs.
- Review comments: `gh pr list --state all --search "updated:>=S"` in each project under `~/apps`,
  then `gh api repos/<owner>/<repo>/pulls/<n>/comments` for those PRs.
- Claude's per-project memories: `~/.claude/projects/-Users-moin-apps*/memory/*.md` (adjust the path
  to the user's apps dir).
- Skip everything that is only a guess about the cause or that happened once.

## 2. Decide for each lesson and pattern

| Finding | Action |
|---|---|
| Duplicate or too specific | Merge it, or delete it |
| No longer true | Delete it |
| Repeated despite being written down (`seen 2x` or more) | Propose a test, lint rule or hook that enforces it |
| Stable preference or rule for every project | Propose moving it to `code-standards.md` or `working-rules.md` |
| Only matters to one project | Propose moving it to that project's `CLAUDE.project.md` |
| New pattern from the evidence | Add it to `lessons.md`, one sentence as `h-learn` describes |
| Still useful, not proven yet | Keep it |

Aim for well under 30 entries when done; every entry costs tokens in every session.

## 3. Apply

1. Show the user the list of proposed changes. Cleaning up `lessons.md` needs no approval; rules,
   tests, hooks and changes in projects do.
2. Set `Last retro:` in `lessons.md` to today.
3. If only `lessons.md` changed, commit it (`chore: review lessons`) and push. Projects aren't affected.
4. For approved rule changes, follow `h-harness-improve`.
5. Tell the user what changed, in plain words: how many lessons were added, merged, deleted and promoted.
