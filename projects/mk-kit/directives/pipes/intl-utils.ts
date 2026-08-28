import type { MkI18nStrings } from '@mk-kit/ui/core';

/**
 * Resolve the locale a formatting pipe should use: an explicit per-call
 * locale wins, then `provideMkI18n({ locale })`, then the runtime default
 * (`undefined` lets `Intl` pick the environment locale).
 */
export function mkResolveLocale(
  i18n: Pick<MkI18nStrings, 'locale'>,
  explicit?: string | null,
): string | undefined {
  return explicit || i18n.locale || undefined;
}

/**
 * Small bounded memo for `Intl` formatter instances — constructing them is
 * far more expensive than calling `format()`, and a pure pipe in a list
 * re-runs for every row.
 */
export class MkIntlCache<T> {
  private readonly map = new Map<string, T>();

  constructor(
    private readonly create: (locale: string | undefined, options: Record<string, unknown>) => T,
    private readonly limit = 32,
  ) {}

  get(locale: string | undefined, options: Record<string, unknown> = {}): T {
    const key = `${locale ?? ''}|${JSON.stringify(options)}`;
    let hit = this.map.get(key);
    if (hit === undefined) {
      hit = this.create(locale, options);
      if (this.map.size >= this.limit) {
        // Evict the oldest entry (Map iteration order is insertion order).
        this.map.delete(this.map.keys().next().value as string);
      }
      this.map.set(key, hit);
    }
    return hit;
  }
}

/** Coerce a pipe input to a finite number; `null` for anything else. */
export function mkToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Coerce a `Date | number | string` to a valid timestamp; `null` for anything else. */
export function mkToTimestamp(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const t =
    value instanceof Date
      ? value.getTime()
      : typeof value === 'number'
        ? value
        : new Date(value as string).getTime();
  return Number.isFinite(t) ? t : null;
}
