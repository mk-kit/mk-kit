# mk-kit

Monorepo for **[@mk-kit/ui](./projects/mk-kit)** — a themable, accessible
Angular 22 component library for admin dashboards & UIs — and its documentation
site, live at **<https://mk-kit.dev>**.

```
projects/
  mk-kit/   → the publishable library (@mk-kit/ui)
  docs/     → the documentation & live-demo site
```

## Requirements

- Node.js ≥ 24.15 (or 22.22+)
- npm ≥ 10

## Develop

```bash
npm install

# Build the library (required before running the docs — the docs consume the
# built package via the @mk-kit/ui path mapping).
npm run build:lib

# Run the documentation site
npm start           # → http://localhost:4200

# Rebuild the library on change while developing
npm run watch:lib
```

Generated artefacts checked in CI (`--check`): `npm run gen:selectors`
(selector → class map for the StackBlitz button) and `npm run gen:api`
(`projects/docs/public/api.json`, `llms.txt`, `llms-full.txt` — the API
reference, extracted from the library sources). Re-run them after changing
any public export.

`projects/mcp/` is the `@mk-kit/mcp` MCP server (same version as the
library, bundles those artefacts): `npm run build:mcp` → `dist/mcp`,
`npm run test:mcp`.

## Build & publish the library

Published to the public npm registry as `@mk-kit/ui`, with a provenance
attestation, by the Release workflow. Bump the version in
`projects/mk-kit/package.json`, write its `CHANGELOG.md` section, and merge
to `main` — the workflow verifies the build, publishes, creates the `v*` tag
and the GitHub Release. Pushing a matching `v*` tag by hand works too.

Auth is npm trusted publishing (OIDC), so no token is stored in the repo.
To publish by hand: `npm run build:lib && cd dist/mk-kit && npm publish --access public`.

The build produces a standards-compliant Angular package (FESM2022 + typings)
with a `@mk-kit/ui` entry point per group and a `@mk-kit/ui/styles.css` subpath
export for the theme.

## Highlights

- **Angular 22**, standalone, `OnPush`, signals throughout (`input`/`model`/`output`).
- **CSS-variable theming** — re-brand by overriding `--mk-*` tokens.
- **Light & dark** out of the box (OS-aware + explicit override + `MkThemeService`).
- **WCAG 2.1 AA** — roles, aria wiring, keyboard nav, focus trapping, live regions.
  See the [accessibility statement](https://mk-kit.dev/accessibility) for what is verified and the known gaps.
- **Admin-oriented** — AppShell, sidebar nav, sortable tables, stat cards, dialogs, toasts.

See [projects/mk-kit/README.md](./projects/mk-kit/README.md) for library usage.

## License

MIT © Mateusz Kornaś
