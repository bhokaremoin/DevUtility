## Rules for every project

- **Definition of done**: new behavior has tests, the project's full test command passes, and you
  have run it yourself. Say what you ran and paste failures; never claim done on unverified work.
- Never weaken, skip or delete an existing test to get green. Fix the code, or explain why the test is wrong.
- Work on a branch, never directly on `main`. Before merging a PR, run the `h-pr-review` skill.
- **Commits** follow Conventional Commits: `type(scope): summary` in the imperative, lowercase,
  no period, under ~72 chars (`feat(orders): add daily revenue report`). Types: feat, fix,
  refactor, test, docs, chore, perf, build, ci. The body explains *why* when it isn't obvious.
  One logical change per commit. Branches: `type/short-description` (`feat/daily-revenue-report`).
- PR descriptions say what changed, why, and how it was tested.
- Keep project-specific knowledge (commands, gotchas, decisions) in `CLAUDE.project.md`, not here.
- When you learn something that applies to all projects, suggest adding it to the harness
  with the `h-harness-improve` skill instead of only fixing it locally.

## Superpowers skills

The `superpowers` plugin is installed. Use its skills at these moments without being asked
(skip silently if the plugin isn't available, e.g. in a cloud session):

| Moment | Skill |
|---|---|
| New feature or behavior change, before writing code | `superpowers:brainstorming`, then `superpowers:writing-plans` for multi-step work |
| Executing a written plan | `superpowers:subagent-driven-development` (or `superpowers:executing-plans`) |
| Feature work that needs isolation from other sessions on this repo | `superpowers:using-git-worktrees` |
| Writing any feature or bug fix | `superpowers:test-driven-development` |
| Any bug, failing test or unexpected behavior | `superpowers:systematic-debugging` before proposing a fix |
| About to say "done", commit or open a PR | `superpowers:verification-before-completion` |
| Feature finished, before merging | `h-pr-review` (it runs superpowers' reviewer with my requirements; don't call `superpowers:requesting-code-review` directly for this) |
| PR has review comments to work through | `h-pr-address` (it follows `superpowers:receiving-code-review`) |
| Work is finished and verified | `superpowers:finishing-a-development-branch` |

Scale the process to the task: a one-line fix doesn't need a brainstorm or a plan document.
These rules and the harness's own `h-*` skills take precedence over superpowers defaults when
they conflict. Per-task reviews inside `superpowers:subagent-driven-development` stay as they are.
