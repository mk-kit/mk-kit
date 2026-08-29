import { isNip } from './nip.js';
import { compactOf } from './util.js';

/**
 * EU VAT identification number syntax per member state, as published for
 * VIES (the VAT prefix is the ISO code except Greece `EL`; `XI` is Northern
 * Ireland under the Windsor Framework). Checksums are verified where the
 * algorithm is public and unambiguous — today `PL` (NIP). Syntax validity
 * does not mean the number is registered: that needs a VIES lookup.
 */
export const VAT_FORMATS: Readonly<Record<string, RegExp>> = {
  AT: /^U\d{8}$/,
  BE: /^[01]\d{9}$/,
  BG: /^\d{9,10}$/,
  CY: /^\d{8}[A-Z]$/,
  CZ: /^\d{8,10}$/,
  DE: /^\d{9}$/,
  DK: /^\d{8}$/,
  EE: /^\d{9}$/,
  EL: /^\d{9}$/,
  ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^\d{8}$/,
  FR: /^[A-Z0-9]{2}\d{9}$/,
  HR: /^\d{11}$/,
  HU: /^\d{8}$/,
  IE: /^(\d{7}[A-Z]{1,2}|\d[A-Z+*]\d{5}[A-Z])$/,
  IT: /^\d{11}$/,
  LT: /^(\d{9}|\d{12})$/,
  LU: /^\d{8}$/,
  LV: /^\d{11}$/,
  MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/,
  PL: /^\d{10}$/,
  PT: /^\d{9}$/,
  RO: /^\d{2,10}$/,
  SE: /^\d{10}01$/,
  SI: /^\d{8}$/,
  SK: /^\d{10}$/,
  XI: /^(\d{9}|\d{12}|(GD|HA)\d{3})$/,
};

const CHECKSUMS: Readonly<Record<string, (n: string) => boolean>> = {
  PL: isNip,
};

/** A parsed EU VAT number. */
export interface VatInfo {
  /** VAT country prefix (`'EL'` for Greece, `'XI'` for Northern Ireland). */
  country: string;
  /** The national part without the prefix or separators. */
  number: string;
  /** Prefix + number, the form VIES expects. */
  vies: string;
}

/**
 * Parses an EU VAT number. With `country` given, a missing prefix is assumed
 * to be that country's; a conflicting prefix is rejected. Greece is accepted
 * as `EL` or `GR`. `null` when the syntax (or the PL checksum) fails.
 */
export function parseVatId(value: unknown, country?: string): VatInfo | null {
  let c = compactOf(value);
  let prefix = /^[A-Z]{2}/.exec(c)?.[0];
  if (prefix === 'GR') prefix = 'EL';
  const hint = country?.toUpperCase() === 'GR' ? 'EL' : country?.toUpperCase();
  if (prefix && VAT_FORMATS[prefix]) {
    if (hint && prefix !== hint) return null;
    c = c.slice(2);
  } else if (hint) {
    prefix = hint;
  } else {
    return null;
  }
  const format = VAT_FORMATS[prefix];
  if (!format || !format.test(c)) return null;
  if (CHECKSUMS[prefix] && !CHECKSUMS[prefix](c)) return null;
  return { country: prefix, number: c, vies: prefix + c };
}

/** `true` for a syntactically valid EU VAT number (see {@link parseVatId}). */
export function isVatId(value: unknown, country?: string): boolean {
  return parseVatId(value, country) !== null;
}
