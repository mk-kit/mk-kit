import { Pipe, type PipeTransform, inject } from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkIntlCache, mkResolveLocale, mkToNumber } from './intl-utils';

/**
 * Options accepted by {@link MkCurrencyPipe}. They map onto
 * `Intl.NumberFormat` currency options; `locale` overrides the i18n /
 * runtime locale for this call only.
 */
export interface MkCurrencyOptions {
  /** BCP 47 locale for this call; defaults to `provideMkI18n({ locale })`, then the runtime locale. */
  locale?: string;
  /** How the currency is shown. Default `'symbol'` (`€`, `$`, `zł`). */
  display?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  /** Fraction digits; both default to the currency's own (2 for EUR, 0 for JPY). */
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Sign display, e.g. `'always'` for `+€10.00` or `'exceptZero'`. */
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
  /** Compact notation for dashboards (`$1.2M`). Default `'standard'`. */
  notation?: 'standard' | 'compact';
  /** Thousands grouping; default `true`. */
  useGrouping?: boolean;
}

const formatters = new MkIntlCache<Intl.NumberFormat>(
  (locale, options) => new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions),
);

/**
 * `mkCurrency` — format a number as money with `Intl.NumberFormat`, honouring
 * the locale and default currency from `provideMkI18n({ locale, currency })`.
 * No Angular locale data is needed. Pure: `null`, `undefined`, `''` and
 * non-numeric input render as `''`.
 *
 * ```html
 * {{ 1234.5 | mkCurrency }}                                <!-- $1,234.50 (i18n currency, default USD) -->
 * {{ 1234.5 | mkCurrency:'EUR' }}                          <!-- €1,234.50 -->
 * {{ 1234.5 | mkCurrency:'PLN':{ locale: 'pl-PL' } }}      <!-- 1234,50 zł -->
 * {{ 1234567 | mkCurrency:'USD':{ notation: 'compact' } }} <!-- $1.2M -->
 * {{ total() | mkCurrency:'GBP':{ signDisplay: 'always' } }} <!-- signals work as-is -->
 * ```
 */
@Pipe({ name: 'mkCurrency', pure: true })
export class MkCurrencyPipe implements PipeTransform {
  private readonly i18n = inject(MK_I18N);

  /**
   * @param value Amount in major units (`12.5` → `$12.50`).
   * @param currency ISO 4217 code; defaults to `provideMkI18n({ currency })`, then `'USD'`.
   * @param options Locale and `Intl.NumberFormat` currency options.
   */
  transform(
    value: number | string | null | undefined,
    currency?: string | null,
    options: MkCurrencyOptions = {},
  ): string {
    const amount = mkToNumber(value);
    if (amount === null) return '';
    const { locale, display, ...rest } = options;
    const intlOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: (currency || this.i18n.currency || 'USD').toUpperCase(),
      currencyDisplay: display ?? 'symbol',
      ...rest,
    };
    return formatters
      .get(mkResolveLocale(this.i18n, locale), intlOptions as Record<string, unknown>)
      .format(amount);
  }
}
