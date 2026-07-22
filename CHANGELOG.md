# Changelog

All notable changes to **`@mkornas/ui`**. The format follows
[Keep a Changelog](https://keepachangelog.com/); versions are private GitHub
Packages releases published on `v*` tags. Dates are ISO-8601.

## [0.7.0] — 2026-07-22

Reactive-forms parity pass: every control now behaves like an Angular Material
control end to end — value accessor, validator, touched-on-blur, and a
form-field that words its own errors.

### Added

- **`Validator` on every control with constraint inputs** (22 of them). The
  bound control now reports the constraint as a validation error instead of the
  input only clamping the UI, and re-validates when the constraint changes
  (`registerOnValidatorChange`, wired by the new `mkValidatorChange()` helper in
  `@mkornas/ui/core`):
  - Standard Angular keys where they map — `min` / `max` (`mk-number-input`,
    `mk-currency-input`, `mk-slider`, `mk-range-slider`, `mk-rating`),
    `minlength` (`mk-password-input` `[minLength]`, `mk-otp` `[length]`),
    `required` (`mk-checkbox`, `mk-radio-group` — `required` on a checkbox
    behaves like `Validators.requiredTrue`).
  - `mk*` keys where there is no standard one — `mkMinDate` / `mkMaxDate`
    (all seven date/month/week pickers + `mk-calendar`), `mkDateFilter`
    (`[disabledDate]`), `mkDateRangeIncomplete` (half-picked range),
    `mkMinTime` / `mkMaxTime` (`mk-time-picker`), `mkMaxItems`
    (`mk-multi-select`, `mk-tag-input`, `mk-file-upload` `[maxFiles]`),
    `mkFileSize` / `mkFileType`.
  - Format checks now validate themselves with the same error shapes their
    standalone validators produce, so the two are interchangeable:
    `cardNumber` (Luhn), `iban` (mod-97, matching `mkIbanValidator()`),
    `postalCode` (matching `mkPostalCodeValidator()`).
- **`mk-form-field` derives its own state from the projected control.** It
  adopts the control's `NgControl` and renders the first validation error
  itself — no `[error]` binding — replacing the per-field `@if` ladder that
  `<mat-error>` requires. New inputs: `errorMessages` (reword one key for this
  field) and `errorOn` (`'touched'` | `'dirty'` | `'always'`; `'touched'`
  matches Material and stands in for `ErrorStateMatcher`). `required` and the
  disabled styling are derived from the control's validators / disabled state,
  and `hasError()` is joined by `errorText()`.
- **`mk-form-error-summary` collects a whole form.** Point `[form]` at a
  `FormGroup` and it walks it, one entry per invalid control, with `[labels]`
  naming the fields and `showOn` (`'submit'` | `'always'`) gating visibility.
  An explicit `[errors]` list still wins, so server-side errors compose.
- **`validation` i18n group** — messages for every key above plus the standard
  `Validators` keys, deep-merged by `provideMkI18n({ validation: … })` like
  `dateNames` and `blockEditor`. `mkFirstErrorMessage()` and the
  `MkErrorMessages` type are exported from `@mkornas/ui/core`.
- **`mk-file-upload` is a form control** — `ControlValueAccessor` + `Validator`.
  The form value is `File[]`, or the tracked `MkUploadFile[]` via the new
  `[valueFormat]="'item'"` (`MkUploadValueFormat`). Upload-progress ticks do not
  churn the form value in `file` format. `accept` / `maxSize` / `maxFiles` are
  enforced as validation errors as well as at pick time, so a list written in
  from the model side is checked too.
- `disabled` input on `mk-calendar` (previously only reachable through a form),
  and the `invalid` input the rest of the library already had on `mk-rating`,
  `mk-checkbox`, `mk-radio-group`, `mk-switch`, `mk-slider`, `mk-range-slider`,
  `mk-button-toggle-group`, `mk-block-editor`, `mk-inline-edit` and
  `mk-calendar` — with the matching `--invalid` styling and `aria-invalid`.
- **Two conformance suites** (222 tests) — `cva-conformance.spec.ts` binds all
  34 value accessors to a real `FormControl` and checks the contract
  (accessor resolution, `writeValue` without echoing back through `onChange`,
  `setDisabledState` both ways, starting disabled, callback registration);
  `forms-integration.spec.ts` covers the validators, the automatic form-field
  errors, touched-on-blur and the error summary.
- Docs: a **Reactive forms** section with a live demo on the Form fields page,
  and an **Errors and validation** section on the Material migration page
  contrasting the `mat-error` ladder with the automatic equivalent.

### Changed

- **Controls mark themselves touched on blur, not only on change.**
  `mk-radio-group`, `mk-button-toggle-group`, `mk-transfer-list`,
  `mk-block-editor`, `mk-signature-pad`, `mk-range-slider` and
  `mk-file-upload` gained a `focusout` handler with a containment check.
  Previously, focusing one and tabbing away without changing anything left the
  control `untouched`, so touched-gated error display never fired.
- `mk-form-field`'s derived required state moved from `required()` to
  `isRequired()` (the `required` input is unchanged and still means "forced
  required"); nested controls read the derived signal.

### Migration notes

- Forms that were valid can now become invalid, because constraint inputs
  report errors instead of only clamping the UI. The two most likely to bite:
  `mk-password-input` validates against `minLength` (default `8`), and
  `mk-otp` reports `minlength` for a partially entered code. Remove the input
  or relax it where the constraint was only meant as a UI hint.
- A `mk-form-field` wrapping a form-bound control now shows errors on its own.
  If you were already computing the message and passing `[error]`, nothing
  changes — an explicit `[error]` still wins. Pass `[error]="''"` to suppress
  errors entirely.

## [0.6.0] — 2026-07-18

### Added

- **Media group** (`@mkornas/ui/media`) — a new entry point for image-heavy
  UIs:
  - **Image** (`mk-image`) — figure-based image block: skeleton shimmer
    while loading, labelled error fallback, caption, `aspectRatio`/`fit`/
    `rounded` presentation, native lazy loading.
  - **Image gallery** (`mk-image-gallery`) — `grid`, `masonry` and `strip`
    (scroll-snap) layouts, `max` + "+N" overflow tile, opens the lightbox on
    click (`lightbox` off → `(itemClick)` only).
  - **Lightbox** (`MkLightboxService.open(items, startIndex)`) — fullscreen
    viewer over the overlay core: looping arrow/Home/End navigation, Esc +
    backdrop close, focus trap, polite counter, captions.
  - **Image cropper** (`mk-image-cropper`) — pan (pointer + arrow keys),
    zoom (wheel/slider/±, two-way `zoom` model), fixed `aspect`, `round`
    avatar mask, `crop()` → PNG data-URL; `crossOrigin` input for
    CORS-enabled remote sources (otherwise a tainted canvas would make
    `crop()` return `null`). Pure geometry helpers `mkCoverScale`,
    `mkClampPan`, `mkCropRect` are exported.
  - **Media gallery** (`mk-media-gallery`) — management grid with two-way
    `items`/`selection` models, checkbox multi-select, drag reorder
    (pointer + keyboard via the dnd module) and a per-item
    `mkMediaActions` template slot for consumer-supplied actions.
- **Profile card** (`mk-profile-card`, data group) — person/entity card
  composing `mk-avatar` (initials fallback): optional cover banner with
  overlapping avatar, name + subtitle, body, `[mkProfileMeta]` stats row and
  `[mkProfileActions]` footer; `orientation="horizontal"` compact row.
- New i18n keys: `previousImage`, `nextImage`, `imageOf`, `viewImage`,
  `imageFailed`, `zoom`, `zoomIn`, `zoomOut`, `mediaLibrary`.
- Docs: new **Media** nav section with "Images & lightbox" and
  "Media manager" pages; profile card documented on Cards & lists.
- **Icon set 25 → 112 glyphs** — ~70 new Feather-style icons (commerce,
  media, users, files, charts, security, nature/food and more), plus
  `arrow-up`/`arrow-down` and alias support in `MkIconRegistry`
  (`registerAliases`; a real icon registered under an alias name wins).
- **Material Symbols aliases** — `provideMkMaterialIcons()` installs ~185
  Material ligature names (`delete`, `expand_more`, `visibility_off`,
  `qr_code_scanner`, …) onto the built-in set, so templates migrating from
  `<mat-icon>` keep their icon names. Coverage driven by a real Material
  app's full icon inventory.
- **Angular Material migration guide** — `MIGRATION.md` + a condensed
  `/migration` docs page: complete component map (~30 Material modules +
  CDK → mk-kit equivalents), `--mat-sys-*` → `--mk-*` token mapping,
  before/after snippets for dialogs/tables/icons, honest gap list and an
  incremental migration order. Future compat helpers (MkTableDataSource,
  dialog token aliases, projected options, codemod) are listed as roadmap.

- **Signature pad** (`mk-signature-pad`) — canvas signature capture with
  pointer/touch/pen: smoothed strokes, hi-DPI-crisp, lossless redraw on
  resize; the form value is a PNG data-URL (`null` while empty), with a Clear
  control, `clear()`/`isEmpty()` and `(cleared)`. CVA + two-way `value`.
- **JSON viewer** (`mk-json-viewer`) — read-only collapsible tree for
  JSON-ish data: `{…} n items` previews, type-coloured primitives, circular
  references rendered as `[Circular]`, `expandDepth` +
  `expandAll()`/`collapseAll()`. `mkBuildJsonTree` is exported.
- **Bundle-size budget in CI** — `scripts/check-size.mjs` compares the built
  FESM bundles against `scripts/size-budget.json` and fails the build on
  regressions.
- Forced-colors coverage for the new controls (phone-input country list,
  card brand badge, currency affix) in the theme's
  `@media (forced-colors: active)` layer.
- New i18n keys: `signature`, `jsonLabel`.

### Changed

- CI and Release workflows bumped from `actions/checkout@v4` /
  `actions/setup-node@v4` to `@v5` (Node 20 runner deprecation).
- ROADMAP refreshed: SSR smoke, density mode, RTL, tour, forced-colors and
  the axe suite were already shipped but still listed as open.

## [0.5.0] — 2026-07-18

### Added

- **Phone input** (`mk-phone-input`) — international telephone field: a
  searchable country-prefix dropdown (60 built-in countries with flag,
  localised name via `Intl.DisplayNames`, dial code) next to a national-number
  input masked per country. Emits a single E.164 string by default or a
  structured `{ country, dialCode, national, e164 }` object with
  `valueFormat="parts"`; pasting a full `+…` number switches the country
  automatically. `preferredCountries` pins codes to the top; the country set
  is replaceable via `countries`. CVA + two-way `value`/`country` models.
- **Postal code input** (`mk-postal-code-input`) — country-aware postal/ZIP
  field: masks, uppercases and validates against 35+ built-in formats
  (PL `00-000`, US ZIP+4, CA `A0A 0A0`, NL `0000 AA`, …); free-format
  countries (GB, IE-style) validate by pattern and normalise the missing
  space on blur. Placeholder defaults to a valid example; `valid()` exposes
  tri-state validity; `mkPostalCodeValidator(country)` covers reactive forms.
- **`mkMask` improvements** — the caret helper is now exported as
  `mkMaskCaret` for building custom masked controls, and the directive derives
  `inputmode` from the pattern (`numeric` for digit-only masks) with an
  `mkMaskInputmode` override.
- **Currency input** (`mk-currency-input`) — money/amount field formatted by
  `Intl.NumberFormat`: live thousands grouping, locale separators, currency
  symbol as a fixed affix (per-locale side), fraction digits padded to the
  currency's convention on blur, zero-decimal currencies honoured; the form
  value stays a plain `number` (`null` when empty), with `min`/`max` clamping
  and an `allowNegative` switch.
- **Card number input** (`mk-card-number-input`) — payment-card field that
  groups digits per detected network (Visa/Mastercard/Discover/JCB 4-4-4-4,
  Amex 4-6-5, Diners 4-6-4), shows the brand as a badge (`(brandChange)` +
  `brand()`), stores raw digits and validates complete numbers with Luhn
  (`valid()` tri-state). `mkDetectCardBrand` and `mkLuhnCheck` are exported.
- **IBAN input** (`mk-iban-input`) — uppercases and groups in blocks of four,
  caps input at the country's exact length (65 countries) and validates with
  the ISO 13616 mod-97 checksum; value is the compact electronic format.
  `mkIbanValidator()`, `mkIbanIsValid`, `mkIbanChecksum` and
  `MK_IBAN_LENGTHS` are exported for reactive forms / custom use.
- New i18n keys: `chooseCountry`, `searchCountries`, `phoneNumber`,
  `postalCode`, `amount`, `cardNumber`, `cardBrand`, `iban`.

### Changed

- **`@mkornas/ui/data` no longer re-exports the icon, chip and table entry
  points** — import `@mkornas/ui/icon`, `/chip` and `/table` directly (the
  root `@mkornas/ui` barrel still exports everything). This removes an
  implicit `data → table` coupling that dragged the table into any chunk
  importing the data group.
- **Docs redesigned** — flat text-only sidebar (no icons, no collapsing
  groups), router-link navigation, quieter sidebar chrome, frosted sticky
  header, icon-only theme/density toggles and refreshed page typography.

### Fixed

- Anchored overlay scroll tracking now registers its capture-phase scroll
  listener as `passive` (no scroll-jank risk while a panel is open).
- `MkSelect` and `MkMenu` clear their typeahead reset timer on destroy.
- `MkFocusTrap` no longer steals focus back when an overlay is opened and
  released within the same tick (deferred initial focus is skipped after
  release).
- `MkThemeService` detaches its `prefers-color-scheme` media-query listener
  on injector destroy (repeated bootstraps in SSR/HMR/tests no longer leak).
- `PATTERN.md` updated to the real per-group entry-point layout,
  `@mkornas/ui/*` import convention and `.scss` styling (it still described
  the pre-audit `src/lib/components/` tree).

## [0.4.0] — 2026-07-10

### Added

- **Grouped table rows** — `mk-table` gained `groupBy` (column key or accessor):
  rows render under collapsible group headers with a row count, sticky below
  the (optionally sticky) column header. `groupLabel` formats the header,
  `(groupToggle)` reports collapses, and `collapseAllGroups()` /
  `expandAllGroups()` are available on the component. Sorting applies within
  groups; group order follows each group's first sorted row.
- **i18n complete** — the block editor's entire chrome (toolbar tools,
  inserter palette, per-block captions/prompts, announcements) is now keyed
  under `MK_I18N.blockEditor` (~90 keys), plus `qrCodeLabel` and `moreEvents`
  (event-calendar overflow pill). No user-facing string in the library
  bypasses `MK_I18N` anymore.
- **Theme builder rebuilt as a token generator** — the `/theme-builder` docs
  page now edits ~26 high-impact `--mk-*` tokens (brand & tones, surfaces &
  text per light/dark mode, radius/type/control-height scales, focus ring,
  spacing) with side-by-side light and dark component-gallery previews, and
  exports only the changed tokens as a drop-in stylesheet — copy to
  clipboard or download `tokens.css`.
- **CI quality gates** — an axe-core accessibility smoke test (17 rendered
  component fixtures, zero-violation assertion) and an SSR render smoke test
  (`renderApplication` over a 21-component gallery, catching unguarded
  `window`/`document` access) now run as part of the normal test suite.

### Fixed

- **Anchored overlays no longer detach on scroll** — panels (select,
  autocomplete, all pickers, menu, hovercard, …) previously kept clamping to
  the viewport while the page scrolled, ending up "stuck" at the screen edge
  far from their trigger. Scroll-driven repositioning now tracks the trigger
  exactly, and the panel dismisses as soon as the trigger scrolls fully out
  of the viewport (the CDK reposition-with-auto-close behaviour).
- `mk-nav-item` never rendered its `[mkNavIcon]` slot for plain action items:
  the icon `ng-content` appeared in all three template branches, and Angular
  assigns a projection slot to only one — a collapsed sidebar rail showed no
  icons at all. Same root cause as the breadcrumb fix below.
- `mk-breadcrumb-item` rendered link crumbs with no text: the projected label
  was assigned to only one of the two `ng-content` branches, so any crumb
  with `href` set was blank (and an axe `link-name` violation). Found by the
  new a11y smoke test.

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

[Unreleased]: https://github.com/mkornas/mk-kit/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/mkornas/mk-kit/compare/v0.6.0...v0.7.0
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
