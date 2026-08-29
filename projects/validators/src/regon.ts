import { digitsOf, isDigits, weightedSum } from './util.js';

/**
 * REGON check digits: `Σ mod 11`, with 10 counting as 0. A 14-digit REGON
 * embeds a valid 9-digit one. Reference: GUS, "Zasady nadawania numeru REGON".
 */
const REGON9_WEIGHTS = [8, 9, 2, 3, 4, 5, 6, 7] as const;
const REGON14_WEIGHTS = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8] as const;

/** Check digit for the first eight digits of a 9-digit REGON. */
export function regon9CheckDigit(first8: string): number {
  return weightedSum(first8, REGON9_WEIGHTS) % 11 % 10;
}

/** Check digit for the first thirteen digits of a 14-digit REGON. */
export function regon14CheckDigit(first13: string): number {
  return weightedSum(first13, REGON14_WEIGHTS) % 11 % 10;
}

/** `true` for a valid 9- or 14-digit REGON (separators ignored). */
export function isRegon(value: unknown): boolean {
  const d = digitsOf(value);
  if (isDigits(d, 9)) return regon9CheckDigit(d.slice(0, 8)) === Number(d[8]);
  if (isDigits(d, 14)) {
    return (
      regon9CheckDigit(d.slice(0, 8)) === Number(d[8]) &&
      regon14CheckDigit(d.slice(0, 13)) === Number(d[13])
    );
  }
  return false;
}

/**
 * KRS numbers are ten digits with leading zeros and carry **no** check digit,
 * so this is a shape check only. Accepts the number with or without zeros.
 */
export function isKrs(value: unknown): boolean {
  const d = digitsOf(value);
  return d.length > 0 && d.length <= 10;
}

/** Ten-digit zero-padded KRS, or `''`. */
export function normalizeKrs(value: unknown): string {
  return isKrs(value) ? digitsOf(value).padStart(10, '0') : '';
}

/**
 * Polish ID card number (dowód osobisty): three letters, then six digits of
 * which the first is the check digit. Letters map A→10 … Z→35; weights
 * 7, 3, 1 cycle over the eight non-check positions and the sum mod 10 must
 * equal the check digit.
 */
export function isPolishIdCard(value: unknown): boolean {
  const c = typeof value === 'string' ? value.replace(/\s/g, '').toUpperCase() : '';
  if (!/^[A-Z]{3}\d{6}$/.test(c)) return false;
  const weights = [7, 3, 1, 0, 7, 3, 1, 7, 3];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const ch = c.charCodeAt(i);
    const v = ch >= 65 ? ch - 55 : ch - 48;
    sum += weights[i] * v;
  }
  return sum % 10 === Number(c[3]);
}
