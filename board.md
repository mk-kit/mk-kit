---
kanban-plugin: board
updated: 2026-09-11
---

# mk-kit

One card per line, ranked top-down inside each column. `#p0`..`#p3` = priority, `[[name]]` = notes/name.md.

## Now

## Next

- [ ] **@mk-kit/server — the surface** README first: store / users / auth / routes / sso entry points, the 40-line new-app example, env conventions; decide the package name [[plan-server-kit]] #p2 #server
- [ ] **@mk-kit/server — store + users** lift db.ts + users.ts from mk-drive, schema runner + addColumn, snapshot() on node:sqlite backup(), integrity(); tests on :memory: [[plan-server-kit]] #p2 #server
- [ ] **@mk-kit/server — auth + routes + sso** identify (cookie / Basic / Bearer / Access), throttle, auth hook with the Basic challenge, sessionOnly, account + app-password routes, SsoProvider; tests with the in-process OIDC provider from projects/auth [[plan-server-kit]] #p2 #server
- [ ] **@mk-kit/server — adopt in mk-drive** delete the duplicated ~1,000 lines, keep grants/locations/shares; every mk-drive test passes unchanged = the kit's acceptance test [[plan-server-kit]] #p2 #server
- [ ] **@mk-kit/server — adopt in momentum, planner, mk-board** single-account / allow-list modes, replace their own sessions and tokens [[plan-server-kit]] #p3 #server
- [ ] **@mk-kit/server — docs + release** page on mk-kit.dev like /auth, release-server.yml, publish 0.1.0 [[plan-server-kit]] #p3 #server

## Later

## Done
