# Changelog

All notable changes to **`@mkornas/ui`**. The format follows
[Keep a Changelog](https://keepachangelog.com/); versions are private GitHub
Packages releases published on `v*` tags. Dates are ISO-8601.

## [Unreleased]

## [0.3.0] — 2026-07-10

### Added

- **Density mode** — a global `data-mk-density="compact"` attribute remaps the
  control-height and spacing tokens for dense admin screens.
  `MkThemeService` gained a persisted `density` signal plus
  `setDensity()` / `toggleDensity()`; the docs header dogfoods the toggle.
- **RTL support** — the whole library now lays out correctly under
  `dir="rtl"`: logical CSS properties across every component (drawer/app-shell
  slide side, switch knob, sliders, tree indent, calendar range pill, pinned
  table columns via `inset-inline-*`, accent stripes, adornments), direction-
  aware pointer math (sliders, column resize, carousel), and RTL-aware
  `-start`/`-end` alignment in the anchored-overlay primitive and tooltip.
  Code surfaces (code block, diff, code editor) intentionally stay LTR.
- **Forced-colors support** — a dedicated `@media (forced-colors: active)`
  layer keeps selection, checked toggles, slider/progress fills, the tabs ink
  bar and overlay boundaries visible in Windows High Contrast using system
  colors.
- `mk-calendar` now implements `ControlValueAccessor` — usable directly with
  `ngModel` / `formControl`, including `setDisabledState` support.
- i18n: drag-and-drop announcements (`dndPickedUp`, `dndMoved`,
  `dndMovedToList`, `dndDropped`, `dndCancelled`) and file-upload rejection
  reasons (`fileRejectedType`, `fileRejectedSize`, `fileRejectedCount`) are
  now `MK_I18N` keys.
- Docs: new **Core & services** page (overlay service, anchored panel, focus
  trap, live announcer, theme service, i18n, hotkeys); API props tables and
  keyboard-interaction tables across the remaining component pages
  (selection, utilities, structure, stepper, tree, icon, snackbar,
  empty-timeline, command-nav, navigation, date-time, dialogs, table,
  drag-drop).

### Changed

- **Breaking (pre-1.0):** `mk-splitter`'s two-way model was renamed
  `size` → `position` (`[(position)]="pct"`), freeing `size` for the
  library-wide control-size convention.

## [0.2.0] — 2026-07-10

### Added

- **Secondary entry points** — the library now ships 15 Material-style entry
  points (`@mkornas/ui/core`, `/forms`, `/table`, `/data`, `/feedback`,
  `/navigation`, `/datetime`, `/charts`-in-`/data`, `/dnd`, `/block-editor`,
  `/directives`, `/button`, `/icon`, `/chip`, `/context-menu`) plus the root
  umbrella. Code-split apps no longer carry the whole library in their initial
  bundle: the docs app's main chunk dropped from 1,082KB to 415KB with no
  import changes. Root imports keep working; group imports are recommended for
  eager shell code.
- **Full localisation** — every built-in string (labels, placeholders,
  announcements, block-editor chrome) now routes through `MK_I18N` (~75 new
  keys), and month/weekday names are localisable via `dateNames` on
  `provideMkI18n` (deep-merged). Passing a locale now localises the calendar
  and every picker.
- **Keyboard data grid** — mk-table's column resize (Arrow keys on the
  separator), column reorder (Alt+Arrow on a header), and inline cell edit
  (Enter/F2) are fully keyboard operable with live announcements; sort headers
  are real buttons and clickable rows activate with Enter/Space.
- Docs: on-page table of contents (powered by `mkScrollspy`), ⌘K search
  (powered by `mk-command-palette`), reorganized navigation, and the three
  overloaded pages split into 11 focused ones with chart props tables.

### Fixed

- Resource leaks: command-palette/drawer scroll-lock and focus traps released
  on destroy; app-shell matchMedia listener; virtual-scroll ResizeObserver;
  dnd drag preview on mid-drag destroy; file-upload preview object-URLs on
  external model resets; splitter/scroll-area/table pointercancel handling.
- Accessibility: hovercard keyboard access, tour focus containment + restore,
  event-calendar event announcements, password reveal toggle in the tab
  order, transfer-list roving tabindex + announcements, notification-center
  unread state for AT, countdown live-region throttling, and more (25 audit
  findings).
- Performance: rows tracked by key (sorting no longer rebuilds the table DOM),
  O(1) selection checks, rAF-coalesced overlay repositioning and scrollspy,
  virtual-scroll no-op scroll updates, diff prefix/suffix trim + size guard.
- Correctness: stable descending sort with consistent null ordering; countdown
  re-arms on a new target; tag-input keeps rejected input.

### Changed

- `MkColumnResize` payload type exported; `mkHighlight` exported from the
  forms group; deep import paths (`@mkornas/ui/src/...`) are replaced by the
  documented entry points.

## [0.1.9] — 2026-07-10

### Added

- **`mk-qr-code`** — a dependency-free QR code generator rendered as SVG. The
  encoder (byte mode, Reed–Solomon ECC, data interleaving, all 8 masks with
  penalty scoring, BCH format/version info) is implemented in-house; versions
  1–10, ECC levels L/M/Q/H, theme-aware colors.
- **`mk-funnel-chart`** — a funnel/conversion chart: stacked trapezoids whose
  width tracks each stage's value, with per-stage conversion %.
- **`mk-treemap`** — a squarified treemap of value-sized rectangles, with a
  hover tooltip and screen-reader table.
- **`mk-scroll-area`** — a scroll container with themed, auto-hiding custom
  scrollbars over real native scrolling (`orientation` vertical/horizontal/both).
- **`mk-mini-date`** — a compact, popover-free segmented day/month/year date
  editor (spinbutton segments, keyboard nav); CVA over `Date | null`.
- **Theme builder** docs page (`/theme-builder`) — live `--mk-*` token controls
  with a real-time component preview and a copy-paste `:root { … }` output.

## [0.1.8] — 2026-07-10

### Added

- **Data-grid pro (`mk-table`)** — opt-in power features on the existing table:
  drag-to-**resize** columns (`resizableColumns` + per-column `resizable`),
  drag-to-**reorder** headers (`reorderableColumns`), **pin/sticky** columns
  (`pinned: 'left' | 'right'`), and **inline cell edit** (`editable`,
  double-click). New outputs `(columnResize)` / `(columnReorder)` / `(cellEdit)`.
  Fully additive — existing tables are unchanged.

## [0.1.7] — 2026-07-09

### Added

- **`mk-password-input`** — password field with a reveal toggle, optional 0–4
  strength meter and a rules checklist; CVA over `string`, form-field wiring.
- **`mk-transfer-list`** — dual list box for moving items between an available
  and a selected list (role/permission assignment); CVA over the selected values,
  optional per-list filtering.
- **`mk-tree-select`** — a hierarchical dropdown select: an `mk-tree` inside a
  top-layer popover; CVA over the picked node's value, clearable.
- **`mk-hovercard`** + `[mkHovercardFor]` — a rich hover-preview panel with
  open/close delays that stays open while hovered; top-layer via `MkAnchoredPanel`.
- **`MkHotkeysService` + `[mkHotkey]`** — a global keyboard-shortcut registry
  (`mod+k`, chords like `g i`), ignoring editable targets by default; the
  directive binds a combo to a host click or `(mkHotkeyPressed)`. Pure
  `mkParseHotkey` / `mkMatchesHotkey` helpers exported.
- **`mk-event-calendar`** — a month-grid scheduler showing event pills per day
  (with "+N more"), month navigation, `(dayClick)` / `(eventClick)`.
- **`mk-kanban`** — a draggable board of columns and cards built on the dnd
  module; two-way `columns`, `(cardMoved)`, custom card `<ng-template>`.
- **`mk-notification-center`** — a bell trigger with an unread badge opening a
  top-layer panel of notifications, with mark-(all-)read and an empty state.
- **`mk-result`** — a full-page status state (success / error / 404 / …) with a
  status icon, title, subtitle and projected action slots.
- **`mk-countdown`** — counts down to a target date (days/hours/minutes/seconds),
  emits `(finished)`; pure `mkSplitDuration` helper exported.
- **`mk-inline-edit`** — click-to-edit text: the display swaps to an input on
  click (or Enter/Space), Enter or blur saves, Escape reverts. `multiline`
  textarea variant, `saveOnBlur`, `(saved)` / `(cancelled)`; CVA over `string`.
- **`mk-tag-input`** — a freeform token/chip input: type and press Enter (or a
  separator) to add a removable chip, Backspace on an empty field removes the
  last, and pasting a delimited string adds several. CVA over `string[]`;
  `max` / `allowDuplicates` / `addOnBlur` options, `(added)` / `(removed)`.
- **`mkMask`** — an input-mask directive. Formats an input as the user types
  against a token pattern (`0` digit, `A` letter, `*` alphanumeric; other chars
  are literals), skipping ill-fitting characters. Exposes the raw value via
  `(unmaskedChange)` and the formatted value via `(maskedChange)`; the pure
  `mkApplyMask(value, pattern)` helper is exported too.
- **`MkDialogService.alert()` and `.prompt()`** — imperative single-button
  acknowledgement and single-field prompt dialogs, alongside the existing
  `confirm()`. `alert()` resolves on dismiss; `prompt()` resolves with the
  entered string (or `null` on cancel), supports `required` / `inputType`.

## [0.1.6] — 2026-07-09

### Added

- **`mkRipple`** — a Material-style press ripple for any surface (button, list
  item, card). Makes the host a positioned, clipping container and paints a
  short-lived wave from the pointer; `mkRippleCentered` / `mkRippleColor`
  options, respects `prefers-reduced-motion`.
- **`mk-form-error-summary`** — an accessible summary of a form's validation
  errors (WAI/GOV.UK pattern): an `alert` region listing each error as a link
  that focuses its field. Call `focus()` after a failed submit to send
  screen-reader and keyboard users straight to the problems.
- **`mk-scatter-chart`** — plot `(x, y)` points across two numeric axes; give
  points a `size` and set `bubble` for a bubble chart. Nice-tick axes, legend,
  per-point hover tooltip, screen-reader table. Dependency-free SVG.
- **`mk-radar-chart`** — a radar / spider chart comparing several series across
  shared axes (one polygon each), with concentric grid rings, a legend and a
  screen-reader table.
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

[Unreleased]: https://github.com/mkornas/mk-kit/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/mkornas/mk-kit/compare/v0.1.9...v0.2.0
[0.1.9]: https://github.com/mkornas/mk-kit/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/mkornas/mk-kit/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/mkornas/mk-kit/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/mkornas/mk-kit/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/mkornas/mk-kit/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/mkornas/mk-kit/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/mkornas/mk-kit/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/mkornas/mk-kit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/mkornas/mk-kit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mkornas/mk-kit/releases/tag/v0.1.0
