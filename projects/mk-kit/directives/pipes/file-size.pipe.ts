import { Pipe, type PipeTransform, inject } from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkIntlCache, mkResolveLocale, mkToNumber } from './intl-utils';

/** Options accepted by {@link MkFileSizePipe}. */
export interface MkFileSizeOptions {
  /** BCP 47 locale for the number part (decimal separator); defaults to the i18n / runtime locale. */
  locale?: string;
  /**
   * `'decimal'` (default) divides by 1000 and labels `kB MB GB …` (what
   * operating systems and file dialogs show); `'binary'` divides by 1024
   * and labels `KiB MiB GiB …`.
   */
  base?: 'decimal' | 'binary';
  /** Maximum fraction digits. Default `1`; bytes never get fractions. */
  digits?: number;
}

const DECIMAL_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'] as const;
const BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'] as const;

const numbers = new MkIntlCache<Intl.NumberFormat>(
  (locale, options) => new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions),
);

/**
 * `mkFileSize` — bytes → a human-readable size such as `1.2 MB`, with the
 * number formatted by `Intl.NumberFormat` in the `provideMkI18n` locale.
 * Pure: `null`, `undefined`, `''` and non-numeric input render as `''`.
 *
 * ```html
 * {{ 1_234_567 | mkFileSize }}                        <!-- 1.2 MB -->
 * {{ 1_234_567 | mkFileSize:{ base: 'binary' } }}     <!-- 1.2 MiB -->
 * {{ 1_234_567 | mkFileSize:{ digits: 2, locale: 'de' } }} <!-- 1,23 MB -->
 * {{ 512 | mkFileSize }}                              <!-- 512 B -->
 * ```
 */
@Pipe({ name: 'mkFileSize', pure: true })
export class MkFileSizePipe implements PipeTransform {
  private readonly i18n = inject(MK_I18N);

  transform(
    value: number | string | null | undefined,
    options: MkFileSizeOptions = {},
  ): string {
    const bytes = mkToNumber(value);
    if (bytes === null) return '';
    const binary = options.base === 'binary';
    const divisor = binary ? 1024 : 1000;
    const units = binary ? BINARY_UNITS : DECIMAL_UNITS;
    const negative = bytes < 0;
    let amount = Math.abs(bytes);
    let index = 0;
    while (amount >= divisor && index < units.length - 1) {
      amount /= divisor;
      index++;
    }
    let digits = index === 0 ? 0 : Math.max(0, options.digits ?? 1);
    // 999.96 kB would round to "1000 kB": promote to the next unit instead.
    if (index < units.length - 1 && Number(amount.toFixed(digits)) >= divisor) {
      amount /= divisor;
      index++;
      digits = Math.max(0, options.digits ?? 1);
    }
    const number = numbers
      .get(mkResolveLocale(this.i18n, options.locale), { maximumFractionDigits: digits })
      .format(negative ? -amount : amount);
    return `${number} ${units[index]}`;
  }
}
