import type { MkResponsive } from '@mk-kit/ui/core';

/**
 * A spacing value: a step on the `--mk-space-*` scale (`0 1 2 3 4 5 6 8 10 12
 * 16`, so `4` = `var(--mk-space-4)` = 16px and follows the density modes) or
 * any CSS length such as `'1.5rem'` / `'clamp(1rem, 2vw, 2rem)'`.
 */
export type MkSpace = number | string;

/** Per-breakpoint spacing, e.g. `{ xs: 2, md: 4 }`. */
export type MkResponsiveSpace = MkResponsive<MkSpace>;

/**
 * A number, or a numeric string as it arrives from a plain attribute
 * (`gap="4"`, `colSpan="2"`), as a number; anything else unchanged.
 */
export function mkNumeric<T>(value: T): T | number {
  return typeof value === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(value) ? Number(value) : value;
}

/** Translate a {@link MkSpace} into CSS (`null` when unset). */
export function mkSpaceToCss(value: MkSpace | null | undefined): string | null {
  if (value == null || value === '') return null;
  const v = mkNumeric(value);
  if (typeof v === 'number') return v === 0 ? '0' : `var(--mk-space-${v})`;
  return v;
}

/** Flex / grid main-axis distribution keywords, in plain words. */
export type MkJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch';

/** Cross-axis alignment keywords. */
export type MkAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

const JUSTIFY: Record<MkJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  stretch: 'stretch',
};

const ALIGN: Record<MkAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

/** `justify-content` value for a {@link MkJustify} keyword (`null` when unset). */
export function mkJustifyToCss(value: MkJustify | null | undefined): string | null {
  return value ? JUSTIFY[value] : null;
}

/** `align-items` / `align-self` value for a {@link MkAlign} keyword (`null` when unset). */
export function mkAlignToCss(value: MkAlign | null | undefined): string | null {
  return value ? ALIGN[value] : null;
}
