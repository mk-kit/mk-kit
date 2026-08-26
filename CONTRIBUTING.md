# Contributing to mk-kit

Thanks for helping. This document covers the workflow, the quality bar every
change has to meet, and the Developer Certificate of Origin that all
contributions are made under.

## Ground rules

- **Bugs and small fixes:** open a pull request directly.
- **New components or behaviour changes:** open an issue first so we can agree
  on the API and where it fits before you invest time. `ROADMAP.md` lists what
  is planned.
- **Security issues:** do not open a public issue — see `SECURITY.md`.
- Be kind and specific in reviews; assume good intent.

## Setup

- Node **24.15 or newer** and npm 11 (the Angular 22 CLI refuses older Node).
- `npm ci`
- `npm run build:lib` — builds the library into `dist/mk-kit`. The docs app
  imports the library from there, so **build the library before serving or
  testing the docs**.
- `npm start` — docs site with live reload at `http://localhost:4200`.
- `npm run watch:lib` in a second terminal rebuilds the library on change.

## Repository layout

| Path | What lives there |
|---|---|
| `projects/mk-kit/<entry>/` | The library, one folder per secondary entry point (`forms`, `table`, `charts`, `navigation`, …). Each has an `index.ts` barrel and `ng-package.json`. |
| `projects/mk-kit/src/styles/` | The theme: every visual value is a `--mk-*` custom property in `mk-kit.scss`; light and dark tokens live side by side. |
| `projects/mk-kit/core/` | Shared services (overlay, focus trap, live announcer, theme, i18n, icons). |
| `projects/docs/` | The documentation site — also the visual-regression and manual-testing surface. |
| `visual-tests/` | Playwright screenshot sweep over docs routes (Linux baselines). |
| `CHANGELOG.md` | Keep-a-Changelog format; every user-visible change gets an entry under **Unreleased**. |

## Quality bar

A pull request is ready when all of these hold:

1. **Tests.** New behaviour has Vitest specs next to the code. `npm test` is
   green. Controls that hold a value must pass the shared conformance suites
   (`cva-conformance.spec.ts`, `forms-integration.spec.ts`) — add your
   component to their fixture lists.
2. **Accessibility.** Keyboard operable, correct roles/ARIA, focus visible,
   announcements through `MkLiveAnnouncer` where state changes silently.
   Add a fixture to `a11y-smoke.spec.ts` (axe runs over it).
3. **SSR-safe.** No bare `window`/`document` at construction time — guard with
   `isPlatformBrowser` or `afterNextRender`. Add the component to
   `ssr-smoke.spec.ts`.
4. **Themed through tokens only.** Styles use `--mk-*` variables; no hard-coded
   colours, radii or spacing. Both themes and all three densities must look
   right. Respect `prefers-reduced-motion` and RTL (logical properties).
5. **Every built-in string is translatable** — add keys to `MkI18nStrings`
   and read them through `MK_I18N`; never hard-code English in templates.
6. **Signals API.** `input()` / `model()` / `output()`, `ChangeDetectionStrategy.OnPush`,
   standalone. No `NgModule`s, no Zone dependence.
7. **Docs.** A demo on the relevant docs page (or a new page wired into the
   sidebar and the ⌘K keywords), a props table, and a `CHANGELOG.md` entry.
8. **Budgets.** `npm run build:lib` must stay within `scripts/size-budget.json`;
   `npm run build` (docs) must not exceed the Angular budgets.

Useful commands:

```bash
npm test              # library unit tests (Vitest)
npm run test:docs     # docs app tests
npm run build         # docs production build
npm run test:visual   # Playwright visual sweep (baselines are Linux-only)
npm run test:visual:update   # regenerate baselines — run on Linux, commit the PNGs
```

## Commits and pull requests

- Branch from `main`: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `chore/<topic>`.
- Commit messages follow Conventional Commits with the entry point as scope
  where it applies: `feat(charts): …`, `fix(overlay): …`, `docs: …`.
  The body explains *why*; the diff already shows *what*.
- Keep PRs focused; a component and its docs belong in one PR, unrelated
  refactors do not.
- CI runs build → tests → docs build on every PR. Visual-test failures show
  diffs in the workflow artefacts; regenerate baselines only for intended
  changes.

## Developer Certificate of Origin

All contributions are made under the [MIT License](LICENSE) and must be
signed off under the Developer Certificate of Origin (DCO) 1.1 — the same
mechanism the Linux kernel and many CNCF projects use. Signing off certifies
that:

> (a) The contribution was created in whole or in part by me and I have the
> right to submit it under the open source license indicated in the file; or
>
> (b) The contribution is based upon previous work that, to the best of my
> knowledge, is covered under an appropriate open source license and I have
> the right under that license to submit that work with modifications, whether
> created in whole or in part by me, under the same open source license
> (unless I am permitted to submit under a different license), as indicated in
> the file; or
>
> (c) The contribution was provided directly to me by some other person who
> certified (a), (b) or (c) and I have not modified it.
>
> (d) I understand and agree that this project and the contribution are
> public and that a record of the contribution (including all personal
> information I submit with it, including my sign-off) is maintained
> indefinitely and may be redistributed consistent with this project or the
> open source license(s) involved.

Full text: <https://developercertificate.org/>

To sign off, add a line to every commit message:

```
Signed-off-by: Your Name <you@example.com>
```

`git commit -s` adds it for you. Use your real name and an email you control.
Pull requests with unsigned commits will be asked to amend before merge.

Contributions created with AI assistance are welcome; you are still the
author for DCO purposes and responsible for the change meeting the bar above.
Say so in the PR description when a substantial part was generated.

## Licence

By contributing you agree that your contributions are licensed under the
project's [MIT License](LICENSE). The mk-kit name and logo are covered by
[TRADEMARK.md](TRADEMARK.md), not by the MIT License.
