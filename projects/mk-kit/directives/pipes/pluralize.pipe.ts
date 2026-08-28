import { Pipe, type PipeTransform, inject } from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkIntlCache, mkResolveLocale, mkToNumber } from './intl-utils';

/**
 * Per-category word forms for {@link MkPluralizePipe}, keyed by the CLDR
 * plural categories `Intl.PluralRules` returns. `other` is required; the
 * pipe falls back to it for any category you leave out.
 *
 * ```ts
 * const files: MkPluralForms = { one: 'plik', few: 'pliki', many: 'plików', other: 'pliku' };
 * ```
 */
export type MkPluralForms = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

/** Options accepted by {@link MkPluralizePipe}. */
export interface MkPluralizeOptions {
  /** BCP 47 locale for the plural rules and number; defaults to the i18n / runtime locale. */
  locale?: string;
  /** Prefix the formatted count (`"3 items"`); `false` gives just the word. Default `true`. */
  withCount?: boolean;
}

const rules = new MkIntlCache<Intl.PluralRules>(
  (locale, options) => new Intl.PluralRules(locale, options as Intl.PluralRulesOptions),
);
const numbers = new MkIntlCache<Intl.NumberFormat>(
  (locale, options) => new Intl.NumberFormat(locale, options as Intl.NumberFormatOptions),
);

/**
 * `mkPluralize` — pick the right word for a count using the locale's plural
 * rules (`Intl.PluralRules`), optionally prefixed with the formatted count.
 * The English shorthand takes a singular and an optional plural (default
 * `singular + 's'`); other languages pass a {@link MkPluralForms} map.
 * Pure: `null`, `undefined`, `''` and non-numeric counts render as `''`.
 *
 * ```html
 * {{ count | mkPluralize:'item' }}                 <!-- 1 item / 3 items -->
 * {{ count | mkPluralize:'entry':'entries' }}      <!-- 1 entry / 2 entries -->
 * {{ count | mkPluralize:'file':null:{ withCount: false } }} <!-- files -->
 * {{ n | mkPluralize:{ one: 'plik', few: 'pliki', many: 'plików', other: 'pliku' }:null:{ locale: 'pl' } }}
 * ```
 */
@Pipe({ name: 'mkPluralize', pure: true })
export class MkPluralizePipe implements PipeTransform {
  private readonly i18n = inject(MK_I18N);

  /**
   * @param value The count.
   * @param singular Singular word, or a full {@link MkPluralForms} map.
   * @param plural Plural word for the shorthand form; default `singular + 's'`. Ignored with a map.
   * @param options Locale and whether to prefix the count.
   */
  transform(
    value: number | string | null | undefined,
    singular: string | MkPluralForms,
    plural?: string | null,
    options: MkPluralizeOptions = {},
  ): string {
    const count = mkToNumber(value);
    if (count === null) return '';
    const locale = mkResolveLocale(this.i18n, options.locale);
    const category = rules.get(locale).select(count);
    let word: string;
    if (typeof singular === 'string') {
      word = category === 'one' ? singular : (plural ?? `${singular}s`);
    } else {
      word = singular[category] ?? singular.other;
    }
    if (options.withCount === false) return word;
    return `${numbers.get(locale).format(count)} ${word}`;
  }
}
