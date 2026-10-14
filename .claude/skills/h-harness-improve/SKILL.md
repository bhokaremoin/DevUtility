---
name: h-harness-improve
description: Use when the user wants to change, add to, or improve the shared harness (rules, knowledge, skills, agents, settings that apply to all projects), or when a lesson learned in this project should apply to every project.
---

# Improve the harness

The harness files in this project (`CLAUDE.md`, `.claude/harness/`, `.claude/skills/h-*`,
`.claude/agents/h-*`, harness entries in `.claude/settings.json`) are synced copies. Editing them
here is pointless: the next sync stops on them or overwrites them. Make the change upstream.

1. Find the master clone: run `harness where` (default `~/code/apps-harness`). If `harness` is not
   installed (e.g. cloud session), tell the user the change to make and stop.
2. Read its `README.md` and `CLAUDE.md` for the layout and rules. In short:
   - `template/` mirrors a project root; everything in it is copied into projects.
   - `settings.json` (repo root) is merged into each project's `.claude/settings.json`.
   - New skills/agents get the `h-` prefix.
3. Make the change in the master clone. Keep always-loaded knowledge files short.
4. Bump `VERSION` and add an entry at the top of `CHANGELOG.md` (rules are at the top of that file).
5. Run the harness tests: `python3 tests/test_harness.py && python3 tests/test_pr_review.py` in the master clone.
6. Show the user the diff, then commit (message starts with `vX.Y.Z:`) and `git push`.
7. Run `harness sync` in this project and tell the user that other projects update with
   `harness sync --all`.

Project-only knowledge does not belong in the harness: put it in `CLAUDE.project.md`.
