## Code standards

Write code the way a well-run open-source project would accept it. When the project already has
a convention, follow it; otherwise use the language's community standard (PEP 8 for Python, the
TypeScript/React community conventions for TS, `gofmt`/Effective Go for Go, etc.) and the
project's formatter and linter.

### Names
- Every name says what the thing is or does in the domain: `pendingOrders`, `calculate_daily_revenue`,
  `OrderRepository`, `order_items` table. No `data`, `info`, `temp`, `obj`, `handle`, `manager`,
  `utils`, `helper`, `x`, `res2`, or abbreviations a newcomer would have to guess.
- Functions are verbs (`send_invoice`), booleans read as questions (`is_active`, `has_access`),
  collections are plural, constants are `UPPER_SNAKE_CASE`.
- Follow the ecosystem's casing for files, types, DB objects and API fields (e.g. Python
  `snake_case.py`, React components `PascalCase.tsx`, SQL tables `snake_case` plural, REST paths
  `kebab-case` plural nouns). One naming style per layer; never mix.
- Services, apps, packages, tables, env vars and branches get short, meaningful names that a
  stranger could guess the purpose of (`billing-service`, `ORDERS_DB_URL`), not clever or generic ones.

### Structure
- Organize by feature/domain first (`orders/`, `users/`), then by layer inside it when the
  feature is big enough. A newcomer should find the code for a feature by its name.
- Small, focused files and functions, each doing one thing. Split when a file needs scrolling
  to understand, not by arbitrary line counts.
- Keep boundaries obvious: HTTP/UI layer, business logic, data access. Business rules don't
  live in route handlers or components.
- Config and secrets come from environment variables, never hardcoded.

### Simple over clever
- Prefer plain, explicit code even if it is longer. No clever one-liners, deep nesting,
  metaprogramming, or abstractions built for imagined future needs. Three similar lines beat a
  premature abstraction.
- Use early returns and guard clauses instead of nested conditionals.
- Reach for a new dependency or pattern only when it clearly removes complexity; say why.
- Someone should understand a module by reading it, without opening other docs.

### Comments
- The code explains itself through names and structure; don't comment what the code already says.
- Comment only the *why* that code cannot show: a workaround, a platform quirk, a non-obvious
  business rule, a link to an issue. No commented-out code, no change-log comments, no
  docstrings that just restate the function name.

### Quality
- Handle errors deliberately: validate input at the edges, fail with clear messages, never
  swallow exceptions silently.
- Tests read like specifications: descriptive test names, one behavior per test.
- No dead code, unused imports, debug prints or TODOs left behind; the linter and type checker pass.
