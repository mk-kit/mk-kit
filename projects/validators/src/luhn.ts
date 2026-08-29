import { digitsOf } from './util.js';

/** Luhn (ISO/IEC 7812-1 mod 10) over a digit string; separators ignored. */
export function isLuhn(value: unknown): boolean {
  const d = digitsOf(value);
  if (d.length < 2) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (double && (n *= 2) > 9) n -= 9;
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** The Luhn check digit that makes `digits + result` valid. */
export function luhnCheckDigit(digits: string): number {
  for (let c = 0; c < 10; c++) if (isLuhn(digits + c)) return c;
  /* istanbul ignore next -- unreachable: exactly one digit always satisfies Luhn */
  return 0;
}

/** Card networks recognised by {@link detectCardBrand}. */
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb';

/** Human-readable brand names. */
export const CARD_BRAND_NAMES: Readonly<Record<CardBrand, string>> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
};

/** Valid PAN lengths per brand. */
const CARD_LENGTHS: Readonly<Record<CardBrand, readonly number[]>> = {
  visa: [13, 16, 19],
  mastercard: [16],
  amex: [15],
  discover: [16, 19],
  diners: [14, 16, 19],
  jcb: [16, 19],
};

/** Card network from the leading digits (IIN ranges); `null` when unknown. */
export function detectCardBrand(value: unknown): CardBrand | null {
  const d = digitsOf(value);
  if (!d) return null;
  if (/^3[47]/.test(d)) return 'amex';
  if (/^(30[0-5]|36|38)/.test(d)) return 'diners';
  if (/^35/.test(d)) return 'jcb';
  if (/^(6011|64[4-9]|65)/.test(d)) return 'discover';
  if (/^(5[1-5]|22[2-9]|2[3-6]|27[0-2])/.test(d)) return 'mastercard';
  if (/^4/.test(d)) return 'visa';
  return null;
}

/**
 * `true` for a card number that passes Luhn and has a length valid for its
 * brand (12–19 digits when the brand is unknown).
 */
export function isCardNumber(value: unknown): boolean {
  const d = digitsOf(value);
  if (!isLuhn(d)) return false;
  const brand = detectCardBrand(d);
  return brand ? CARD_LENGTHS[brand].includes(d.length) : d.length >= 12 && d.length <= 19;
}
