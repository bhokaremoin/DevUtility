# Review focus areas

Each `## ` section below gets its own reviewer. Add, remove or edit sections to change what gets
reviewed; the `h-pr-review` skill picks them up automatically. Keep each section a checklist of
what matters to *me*, not generic best practice.

## Use cases and correctness

- Does the change do what the requirements say? Walk through each user journey end to end:
  the happy path and the main failure paths (invalid input, missing data, no permission, network
  or service failure).
- Edge cases a real user will hit: empty states, first-time use, very long or large input,
  duplicates, repeated taps/requests, concurrent edits, time zones and dates.
- Roles and permissions: every user type sees and can do exactly what it should.
- Regressions: does the change break or alter existing behavior elsewhere?
- Data integrity: can this lose, corrupt or leak data? Are migrations safe for existing data?

## Code quality and standards

- Review against `.claude/harness/knowledge/code-standards.md` in full.
- Names: meaningful, domain-specific, consistent with the ecosystem and the project; no generic
  `data`/`utils`/`manager`/`helper` names or guessable-only abbreviations.
- Simplicity: could a developer with 2-3 years of experience understand it by reading it? Flag
  clever code, deep nesting, needless abstraction, indirection, or speculative generality.
- Structure: feature-first organization, business logic kept out of routes/components, files and
  functions doing one thing, consistency with the existing patterns in the project.
- Comments: flag comments that restate the code and commented-out code; flag missing *why*
  comments only where code is genuinely non-obvious (workaround, quirk, business rule).
- Dead code, unused imports, debug output, leftover TODOs.

## Tests and verification

- Do the tests prove the new behavior and the failure cases, or only that the code runs?
- Name each untested behavior concretely (which input, which path).
- Were any existing tests weakened, skipped or deleted? That is always a Blocker unless justified.
- Does the change meet the project's definition of done in `CLAUDE.project.md` (e.g. required
  E2E flows)?
- Do the test results passed in actually show everything passing?

## Security and production readiness

- Authentication and authorization on every new endpoint, screen and action.
- Input validation at the edges; injection (SQL, command, path), unsafe deserialization.
- Secrets: nothing hardcoded or logged; config from environment variables.
- Error handling: no swallowed exceptions; errors reach the user as clear messages, not stack traces.
- Obvious performance problems at this app's realistic scale (N+1 queries, unbounded lists).
