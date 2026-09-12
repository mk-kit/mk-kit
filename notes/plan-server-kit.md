# Plan: `@mk-kit/server` — the backend every mk app rewrites

Written 2026-09-11. The Parse-like convenience without the Parse architecture:
a new app gets accounts, sessions, single sign-on, app passwords, an audit log
and a SQLite store in an afternoon — in-process, no service between.

## Why

mk-drive, momentum, planner, mk-board and gastronaut each carry the same
~1,000 lines: open SQLite with WAL, run a schema, add columns on upgrade,
users with scrypt passwords, server-side sessions with a cookie, a login
throttle, OIDC through `@mk-kit/auth`, Cloudflare Access mapping, app
passwords for scripts, an audit table. mk-drive's copy is the most complete
(`server/src/{db,users,auth,sso}.ts`, `routes/{account,app-passwords}.ts`)
and is the reference. The alternative — a database service that exposes
SQLite to other apps over the network — was considered and rejected: it
turns SQLite's strength (embedded, zero latency, one file) into a slower
Postgres. If two apps ever need one shared database, that is Postgres.

## Shape

One package, `projects/server`, next to `auth` and `validators`, Node ≥ 20,
ESM, type-stripping friendly, no build step for consumers. Fastify and
`@mk-kit/auth` as optional peers. Entry points:

| Entry | What it gives |
| --- | --- |
| `@mk-kit/server/store` | `openStore(file, { schema, columns })` → `DatabaseSync` with WAL, foreign keys, busy timeout, the schema statements run, `addColumn` for upgrades; `snapshot(db, path)` on `node:sqlite`'s `backup()`; `integrity(db)`. |
| `@mk-kit/server/users` | `Users(db)`: create/update/disable/remove, roles `admin`/`member`, scrypt hashes, `authenticate`, sessions (`createSession` with `via`, `session`, `sessionsOf`, revoke, purge), app passwords (sha256 of a random secret, prefix, last use), `audit()` + `auditList()`. Grants stay in the app: they are the app's own permission model. |
| `@mk-kit/server/auth` | `createIdentify({ users, throttle, access?, cookieName })` — the one function that turns a request into an identity (session cookie, `Basic email:secret`, `Bearer secret`, optional Access JWT via `@mk-kit/auth`), a `LoginThrottle`, `registerAuthHook(app, { open: [...], guard: (path) => bool })` with the Basic challenge for non-browser paths, `sessionOnly(req)`. |
| `@mk-kit/server/routes` | `registerAccountRoutes(app, { users, identify, sso?, passwordLogin })` — setup, login, logout (provider logout when the session began at the provider), me, sessions, name, password, app passwords; `registerAdminUserRoutes` optional. Response shapes = mk-drive's today (`Identity`, `Session`, `AppPassword`, `AuditEntry`) exported as types. |
| `@mk-kit/server/sso` | `SsoProvider` (lazy discovery, retried on login) + `registerSso(app, …)` mapping an identity's email to a local user — moved from mk-drive as is. |

Apps keep: their schema (passed in), their permission model, their routes.
The kit never owns a table the app did not ask for beyond `users`, `sessions`,
`app_passwords`, `audit`.

## Phases

1. **Surface** — write the README first: the five entry points above, one
   "new app in 40 lines" example, the env-var conventions
   (`<APP>_OIDC_*`, `<APP>_ADMIN_EMAIL/PASSWORD`, `<APP>_PASSWORD_LOGIN`,
   `<APP>_COOKIE_SECRET`). Decide the package name. ½ day.
2. **store + users** — lift `db.ts` + `users.ts` from mk-drive, generalise the
   schema runner, add `snapshot()`/`integrity()`, tests on `:memory:`. 1 day.
3. **auth + routes + sso** — lift `auth.ts`, `routes/account.ts`,
   `routes/app-passwords.ts`, `sso.ts`; tests with the in-process OIDC provider
   already in `projects/auth`; the throttle and the Basic challenge covered. 1–2 days.
4. **Adopt in mk-drive** — delete the duplicated code, keep grants/locations/
   shares; every existing mk-drive test must still pass unchanged. That is
   the acceptance test of the kit. 1 day.
5. **Adopt in momentum, planner, mk-board** — each replaces its own
   sessions/tokens with the kit's, keeping their single-user or allow-list
   modes (a `mode: 'single'` option: one account, no People page). 1 day each,
   as they come up.
6. **Docs + release** — a page on mk-kit.dev like `/auth`, `release-server.yml`
   like `release-auth.yml`, publish 0.1.0. ½ day.

## Decisions to hold

- No ORM, no query builder. Statements stay in the app; the kit runs the
  schema and adds columns. SQLite is the point.
- Passwords: scrypt with the same parameters as mk-drive; the hash format is
  the migration path (existing rows just work).
- Sessions and app passwords are the kit's tables; identity `via` is
  `session | token | access`.
- An app password can never manage the account (`sessionOnly` on those routes).
- The kit is framework-light: Fastify routes are one entry point; the identify
  function and the store work with any HTTP layer.
