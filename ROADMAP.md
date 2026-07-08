# Roadmap — missing components & features

A curated gap analysis for `@mk-kit/ui`, measured against Angular Material and
common admin-dashboard needs. Priorities: **P1** high value / frequently needed,
**P2** useful, **P3** nice-to-have. This is a planning doc, not a commitment.

## What already ships (for reference)

Buttons, button-toggle, inputs, form-field, select, autocomplete, checkbox,
radio, switch, slider, calendar + date/time/range pickers · card, divider,
badge, tag, chip, avatar, list, stat-card, progress-bar, **progress-ring**,
spinner, skeleton, table (+ standalone `mkSort`), **charts** (sparkline, bar,
line, donut), **empty-state**, **timeline** · alert, tooltip, dialog, toast,
**snackbar**, **bottom-sheet** · tabs, accordion, breadcrumb, pagination, menu,
context-menu, app-shell, nav-list, stepper, tree · block-editor, drag-drop.
Theming via `--mk-*` tokens (light/dark), WCAG 2.1 AA, overlay/focus-trap/
live-announcer core.

---

## Components

### Form controls
- **P1 File upload / dropzone** (`mk-file-upload`) — click + drag-drop, preview,
  progress, validation. The single most-requested missing form control.
- **P1 Multi-select** — `mk-select` is single-value; add multiple selection with
  chips (or a `multiple` mode). Pairs with a **token/tag input**.
- **P2 Rating** (`mk-rating`) — star input + read-only display.
- **P2 Number stepper input** — numeric field with +/- and clamp/step.
- **P2 OTP / PIN input** — segmented one-time-code field.
- **P2 Color picker** — swatch grid + hex/HSL, token-friendly.
- **P2 Textarea autosize** — grow-with-content directive for `mkInput`.
- **P3 Range slider** — two-thumb variant of `mk-slider`.
- **P3 Form error summary** — aggregated, linkable validation list.

### Data display
- **P1 Description list** (`mk-description-list`) — key/value pairs (entity detail
  panels); trivial but ubiquitous in dashboards.
- **P1 Virtual scroll** — windowed rendering for long lists/tables (perf).
- **P2 Expandable / nested table rows** — detail rows + row grouping.
- **P2 Avatar group** — overlapped avatars with "+N" overflow.
- **P2 Code block** — the docs have one; promote a themed `mk-code` with copy.
- **P2 Carousel** — accessible slides/gallery.
- **P3 Comparison / diff view**, **P3 QR/barcode**.

### Charts (extend the module)
- **P2 Horizontal bar** + **stacked area** variants.
- **P2 Gauge / radial** — single-metric dial (KPIs).
- **P3 Heatmap**, **P3 scatter**, **P3 funnel**, **P3 radar**, **P3 treemap**.

### Navigation & layout
- ✅ **Drawer** (`mk-drawer`) — declarative slide-out side panel (shipped).
- ✅ **Toolbar** (`mk-toolbar`) — standalone action bar (shipped).
- ✅ **Page header** (`mk-page-header`) — title/breadcrumb/meta/actions/tabs (shipped).
- ✅ **Command palette** (`mk-command-palette`, ⌘K) — filtered, grouped action
  menu (shipped).
- ✅ **Nav group** (`mk-nav-group`) — collapsible sidebar sections (shipped).
- **P1 Split panes / resizable layout** (`mk-splitter`) — dashboard panel resize.
- **P2 FAB / speed-dial**, **P2 scrollspy**, **P2 back-to-top**.
- **P3 Scroll-area** — cross-browser custom scrollbar container.

### Feedback & overlay
- **P1 Popover** (`mk-popover`) — rich (non-text) floating panel; today only
  text `tooltip` + `menu` exist. Also enables **popconfirm** (inline confirm).
- **P2 Banner** — page/section-level persistent alert with actions.
- **P2 Top loading bar** — route-level progress (YouTube/GitHub style).
- **P2 Skeleton presets** — text/paragraph/card/table skeleton shapes.

### Directives / utilities
- **P1 clickOutside**, **P1 copy-to-clipboard**, **P2 intersection/lazy-load**,
  **P2 autofocus**, **P2 infinite-scroll**, **P3 ripple**.

### Pickers
- **P2 Month / year / week pickers** (reuse `calendar`), **P3 mini inline date**.

---

## Features & infrastructure (not components)

- **P1 Unit tests.** The library has **0 spec files**. For a published package,
  add Vitest specs (a11y roles, keyboard, CVA, signals) — start with Button,
  Select, Table, overlay/focus-trap core.
- **P1 CI pipeline.** GitHub Actions: build lib + docs, typecheck, lint, run
  tests, publish-dry-run on PRs; release on tag.
- **P1 i18n of built-in strings.** Hardcoded English exists in aria labels and
  UI text ("No results", "No options", "Close", announcer messages). Provide an
  injectable string/`InjectionToken` map so consumers can localize.
- **P2 Storybook (or keep the docs app) + visual-regression** snapshots
  (Playwright) in light/dark to catch UI regressions.
- **P2 Automated a11y checks** (axe) in CI over the docs pages.
- **P2 SSR / hydration verification** — components are `isPlatformBrowser`-guarded;
  add an SSR smoke test.
- **P2 SCSS preprocessor migration** — see `BACKLOG.md` (dedupe tone/size/theme
  blocks via mixins + a token map).
- **P2 Density mode** — global compact/comfortable switch (table has density;
  generalize to a token/attribute).
- **P2 RTL audit** — verify logical properties; add `dir="rtl"` coverage.
- **P3 High-contrast / forced-colors theme**, **P3 additional prebuilt themes**,
  **P3 a theme-builder page** in the docs.
- **P3 CHANGELOG + semantic-release**, **P3 bundle-size budget** in CI.

---

## Suggested near-term order

1. Tests + CI (unblocks confident publishing).
2. File upload, multi-select, description list, popover (highest daily-use gaps).
3. Command palette + split panes (dashboard differentiators).
4. i18n token, then the SCSS migration.
