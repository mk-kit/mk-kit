import { Pipe, type PipeTransform, inject } from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkIntlCache, mkResolveLocale, mkToTimestamp } from './intl-utils';

/** Options accepted by {@link MkRelativeTimePipe}. */
export interface MkRelativeTimeOptions {
  /** BCP 47 locale for this call; defaults to `provideMkI18n({ locale })`, then the runtime locale. */
  locale?: string;
  /**
   * `'auto'` (default) uses phrases like "yesterday" / "now" where the locale
   * has them; `'always'` sticks to "1 day ago" / "in 0 seconds".
   */
  numeric?: 'always' | 'auto';
  /** Length of the unit word: `'long'` (default, "minutes"), `'short'` ("min."), `'narrow'` ("m"). */
  style?: 'long' | 'short' | 'narrow';
  /**
   * Largest unit to use. Default `'year'`; e.g. `'day'` keeps "45 days ago"
   * instead of "1 month ago".
   */
  maxUnit?: Intl.RelativeTimeFormatUnit;
}

/** Unit ladder: `[unit, milliseconds per unit]`, smallest first. */
const UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 1_000],
  ['minute', 60_000],
  ['hour', 3_600_000],
  ['day', 86_400_000],
  ['week', 604_800_000],
  ['month', 2_629_800_000], // 365.25 / 12 days
  ['year', 31_557_600_000], // 365.25 days
];

const formatters = new MkIntlCache<Intl.RelativeTimeFormat>(
  (locale, options) =>
    new Intl.RelativeTimeFormat(locale, options as Intl.RelativeTimeFormatOptions),
);

/**
 * `mkRelativeTime` — "3 minutes ago" / "in 2 days" / "yesterday" from a
 * `Date`, timestamp or ISO string, via `Intl.RelativeTimeFormat` in the
 * `provideMkI18n` locale (no Angular locale data). Pure: `null`, `undefined`
 * and unparsable input render as `''`.
 *
 * The pipe picks the largest unit whose magnitude is at least 1 (seconds →
 * minutes → hours → days → weeks → months → years) and rounds. Pass `now`
 * for deterministic output in tests, or bind a ticking signal to keep a
 * list live — a pure pipe only re-runs when an argument changes:
 *
 * ```html
 * {{ comment.createdAt | mkRelativeTime }}                    <!-- 3 minutes ago -->
 * {{ due | mkRelativeTime:now() }}                            <!-- in 2 days (now() ticks) -->
 * {{ due | mkRelativeTime:null:{ style: 'short' } }}          <!-- in 2 days -->
 * {{ ts | mkRelativeTime:null:{ locale: 'pl', numeric: 'always' } }} <!-- 3 minuty temu -->
 * ```
 */
@Pipe({ name: 'mkRelativeTime', pure: true })
export class MkRelativeTimePipe implements PipeTransform {
  private readonly i18n = inject(MK_I18N);

  /**
   * @param value The instant to describe.
   * @param now Reference instant; defaults to `Date.now()` at call time.
   * @param options Locale, numeric mode, style and unit cap.
   */
  transform(
    value: Date | number | string | null | undefined,
    now?: Date | number | string | null,
    options: MkRelativeTimeOptions = {},
  ): string {
    const target = mkToTimestamp(value);
    if (target === null) return '';
    const reference = mkToTimestamp(now) ?? Date.now();
    const diff = target - reference;
    const [unit, amount] = pickUnit(diff, options.maxUnit ?? 'year');
    const { locale, maxUnit: _maxUnit, ...rest } = options;
    return formatters
      .get(mkResolveLocale(this.i18n, locale), {
        numeric: 'auto',
        style: 'long',
        ...rest,
      })
      .format(amount, unit);
  }
}

/** Choose the largest unit (≤ `maxUnit`) whose rounded magnitude is ≥ 1; seconds otherwise. */
function pickUnit(
  diffMs: number,
  maxUnit: Intl.RelativeTimeFormatUnit,
): [Intl.RelativeTimeFormatUnit, number] {
  const cap = UNITS.findIndex(([u]) => u === maxUnit || `${u}s` === maxUnit);
  const last = cap === -1 ? UNITS.length - 1 : cap;
  const abs = Math.abs(diffMs);
  for (let i = last; i > 0; i--) {
    const [unit, ms] = UNITS[i];
    if (abs >= ms) return [unit, Math.round(diffMs / ms)];
  }
  const value = Math.round(diffMs / 1000);
  // Avoid "-0 seconds": normalise negative zero so 'auto' can render "now".
  return ['second', value === 0 ? 0 : value];
}
