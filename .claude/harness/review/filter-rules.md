# Triage rules

The triage agent applies these rules to every reviewer finding. When a rule here conflicts with a
reviewer's opinion, the rule wins. Add your own rules under "My rules".

## Severity
Reviewers grade every finding; the triage agent re-grades if the reviewer got it wrong.
- **Critical**: breaks functionality or a user journey, security hole, data loss/corruption/leak,
  failing or weakened tests.
- **High**: a bug in a realistic scenario, a requirement or edge journey that doesn't work, or a
  code-quality problem that will clearly hurt whoever works on this next (meaningless names on
  new modules/APIs, tangled structure, business logic in the wrong layer).
- **Medium**: real but smaller: a minor edge case, a clear code-standards violation, a missing
  test for a specific behavior.
- **Low**: polish, preference, nits.

## What gets posted
- **Critical and High: always**, once verified.
- **Medium: only if it matters and is an easy win**: a real improvement, localized, fixable in
  roughly 15 minutes without redesign. Otherwise drop it.
- **Low: never.**

Every posted finding is labelled **Functional** (breaks or risks behavior) or **Code quality**.
Functional findings come first.

## Always drop
- Findings about code this change didn't touch, unless the change makes the problem reachable or worse.
- Speculation without a concrete scenario ("could be an issue", "might not scale", "consider").
- Requests to add comments or docstrings to code that is already clear.
- Premature abstraction: DRY-ing two or three similar blocks, making things configurable, adding
  interfaces or layers for hypothetical future needs.
- Style that the formatter/linter handles, or that matches the project's existing convention.
- "Add more tests" without naming a specific untested behavior.
- Enterprise-scale concerns that don't fit a personal app (horizontal scaling, i18n, multi-region,
  heavy observability) unless the requirements ask for them.
- Anything contradicted by the actual code (always open the file and check).
- Duplicates: merge findings that describe the same problem; credit every reviewer that raised it.

## Re-reviews
- Never raise an earlier finding again as a new finding. Judge it in the earlier-findings list:
  - **fixed**: the code now handles it.
  - **not_fixed**: claimed fixed or left open, but the problem is still there.
  - **accepted_reply**: the developer pushed back and the reasoning holds. Accept good reasoning
    even if you'd have done it differently.
  - **rejected_reply**: the pushback doesn't hold; reply with the concrete reason.
- New findings only on lines changed since the previous round, unless Critical.
- Earlier findings that were resolved and whose code didn't change since stay as they are; skip them.

## My rules
<!-- Add your own keep/drop rules here. -->
