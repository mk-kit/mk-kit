# mk-kit Component Authoring Spec (READ FIRST)

You are building components for **@mk-kit/ui**, an Angular 22 admin/dashboard
component library. Every component MUST follow this spec exactly so the whole
library compiles and looks like one coherent system. The reference
implementation is `projects/mk-kit/button/` — read it and mirror its structure
precisely.

## Hard rules

1. **Angular 22, standalone.** No NgModules. `ChangeDetectionStrategy.OnPush` on
   every component. Do NOT set `standalone: true` (it's the default in v22) and
   do NOT set `imports: []` unless the template actually uses another component.
2. **Signals only.** Inputs via `input()` / `input.required()`, two-way via
   `model()`, events via `output()`. Use `computed()` for derived state,
   `signal()` for local state. Transforms: `booleanAttribute`, `numberAttribute`.
   NEVER use `@Input()`/`@Output()` decorators or Zone-based patterns.
3. **File layout per component:** its own folder under the component's GROUP
   entry point, `projects/mk-kit/<group>/<name>/` (e.g. `forms/select/`), with:
   - `<name>.ts` — component, uses `templateUrl` + `styleUrl` (separate files).
   - `<name>.html`
   - `<name>.scss` (starts with `@use '../../src/styles/mixins' as mk;`)
   - `<name>.spec.ts` — vitest spec (`provideZonelessChangeDetection()` in
     the TestBed providers).
   - `index.ts` — `export * from './<name>';`
   Register the component with ONE line in the group barrel
   `projects/mk-kit/<group>/index.ts`, and add it to the repo-wide
   `ssr-smoke.spec.ts` and `a11y-smoke.spec.ts` case lists.
4. **Styling = tokens only.** CSS uses `:host` selectors (default Emulated
   encapsulation). You may ONLY reference `--mk-*` custom properties for colors,
   spacing, radius, typography, shadows, motion, z-index. NEVER hardcode a hex
   color, px color, or raw color name. Hardcoded geometry px is acceptable only
   where no token fits. Use the local-var tone pattern from button.scss
   (`--_main`, `--_subtle`, etc.) for tone-aware components. `color-mix(in srgb, ...)`
   is allowed for derived shades. Respect `prefers-reduced-motion`.
5. **WCAG 2.1 AA.** Correct semantic elements/roles, `aria-*` wiring, visible
   `:focus-visible` ring (`outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring); outline-offset: var(--mk-focus-ring-offset);`),
   full keyboard operability (Arrow/Home/End/Enter/Space/Esc as appropriate),
   `aria-label`/`aria-labelledby`/`aria-describedby`, min 44px hit targets where
   relevant, never rely on color alone. Use `mkUniqueId()` for id wiring and
   `MkLiveAnnouncer` for status messages.
6. **Form controls** implement `ControlValueAccessor` (register via
   `NG_VALUE_ACCESSOR` provider with `useExisting`) AND expose a `model()` value
   so both `[(ngModel)]`/reactive forms AND `[(value)]` work. Reflect
   `disabled` from CVA `setDisabledState`. Emit proper `aria-invalid`,
   `aria-required`, `aria-describedby` for hints/errors.
7. **Selectors:** attribute selectors that enhance native elements where it aids
   a11y (e.g. `button[mkButton]`); element selectors `mk-*` for structural
   components (e.g. `mk-card`, `mk-alert`). Prefix everything `mk`/`mk-`.
8. **Imports** only from `@angular/core`, `@angular/common`, `@angular/forms`.
   Shared helpers come from the SECONDARY ENTRY POINTS, e.g.
   `import { MkSize, mkUniqueId, MK_I18N, MkAnchoredPanel } from '@mk-kit/ui/core';`
   `import { mkApplyMask } from '@mk-kit/ui/directives';`
   Sibling components in the SAME group are imported via relative paths, e.g.
   `import { MkFormField } from '../form-field/form-field';`
   Do NOT import from the ROOT `'@mk-kit/ui'` or `'mk-kit'` (circular).
9. **Do NOT run `ng build`** (parallel builds race on the dist folder). Do NOT
   edit `public-api.ts`, `angular.json`, or any file outside your assigned
   component folders and your group barrel. Do NOT edit the Button. Do NOT
   `npm install` anything.
10. Keep host-binding handler params typed as `Event` (Angular types `$event`
    as `Event` in host bindings; narrow inside the method). See button.ts.

## Shared types (from `../../core/types`)
```ts
type MkSize = 'sm' | 'md' | 'lg';
type MkTone = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
type MkVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
type MkThemePreference = 'light' | 'dark' | 'system';
type MkPlacement = 'top'|'top-start'|'top-end'|'bottom'|'bottom-start'|'bottom-end'|'left'|'right';
```

## Core utilities available
- `mkUniqueId(prefix?)` — unique DOM ids for aria wiring.
- `MkLiveAnnouncer.announce(msg, 'polite'|'assertive')` — SR announcements.
- `MkFocusTrap` (class, `new MkFocusTrap(el).activate()/.release()`) and
  `mkGetFocusable(el)`.
- `MkOverlayService.open(Component, config)` → `MkOverlayRef`; inject data with
  `inject(MK_OVERLAY_DATA)` and the ref with `inject(MkOverlayRef)` inside the
  rendered component. Config: `{ data, hasBackdrop, closeOnBackdropClick,
  closeOnEscape, trapFocus, panelClass, role, ariaLabel }`.
- `MkThemeService` — `preference()`, `resolvedTheme()`, `isDark()`, `setTheme()`,
  `toggle()`.

## Design tokens you may use (defined in styles/mk-kit.css)
Colors (theme-aware, have light+dark values):
`--mk-bg --mk-surface --mk-surface-2 --mk-surface-3 --mk-surface-inverse --mk-overlay-scrim`
`--mk-text --mk-text-muted --mk-text-subtle --mk-text-inverse --mk-text-disabled`
`--mk-border --mk-border-strong --mk-border-subtle`
`--mk-hover-overlay --mk-active-overlay --mk-selected-bg --mk-selected-text`
Tone families (each has `-hover -contrast -subtle -subtle-text`, primary also `-active -subtle-hover`):
`--mk-primary* --mk-success* --mk-warning* --mk-danger* --mk-info*` and
`--mk-neutral-subtle --mk-neutral-subtle-hover --mk-neutral-subtle-text`
`--mk-focus-ring --mk-focus-ring-width --mk-focus-ring-offset`
Shadows: `--mk-shadow-xs|sm|md|lg|xl`
Skeleton/scroll/code: `--mk-skeleton-base --mk-skeleton-shine --mk-code-bg`
Geometry: `--mk-space-0..16`, `--mk-radius-none|xs|sm|md|lg|xl|2xl|pill|circle`,
`--mk-control-height-sm|md|lg`, `--mk-border-width` `--mk-border-width-strong`
Type: `--mk-font-sans --mk-font-mono --mk-font-size-xs..4xl --mk-font-weight-normal|medium|semibold|bold --mk-line-height-tight|snug|normal|relaxed`
Motion: `--mk-duration-instant|fast|normal|slow --mk-ease-standard|emphasized|out`
Z: `--mk-z-base|sticky|drawer|overlay|dialog|menu|tooltip|toast`
Layout: `--mk-sidebar-width --mk-sidebar-width-collapsed --mk-header-height`

## Quality bar
Match the polish of the Button: smooth transitions, hover/active/focus/disabled
states, tone + size + variant support where sensible, sensible empty/loading
states, and thorough JSDoc on public inputs/outputs with a usage example in the
component's class doc comment. Components must feel like Angular Material but
cleaner and admin-oriented.
