# mk-kit

Monorepo for **[@mkornas/ui](./projects/mk-kit)** — a themable, accessible
Angular 22 component library for admin dashboards & UIs — and its documentation
site.

```
projects/
  mk-kit/   → the publishable library (@mkornas/ui)
  docs/     → the documentation & live-demo site
```

## Requirements

- Node.js ≥ 24.15 (or 22.22+)
- npm ≥ 10

## Develop

```bash
npm install

# Build the library (required before running the docs — the docs consume the
# built package via the @mkornas/ui path mapping).
npm run build:lib

# Run the documentation site
npm start           # → http://localhost:4200

# Rebuild the library on change while developing
npm run watch:lib
```

## Build & publish the library

Published **privately to GitHub Packages** as `@mkornas/ui`. Pushing a `v*` tag
runs the Release workflow, which builds, tests, and publishes with the built-in
`GITHUB_TOKEN`:

```bash
# bump projects/mk-kit/package.json version, then:
git tag v0.1.0 && git push origin v0.1.0
```

To publish by hand: export a PAT with `write:packages` as `NODE_AUTH_TOKEN`,
then `npm run build:lib && cd dist/mk-kit && npm publish`.

The build produces a standards-compliant Angular package (FESM2022 + typings)
with a `@mkornas/ui` entry point and a `@mkornas/ui/styles.css` subpath export for
the theme.

## Highlights

- **Angular 22**, standalone, `OnPush`, signals throughout (`input`/`model`/`output`).
- **CSS-variable theming** — re-brand by overriding `--mk-*` tokens.
- **Light & dark** out of the box (OS-aware + explicit override + `MkThemeService`).
- **WCAG 2.1 AA** — roles, aria wiring, keyboard nav, focus trapping, live regions.
- **Admin-oriented** — AppShell, sidebar nav, sortable tables, stat cards, dialogs, toasts.

See [projects/mk-kit/README.md](./projects/mk-kit/README.md) for library usage.

## License

MIT © Mateusz Kornaś
