# @mkornas/ui

**Themable, accessible Angular 22 component library for admin dashboards & UIs.**

Signals-first. WCAG 2.1 AA. Every pixel controlled by CSS variables. Light &
dark mode out of the box. Zero runtime dependencies beyond Angular.

> Like Angular Material — but leaner, admin-oriented, and re-themable by editing
> a handful of CSS custom properties.

## Install

`@mkornas/ui` is published **privately to GitHub Packages**. Tell npm where the
`@mkornas` scope lives, once per consuming project — add an `.npmrc`:

```ini
# .npmrc
@mkornas:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then export a token with `read:packages` (a GitHub PAT locally, or the
`GITHUB_TOKEN` in Actions) and install:

```bash
export NODE_AUTH_TOKEN=ghp_your_pat_with_read_packages
npm install @mkornas/ui
```

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms` (v22+).

## Setup

**1. Import the theme stylesheet** once (e.g. in `angular.json` `styles` or your
global `styles.css`):

```css
@import '@mkornas/ui/styles.css';
```

**2. Add the `mk-app` class** to your `<body>` (or a top-level wrapper) so the
background, text color, fonts and themed scrollbars apply:

```html
<body class="mk-app">
```

**3. Use components** — everything is standalone, just import what you need:

```ts
import { Component, inject } from '@angular/core';
import { MkButton, MkCard, MkThemeService } from '@mkornas/ui';

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

## Theming

The entire look is driven by `--mk-*` custom properties defined on `:root`.
Override any of them — globally or scoped to a subtree — to re-brand instantly:

```css
:root {
  --mk-primary: #7c3aed;
  --mk-primary-hover: #6d28d9;
  --mk-radius-md: 4px;
  --mk-font-sans: 'Inter', system-ui, sans-serif;
}
```

### Dark mode

Dark mode works with no JavaScript — it follows the OS `prefers-color-scheme`.
To let users choose explicitly, set `data-mk-theme` on `<html>` (`"light"` |
`"dark"`), or use the built-in `MkThemeService`:

```ts
const theme = inject(MkThemeService);
theme.setTheme('dark');      // force dark
theme.setTheme('system');    // follow the OS
theme.toggle();              // flip light/dark
theme.resolvedTheme();       // signal: 'light' | 'dark'
```

The service persists the choice to `localStorage` and is fully SSR-safe.

## What's inside

- **Forms** — Button, FormField, Input, Select, Checkbox, Radio, Switch, Slider
- **Data** — Table (sortable/sticky), Card, Badge, Tag, Chip, Avatar, List,
  StatCard, ProgressBar, Spinner, Skeleton, Divider
- **Feedback** — Alert, Toast, Dialog (+confirm), Tooltip
- **Navigation & layout** — Tabs, Accordion, Breadcrumb, Pagination, Menu,
  AppShell, NavList

All components: `OnPush`, signal inputs/outputs, keyboard-operable, screen-reader
labelled, `:focus-visible` rings, and `prefers-reduced-motion` aware.

## Accessibility

mk-kit targets **WCAG 2.1 AA**: semantic roles, complete `aria-*` wiring, focus
trapping for overlays, roving tabindex for composite widgets, live-region status
announcements, and color contrast that holds in both themes. Information is never
conveyed by color alone.

## License

MIT © Mateusz Kornaś
