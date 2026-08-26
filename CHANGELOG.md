# Changelog

All notable changes to **`@mk-kit/ui`** (published as `@mkornas/ui` up to
0.33.0). The format follows [Keep a Changelog](https://keepachangelog.com/);
versions are published to npm on `v*` tags. Dates are ISO-8601.

## [Unreleased]

### Added

- **`mk-datetime-picker`** — one field for a date and a time of day: an
  `mk-calendar` paired with a time list generated from `step`, a single
  local `Date` value, typed input (`2026-08-26 14:30`, ISO `T`, `2:30 pm`,
  bare ISO date → midnight), `min`/`max` at minute precision (boundary days
  trim the time list; validation reports `mkMinDate`/`mkMaxDate`), `hour12`,
  `clearable`, `mk-form-field` integration. Picking a day keeps the panel
  open and hands focus to the time list; picking a time commits and closes.
  Wave A of the Round-5 roadmap.
- **Nested submenus in `mk-menu`** — `<mk-menu-item [mkSubmenuFor]="sub">`
  opens a nested `<mk-menu>` beside the item on hover (150 ms dwell),
  ArrowRight, Enter, Space or click; ArrowLeft / Escape close one level and
  return focus to the item; activating any leaf closes the whole chain
  (`MkMenu.closeAll()`). Items expose `aria-haspopup` / `aria-expanded` and a
  chevron; RTL opens on the left and swaps the arrow keys. Any depth.
  `MkAnchoredPanel` gains `keepOpenWhen` so a parent panel ignores
  pointerdowns inside its nested panels.
- **`mk-split-button`** — a primary action with an attached menu: the main
  segment emits `action`, the chevron segment is a full menu button for the
  `mk-menu` given in `[menu]`. Shared `variant`/`tone`/`size`, `disabled`,
  `loading` (spinner + chevron disabled), `fullWidth`, `type="submit"`,
  i18n `moreActions` label.
- `formatDate` understands time tokens: `HH`, `H`, `hh`, `h`, `mm`, `a`.
- i18n keys `selectDateTime`, `chooseDateTime`, `chooseTime`,
  `openDateTimePicker`.

### Fixed

- `mk-page-header` actions and `mk-toolbar` end slots: buttons projected
  inside a wrapper element (`<div mkPageHeaderActions>`, `<span mkToolbarEnd>`)
  had no spacing between them; the wrapper now lays out its children with
  the slot's gap.
- `mk-date-picker`: typing an unparsable date and pressing Enter left the
  text in the field even though the value reverted; the field now shows the
  reverted value.

### Changed

- Docs: mk-kit favicon (SVG + ICO + touch icon) instead of the Angular
  default; wider header padding.

## [0.34.1] — 2026-08-26

### Changed

- **Package README rewritten** for the public release: the full component
  inventory by group, entry points, density & touch, i18n, SSR & zoneless,
  the PrimeNG mapping and the versioning/support policy. No code changes.
- First release published from CI through npm trusted publishing (OIDC) with
  a provenance attestation.

## [0.34.0] — 2026-08-26

### Changed

- **Package renamed to `@mk-kit/ui` and published to the public npm registry.**
  Up to 0.33.0 the library shipped as `@mkornas/ui` from GitHub Packages.
  Migrate with a find-and-replace of `@mkornas/ui` → `@mk-kit/ui` in imports
  and stylesheets, remove the `@mkornas:registry` line from `.npmrc`, then
  `npm install @mk-kit/ui`. No API changes. The repository now lives at
  <https://github.com/mk-kit/mk-kit>.
- Releases are published from CI with npm provenance attestations
  (`npm audit signatures` verifies them).

### Added

- **Landing page** at the docs root: a live, page-wide theming demo (the brand
  swatches rewrite the `--mk-primary` token family), a wall of live
  components, a PrimeNG → mk-kit mapping and the open-core pricing outline.
- `CONTRIBUTING.md` (DCO 1.1 sign-off), `TRADEMARK.md` and `SECURITY.md`.

## [0.33.0] — 2026-08-10

### Added

- **Bar chart fits its own category labels.** A narrow chart with many
  categories used to render every label flat at its band centre, so they
  overlapped into an unreadable smear — a 24-hour axis in a card is the
  canonical case (at 326px the band is 13.6px and "00:00" is 31.5px, so 23 of
  24 neighbouring pairs collided). `labelAngle` defaults to `'auto'`: labels
  stay flat while they fit, tilt 45° when they would collide, and thin to
  every Nth when even tilting cannot fit them — dropping a label beats
  overlapping it, and every category keeps its bar either way. A number pins
  the angle (clamped 0…90); `0` forces flat. Tilting grows the bottom margin
  by `maxLabelWidth × sin(angle)` (bounded), so `height` still means the
  height you asked for instead of clipping at the viewBox edge. Horizontal
  bars are never tilted — their categories run down the Y axis.

### Fixed

- **Category labels tracked by value, not index (NG0955).** `@for (band of
  bands(); track band.label)` produced duplicate keys whenever two categories
  shared a label — a rolling 12-month window that starts and ends in the same
  month is enough, and any thinned axis repeats the empty string. Tracks
  `$index` now.

### Changed

- `'auto'` label fitting is on by default, so existing crowded bar charts will
  start tilting and thinning without a code change. Pass `[labelAngle]="0"` to
  keep the old always-flat rendering.

## [0.32.0] — 2026-08-08

The scheduler, output & tooling wave — ROADMAP Round 4.

### Added

- **Event calendar: editable time grid.** With `editable`, week/day-view
  event pills drag to move (vertical snaps to `snapMinutes`, horizontal
  changes the day, touch arms via long-press) and drag their bottom edge to
  resize; a live time-range label and target-slot outline show the would-be
  result. Full keyboard equivalents (Enter/Space arms, arrows move,
  Shift+Up/Down resizes, Enter commits, Escape cancels) with live-announced
  steps satisfy WCAG 2.5.7. The calendar never mutates your data:
  `(eventMove)`/`(eventResize)` emit `{event, start, end}` and the consumer
  maps-and-replaces. Also fixed in passing: time-grid tooltips rendered a
  literal "HH:mm" (the date formatter has no time tokens).
- **`mk-markdown`** — dependency-free CommonMark-subset renderer for
  changelogs, AI output, and user notes. Raw HTML is always escaped and
  unsafe URL schemes are dropped at parse time, so there is no XSS surface
  and no sanitizer bypass; fenced code highlights via the core highlighter;
  GitHub pipe tables with alignment; typed AST exported
  (`mkParseMarkdown`/`mkRenderMarkdown`).
- **`mk-log-viewer`** — virtualized tail-follow log pane: ANSI SGR colors
  mapped to theme tokens (not raw terminal colors), stick-to-bottom follow
  that detaches when you scroll up (floating "Follow" chip to re-attach),
  case-insensitive search with `<mark>` highlighting that preserves ANSI
  coloring across match boundaries, `maxLines` ring buffer, copy-all and
  wrap toggles, `role="log"` semantics.
- **`MkHistoryService` / `MkHistoryStack`** — a generic undo/redo command
  stack: `push` records done actions, `batch()` groups (nested batches
  flatten), pushes during undo/redo are ignored (the classic corruption
  footgun, guarded and documented), `limit` eviction, independent scopes
  via `createScope()`, and opt-in `registerHistoryHotkeys()` wiring
  `mod+z` / `mod+shift+z` / `mod+y` that never fights native text-field
  undo.
- **Playwright visual regression** — `npm run test:visual`: 13 docs routes
  × light/dark, full-page, with a frozen clock, disabled animations, and
  two subtle stabilizations (forced scrollbar gutter; a font-warm-up pass)
  discovered the hard way. Linux baselines committed; weekly + manual
  GitHub workflow (not in the PR-blocking CI).
- **`ng add @mk-kit/ui`** — wires the theme stylesheet into angular.json
  (prepended, so app styles win) and optionally scaffolds
  `provideMkI18n({})` (`--i18n`); ships as compiled schematics in the
  package.
- Docs: new "Markdown & logs" page; history section on Core services;
  editable-grid section on Date & time; `ng add` in Getting started (which
  also had a stale pre-rename package name corrected).
- i18n: six `eventCalendar*` editing keys, four `log*` viewer keys.

### Changed

- Size budgets: data 560→640 KiB (markdown + log viewer), directives
  80→100 KiB (history).

## [0.31.0] — 2026-08-08

The growth wave: the 2026-08 audit's top "what admin consumers still
hand-roll" list, plus the touch-keys input components. Built in an isolated
worktree; also repairs a 0.30.0 packaging slip (see Fixed).

### Added

- **`MkTableDataSource<T>`** (`@mk-kit/ui/table`) — the server-side data
  adapter for `mk-table`: signal state (`rows`/`total`/`loading`/`error`/
  `empty`), `setPage`/`setPageSize`/`setSort`/`setFilter` (debounced) /
  `refresh`, Promise or Observable fetchers, epoch-based latest-wins race
  handling (a stale response can never overwrite newer state), rows kept
  on screen during loads, `connectSort(mkSort)`, and auto-cleanup when
  created in an injection context. `setSort` accepts both the `mkSort`
  directive's state and `mk-table`'s `(sortChange)` payload.
- **`@mk-kit/ui/rich-text`** — new entry point. The block editor's
  internal rich-text engine moved here (block-editor shrank 222→205 KiB and
  re-exports everything it used to), plus the new standalone
  **`mk-rich-text`**: a sanitized-HTML-string CVA field with toolbar for
  single description/notes fields where the block editor is overkill.
  Sanitizes on write and on every edit; wires into `mk-form-field`;
  normalizes visually-empty content to `''`.
- **`mk-repeater`** — add/remove/reorder rows of a projected
  `mkRepeaterRow` template. CVA over `T[]` with immutable updates,
  `factory`/`min`/`max`, touch-safe handle-only drag reorder (+ dnd's
  keyboard mode), object-identity row tracking so removing a middle row
  preserves the state of the rows below, `mkRepeaterEmpty` slot, and
  reorder announcements. New i18n keys `repeaterAddRow`,
  `repeaterRemoveRow`, `repeaterReorderRow`, `repeaterRowMoved`.
- **`[mkMention]`** — @mention/#tag autocomplete for native
  textarea/input: mirror-div caret measurement anchors a top-layer listbox
  at the caret, triggers configurable per option, contains/startsWith or
  async (`mentionFilter="none"` + `(mentionSearch)` + `mentionLoading`),
  full keyboard support with the library's Escape contract, insertion via
  `mentionInsert` with a proper `input` event so forms stay in sync.
- **`*mkCan` / `*mkCannot` / `[mkCanDisable]`** — permission-gated UI via a
  provided `MkPermissionPolicy` (`can(permission)` returning `boolean` or a
  `Signal<boolean>` — signal policies re-evaluate live). `else` templates
  supported; no provider means everything is granted; `[mkCanDisable]`
  uses native `disabled` where the element has it, `aria-disabled`
  otherwise.
- **`mk-calendar-heatmap`** — GitHub-style year-of-activity squares:
  semantic-table rendering like `mk-heatmap`, month/weekday labels from the
  i18n date names, linear intensity buckets with a `color-mix` ramp,
  legend, `(cellClick)`, rolling last-12-months default or a fixed `year`.
- **`mk-numeric-keypad`** and **`mk-on-screen-keyboard`** (+
  `[mkOnScreenKeyboardFor]` trigger) — the touch-first input components
  from the touch-keys side task, now landed with their spec coverage
  (CVA/a11y/SSR suites included), i18n keys, and the `backspace` /
  `corner-down-left` icons.
- Docs: new `/components/rich-text` page; `MkTableDataSource` section on
  the table page; repeater and mention sections on the forms/selection
  pages; calendar heatmap on charts; permissions on utilities.

### Fixed

- **0.30.0 shipped root-spec references to components it didn't contain**
  (the numeric-keypad/on-screen-keyboard coverage landed a release before
  the components) — a clean checkout of 0.30.0 could not compile the spec
  suites. 0.31.0 lands the components those specs cover, restoring a
  buildable tree.

### Changed

- Forms bundle budget raised 725→800 KiB (four new controls this wave:
  repeater, mention, numeric keypad, on-screen keyboard).

## [0.30.0] — 2026-08-08

The performance wave: the 2026-08 audit's hot paths. The theme is the same
everywhere — stop doing whole-structure work per event, and stop timers that
have nothing left to do (in a zoneless app every stray tick is a change
detection pass).

### Changed — hot paths

- **Signature pad** draws only the new segment per frame (rAF-batched, with
  `getCoalescedEvents`), with the canvas rect / devicePixelRatio / stroke
  color cached per gesture — it used to redraw *every stroke ever drawn* on
  each pointermove and force a style recalc doing it. The final stroke is
  pixel-identical (same midpoint-quadratic geometry, full redraw on release).
- **Code editor**: syntax highlighting and JSON validation now trail typing
  by ~180 ms (the textarea itself stays perfectly live; programmatic writes
  and `format()` flush synchronously). The line-number gutter counts
  newlines without allocating a split array, and keeps array identity while
  the count is unchanged.
- **Block editor** serializes the document to HTML only when something
  consumes it (`valueFormat="html"` or an `htmlChange` listener) instead of
  on every keystroke; block-definition lookup is Map-backed; the inserter
  lost its O(n²) option indexing; N inserters now share ONE document
  pointerdown listener; six input-mirror effects became pull-based signal
  wiring.
- **Drag & drop** measures each list and item once at lift (re-measuring
  only lists the placeholder actually changed, or after a mid-drag scroll —
  which the old code didn't handle at all), skips placeholder DOM work when
  the index is unchanged, and coalesces moves to one computation per frame,
  flushed synchronously on drop.
- **Sliders** capture the pointer for the drag instead of holding
  document-wide pointermove listeners for their whole life, and cache track
  geometry/direction per drag — zero layout reads per move.
- **Tree** rows `track` their node (expanding inserts rows instead of
  rewriting every row below) and expansion state survives consumer array
  rebuilds. **JSON viewer** toggles in O(1) with cached previews.
  **Kanban** keeps its drop-list connection arrays referentially stable.
  **Table** sorting uses a cached `Intl.Collator` (identical ordering,
  several-fold faster on large data).
- **Timers rest**: countdown stops ticking at zero (and while the tab is
  hidden) and re-arms on a new target; the loading bar's trickle stops at
  its 90% ceiling instead of spinning forever after a failed navigation;
  carousel autoplay pauses while the tab is hidden or the carousel is
  offscreen. Leaks fixed: tour's document listener at app teardown,
  click-outside's listener while disabled, autofocus/phone-input timeouts.
- **Paint**: progress bar and loading bar animate `transform: scaleX`
  instead of `width` (RTL-aware origins); skeleton and image shimmers are
  compositor-only translated gradients instead of per-frame
  `background-position` repaints; the scroll-area coalesces its measurements
  to one batch per frame. The event calendar's week view builds per-day
  buckets in one pass (was 14 filter+sort passes per change detection) and
  all date labels are precomputed (~98 `formatDate` calls per CD → 0 at
  rest).

### Changed — packaging

- **New `@mk-kit/ui/checkbox` entry point.** `mk-table` imported
  `MkCheckbox` from the 714 KiB forms entry, dragging the whole forms module
  graph into table-only consumers. Checkbox is now its own entry depending
  only on core, via a new **`MkFieldContext`** DI token in core (the
  abstract field-wrapper contract; `MkFormField` provides it) — also adopted
  by `mk-inline-edit`, cutting the data→forms edge. `@mk-kit/ui/forms`
  re-exports `MkCheckbox`, so existing imports keep working.
- **`mkHighlight` moved to `@mk-kit/ui/core`** (with `MkCodeLanguage`);
  `mk-code` no longer pulls the forms entry for a pure function. The forms
  entry re-exports it for compat.
- Docs site preloads lazy routes (`withPreloading(PreloadAllModules)`).

## [0.29.0] — 2026-08-08

The mobile wave: the 2026-08 audit's phone-readiness gaps, fixed as a set.
The library now behaves on an uncustomized iPhone, not just on a tablet with
the touch density flag set.

### Fixed

- **Kanban boards and sortable lists scroll on phones again.** `mkDrag` set
  `touch-action: none` on the whole item and lifted after 5px — a swipe over
  a card *was* a drag, so a board couldn't be scrolled by touch at all. Items
  now use `touch-action: pan-y` (horizontal lists: `manipulation`), and touch
  lifts via **press-and-hold** (~300 ms, new `mkDragTouchDelay` input, `0`
  restores instant lifting): moving beyond a 10 px slop before the hold
  elapses is a scroll and is left to the browser; once armed, the item gets a
  `.mk-drag--armed` lift style, scrolling locks for the gesture, and
  Android's long-press context menu is suppressed. Mouse, pen, and keyboard
  drag are unchanged.
- **iOS no longer zooms into every form.** Text-entry fields rendered at
  14 px, under the 16 px threshold iOS uses to decide to zoom. Every editable
  field — inputs, selects' typed fields, tag/multi-select queries, number,
  phone/postal/currency/card/IBAN/tax-id, OTP small cells, date/time picker
  inputs, color-picker hex, code editor (via its shared metric variable, so
  the highlight overlay stays in lockstep), table cell editor, inline edit —
  now renders at `max(var(--mk-font-size-md), 16px)` under
  `@media (pointer: coarse)`. Desktop is untouched.
- **Touch targets meet 24 px (44 px where it counts) on coarse pointers.**
  New `touch-target()` mixin in `_mixins.scss` draws an invisible centred
  hit box under `(pointer: coarse)` without changing visuals — applied to
  chip remove (~17 px), checkbox/radio (~18 px), switch, slider and
  range-slider thumbs (44 px), rating stars, splitter handle (7 px), table
  column-resize handle (8 px), tree expander.
- **Safe areas and dynamic viewports.** `env(safe-area-inset-*)` on the FAB,
  toast and snackbar containers, bottom-sheet panel, and app-shell header/nav
  (landscape notch); `100vh` → `100dvh` (with vh fallback lines) in the
  app-shell, dialog and bottom-sheet panels, menu, and toast container — so
  bottom-anchored UI clears the home indicator and nothing hides behind
  iOS Safari's collapsing toolbar.
- **Overlays behave around the software keyboard.** `MkAnchoredPanel` caps
  panels to the viewport (respecting a panel's own smaller CSS max), listens
  to `visualViewport` resize/scroll — the only signal iOS gives when the
  keyboard appears — and positions against the visual viewport. The modal
  scroll lock upgraded from `overflow: hidden` (ignored by iOS touch
  scrolling) to the fixed-body technique with reference counting and
  invisible scroll restoration; overlay scroll regions gained
  `overscroll-behavior: contain`.

### Added

- **Carousel swipe.** Pointer-based: horizontal-intent detection releases
  vertical movement to native scroll, the track follows the finger, release
  advances past 25% width or on a flick (RTL-aware), a post-drag click
  swallower protects links in slides, and reduced motion snaps instantly.
- **Tap paths for hover-only UI.** Chart tooltips pin on tap (tap another
  point to move the pin, tap outside to clear — mouse hover semantics
  unchanged); `[mkTooltip]` toggles on touch tap instead of being
  instantly self-dismissed, and taps outside dismiss it; hovercards toggle
  on tap; inline-edit's pencil affordance is always visible under
  `(hover: none)`.
- **Long-press context menu.** `[mkContextMenuFor]` opens after a 500 ms
  press on iOS Safari, which never fires `contextmenu`; the Android
  synthetic follow-up is de-duplicated.
- **Tabs and stepper headers scroll at phone widths** (hidden scrollbars;
  the active tab is scrolled into view on selection — note the tab
  indicator now sits ON the bottom border rather than 1 px below it).
- **Docs: `/touch` showcase page** — side-by-side touch-density comparison,
  a stacked `stackAt` table in a phone-width frame, bottom-sheet vs dialog,
  gestures (signature pad, handle-based sortable list), a 375 px phone-frame
  demo — and the header density toggle now cycles comfortable → compact →
  **touch**.

## [0.28.0] — 2026-08-07

The accessibility compliance release: the 2026-08 audit's WCAG 2.1 AA
failures, fixed across the whole library in one wave (10 file-partitioned
agents + central integration; 128 new specs, 1320 total green).

### Fixed — overlay & focus infrastructure

- **Escape now closes only the topmost overlay.** Every overlay used to
  register its own capture-phase document listener, so one Escape closed the
  entire stack bottom-first and a menu or picker inside a dialog could never
  consume the key. One bubble-phase listener now closes the topmost
  `closeOnEscape` overlay and respects `defaultPrevented` — inner widgets
  (menus, autocomplete, pickers, tooltips) win, as they already
  `preventDefault()`.
- **Modal overlays make the rest of the page inert.** `aria-modal` was a
  promise the DOM didn't keep. Modals now set `inert` on the other body
  children — except `[popover]` panels, toast/snackbar containers, and live
  regions (an inert live region silently stops announcing) — with exact
  per-overlay unwinding so nested modals restore correctly.
- Backdropless overlays no longer block clicks on the page behind them; the
  focus trap skips `visibility: hidden` elements and restores focus only to
  still-connected targets.

### Fixed — contrast tokens (visual change)

- `--mk-text-subtle` (placeholders, breadcrumbs, weekday headers…) now
  clears 4.5:1 in both themes (was 3.03:1 light / 3.97:1 dark);
  `--mk-focus-ring` is opaque and ≥3:1 in both themes (was 2.29:1 light);
  dark-theme `--mk-primary`/`--mk-danger` darkened minimally so white button
  labels clear 4.5:1. New **`--mk-danger-text`** token (lighter red in dark)
  keeps error/danger *text* at ≥4.5:1 on dark surfaces — all 23 danger
  text-color usages now point at it.

### Fixed — dismissal & keyboard paths

- Date picker, date-range picker and tree-select panels (teleported to the
  top layer) now close on Escape — returning focus to their trigger — and on
  tabbing out. The range picker previously had no Escape handling at all.
- Arrow keys now enter a mouse-opened menu (Down → first item, Up → last);
  ArrowUp on a closed trigger opens focusing the last item.
- Tooltips satisfy WCAG 1.4.13: a 150 ms grace lets the pointer travel onto
  the tooltip, and Escape dismisses it from anywhere. Hovercards return
  focus to the trigger on Escape.
- The block editor's formatting toolbar is keyboard-operable (tools fire on
  click, the toolbar survives Tab into it, Escape returns to the text); the
  block options popup dropped its fake `role="menu"` for honest disclosure
  semantics. The tree's chevron expands a branch without selecting it, which
  makes tree-select branches mouse-reachable.
- Sliders flip ArrowLeft/Right in RTL to match the mirrored track. Alt+Arrow
  column reorder at the table edge no longer triggers browser Back.

### Fixed — semantics & live regions

- Carousel: visible pause/play toggle (first in tab order, two-way
  `userPaused`), autoplay disabled under `prefers-reduced-motion`, touch
  pauses on pointerdown, and the position live region is silenced only while
  auto-rotating. Slide labels are i18n (`slideOf`).
- Table stacked mode re-applies roles to the five spots it missed
  (selection/expander cells, detail/group/empty rows); the inline cell
  editor has an accessible name and deterministic focus; `MkSortHeader`
  renders a real `<button>` (note: clicks on the `th` outside the button no
  longer sort — set `--mk-sort-header-pad-y/x` to extend the fill).
- Filtering announces result counts (autocomplete, multi-select, command
  palette — new `resultsCount` key); chip collections announce add/remove
  (`itemAdded`/`itemRemoved`); toast/snackbar no longer announce everything
  twice (`MkSnackbarConfig.politeness` is deprecated, a no-op); the loading
  bar is a real progressbar while active.
- Chip remove buttons are named "Remove ⟨chip text⟩" by default; removable
  chips are keyboard-focusable. Steppers announce completed/error states.
  Diff rows carry sr "Added:"/"Removed:" prefixes and split view gained
  visible +/− gutter glyphs. Banner scopes its live region away from its
  buttons and hides the icon slot from AT.
- Command palette: i18n dialog label, `role="group"` sections, active option
  scrolled into view, visible-and-announced empty state.
- Code, JSON viewer, heatmap and diff scroll regions are keyboard-focusable
  named regions. FAB uses correct disclosure semantics (actions follow the
  trigger in DOM, focus moves in on open, Escape restores). Back-to-top
  respects `prefers-reduced-motion` and moves focus to the scroll target.
- Rating and OTP wire into `mk-form-field` (label/description/error
  associations); the file-upload retry button is no longer inside an
  `aria-hidden` subtree; the form error summary uses the i18n title and
  focuses itself on failed submit (`autoFocus`, default on).

### Added

- `MkPasswordInput[autocomplete]` (`'current-password' | 'new-password'`),
  `MkCarousel[userPaused]`, `MkFormErrorSummary[autoFocus]`, and i18n keys
  `resultsCount`, `pauseSlideshow`, `playSlideshow`, `slideOf`,
  `commandPaletteLabel`, `stepCompleted`, `stepError`, `diffAddedLine`,
  `diffRemovedLine`, `itemAdded`, `itemRemoved`.

## [0.27.2] — 2026-08-07

Quick-wins wave from the 2026-08 five-track audit (a11y / mobile / performance
/ compatibility / gaps): the small, provable bugs first.

### Fixed

- **Anchored panels can no longer vanish when `showPopover()` throws.** The
  top-layer promotion wrapped `showPopover()` in a try/catch but left the
  `popover="manual"` attribute on the element in the catch path — and in any
  Popover-supporting browser the UA stylesheet then applies
  `[popover]:not(:popover-open) { display: none }`, hiding the panel with no
  error. The catch now removes the attribute so the body-portal fallback
  actually renders. Regression-tested with a throwing `showPopover`.

- **`MkSignaturePad.clear()` no longer crashes on the server.** `redraw()`
  read `window.devicePixelRatio` and called `getComputedStyle` unguarded;
  its siblings (`resizeCanvas`, `paintExternal`) check `isBrowser`, this one
  was missed — and it is reachable during SSR through the public `clear()`.
  The SSR smoke root now calls `clear()` after view init to keep it covered.

- **Fast taps can no longer abort pointer interactions mid-setup.**
  `setPointerCapture` throws `NotFoundError` when the pointer has already
  been released — easiest to hit with quick touch taps. Guarded in `mkDrag`,
  the splitter, the scroll-area thumbs, and the signature pad (the other
  call sites already used optional calls).

- **Sliders recover from cancelled pointers.** `MkSlider` and
  `MkRangeSlider` listened only for `pointerup`, so a browser-initiated
  `pointercancel` (notification shade, long-press UI) left them wedged in
  dragging state until the next stray pointer event. Both now treat
  `pointercancel` as release.

- **`rxjs` declared as a peer dependency.** `MkOverlayRef` has a runtime
  import of `Observable`; resolution only worked through Angular's own
  transitive peer. Now explicit (`^7.8.0`).

### Changed

- **SSR smoke coverage extended** to `mk-block-editor` (including a
  server-side `mkHtmlToBlocks()` round through its no-DOM fallback) — the one
  entry point the suite previously skipped.

## [0.27.1] — 2026-07-29

### Fixed

- **`MkAppShell` no longer spends 12% of a phone screen on gutters.**
  `.mk-app-shell__main` had `padding: var(--mk-space-6)` — 24px each side —
  with no media query, on every screen of every app built on the shell. Below
  640px it is now `--mk-space-4`, giving 16px back to the content the user
  actually came for.

## [0.27.0] — 2026-07-29

### Added

- **`MkTable[stackAt]` — rows become cards on narrow screens.** A grid cannot
  survive a phone: eight columns become eight unreadable slivers, and
  horizontal scrolling loses the row you were reading. Set a pixel width and
  below it each row renders as a card with the column header beside its value.

  The threshold is measured on the **table's own box**, via `ResizeObserver`,
  not the viewport — a table in a narrow sidebar should stack while the window
  around it is enormous, and one on a tablet in landscape should not.

  Per-column behaviour is one field, `MkTableColumn.stack`:
  `'title'` (card heading, unlabelled — the value identifies the record),
  `'footer'` (actions, unlabelled, along the bottom), `'hide'` (not rendered at
  all, so a screen reader does not read it either — unlike hiding cells in CSS).
  Anything unset becomes a labelled `header / value` row.

  **The DOM stays a real `<table>`.** Selection, expandable rows, inline edit,
  grouping and consumer `mkTableCell` templates all reach for a `td`, so
  swapping in different elements would have broken every one of them. Because
  `display: block` strips a table of its implicit ARIA roles, the component
  re-applies `role="table|rowgroup|row|cell"` *while stacked only* — axe passes
  in both layouts, and the grid keeps the semantics the elements already carry.

  Grid-only chrome is suppressed when stacked: per-column widths (configured or
  dragged), pinned offsets, and zebra striping, none of which describe a card.

  Opt-in — `stackAt` defaults to `0`, so no existing table changes shape.

## [0.26.1] — 2026-07-29

### Fixed

- **`MkCalendar`'s today dot no longer lands on top of the date.** The dot is
  an `::after` that was anchored to the day-number `<span>`, which is
  `line-height: 1` — so its box is only as tall as the glyphs and
  `bottom: 4px` fell across the digits rather than beneath them. Worst on
  today-**and**-selected, where dot and text are both `--mk-primary-contrast`
  and it read as a white smudge over the number. The dot now hangs off the day
  button, whose box is the whole cell and which was already positioned; the
  span's now-purposeless `position: relative` is gone.

### Added

- **`MkCalendar[fullWidth]`.** The host sizes to content, which is right for a
  date-picker popover and wrong for a calendar laid out in a page column or
  sidebar — it sat at its intrinsic width and left the space beside it empty.
  Opting in stretches the grid and shares the width evenly between cells, with
  `--_cell-size` becoming their *minimum* rather than a fixed size, so the
  calendar grows with its container but never squashes the dates below a
  usable target. Default stays off; popovers are unaffected.

- First tests for `MkCalendar`'s layout wiring. Note the dot's pixel placement
  is CSS and jsdom has no layout engine, so that part is structural only.

## [0.26.0] — 2026-07-29

### Added

- **`data-mk-density="touch"` — a density mode for fingers.** The density axis
  only went one way: `compact` tightened controls, and there was nothing for
  tablets and kiosks. The default 38px control is comfortable under a cursor
  and too small for a finger, so touch screens ended up re-implementing sizes
  in application CSS. `touch` sets 40/48/56px controls (48px is the WCAG 2.5.5
  target) and grows `--mk-space-3`/`--mk-space-4` with them, since adjacent
  targets are as much of a mis-tap problem as small ones.

  It composes per-subtree, which is the point: these are plain custom
  properties, so `data-mk-density="touch"` on any element rescales everything
  inside it. A touch-sized dialog inside an otherwise mouse-sized admin needs
  one attribute, not a stylesheet.

### Changed

- **`MkDensity` gains `'touch'`**, and `MkThemeService` no longer special-cases
  a single mode when writing `data-mk-density`: `comfortable` is the token
  default and so remains the *absence* of the attribute, while every other mode
  writes its own name. `toggleDensity()` still flips comfortable ↔ compact, and
  now returns to comfortable from `touch` rather than cycling into it — a
  mouse user pressing a density button must never land on finger-sized
  controls.
- First tests for `MkThemeService`, covering the above.

## [0.25.2] — 2026-07-26

### Fixed

- **`MkAppShell` mobile drawer no longer hides behind its own scrim.** The
  sidebar sits earlier in the DOM than the scrim and both were at
  `--mk-z-drawer`, so with equal z-index the scrim painted on top and the
  open drawer was dimmed and unclickable. The mobile sidebar now sits at
  `calc(var(--mk-z-drawer) + 1)`.

## [0.25.1] — 2026-07-25

### Fixed

- **`MkNavItem` sub-lists actually collapse now.** The template hides the
  nested `<ul>` with the `hidden` attribute, but the stylesheet's
  `.mk-nav-item__sub { display: flex }` outweighs the UA's
  `[hidden] { display: none }`, so `expanded=false` was silently ignored and
  every parent item rendered permanently expanded. An explicit
  `.mk-nav-item__sub[hidden] { display: none }` restores the collapse —
  the same guard `MkNavGroup` already shipped for its items region.

- **No more stray focus ring around overlay panels.** With
  `autoFocus: false` the focus trap focuses the panel itself
  (`tabindex="-1"`), and the UA focus ring rendered as a blue outline around
  the whole bottom sheet / dialog. The panel's programmatic focus is pure Tab
  containment, so `.mk-overlay-panel` now suppresses its own outline;
  controls inside keep their rings.

## [0.25.0] — 2026-07-25

### Fixed

- **`MkTooltip` now dismisses on pointer input.** Tooltips deliberately sit
  above dialogs (`--mk-z-tooltip` 1300 vs `--mk-z-dialog` 1100) so a tip on a
  control INSIDE a modal stays visible. The cost of that ordering is that a
  tooltip which outlives the interaction that spawned it floats over whatever
  the interaction opened — tap a tooltipped element that also opens a dialog
  and the tip hung there on top of it.

  `pointerdown` now hides the tip, and suppresses the `focusin` that the same
  press causes so it cannot immediately reopen. Keyboard focus, which has no
  preceding pointerdown, still shows a tooltip as before.

## [0.24.0] — 2026-07-25

### Added

- **`MkImage` gains `priority`, `srcset` and `sizes`** — the LCP path. The
  component already reserved layout with `aspectRatio` and deferred with
  `lazy`, but lazy is exactly wrong for a hero: deferring the largest
  above-the-fold image is what pushes LCP past 2.5s. `priority` fetches
  eagerly at `fetchpriority="high"` with `decoding="sync"`, and deliberately
  overrides `lazy` so a lazy default cannot silently defeat it. Use it on ONE
  image per page — several compete for the bandwidth the real LCP image needs.

  `srcset`/`sizes` pass through verbatim. Serving a 2048px file into a 600px
  slot is one of the most common LCP mistakes and there was previously no way
  to avoid it through this component.

  Note what `priority` does NOT do: emit `<link rel=preload>`. That tag has to
  be in the HTML the server sends in order to beat the browser's preload
  scanner, which a component rendered later cannot guarantee. For a CSS
  background or a late-rendered hero, pair this with a preload hint.

## [0.23.0] — 2026-07-25

### Fixed

- **`MkStepper` vertical orientation now interleaves each step's body with its
  own header**, instead of stacking all three headers and dropping the content
  below them. `orientation="vertical"` previously only changed the header
  rail's `flex-direction`, which is a horizontal layout wearing a column — the
  content never sat under the step it belonged to.

  This required `MkStep` to capture its body as a **template** rather than
  projecting it in place, so the stepper can render each body in the position
  the orientation calls for. The public API is unchanged —
  `<mk-step label="…">content</mk-step>` still reads identically — but the step
  host element is now empty and the panel wrapper (with its role and aria)
  belongs to the stepper.

  The ARIA model deliberately differs by orientation, matching what Angular
  Material does: horizontal stays a `tablist` of `tab`s over `tabpanel`s, while
  vertical becomes a disclosure pattern — plain buttons carrying
  `aria-expanded` / `aria-current="step"` over `role="region"` panels. `role=tab`
  requires tabs to be direct children of their `tablist`, which an interleaved
  layout cannot satisfy, so reusing it there would have been invalid.

  The vertical connector is now the content wrapper's leading border, so the
  rule spans the expanded body and stops at the last step rather than being a
  fixed-height stub.

### Added

- **`MkOverlayService.closeAll()`** (plus `openCount`) — dismisses every open
  overlay, newest first. App-level events (logging out, a session expiring)
  have to clear whatever is floating above the page, and the caller generally
  holds no reference to it; previously there was no way to do this at all.
  Each is closed with no result, exactly as a backdrop click would.

## [0.22.0] — 2026-07-25

### Added

- **`MkOverlayConfig.autoFocus`** (default `true`) — set `false` to focus the
  panel itself instead of its first focusable control. Content-led surfaces (a
  product sheet, an image preview) usually have a close button first, so the
  default announces "dismiss me" before the content. This is deliberately *not*
  implemented as `trapFocus: false`: Tab containment and focus restore are what
  make the overlay modal, and they stay on.

- **`--mk-spinner-size` / `--mk-spinner-thickness`** — public tokens on
  `MkSpinner`. The `sm`/`md`/`lg` presets top out at 2.25rem, which is right for
  inline spinners but too small for a page-level loader; either token now
  overrides the preset. Chosen over a second sizing *input* so there is no way
  for `size` and a diameter to disagree.

### Fixed

- **`.mk-bottom-sheet-panel` chrome now ships in `mk-kit.css`**, alongside
  `.mk-dialog-panel`, instead of living in the `MkBottomSheet` component's
  stylesheet. That stylesheet only loads when the layout component is actually
  rendered, so opening a *bare* component through `MkBottomSheetService` — the
  normal thing to do when the sheet body is bespoke — produced an unstyled,
  viewport-centred panel with no surface, radius, bottom anchoring or entrance
  animation. Bare panels also get the same padding/scroll-region fallback
  dialogs already had.

## [0.21.0] — 2026-07-25

### Added

- **`MkSubmitInput`** (`mk-submit-input`) — the "type a code and apply it"
  pattern as one connected control: discount codes, gift cards, invite codes,
  newsletter sign-up, quick search. The inner input and its action button share
  a single `mk-input-group` frame; the button is disabled while the value is
  empty or blank, while `disabled`, and while `loading` (where it delegates to
  `mkButton`'s spinner). **`(submitted)` emits the trimmed value** on click or
  on Enter.

  Because this control almost always sits inside a *bigger* form, Enter must
  never trigger that form's submit: the action is a `type="button"` and, while
  `submitOnEnter` (default `true`) is on, the Enter keydown is
  `preventDefault()`-ed — the browser's implicit form submission never fires.
  `[submitOnEnter]="false"` hands Enter back to the enclosing form.

  The button is configured, not projected: `buttonLabel` sets its caption, and
  `buttonIcon` switches it to the square icon-only variant where that same
  label becomes its `aria-label`, so the action always has an accessible name.
  `buttonVariant` / `buttonTone` forward to `mkButton`; `clearable` adds a
  clear affix; `label` names the input itself when used outside an
  `mk-form-field` (inside one, the field's `<label for>` still targets the
  inner input). Implements `ControlValueAccessor` with a two-way `value` model,
  so `[(value)]`, `[(ngModel)]` and reactive forms all work.
- **i18n** — new `submit` string (`'Submit'`), the default action caption.

## [0.20.0] — 2026-07-25

### Added

- **Time picker `valueFormat`** (`mk-time-picker`) — the form value can now be
  a `Date` instead of a `HH:mm` string, for hosts whose model is a datetime
  (migrating off Angular Material's `mat-timepicker`, feeding an order's pickup
  instant, …). `valueFormat="date"` emits a `Date` whose **local** hours and
  minutes carry the picked time, with seconds and milliseconds zeroed; the date
  part is taken from the current value when that is already a `Date` — so
  editing the time repeatedly never drifts the day — and otherwise from today.
  Like `mk-phone-input`, **both** modes read either shape back: `writeValue`
  (and `[(value)]`) accept a `Date`, a `HH:mm` string or `null` regardless of
  the mode and normalise to the configured one; only the *emitted* value
  changes. Internally the time is always canonical `HH:mm`, which is what
  `[min]` / `[max]` and the `mkMinTime` / `mkMaxTime` validators compare — so
  bounds work unchanged against a `Date` model. Clearing still emits `null` in
  both modes. **The default (`'string'`) is unchanged**: the value stays a
  `HH:mm` string and existing consumers need no edit; `value` is merely widened
  to `string | Date | null`.

## [0.19.0] — 2026-07-25

### Added

- **Field directive** (`mkField`) — one attribute that applies the semantic
  mobile-keyboard and autofill bundle a text input needs, so the two mistakes
  every codebase makes stop happening: email fields without
  `autocapitalize="off"` (iOS capitalises every address) and address fields with
  no `autocomplete` at all (the browser cannot offer a saved address at
  checkout). `<input mkInput mkField="street" formControlName="street" />` sets
  `type`, `inputmode`, `autocomplete`, `autocapitalize`, `autocorrect`,
  `spellcheck` and `enterkeyhint` from one name. Eighteen kinds — `email`,
  `tel`, `url`, `search`, `numeric`, `given-name`, `family-name`, `name`,
  `organization`, `street`, `address-line1`, `address-line2`, `city`, `region`,
  `country`, `postal-code`, `username`, `one-time-code` — exported as
  `MkFieldKind` with the lookup table itself (`MK_FIELD_PRESETS`, typed
  `MkFieldPreset`) so hosts can inspect or extend it. The kind is a signal
  input, so a bound kind re-applies the whole bundle. It only sets attributes,
  so it composes with `mkInput`, `mk-form-field`, `[(ngModel)]` and reactive
  forms without touching their APIs. Precedence: a **static** attribute on the
  element wins (the directive snapshots the seven attributes at construction and
  fills in only what is missing — `mkField="username" type="password"` stays a
  password field); a template `[attr.…]` binding does **not**, because Angular
  applies host bindings after template bindings.

## [0.18.0] — 2026-07-25

### Added

- **Tax-ID input** (`mk-tax-id-input`) — a country-aware business
  tax-identifier field: it masks as you type, keeps the **compact** identifier
  (digits only) as the form value while displaying it masked, defaults its
  placeholder to a valid example for the country and self-validates through
  `NG_VALIDATORS` (error key `taxId`). Five built-in formats — `PL` NIP
  (`000-000-00-00`, verified with the official weighted mod-11 checksum,
  including the "remainder 10 is never valid" rule), `DE` USt-IdNr., `CZ` DIČ,
  `IT` Partita IVA and `SK` IČ DPH (shape-verified). `MK_TAX_ID_FORMATS`,
  `MkTaxIdFormat`, `mkTaxIdFormat()`, `mkTaxIdIsValid()`, `mkNipChecksum()` and
  `mkTaxIdValidator(country)` are exported for reactive forms / custom use;
  empty values pass so they compose with `Validators.required`.
- New i18n keys: `taxId` (accessible label) and `validation.taxId` (error
  wording, receives `{ country, label, example }`).

## [0.17.4] — 2026-07-25

### Fixed

- **`MkNavItem` parents are no longer dead buttons in a collapsed rail.** When
  the enclosing `MkNavList` is `collapsed`, an item's sub-list cannot be shown
  (`mk-nav-item__sub` is always hidden at rail width), so clicking a parent only
  flipped an invisible `expanded` flag and appeared to do nothing — making every
  section that has children unreachable while the sidebar was collapsed. The
  parent now emits `action` instead, so the host can navigate to the section,
  matching what a leaf item does. Expanded lists are unchanged (still toggle the
  disclosure), and hosts that don't bind `(action)` on parents keep the previous
  behaviour.

## [0.17.3] — 2026-07-24

### Fixed

- **Input focus rings are now inset** (`outline-offset: -2px`) on `mkInput`,
  `MkInputGroup`, `MkNumberInput`, `MkCurrencyInput` and `MkPhoneInput`. The
  previous outward ring was clipped when the field sat flush inside an
  `overflow:hidden` ancestor (cards, dialog/drawer bodies, table cells); an
  inset ring hugs inside the border and is never clipped.
- **Dialog and drawer titles wrap** instead of overflowing past the header's
  close button (`overflow-wrap: anywhere` + `min-width: 0`), so long entity
  names no longer push the close control off the edge.

## [0.17.2] — 2026-07-24

### Fixed

- **Nested `mkDrag` no longer captures a nested item's drag handles.** An outer
  draggable item collected its handles with `descendants: true`, so a nested
  `[mkDropList]`/`[mkDrag]` (e.g. a product list inside a draggable category)
  had its handles claimed by the outer item — pressing an inner handle started
  the *outer* drag and inner dnd never worked. Handles are now scoped to their
  nearest `[mkDrag]` ancestor.
- **`mkDialogFooter` buttons no longer touch.** The projected footer content is
  the footer's single child, so the footer's `gap` never reached the buttons
  inside it. The projected wrapper is now laid out as the actions row itself
  (gap + right-alignment). New: `data-align="start|center|end|between"` on the
  `[mkDialogFooter]` element controls button distribution (default `end`).

## [0.17.1] — 2026-07-24

### Fixed

- **`mkInput` now provides its own `ControlValueAccessor`.** It previously
  leaned on Angular's built-in `DefaultValueAccessor`, which did not reliably
  push a programmatic model reset back onto the native element — clearing the
  bound model (e.g. `newValue = ''` after adding an item) left the old text
  visible in the field. The directive now writes the value straight to the host
  `<input>`/`<textarea>`, buffers IME composition so `onChange` fires once per
  completed character, and reflects `setDisabledState`. Existing `[(ngModel)]`
  and reactive-forms usage is unchanged; the field just clears when the model
  says it should.
- **`MkTagInput` clears its entry field after committing a tag.** The one-way
  `[value]="query()"` binding did not empty an input the user had just typed
  into, so a second tag concatenated onto the first. Commit now resets the
  native element directly alongside the signal.

## [0.17.0] — 2026-07-24

### Changed

- **`MkDragHandle` is now a directive** (was an attribute-selector component).
  A component selector cannot sit on another component's element, so
  `<mk-icon mkDragHandle />` failed with NG8023 — exactly the composition the
  CDK's `cdkDragHandle` allowed. The handle's look (grab cursor, muted colour,
  `touch-action: none`) moved from the component stylesheet to the global
  `.mk-drag-handle` class in the theme stylesheet (same precedent as the
  overlay chrome). Markup and behaviour are unchanged for existing
  `<span mkDragHandle>` / `<button mkDragHandle>` consumers.

## [0.16.0] — 2026-07-24

### Added

- **`MkInputGroup`** (`mk-input-group`) — wraps a native `input[mkInput]` with
  `mkInputPrefix` / `mkInputSuffix` affixes (icons, static text, compact
  buttons) inside one shared control frame. The group owns the border, focus
  ring and invalid state; the nested input detects the group via DI and drops
  its own chrome. Inherits size + invalid from a wrapping `mk-form-field`.
  Closes the long-standing "search field with a leading icon" gap that
  consumers papered over with local wrappers.

## [0.15.0] — 2026-07-23

### Added

- **`rowClass` on `MkTable`** — optional `(row) => string | null` whose result
  is appended to each row's class list. For consumer-owned row state (an
  "active in the side panel" highlight, an unread accent) that the built-in
  `selectable` style doesn't cover.

## [0.14.0] — 2026-07-23

### Added

- **`cropRect()` on `MkImageCropper`** — the visible crop region in natural
  image pixels (exactly what `crop()` would rasterise), without touching a
  canvas. For backends that perform the actual crop from the master image:
  the client sends coordinates, keeps full quality and works in jsdom/SSR.

## [0.13.0] — 2026-07-23

### Added

- **`description` on `MkAutocompleteOption`** — a muted second line under the
  label, rendered only when present. Labels alone can collide (two customers
  named Jan Kowalski); the description is the disambiguator (email · phone, an
  id under a product name). Options without one are unchanged.

## [0.12.0] — 2026-07-23

### Added

- **`disabledDate` on `MkDatePicker`.** `MkCalendar` already accepted a
  per-day disable predicate, but the picker never threaded it through, so a
  consumer needing "closed days aren't selectable" (a restaurant's reservation
  form) had to keep a Material datepicker alive just for its filter. Same
  predicate, now on the picker:

  ```html
  <mk-date-picker [(value)]="date" [disabledDate]="isClosedDay" />
  ```

## [0.11.0] — 2026-07-23

### Added

- **Week and day views on `MkEventCalendar`.** The component was month-grid
  only, which rules it out for the screen schedulers actually live in — staff
  work *today*, not *this month*. A new `view` model (`'month' | 'week' |
  'day'`, default `month`) switches to a timed hour grid: events gain optional
  `start`/`end` instants, overlaps pack side-by-side into lanes (the standard
  scheduler layout, implemented as a pure, unit-tested function), untimed
  events render in an all-day strip, and `dayStartHour`/`dayEndHour` bound the
  visible range. Clicking an empty slot emits `slotClick` with the slot's start
  instant — the "create at this time" affordance every scheduler needs. Header
  navigation steps by the active unit and the label follows
  (`July 2026` / `Jul 20 – Jul 26, 2026` / `July 23, 2026`).

  ```html
  <mk-event-calendar
    [(view)]="view" [(viewDate)]="date" [events]="events"
    [dayStartHour]="10" [dayEndHour]="23"
    (slotClick)="createAt($event)" (eventClick)="open($event)" />
  ```

  Month-view behaviour, markup and APIs are unchanged; `date` alone still
  places an event on the month grid.

## [0.10.0] — 2026-07-23

### Added

- **`[mkTableCell]` — per-column cell templates for `MkTable`.** A cell could
  only be text (`MkTableColumn.format` returns a string), so a status tag, an
  avatar, a progress bar or an action button meant abandoning `mk-table` for a
  hand-rolled `<table>`. An `<ng-template mkTableCell="key" let-value
  let-row="row">` now renders that column's cells, receiving the **raw** value
  (not the formatted string) plus the row. Columns without a template are
  unchanged, and `format` still applies wherever a string is needed.

  ```html
  <mk-table [columns]="cols" [data]="rows()">
    <ng-template mkTableCell="status" let-value>
      <mk-tag [tone]="toneFor(value)">{{ label(value) }}</mk-tag>
    </ng-template>
  </mk-table>
  ```

- **`MkI18nInput` — one field, many languages.** Translatable text is usually
  built as one input per locale, stacked; the form then grows linearly with
  locale count and the field the author actually wants is buried. This renders
  a single input with a compact locale switcher, and marks any `requiredLocales`
  that are still empty so a missing translation is visible without switching to
  it. Binds a `Record<code, string>` as a single control, so it drops into
  reactive forms without a nested group.

  ```html
  <mk-form-field label="Name">
    <mk-i18n-input formControlName="name" [locales]="locales"
                   [requiredLocales]="['pl']" />
  </mk-form-field>
  ```

  The empty marker is a glyph as well as a colour — colour alone would not
  survive a monochrome or colour-blind read.

## [0.9.0] — 2026-07-23

Closes the gaps that forced a consuming app to keep local wrappers and CSS
overrides instead of using the kit as-is.

### Added

- **`MkDialogConfig.size`** — `'sm' | 'md' | 'lg' | 'xl'` (32/45/56/75rem, each
  `min(target, 92vw)`). The panel had exactly one width, so anything wider than
  a confirmation — a two-column form, a table in a modal — needed the consumer
  to ship its own panel-class CSS. Defaults to `sm`, so existing dialogs are
  unchanged.

- **`MkOverlayRef.result` and `MkOverlayRef.closed$`.** The close result was
  only a Promise, which forced RxJS callers to wrap it in `from(...)` and made
  every dialog assertion in their tests async. It is now also a signal
  (`result`) and an Observable (`closed$`, emits once then completes, and
  replays to a late subscriber so it can't hang). All three settle together;
  `afterClosed` is unchanged.

- **`[mkPageHeaderMedia]` slot on `MkPageHeader`** — a leading icon/avatar/logo
  beside the title. Its absence was the one reason a consumer kept a hand-rolled
  page header. The slot collapses when nothing is projected, so existing headers
  keep their alignment.

- **`MkConfirmDialogData.icon`** — an icon beside the message, tinted by
  `tone === 'danger'`. Destructive confirms otherwise carried no visual weight
  beyond their wording, which is why consumers rebuilt the body by hand.

## [0.8.0] — 2026-07-23

Two defects found while migrating a real admin panel onto the library.

### Fixed

- **Body-level overlay panels had no chrome.** `.mk-dialog-panel` — background,
  border, radius, shadow, `max-height`, `overflow: hidden` — was defined in
  `dialog.scss`, which is `MkDialog`'s own stylesheet. `MkOverlayService`
  renders an *arbitrary* component into the panel, so opening one with
  `MkDialogService.open(MyComponent)` loaded none of it: the component rendered
  bare on the scrim with no surface and no overflow containment, and long
  content spilled. The chrome now lives in `styles/mk-kit.css`, where the rest
  of the body-level overlay CSS already lived, so it applies to any component
  the service renders. A panel with no `mk-dialog` wrapper also gets padding
  and its own scroll region.

- **Charts grew unboundedly tall.** `MkBarChart` / `MkLineChart` draw into a
  viewBox while `.mk-chart__svg` sets `width: 100%; height: auto`, so rendered
  height was `containerWidth × (viewBoxHeight / viewBoxWidth)`. A full-width
  chart on a wide monitor measured over 2000px tall. Capping the height is not
  a fix — `preserveAspectRatio="xMidYMid meet"` then letterboxes the plot into
  a narrow band with empty margins either side.

### Added

- **`responsive` on `MkBarChart` and `MkLineChart`** (default `true`). The
  viewBox width is re-derived from the measured host, so `height` means pixels
  and the drawing fills the available width without distortion or letterboxing.
  Set `[responsive]="false"` to pin the drawing to `width` (the 0.7 behaviour).
  SSR-safe: with no `ResizeObserver`, or before the first measurement, the
  declared `width` is used unchanged.

### Notes

- The chart change alters default rendering: a chart in a container wider than
  its `width` now fills that width at its declared pixel height, instead of
  scaling both. That is the intended fix, but it *will* change existing layouts
  that relied on the old scaling — opt out per chart with `[responsive]="false"`.

## [0.7.0] — 2026-07-22

Reactive-forms parity pass: every control now behaves like an Angular Material
control end to end — value accessor, validator, touched-on-blur, and a
form-field that words its own errors.

### Added

- **`Validator` on every control with constraint inputs** (22 of them). The
  bound control now reports the constraint as a validation error instead of the
  input only clamping the UI, and re-validates when the constraint changes
  (`registerOnValidatorChange`, wired by the new `mkValidatorChange()` helper in
  `@mk-kit/ui/core`):
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
  `MkErrorMessages` type are exported from `@mk-kit/ui/core`.
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

### Infrastructure

- **Releases are automatic.** Pushing a version bump to `main` now publishes
  `@mk-kit/ui`, creates the `v<version>` tag and opens a GitHub Release with
  that version's changelog section — no manual tagging. Pushing a `v*` tag
  still works and now fails loudly if the tag and `package.json` disagree
  instead of shipping a mismatch; every path skips a version that is already
  published, so re-runs and overlapping triggers cannot double-publish.
- Build and test steps moved into a reusable `verify.yml` called by both CI and
  Release, so a release runs exactly what CI runs (build lib → size budget →
  test lib → test docs → build docs → publish dry-run) and the two cannot
  drift. The built package is uploaded as a workflow artifact.
- New `scripts/changelog-section.mjs` extracts a version's changelog section;
  the release fails before publishing if that section is missing.

### Fixed

- Docs app spec asserted on an `mk-nav-list` element the shell stopped
  rendering when the docs IA overhaul replaced the sidebar with a flat text
  nav, failing `npm run test:docs` (and CI) since then. It now checks the
  actual landmark, its grouped links and the version badge.

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

- **Media group** (`@mk-kit/ui/media`) — a new entry point for image-heavy
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

- **`@mk-kit/ui/data` no longer re-exports the icon, chip and table entry
  points** — import `@mk-kit/ui/icon`, `/chip` and `/table` directly (the
  root `@mk-kit/ui` barrel still exports everything). This removes an
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
  `@mk-kit/ui/*` import convention and `.scss` styling (it still described
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
  points (`@mk-kit/ui/core`, `/forms`, `/table`, `/data`, `/feedback`,
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
  forms group; deep import paths (`@mk-kit/ui/src/...`) are replaced by the
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

Initial private release as `@mk-kit/ui` on GitHub Packages.

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

[Unreleased]: https://github.com/mk-kit/mk-kit/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/mk-kit/mk-kit/compare/v0.6.0...v0.7.0
[0.2.0]: https://github.com/mk-kit/mk-kit/compare/v0.1.9...v0.2.0
[0.1.9]: https://github.com/mk-kit/mk-kit/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/mk-kit/mk-kit/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/mk-kit/mk-kit/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/mk-kit/mk-kit/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/mk-kit/mk-kit/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/mk-kit/mk-kit/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/mk-kit/mk-kit/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/mk-kit/mk-kit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/mk-kit/mk-kit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mk-kit/mk-kit/releases/tag/v0.1.0
