# Roadmap — missing components & features

A curated gap analysis for `@mk-kit/ui`, measured against Angular Material and
common admin-dashboard needs. Priorities: **P1** high value / frequently needed,
**P2** useful, **P3** nice-to-have. This is a planning doc, not a commitment.

## Round 5 (2026-08-26) — competitor gap analysis & Free / Pro tiering

Measured against the full component inventories of PrimeNG 21 (last MIT)
+ PrimeUI PRO, Kendo UI for Angular, Syncfusion EJ2, Angular Material/CDK,
ng-zorro-antd, Taiga UI and DevExtreme (sidebar-level, 2026-08-26). Only
feature areas that appear in **two or more** suites count as gaps; suite-
exclusive novelties (Terminal, Watermark, Ribbon, Smith chart…) are ignored.

### Tiering principle

- **Everything that ships today stays MIT** — all 165 components, directives
  and services, the theme builder, i18n, the schematic and the docs. Nothing
  is carved out of the free core; the free core is the marketing.
- **Pro = things that do not exist yet** and that every paid Angular vendor
  also charges for: multi-week "vendor-class" widgets, finished screens, the
  Figma kit and support. Each Pro widget must be a genuinely separate entry
  point that the free library never depends on.
- Free gaps below are prioritised by (a) how many suites ship it, (b) how often
  an admin panel actually needs it, (c) reuse of existing primitives.

### What we already cover that PrimeUI now charges for

Charts (12 types), rich-text + block editor, event calendar with editable
week/day grid, kanban, data table with resize/reorder/pin/inline-edit +
server-side data source, Figma-free theme builder. These are the migration
hooks — see the "Coming from PrimeNG" section on the homepage.

### Free-tier gaps (stay MIT) — ordered by priority

| Pri | Component / feature | Suites with it | Reuses | Size |
|-----|---------------------|----------------|--------|------|
| ✅ | **`mk-datetime-picker`** — combined date + time field (shipped, Wave A) | P K S Z T D | date-picker + time-picker + anchored panel | S |
| ✅ | **Nested submenus** in `mk-menu` (`[mkSubmenuFor]`, hover/keyboard, RTL) — shipped, Wave A | P K S M Z D | menu, anchored panel | M |
| ✅ | **`mk-split-button`** — main action + menu trigger (shipped, Wave A) | P K S Z D | button, menu | S |
| ✅ | **Tree table** — nested rows in `mk-table` (`childrenKey`, expand/collapse, indent, keyboard) — shipped, Wave A | P K S D | table expandable rows, tree key model | M |
| ✅ | **Icon set** — ship ~250 tree-shakeable SVG icons via `MkIconRegistry` (today: 35) + documented Lucide/Material adapters; stop using emoji in docs | all | icon registry — shipped, Wave A (420+ icons) | M |
| P1 | **`mk-chat`** + **`mk-prompt-box`** — message list, streaming text, tool/attachment cards, composer | K S D | virtual scroll, markdown, file-upload, autosize | M |
| P1 | **`mk-query-builder`** — rule/group tree → JSON, pairs with `MkTableDataSource` filters | K S D | select, inputs, date pickers, repeater | M |
| ✅ | **CSV export + print stylesheet** — `table.exportCsv()`, `mkToCsv` / `mkExportCsv`, `@media print` table styles (shipped, Wave A) | K S D | table columns | S |
| ✅ | **Layout primitives** — `mk-stack`, `mk-grid`, `mk-flex` + `mkFlexItem` / `mkGridItem` + `MkBreakpointService` (shipped, Wave A) | K M Z D S T | app-shell media query | S |
| P2 | **Draggable / resizable dialog** (`draggable`, `resizable` on `mk-dialog`) | P K S D | dialog, dnd rect-snapshot | S |
| P2 | `mk-cascader` — multi-level dependent select | P Z | select, anchored panel | M |
| P2 | `mk-listbox` — standalone single/multi selection list (keyboard, typeahead) | P K S M D | list, roving tabindex | S |
| P2 | `mk-form-field` float-label variant (`labelPosition="float"`) | P K S M T | form-field | S |
| P2 | `mkBlockUi` / `mk-load-panel` — overlay loading state on any region | P Z T D | overlay, spinner | S |
| P2 | `mk-dynamic-form` — schema → form renderer (fields, groups, validators, conditions) | K D (+ Formly) | every form control, repeater | L |
| P2 | Bullet chart, meter group, sankey | K S D / P / K S D | chart-utils | S/S/M |
| P2 | `mk-cron-editor` — human cron expression builder (admin schedulers) | Z | select, inputs | S |
| P2 | `mk-tab-bar` / bottom navigation (mobile) | K T | nav-list | S |
| P2 | `mk-image-compare` slider | P | image, slider | S |
| P2 | Pipes: `mkCurrency`, `mkRelativeTime`, `mkFileSize`, `mkInitials`, `mkTruncate` | Z T | date-utils, payment helpers | S |
| P2 | Overlay badge (`[mkBadgeOverlay]` anchored to icon/avatar) | P K S M | badge | S |
| P3 | Multi-date selection in `mk-calendar` | P K S T | calendar range model | S |
| P3 | `mk-barcode` (Code 128 / EAN) | K S | qr-code encoder pattern | S |
| P3 | `mkAffix` sticky directive, `mkLineClamp` | Z T | intersect | S |
| P3 | Candlestick / stock chart | K S D | line/bar chart | M |
| P3 | Color palette / gradient picker variants | K | color-picker | S |
| P3 | Comment thread (`mk-comment`) | Z T | avatar, timeline | S |
| P3 | Swipe-to-reveal list actions (mobile) | T | dnd pointer handling | S |
| P3 | Test harnesses (`@mk-kit/ui/testing`) | M | — | M |
| — | Spreadsheet, geo maps, PDF viewer, image editor, word processor | K S / K S D / P K S T / S / S | out of scope — huge, and not admin-panel core |

Size: S ≤ 2 days, M ≤ 1 week, L ≤ 2 weeks (single dev, with tests + docs).

### Pro candidates (paid, separate `@mk-kit/pro/*` entry points)

Ranked by how many paid suites charge for it × admin-panel demand × distance
from what the free core can already fake.

| # | Widget | Charged for by | Effort | Notes |
|---|--------|----------------|--------|-------|
| 1 | **Admin Starter** — auth/2FA, dashboard, CRUD list + detail + form, settings, users & roles, billing, notifications, audit log (12 screens, mock API, tests) | PrimeBlocks, Kendo templates, every ThemeForest admin | 3–4 wk | Lift and generalise the internal CMS admin. The product; ships first. |
| 2 | **`mk-dashboard-grid`** — draggable/resizable widget layout with breakpoints + persisted layout JSON | Syncfusion Dashboard Layout, Kendo TileLayout | 2 wk | Highest demand-to-effort ratio; every "build your own dashboard" admin. |
| 3 | **Resource scheduler / timeline view** on `mk-event-calendar` (resources as rows, day/week timeline, drag across resources) | PrimeUI Scheduler, Kendo, Syncfusion, DevExtreme | 2–3 wk | Free calendar stays; Pro adds the resource axis. |
| 4 | **`mk-gantt`** — tasks, dependencies, drag/resize, baseline, critical path, zoom | PrimeUI (soon), Kendo, Syncfusion, DevExtreme | 3–4 wk | |
| 5 | **Export pack** — XLSX with styles/multiple sheets, PDF (table + charts), scheduled/large exports via web worker | Kendo, Syncfusion, DevExtreme | 2 wk | CSV + print stay free. |
| 6 | **`mk-pivot-grid`** + field chooser | Kendo, Syncfusion, DevExtreme | 3–4 wk | |
| 7 | **`mk-form-builder`** — drag-drop form designer emitting the free `mk-dynamic-form` schema | (no Angular vendor has a good one) | 3 wk | Differentiator; needs free `mk-dynamic-form` first. |
| 8 | **`mk-org-chart`** | PrimeNG, Syncfusion, DevExtreme | 1 wk | Small enough to be free if Pro needs a "taster"; decide at launch. |
| 9 | **`mk-diagram`** — flow/whiteboard editor with nodes, ports, auto-layout | PrimeUI (soon), Kendo, Syncfusion, ng-zorro (Graph), DevExtreme | 4–6 wk | Last; only if Pro is validated. |
| 10 | **Figma kit** mirroring every `--mk-*` token, plus the Admin Starter screens | Kendo, PrimeUI, Untitled UI | 2–3 wk | Design work, not code. |

### Pro packaging

- Private repo `mk-kit-pro`; package `@mk-kit/pro` with one secondary entry
  per widget (`@mk-kit/pro/gantt`…); peer-depends on the public package.
- Offline licence key à la MUI X / AG Grid (`provideMkProLicense(key)`,
  console warning + watermark without a valid key; no network calls).
- Delivery: private GitHub repo access + tarball download first; private npm
  (Verdaccio on the VPS or Cloudsmith) once `npm install` friction shows up.
- Same quality bar as the core: specs, a11y smoke, SSR smoke, visual sweep,
  i18n keys through `provideMkI18n`.

### Implementation waves

1. **Wave A — free P1 (2 weeks) → public launch.** datetime-picker, submenus,
   split-button, tree table, icon set, CSV export + print, layout primitives.
   These close every "2+ suites" gap a PrimeNG migrator hits in week one.
2. **Wave B — free P1 differentiators + DX (3 weeks).** `mk-chat` +
   prompt box, `mk-query-builder`, draggable dialog, listbox, cascader,
   float label, block UI; StackBlitz starters, `llms.txt` + MCP server,
   generated API reference, test harnesses.
3. **Gate (month 3 after launch):** ≥ 1k stars or ≥ 2k weekly downloads or
   ≥ 150 Pro waitlist sign-ups → start Pro. Otherwise continue Wave C only.
4. **Wave C — free P2 (rolling).** dynamic-form renderer, cron editor,
   charts (bullet/meter/sankey), pipes, tab bar, image compare, overlay badge.
5. **Pro 1 (4 weeks):** Admin Starter + `mk-dashboard-grid` + licence
   plumbing + checkout (Paddle/Polar) → Pro launch to the waitlist.
6. **Pro 2 (6 weeks):** resource scheduler, gantt, export pack.
7. **Pro 3 (as validated):** pivot grid, form builder, Figma kit, diagram.

---

## ⭑ CMS admin blockers

Driven by an internal **CMS** admin panel (schema-driven CRUD). The original blockers
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
- ✅ **Form error summary** (`mk-form-error-summary`) — WAI/GOV.UK alert listing
  validation errors, each linking to + focusing its field; `focus()` on submit
  (shipped).
- ✅ **Phone input** (`mk-phone-input`) — searchable country-prefix dropdown +
  per-country masked national number; E.164 or `{prefix, number}` parts output
  (shipped).
- ✅ **Postal code input** (`mk-postal-code-input`) — country-aware mask +
  validation for 35+ formats, plus `mkPostalCodeValidator` (shipped).
- ✅ **Currency / amount input** (`mk-currency-input`) — `Intl.NumberFormat`
  live grouping, locale separators, currency affix, blur padding/clamping,
  numeric CVA value (shipped).
- ✅ **Card number input** (`mk-card-number-input`) — brand-aware grouping
  (Visa/MC/Amex/Discover/Diners/JCB), brand badge, Luhn validation (shipped).
- ✅ **IBAN input** (`mk-iban-input`) — group-by-four display, 65-country
  length table, mod-97 checksum, `mkIbanValidator` (shipped).
- ✅ **Signature pad** (`mk-signature-pad`) — canvas capture, PNG data-URL CVA
  value, hi-DPI + lossless resize redraw (shipped).

### Media (new group, 2026-07-18)
- ✅ **Image** (`mk-image`) — skeleton/error states, aspect/fit/rounded, lazy (shipped).
- ✅ **Image gallery** (`mk-image-gallery`) — grid/masonry/strip + "+N" overflow,
  lightbox integration (shipped).
- ✅ **Lightbox** (`MkLightboxService`) — fullscreen keyboard-navigable viewer (shipped).
- ✅ **Image cropper** (`mk-image-cropper`) — pan/zoom/aspect/round, `crop()` →
  data-URL, exported geometry helpers (shipped).
- ✅ **Media gallery** (`mk-media-gallery`) — select/reorder/actions management
  grid on the dnd module (shipped).
- ✅ **Profile card** (`mk-profile-card`, data group) — cover + overlapping
  avatar, meta/actions slots (shipped).

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
- ✅ **Comparison / diff view** (`mk-diff`) — LCS line diff + word highlighting, unified/split (shipped).
- ✅ **QR code** (`mk-qr-code`) — dependency-free generator (in-house byte-mode
  encoder + Reed–Solomon ECC + masking, versions 1–10, L/M/Q/H), SVG output (shipped).
- ✅ **JSON viewer** (`mk-json-viewer`) — collapsible JSON tree, type-coloured
  primitives, circular-safe, expand/collapse-all (shipped).

### Charts (extend the module)
- ✅ **Horizontal bar** (`mk-bar-chart orientation="horizontal"`) + **stacked
  area** (`mk-line-chart stacked`) shipped.
- ✅ **Gauge / radial** (`mk-gauge`) — single-metric KPI dial, configurable sweep
  (shipped).
- ✅ **Scatter / bubble** (`mk-scatter-chart`) — numeric x/y axes, optional
  `bubble` sizing, per-point tooltip (shipped).
- ✅ **Heatmap** (`mk-heatmap`) — value-shaded matrix table, theme-aware via
  `color-mix`, min→max legend (shipped).
- ✅ **Radar / spider** (`mk-radar-chart`) — multi-series polygons over shared
  axes, concentric rings (shipped).
- ✅ **Funnel** (`mk-funnel-chart`) — conversion trapezoids with per-stage %; and
  ✅ **Treemap** (`mk-treemap`) — squarified value-sized tiles (shipped).

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
- ✅ **Scroll-area** (`mk-scroll-area`) — themed auto-hiding custom scrollbars over
  native scrolling; vertical/horizontal/both (shipped).

### Feedback & overlay
- ✅ **Popover** (`mk-popover`) + **popconfirm** (`mk-popconfirm`) — rich non-text
  floating panel + inline confirm, top-layer via `MkAnchoredPanel` (shipped).
- ✅ **Banner** (`mk-banner`) — persistent page/section notice, tone + actions + dismiss (shipped).
- ✅ **Top loading bar** (`mk-loading-bar` + `MkLoadingBarService`) — route-level progress (shipped).
- ✅ **Skeleton presets** (`mk-skeleton-preset`) — paragraph/card/list/table layouts (shipped).

### Directives / utilities
- ✅ **clickOutside** (`mkClickOutside`) + **copy-to-clipboard**
  (`mkCopyToClipboard`) — shipped; docs at `/components/utilities`.
- ✅ **autofocus** (`mkAutofocus`) shipped.
- ✅ **intersect / lazy-load** (`mkIntersect`) — `IntersectionObserver` wrapper,
  `(mkIntersect)` + `intersecting()` signal, `once` for reveal/lazy (shipped).
- ✅ **infinite-scroll** (`mkInfiniteScroll`) — fires near the scroll bottom,
  re-arms, `disabled` guard (shipped).
- ✅ **ripple** (`mkRipple`) — Material-style press ripple for any surface;
  centered/color options, respects reduced-motion (shipped).

### Pickers
- ✅ **Month / year picker** (`mk-month-picker`, `mode="month" | "year"`) — compact
  field + top-layer popover; 12-month / 12-year grid, roving keyboard nav (shipped).
- ✅ **Week picker** (`mk-week-picker`) — pick a whole week from the calendar
  popover; hover previews the week, `MkWeek` `{start, end}` value, ISO week
  number option (shipped).
- ✅ **Mini inline date** (`mk-mini-date`) — compact popover-free segmented
  day/month/year editor, CVA over Date (shipped).

---

## Features & infrastructure (not components)

- ✅ **Unit tests** — Vitest specs (`@angular/build:unit-test`), 776 tests across
  components (CVA, keyboard, ARIA, signals) + the diff/HTML-parser/overlay-math
  utilities, including two library-wide conformance suites
  (`cva-conformance.spec.ts`, `forms-integration.spec.ts`). (shipped; grow
  coverage as components land.)
- ✅ **CI pipeline** — `.github/workflows/ci.yml` (build lib → test lib → test
  docs → build docs → publish dry-run, on push/PR) + `release.yml` (publish to
  npm on `v*` tags). (shipped.)
- ✅ **i18n of built-in strings** — `MK_I18N` token + `provideMkI18n(overrides)`
  over English defaults (`MkI18nStrings`); wired through select/autocomplete/
  multi-select/table/command-palette (empty text), dialog/drawer/bottom-sheet
  (close), alert/banner (dismiss), pagination/calendar/carousel (aria) and the
  sort announcer. (shipped.)
- **P2 Storybook (or keep the docs app) + visual-regression** snapshots
  (Playwright) in light/dark to catch UI regressions.
- ✅ **Automated a11y checks** — `a11y-smoke.spec.ts` runs axe-core over
  rendered component fixtures in the normal test suite (shipped); docs-page
  crawling remains optional follow-up.
- ✅ **SSR verification** — `ssr-smoke.spec.ts` server-renders a component
  gallery via `renderApplication`, catching unguarded `window`/`document`
  access (shipped).
- ✅ **SCSS preprocessor migration** — all component styles are `.scss`; theme
  source is `styles/mk-kit.scss` (dark tokens deduped) with shared
  `_mixins.scss` (`tone`/`focus-ring`/`control-size`). (shipped.)
- ✅ **Density mode** — global comfortable/compact switch via
  `data-mk-density` + `MkThemeService.toggleDensity()` (shipped).
- ✅ **Secondary entry points** — Material-style per-group FESMs; code-split
  apps only carry the groups they use (docs main: 1,082KB → 415KB).
- ✅ **Full i18n coverage** — every built-in string + localisable date names,
  plus the `validation` message group behind automatic form-field errors.
- ✅ **Reactive-forms parity (v0.7.0)** — every control is a value accessor;
  constraint inputs (`min`/`max`/`minLength`/`required`, date & time bounds,
  item counts, card/IBAN/postal formats) report validation errors via
  `NG_VALIDATORS` and re-validate when the constraint changes; `mk-form-field`
  derives its error/required/disabled state from the projected `NgControl`
  (no `ErrorStateMatcher`, no `<mat-error>` equivalent needed) and
  `mk-form-error-summary` can collect a whole `FormGroup`. (shipped.)
- ✅ **Keyboard-complete data grid** — resize/reorder/edit all keyboard operable.
- ✅ **Docs IA overhaul** — split pages, on-page TOC, ⌘K search, new nav.
- ✅ **RTL support** — logical properties across the library (shipped).
- ✅ **High-contrast / forced-colors support** — a dedicated
  `@media (forced-colors: active)` layer in the theme re-expresses
  selection/checked/fill states with system colors (shipped).
  **P3 additional prebuilt themes**,
  ✅ **a theme-builder page** in the docs (`/theme-builder` — live token controls +
  copy-paste `:root` output).
- **P3 CHANGELOG + semantic-release** (changelog is hand-kept; release on
  `v*` tags). ✅ **Bundle-size budget** — CI fails when the built FESM bundles
  exceed `scripts/size-budget.json` (shipped).

---

## Suggested near-term order

Tests, CI, the SCSS migration, i18n and all CMS blockers are done. All P1s
are shipped. What's left of Round 1 is P2/P3:

1. RTL audit + density mode; high-contrast / forced-colors theme (remaining P2/P3).
2. **Round 1 + Round 2 gap analyses are effectively complete** — nearly every listed control has shipped.

---

## Round 2 — proposed new controls

The Round 1 gap analysis above is essentially complete. This is a fresh pass of
genuinely useful controls still missing, measured against modern component
libraries (Radix, Ark, PrimeNG, Ant) and SaaS/admin needs. Each notes the
existing primitive it would reuse. Priorities as before.

### Tier 1 — high value, clean fit
- ✅ **Imperative dialogs** — `MkDialogService` already had `confirm()`; added
  `alert()` (single-button) and `prompt()` (text input) — Promise-based, over the
  existing overlay/dialog (shipped).
- ✅ **`mkMask`** — input-mask directive (`0`/`A`/`*` tokens + literals) with
  `(unmaskedChange)` raw value; skips ill-fitting chars, caret-aware (shipped).
- ✅ **`mk-tag-input`** — freeform token/chip input (create-on-Enter/separator,
  paste-split, Backspace-removes), CVA over `string[]`, reuses `MkChip`; `max` /
  `allowDuplicates` / `addOnBlur` (shipped).
- ✅ **`mk-inline-edit`** — click text to edit in place; Enter/blur saves,
  Escape reverts, `multiline` textarea, CVA over string (shipped).
- ✅ **`mk-password-input`** — reveal toggle + 0–4 strength meter + rules
  checklist, CVA over string (shipped).

### Tier 2 — useful, moderate size
- ✅ **`mk-transfer-list`** — dual list box (available ⇄ selected), CVA over the
  selected values, per-list filter (shipped).
- ✅ **`mk-tree-select`** — hierarchical dropdown (mk-tree in a top-layer popover),
  CVA, clearable (shipped).
- ✅ **`mk-hovercard`** + `[mkHovercardFor]` — hover-preview panel with open/close
  delays, stays open while hovered (shipped).
- ✅ **`MkHotkeysService` + `[mkHotkey]`** — global shortcut registry (`mod+k`,
  chords), ignores editable targets; `mkParseHotkey`/`mkMatchesHotkey` (shipped).
- ✅ **`mk-tour`** — product-onboarding coach marks (`MkTourService` +
  popup) (shipped).

### Tier 3 — larger / specialized
- ✅ **Data-grid pro** — extended `mk-table` with column resize, drag reorder,
  pin/sticky columns, and inline cell edit (double-click); gated by
  `resizableColumns`/`reorderableColumns` + per-column `resizable`/`editable`/
  `pinned`, with `(columnResize)`/`(columnReorder)`/`(cellEdit)` (shipped).
- ✅ **`mk-event-calendar`** — month scheduler with event pills + "+N more",
  month nav, day/event click (shipped).
- ✅ **`mk-kanban`** — draggable board columns/cards on the dnd module,
  `(cardMoved)`, custom card template (shipped).
- ✅ **`mk-notification-center`** — bell + unread badge + top-layer inbox panel,
  mark-(all-)read (shipped).
- ✅ **`mk-result`** — full-page success/error/404 status states + action slots
  (shipped).
- ✅ **`mk-countdown`** — count-to-date display, `(finished)`, `mkSplitDuration`
  helper (shipped).

## Round 3 — growth wave (2026-08, shipped in 0.31.0)

From the 2026-08 audit's gap analysis (ranked by what admin-dashboard
consumers still had to hand-roll):

- ✅ **`MkTableDataSource`** — server-side sort/page/filter adapter for
  `mk-table` + `mkSort` + `mk-pagination`: signal state (`rows/total/loading/
  error/empty`), debounced filter, latest-wins race handling, Promise or
  Observable fetchers (shipped).
- ✅ **`@mk-kit/ui/rich-text`** — the block editor's rich-text engine as its
  own entry + standalone **`mk-rich-text`** field: sanitized-HTML-string CVA
  with toolbar, for single description/notes fields (shipped).
- ✅ **`mk-repeater`** — add/remove/reorder rows of a projected template, CVA
  over `T[]`, min/max caps, touch-safe handle reordering (shipped).
- ✅ **`[mkMention]`** — @mention/#tag autocomplete inside native
  textarea/input: caret-anchored top-layer panel, sync or async options
  (shipped).
- ✅ **`*mkCan` / `*mkCannot` / `[mkCanDisable]`** — permission-gated
  rendering/disabling via a provided `MkPermissionPolicy` (signal-reactive)
  (shipped).
- ✅ **`mk-calendar-heatmap`** — GitHub-style year-of-activity squares with
  month/weekday labels, buckets, legend (shipped).
- ✅ **`mk-numeric-keypad`** + **`mk-on-screen-keyboard`** — touch-first PIN
  keypad and on-screen keyboard with trigger directive (shipped).

## Round 4 — scheduler, output & tooling wave (2026-08, shipped in 0.32.0)

- ✅ **Event-calendar editable time grid** — drag-to-move / drag-to-resize on
  the week/day views (snap grid, touch long-press, full keyboard equivalents,
  consumer-owns-data `(eventMove)`/`(eventResize)`) (shipped).
- ✅ **`mk-markdown`** — dependency-free CommonMark-subset renderer; raw HTML
  always escaped, unsafe URLs dropped at parse time; fenced-code highlighting
  via the core highlighter; GitHub pipe tables (shipped).
- ✅ **`mk-log-viewer`** — virtualized tail-follow log pane: theme-mapped ANSI
  colors, stick-to-bottom follow with scroll detach, search highlighting,
  ring-buffer cap, `role="log"` (shipped).
- ✅ **`MkHistoryService` / `MkHistoryStack`** — generic undo/redo command
  stack: batching, re-entrancy guard, scoped stacks, opt-in `mod+z` hotkey
  wiring (shipped).
- ✅ **Playwright visual regression** — 12 docs routes × light/dark, frozen
  clock, Linux baselines, weekly + manual workflow (shipped).
- ✅ **`ng add @mk-kit/ui`** — wires the theme stylesheet, optional
  `provideMkI18n` scaffold (shipped).

Still open: org-chart (P3), generated API reference (P2), test harnesses
(P3), public-npm/provenance decision (P3), nested tree-table rows (P3),
high-contrast theme preset (P3).
