import { compactOf } from './util.js';

/**
 * IBAN lengths per country from the SWIFT IBAN Registry (release 98, 2025).
 * Countries missing here are validated on the checksum and the 34-character
 * maximum only.
 */
export const IBAN_LENGTHS: Readonly<Record<string, number>> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BI: 27,
  BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DJ: 27, DK: 18, DO: 28,
  EE: 20, EG: 29, ES: 24, FI: 18, FK: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23,
  GL: 18, GR: 27, GT: 28, HN: 28, HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26,
  IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21,
  LY: 25, MC: 27, MD: 24, ME: 22, MK: 19, MN: 20, MR: 27, MT: 31, MU: 30, NI: 28,
  NL: 18, NO: 15, OM: 23, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22,
  RU: 33, SA: 24, SC: 31, SD: 18, SE: 24, SI: 19, SK: 24, SM: 27, SO: 23, ST: 25,
  SV: 28, TL: 23, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20, YE: 30,
};

const IBAN_MAX = 34;

/** The parts of an IBAN. */
export interface IbanInfo {
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  /** The two check digits. */
  checkDigits: string;
  /** Basic Bank Account Number — everything after the check digits. */
  bban: string;
  /** Electronic format: uppercase, no separators. */
  electronic: string;
  /** Print format: groups of four separated by spaces. */
  formatted: string;
}

/**
 * ISO 7064 MOD 97-10 over the rearranged IBAN (BBAN + country + check digits,
 * letters as 10–35). Computed digit-by-digit so the value never exceeds
 * `Number.MAX_SAFE_INTEGER`.
 */
export function ibanMod97(electronic: string): number {
  const rearranged = electronic.slice(4) + electronic.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    rem = code >= 65 ? (rem * 100 + (code - 55)) % 97 : (rem * 10 + (code - 48)) % 97;
  }
  return rem;
}

/** The two check digits that make `country + '00' + bban` valid. */
export function ibanCheckDigits(country: string, bban: string): string {
  const rem = ibanMod97(`${country.toUpperCase()}00${bban.toUpperCase()}`);
  return String(98 - rem).padStart(2, '0');
}

/**
 * Parses an IBAN (spaces / dashes / lowercase accepted): shape, registry
 * length for known countries, and the MOD 97 checksum. `null` when invalid.
 */
export function parseIban(value: unknown): IbanInfo | null {
  const e = compactOf(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(e) || e.length > IBAN_MAX) return null;
  const country = e.slice(0, 2);
  const expected = IBAN_LENGTHS[country];
  if (expected !== undefined && e.length !== expected) return null;
  if (ibanMod97(e) !== 1) return null;
  return {
    country,
    checkDigits: e.slice(2, 4),
    bban: e.slice(4),
    electronic: e,
    formatted: e.replace(/(.{4})(?=.)/g, '$1 '),
  };
}

/** `true` for a valid IBAN. */
export function isIban(value: unknown): boolean {
  return parseIban(value) !== null;
}

/** Print format (`'PL61 1090 1014 …'`), or `''` when invalid. */
export function formatIban(value: unknown): string {
  return parseIban(value)?.formatted ?? '';
}
