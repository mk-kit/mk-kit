# Roadmap — missing components & features

A curated gap analysis for `@mkornas/ui`, measured against Angular Material and
common admin-dashboard needs. Priorities: **P1** high value / frequently needed,
**P2** useful, **P3** nice-to-have. This is a planning doc, not a commitment.

## ⭑ mk-cms admin blockers

Driven by the **mk-cms** admin panel (schema-driven CRUD). The original blockers
— **file-upload**, **multi-select + chips**, **JSON/code editor**,
**popover/popconfirm** and **description-list** — plus the **block-editor ↔ HTML bridge** — are all ✅ **shipped** (details in the
component sections below), including the **revision diff / comparison view**
(`mk-diff`) and the **block-editor ↔ HTML bridge**. **No blockers remain.**

The **block-editor ↔ HTML bridge** shipped as `valueFormat="html"` on
`mk-block-editor` (reads/writes an HTML string so it backs a string-typed
`richtext` field) + `mkHtmlToBlocks(html)` — the inverse of `mkBlocksToHtml` —
for the `MkBlockDocument` ⇄ HTML round-trip.

The rest of the admin (tables + bulk actions, app-shell, nav-group, command
palette, tree + dnd menu builder, dialogs, toasts, date pickers, charts) is
covered by shipping components.

---

## What already ships (for reference)

Buttons, button-toggle, inputs, form-field, select, autocomplete,
**multi-select** (chips + async), **file-upload** (dropzone),
**code-editor** (JSON highlight + validation), checkbox,
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
- ✅ **File upload / dropzone** (`mk-file-upload`) — click + drag-drop, preview,
  progress, type/size/count validation, async `uploadFn` (shipped).
- ✅ **Multi-select** (`mk-multi-select`) — multiple selection with removable
  chips over a sync/async option source (shipped). A token/tag input could still
  reuse its chip + query internals.
- ✅ **Rating** (`mk-rating`) — star input + read-only display (shipped).
- ✅ **Number input** (`mk-number-input`) — numeric field with −/+ and clamp/step (shipped).
- ✅ **OTP / PIN input** (`mk-otp`) — segmented one-time-code field (shipped).
- ✅ **Color picker** (`mk-color-picker`) — swatch + hex + native OS picker (shipped).
- ✅ **Textarea autosize** (`mkAutosize`) — grow-with-content directive (shipped).
- ✅ **Range slider** (`mk-range-slider`) — two-thumb `[low,high]` variant (shipped).
- **P3 Form error summary** — aggregated, linkable validation list.

### Data display
- ✅ **Description list** (`mk-description-list` + `mk-desc-item`) — key/value
  pairs for entity-detail panels; grid/stacked, rich values (shipped).
- ✅ **Virtual scroll** (`mk-virtual-scroll`) — windowed rendering for long lists (shipped).
- ✅ **Expandable table rows** (`mk-table expandable`) — per-row detail panel via
  `<ng-template mkTableRowDetail let-row>`, multi- or `singleExpand` accordion,
  `(expandedChange)` (shipped). **P3 nested/grouped rows** remaining.
- ✅ **Avatar group** (`mk-avatar-group`) — overlapped avatars with "+N" overflow (shipped).
- ✅ **Code block** (`mk-code`) — themed read-only block, highlight + copy (shipped).
- ✅ **Carousel** (`mk-carousel`) — accessible slides/gallery (shipped).
- ✅ **Comparison / diff view** (`mk-diff`) — LCS line diff + word highlighting, unified/split (shipped). **P3 QR/barcode** remaining.

### Charts (extend the module)
- ✅ **Horizontal bar** (`mk-bar-chart orientation="horizontal"`) + **stacked
  area** (`mk-line-chart stacked`) shipped.
- ✅ **Gauge / radial** (`mk-gauge`) — single-metric KPI dial, configurable sweep
  (shipped).
- **P3 Heatmap**, **P3 scatter**, **P3 funnel**, **P3 radar**, **P3 treemap**.

### Navigation & layout
- ✅ **Drawer** (`mk-drawer`) — declarative slide-out side panel (shipped).
- ✅ **Toolbar** (`mk-toolbar`) — standalone action bar (shipped).
- ✅ **Page header** (`mk-page-header`) — title/breadcrumb/meta/actions/tabs (shipped).
- ✅ **Command palette** (`mk-command-palette`, ⌘K) — filtered, grouped action
  menu (shipped).
- ✅ **Nav group** (`mk-nav-group`) — collapsible sidebar sections (shipped).
- ✅ **Split panes / resizable layout** (`mk-splitter`) — two panes, draggable +
  keyboard ARIA separator, horizontal/vertical (shipped).
- ✅ **FAB / speed-dial** (`mk-fab` + `mkFabAction`) and ✅ **back-to-top** (`mk-back-to-top`) shipped.
- ✅ **Scrollspy** (`mkScrollspy`) — tracks the in-view section and exposes its
  `id` for table-of-contents highlighting; `root`/`offset` inputs (shipped).
- **P3 Scroll-area** — cross-browser custom scrollbar container.

### Feedback & overlay
- ✅ **Popover** (`mk-popover`) + **popconfirm** (`mk-popconfirm`) — rich non-text
  floating panel + inline confirm, top-layer via `MkAnchoredPanel` (shipped).
- ✅ **Banner** (`mk-banner`) — persistent page/section notice, tone + actions + dismiss (shipped).
- ✅ **Top loading bar** (`mk-loading-bar` + `MkLoadingBarService`) — route-level progress (shipped).
- ✅ **Skeleton presets** (`mk-skeleton-preset`) — paragraph/card/list/table layouts (shipped).

### Directives / utilities
- ✅ **clickOutside** (`mkClickOutside`) + **copy-to-clipboard**
  (`mkCopyToClipboard`) — shipped; docs at `/components/utilities`.
- ✅ **autofocus** (`mkAutofocus`) shipped. **P2 intersection/lazy-load**, **P2 infinite-scroll**, **P3 ripple** remaining.

### Pickers
- ✅ **Month / year picker** (`mk-month-picker`, `mode="month" | "year"`) — compact
  field + top-layer popover; 12-month / 12-year grid, roving keyboard nav (shipped).
- ✅ **Week picker** (`mk-week-picker`) — pick a whole week from the calendar
  popover; hover previews the week, `MkWeek` `{start, end}` value, ISO week
  number option (shipped). **P3 mini inline date** remaining.

---

## Features & infrastructure (not components)

- ✅ **Unit tests** — Vitest specs (`@angular/build:unit-test`), 144 tests across
  components (CVA, keyboard, ARIA, signals) + the diff/HTML-parser/overlay-math
  utilities. (shipped; grow coverage as components land.)
- ✅ **CI pipeline** — `.github/workflows/ci.yml` (build lib → test lib → test
  docs → build docs → publish dry-run, on push/PR) + `release.yml` (publish to
  GitHub Packages on `v*` tags). (shipped.)
- ✅ **i18n of built-in strings** — `MK_I18N` token + `provideMkI18n(overrides)`
  over English defaults (`MkI18nStrings`); wired through select/autocomplete/
  multi-select/table/command-palette (empty text), dialog/drawer/bottom-sheet
  (close), alert/banner (dismiss), pagination/calendar/carousel (aria) and the
  sort announcer. (shipped.)
- **P2 Storybook (or keep the docs app) + visual-regression** snapshots
  (Playwright) in light/dark to catch UI regressions.
- **P2 Automated a11y checks** (axe) in CI over the docs pages.
- **P2 SSR / hydration verification** — components are `isPlatformBrowser`-guarded;
  add an SSR smoke test.
- ✅ **SCSS preprocessor migration** — all component styles are `.scss`; theme
  source is `styles/mk-kit.scss` (dark tokens deduped) with shared
  `_mixins.scss` (`tone`/`focus-ring`/`control-size`). (shipped.)
- **P2 Density mode** — global compact/comfortable switch (table has density;
  generalize to a token/attribute).
- **P2 RTL audit** — verify logical properties; add `dir="rtl"` coverage.
- **P3 High-contrast / forced-colors theme**, **P3 additional prebuilt themes**,
  **P3 a theme-builder page** in the docs.
- **P3 CHANGELOG + semantic-release**, **P3 bundle-size budget** in CI.

---

## Suggested near-term order

Tests, CI, the SCSS migration, i18n and all mk-cms blockers are done. All P1s
are shipped. What's left is P2/P3:

1. **Intersection / lazy-load / infinite-scroll** directives — remaining P2 utilities.
2. **Mini inline date** — remaining picker P3.
3. RTL audit + density mode; then P3 polish (QR, ripple, theme-builder,
   high-contrast theme, heatmap/scatter charts).
