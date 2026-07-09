# Changelog

All notable changes to **`@mkornas/ui`**. The format follows
[Keep a Changelog](https://keepachangelog.com/); versions are private GitHub
Packages releases published on `v*` tags. Dates are ISO-8601.

## [Unreleased]

### Added

- **`mk-form-error-summary`** — an accessible summary of a form's validation
  errors (WAI/GOV.UK pattern): an `alert` region listing each error as a link
  that focuses its field. Call `focus()` after a failed submit to send
  screen-reader and keyboard users straight to the problems.
- **`mk-scatter-chart`** — plot `(x, y)` points across two numeric axes; give
  points a `size` and set `bubble` for a bubble chart. Nice-tick axes, legend,
  per-point hover tooltip, screen-reader table. Dependency-free SVG.
- **`mk-heatmap`** — a value-shaded matrix rendered as a semantic table; cell
  colours are mixed from `accent` over the surface via `color-mix` (theme-aware),
  with an optional min→max scale legend and in-cell values.
- **`mkIntersect`** — a thin `IntersectionObserver` wrapper. Emits
  `(mkIntersect)` with the host's visibility and exposes an `intersecting()`
  signal; `once` fires a single time and disconnects (reveal-on-scroll, lazy
  loading).
- **`mkInfiniteScroll`** — emits `(mkInfiniteScroll)` when its scroll container
  nears the bottom (`distance`), re-arming after you scroll back up; `disabled`
  pauses it while loading or when everything is loaded.
- **`mk-week-picker`** — pick a whole calendar week from the popover calendar;
  hovering a day previews its entire week, clicking selects it. Value is an
  `MkWeek` (`{ start, end }`, aligned to `firstDayOfWeek`); `showWeekNumber`
  prefixes the ISO week. `mk-calendar` gained a `(dateHovered)` output and
  date-utils gained `startOfWeek` / `endOfWeek` / `getISOWeek`.
- **`mkScrollspy`** — a directive that tracks which section is in view and
  exposes its `id` (via `activeId()` / `(activeChange)`), so a table of contents
  can highlight the current link. `root` and `offset` inputs; activates the last
  section when scrolled to the bottom.
- **Expandable table rows** — `mk-table` gains `expandable` (a leading expander
  column) and `singleExpand` (accordion). Each row reveals a detail panel
  supplied via `<ng-template mkTableRowDetail let-row>`, with the row object as
  the implicit context; `(expandedChange)` reports the open rows. Full ARIA
  (`aria-expanded` / `aria-controls`).

## [0.1.5] — 2026-07-09

### Added

- **Chart variants** — `mk-gauge`, a single-metric radial KPI dial with a
  configurable sweep (`arc°`), unit and label (`role="meter"`);
  `mk-bar-chart orientation="horizontal"`; and `mk-line-chart stacked`
  (cumulative filled areas).
- **`mk-range-slider`** — a two-thumb `[low, high]` range slider (each thumb a
  `role="slider"`; the thumbs can't cross). CVA over a `[number, number]` tuple.
- **`mk-skeleton-preset`** — ready-made loading layouts (`paragraph` / `card` /
  `list` / `table`) composed from the skeleton primitive.
- **`mk-loading-bar`** + **`MkLoadingBarService`** — a thin top-of-page progress
  bar for route/async progress (`start`/`set`/`inc`/`complete`/`stop`).
- **`mk-month-picker`** — a compact field + top-layer popover for picking a
  **month** (`MMM yyyy`) or a **year** (`mode="year"`); CVA over a `Date`.

### Fixed

- **`MkAnchoredPanel` DOM leak** — every anchored overlay (selects, autocompletes,
  menus, all pickers) orphaned one detached panel element per open/close cycle:
  on teardown the directive moved the teleported node back into the component view
  instead of removing it. The node is now removed outright, so nothing accumulates.

## [0.1.4] — 2026-07-09

### Added

- **i18n token map** — `MK_I18N` injection token + `provideMkI18n(overrides)`
  over English defaults (`MkI18nStrings`), so consumers can localise every
  built-in string. Wired through select / autocomplete / multi-select / table /
  command-palette (empty text), dialog / drawer / bottom-sheet (close),
  alert / banner (dismiss), pagination / calendar / carousel (aria) and the sort
  announcer.

## [0.1.3] — 2026-07-09

### Added

- **Block-editor ↔ HTML bridge** — `valueFormat="html"` on `mk-block-editor`
  reads/writes an HTML string (so it backs a string-typed `richtext` field),
  plus `mkHtmlToBlocks(html)`, the inverse of `mkBlocksToHtml`, for the
  `MkBlockDocument ⇄ HTML` round-trip.
- **`mk-diff`** — a revision comparison view: LCS line diff with intra-line word
  highlighting, in `unified` or `split` layout.

## [0.1.2] — 2026-07-09

### Added

- Data display: **`mk-code`** (read-only highlighted block + copy),
  **`mk-virtual-scroll`** (windowed lists), **`mk-carousel`**.
- Form controls: **`mk-rating`**, **`mk-number-input`**, **`mk-otp`**,
  **`mkAutosize`** (textarea grow directive).
- **`mk-color-picker`**, **`mk-banner`**, **`mk-fab`** + speed-dial,
  **`mk-back-to-top`**, **`mkAutofocus`**.

## [0.1.1] — 2026-07-09

### Added

- **`mk-description-list`**, **`mk-splitter`** (resizable panes),
  **`mkClickOutside`**, **`mkCopyToClipboard`**.

### Changed

- Docs navigation reorganized into collapsible `MkNavGroup` sections.

### Fixed

- **`MkNavGroup`** collapse: the items region now actually hides — a class-level
  `display:flex` was overriding the UA `[hidden]{display:none}`.

## [0.1.0] — 2026-07-09

Initial private release as `@mkornas/ui` on GitHub Packages.

### Added

- **Clip-proof anchored overlays** — `MkAnchoredPanel` renders floating panels in
  the browser **top layer** (native Popover API), so every dropdown, menu,
  picker and tooltip is immune to ancestor `overflow` / `transform` / `z-index`
  and can never be clipped or pushed off-screen.
- **`mk-multi-select`** (removable chips, async source), **`mk-file-upload`**
  (dropzone + validation + progress), **`mk-code-editor`** (JSON highlight +
  validation), **`mk-popover`** / **`mk-popconfirm`**.
- The full base component library — buttons, form controls, form-field, tables
  (+ sort), charts (sparkline / bar / line / donut), navigation (tabs, menu,
  command palette, app-shell), feedback (alert, dialog, toast, snackbar,
  bottom-sheet), block editor and drag-and-drop — themed via `--mk-*` tokens
  (light/dark), WCAG 2.1 AA.

[Unreleased]: https://github.com/mkornas/mk-kit/compare/v0.1.5...HEAD
[0.1.5]: https://github.com/mkornas/mk-kit/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/mkornas/mk-kit/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/mkornas/mk-kit/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/mkornas/mk-kit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/mkornas/mk-kit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mkornas/mk-kit/releases/tag/v0.1.0
