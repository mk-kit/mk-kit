# Visual regression tests

Playwright screenshot sweep over representative docs pages, each captured
full-page in **light and dark** mode against the **production build** of the
docs app (`ng build docs`, served statically with SPA fallback by
`serve.mjs`).

## Running

```bash
npm run test:visual          # compare against committed baselines
npm run test:visual:update   # regenerate baselines (see OS caveat below)
```

The Playwright `webServer` builds the docs and serves `dist/docs/browser` on
port 4311 automatically. Locally a running server is reused
(`reuseExistingServer`), so you can keep `node visual-tests/serve.mjs` up
between runs to skip rebuilds.

## Baselines are Linux-only — do not regenerate on macOS/Windows

Font rasterization and antialiasing differ per OS, so screenshots taken on
macOS or Windows will never match these baselines (and vice versa). The
committed baselines in `docs-pages.spec.ts-snapshots/` were generated on
Linux, the same platform as CI (`.github/workflows/visual.yml`,
ubuntu-latest). Regenerate them **on Linux only** with
`npm run test:visual:update`. The config drops Playwright's default
platform suffix from snapshot names for this reason — names are exactly
`<route>-<theme>.png`.

## How determinism is handled

- **Theme** — seeded via the same mechanism the docs persist it:
  `localStorage['mk-kit-theme'] = 'light' | 'dark'` (plus
  `mk-kit-density = 'comfortable'`), set in an init script so
  `MkThemeService` applies `data-mk-theme` before first paint. No toggle
  clicking, no flash of the wrong theme.
- **Clock** — `page.clock.setFixedTime(2026-01-20T12:00Z)` before
  navigation, so calendars, date pickers and chart date axes always render
  the same date. Timezone is pinned to UTC and locale to en-US in the config.
- **Motion** — `reducedMotion: 'reduce'` context option plus an injected
  `* { transition: none; animation: none }` style; screenshots also use
  `animations: 'disabled'` and `caret: 'hide'`.
- **Fonts/layout** — each capture waits for `document.fonts.ready` and two
  animation frames before screenshotting. Additionally, a throwaway
  **warm-up full-page screenshot** is taken first: the first full-page
  rasterization makes Chromium load lazy fallback fonts for below-the-fold
  glyphs, which reflows text once across the whole page (~90px of page
  height on the table page). The warm-up absorbs that one-time reflow so
  the compared capture is always the settled layout.
- **Layout width** — `html { overflow-y: scroll }` is forced so the
  scrollbar gutter is always reserved; otherwise full-page capture can
  change content width by ~15px and flip width-driven layouts (mk-table's
  ResizeObserver-based stacked mode).

## CI

`.github/workflows/visual.yml` runs the sweep on `workflow_dispatch` and a
weekly cron (ubuntu-latest, Node 24.18). It is intentionally **not** part of
`ci.yml` because the baselines are platform-bound. On failure it uploads
`playwright-report/` and `test-results/` (which contain the actual/diff
images) as an artifact.

## Adding pages

Add a `{ path, slug }` entry to `ROUTES` in `docs-pages.spec.ts` (paths come
from `projects/docs/src/app/app.routes.ts`), then regenerate baselines on
Linux. Note: the docs have no dedicated "touch" route; the signature-pad page
covers the touch-input component.
