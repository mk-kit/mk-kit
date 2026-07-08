/** Shared primitive types used across mk-kit components. */

/** Control size scale. Maps to `--mk-control-height-*` tokens. */
export type MkSize = 'sm' | 'md' | 'lg';

/** Semantic color tone. Each maps to a `--mk-<tone>*` token family. */
export type MkTone =
  | 'primary'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/** Visual treatment for tinted/interactive surfaces. */
export type MkVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';

/** Theme selection. `system` follows the OS `prefers-color-scheme`. */
export type MkThemePreference = 'light' | 'dark' | 'system';

/** Concrete resolved theme (never `system`). */
export type MkResolvedTheme = 'light' | 'dark';

/** Common placement values for overlays (menus, tooltips, popovers). */
export type MkPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right';
