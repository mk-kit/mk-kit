# @mk-kit/ui

**Themable, accessible Angular component library for admin dashboards, back-offices and internal tools.**

175+ standalone components, directives and services — data tables, charts,
date & time pickers, editors, kanban, overlays, an app shell — written for
Angular 22 with signals and `OnPush` from day one. Every visual value is a
`--mk-*` CSS custom property; light and dark ship out of the box; WCAG 2.1 AA
is the target, not the marketing. MIT licensed. Zero runtime dependencies
beyond Angular.

- **Docs & live demos:** <https://mk-kit.dev>
- **Changelog:** [CHANGELOG.md](https://github.com/mk-kit/mk-kit/blob/main/CHANGELOG.md)
- **Issues:** <https://github.com/mk-kit/mk-kit/issues>

## Install

```bash
ng add @mk-kit/ui
```

`ng add` installs the package and wires the theme stylesheet into
`angular.json`. By hand instead:

```bash
npm install @mk-kit/ui
```

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms`,
`@angular/platform-browser` (^22) and `rxjs` (^7.8).

## Setup

**1. Import the theme stylesheet** once (in `angular.json` `styles` or your
global stylesheet):

```css
@import '@mk-kit/ui/styles.css';
```

**2. Add the `mk-app` class** to `<body>` (or a top-level wrapper) so
background, text colour, fonts and themed scrollbars apply:

```html
<body class="mk-app">
```

**3. Use components** — everything is standalone; import what you need:

```ts
import { Component, inject } from '@angular/core';
import { MkButton, MkCard, MkThemeService } from '@mk-kit/ui';

@Component({
  selector: 'app-root',
  imports: [MkButton, MkCard],
  template: `
    <mk-card variant="elevated">
      <button mkButton tone="primary" (click)="theme.toggle()">
        Toggle theme
      </button>
    </mk-card>
  `,
})
export class AppRoot {
  protected readonly theme = inject(MkThemeService);
}
```

## What's inside

| Group | Highlights |
|---|---|
| **Forms & inputs** (53) | text, number, password (strength meter), OTP, phone (country prefix), postal code, currency, card number, IBAN, tax id, masked input, tag input, select, autocomplete, multi-select, tree-select, transfer list, checkbox, radio, switch, slider, range slider, rating, colour picker, file upload (dropzone), signature pad, numeric keypad & on-screen keyboard, repeater (`FormArray`), form field with automatic validation messages, form error summary, listbox, cascader (multi-column select), floating labels |
| **Date & time** | calendar, date picker, date-range picker, time picker, month/year picker, week picker, inline mini date, event calendar with editable week/day grid (drag to move / resize) |
| **Tables & grids** (7) | data table — sort, multi-select, expandable rows, tree rows, grouping, sticky header, column resize / reorder / pin, inline cell edit, responsive stacking, CSV export, print styles — plus `MkTableDataSource` for server-side sort/page/filter, query builder (`mk-query-builder` → predicate / readable text / `MkTableDataSource.setQuery()`) |
| **Charts** (12) | line/area, bar (stacked, horizontal, label fitting), donut, gauge, progress ring, scatter/bubble, radar, funnel, treemap, heatmap, calendar heatmap, sparkline — SVG, themed, accessible |
| **Data display** (25) | cards, lists, stat cards, badges, tags, chips, avatars & groups, timeline, description list, tree, empty state, countdown, QR code, diff view, JSON viewer, code block, virtual scroll, carousel, kanban |
| **Navigation & layout** (21) | app shell (responsive sidebar), stack / flex / grid layout primitives, nav list & groups, tabs, stepper, breadcrumb, pagination, menu, context menu, command palette (⌘K), page header, toolbar, splitter, drawer, scroll area, FAB, back-to-top |
| **Feedback & overlays** (21) | dialogs (+ `confirm()` / `alert()` / `prompt()`), bottom sheet, drawer, popover, popconfirm, hovercard, tooltip, toast, snackbar, alert, banner, result page, notification center, product tour, progress bar, loading bar, spinner, skeletons, block UI (region / page overlay), draggable & resizable dialogs |
| **Editors & interactions** (25) | block editor (Notion-style, HTML round-trip), rich text, markdown renderer, code editor, log viewer, drag & drop, sortable list, @mentions, hotkeys, undo/redo history, permissions (`*mkCan`), clipboard, intersect, infinite scroll, ripple, scrollspy, chat (streaming message log, tool cards, prompt box) |
| **Media** (6) | image with states, gallery, lightbox, cropper, media manager |
| **Core services** | theme (light/dark/system + density), breakpoints, overlay & anchored panels, focus trap, live announcer, icon registry (426 built-in icons), i18n |

The full, searchable index lives in the docs (`/components-index`).

## Entry points

Import from the umbrella `@mk-kit/ui`, or from a group to keep bundles lean:

```ts
import { MkTable } from '@mk-kit/ui/table';
import { MkLineChart } from '@mk-kit/ui/data';
import { MkDatePicker } from '@mk-kit/ui/datetime';
```

Available: `core`, `forms`, `datetime`, `table`, `data`, `navigation`,
`feedback`, `directives`, `dnd`, `media`, `icon`, `button`, `checkbox`, `chip`,
`context-menu`, `layout`, `chat`, `query-builder`, `rich-text`, `block-editor`. `sideEffects: false` throughout.

## Theming

The entire look is driven by `--mk-*` custom properties on `:root`. Override
any of them — globally, or scoped to a subtree — to re-brand at runtime, no
rebuild:

```css
:root {
  --mk-primary: #0f766e;
  --mk-primary-contrast: #ffffff;
  --mk-radius-md: 4px;
  --mk-font-sans: 'Inter', system-ui, sans-serif;
}

[data-mk-theme='dark'] {
  --mk-primary: #2dd4bf;
  --mk-primary-contrast: #042f2e;
}
```

The docs include a theme builder that exports a ready-to-paste `:root` block.

### Dark mode

Dark mode follows the OS `prefers-color-scheme` with no JavaScript. To let
users choose, set `data-mk-theme` on `<html>` (`"light"` | `"dark"`) or use
`MkThemeService`:

```ts
const theme = inject(MkThemeService);
theme.setTheme('dark');      // force dark
theme.setTheme('system');    // follow the OS
theme.toggle();              // flip light/dark
theme.resolvedTheme();       // signal: 'light' | 'dark'
```

The choice is persisted to `localStorage`; the service is SSR-safe.

### Density & touch

Three densities — `comfortable`, `compact`, `touch` — via `data-mk-density`
or `MkThemeService.setDensity()`. Touch density enlarges every hit target;
inputs use 16px text on coarse pointers, drag starts on long-press, overlays
respect safe-area insets.

## Internationalisation

Every string the library renders comes from one provider:

```ts
import { provideMkI18n } from '@mk-kit/ui/core';

bootstrapApplication(AppRoot, {
  providers: [provideMkI18n({ close: 'Zamknij', noData: 'Brak danych' })],
});
```

Overrides can be scoped to a component subtree for mixed-locale screens.
Layout and arrow keys flip under `dir="rtl"`.

## Accessibility

Target: **WCAG 2.1 AA**. Semantic roles and complete `aria-*` wiring, roving
tabindex for composite widgets, focus trapping and background `inert` for
modals, an Escape that closes only the topmost overlay, live-region
announcements for async state, contrast-checked tokens in both themes,
`prefers-reduced-motion` and `forced-colors` support. Axe runs over rendered
fixtures in the test suite; information is never conveyed by colour alone.

## SSR & zoneless

Every component guards non-browser platforms (an SSR smoke suite renders the
whole library on the server), and nothing depends on Zone.js.

## Coming from PrimeNG?

The admin surface maps closely — `p-table` → `mk-table`, `p-select` →
`mk-select`, `p-datePicker` → `mk-date-picker`, `DialogService` →
`MkDialogService`, `MessageService` → `MkToastService` — and the parts
PrimeUI sells separately (charts, text editor, scheduler, task board) are
here under MIT. The docs landing page carries a mapping table.

## Versioning & support

mk-kit tracks the current Angular major. A matching release follows each new
Angular major within weeks; the previous major keeps receiving fixes for six
months. Releases are published from CI with npm provenance
(`npm audit signatures`).

## Contributing

See [CONTRIBUTING.md](https://github.com/mk-kit/mk-kit/blob/main/CONTRIBUTING.md)
(DCO sign-off), [SECURITY.md](https://github.com/mk-kit/mk-kit/blob/main/SECURITY.md)
for vulnerability reports, and [TRADEMARK.md](https://github.com/mk-kit/mk-kit/blob/main/TRADEMARK.md)
for use of the name and logo.

## License

MIT © Mateusz Kornaś. Part of the built-in icon set is derived from
[Lucide](https://lucide.dev) (ISC) — see `THIRD_PARTY_NOTICES.md`.
