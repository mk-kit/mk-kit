/** A country's postal-code shape. */
export interface PostalFormat {
  /** ISO 3166-1 alpha-2 code, uppercase. */
  country: string;
  /** Regex the canonical form must match. */
  pattern: RegExp;
  /** A valid example. */
  example: string;
}

/**
 * Postal-code formats for 36 countries, matched against the canonical form
 * (uppercase, single spaces). Sources: UPU Postal Addressing Systems and the
 * national posts.
 */
export const POSTAL_FORMATS: readonly PostalFormat[] = [
  { country: 'AT', pattern: /^\d{4}$/, example: '1010' },
  { country: 'AU', pattern: /^\d{4}$/, example: '2000' },
  { country: 'BE', pattern: /^\d{4}$/, example: '1000' },
  { country: 'BR', pattern: /^\d{5}-?\d{3}$/, example: '01310-100' },
  { country: 'CA', pattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, example: 'K1A 0B1' },
  { country: 'CH', pattern: /^\d{4}$/, example: '8001' },
  { country: 'CZ', pattern: /^\d{3} ?\d{2}$/, example: '110 00' },
  { country: 'DE', pattern: /^\d{5}$/, example: '10115' },
  { country: 'DK', pattern: /^\d{4}$/, example: '1050' },
  { country: 'EE', pattern: /^\d{5}$/, example: '10111' },
  { country: 'ES', pattern: /^\d{5}$/, example: '28001' },
  { country: 'FI', pattern: /^\d{5}$/, example: '00100' },
  { country: 'FR', pattern: /^\d{5}$/, example: '75001' },
  { country: 'GB', pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/, example: 'SW1A 1AA' },
  { country: 'GR', pattern: /^\d{3} ?\d{2}$/, example: '105 57' },
  { country: 'HR', pattern: /^\d{5}$/, example: '10000' },
  { country: 'HU', pattern: /^\d{4}$/, example: '1051' },
  { country: 'IE', pattern: /^[A-Z]\d{2} ?[A-Z\d]{4}$/, example: 'D02 X285' },
  { country: 'IN', pattern: /^\d{6}$/, example: '110001' },
  { country: 'IT', pattern: /^\d{5}$/, example: '00184' },
  { country: 'JP', pattern: /^\d{3}-?\d{4}$/, example: '100-0001' },
  { country: 'LT', pattern: /^\d{5}$/, example: '01100' },
  { country: 'LU', pattern: /^\d{4}$/, example: '1111' },
  { country: 'LV', pattern: /^\d{4}$/, example: '1010' },
  { country: 'MX', pattern: /^\d{5}$/, example: '06000' },
  { country: 'NL', pattern: /^\d{4} ?[A-Z]{2}$/, example: '1012 AB' },
  { country: 'NO', pattern: /^\d{4}$/, example: '0150' },
  { country: 'NZ', pattern: /^\d{4}$/, example: '6011' },
  { country: 'PL', pattern: /^\d{2}-?\d{3}$/, example: '00-950' },
  { country: 'PT', pattern: /^\d{4}-?\d{3}$/, example: '1100-048' },
  { country: 'RO', pattern: /^\d{6}$/, example: '010011' },
  { country: 'SE', pattern: /^\d{3} ?\d{2}$/, example: '111 29' },
  { country: 'SI', pattern: /^\d{4}$/, example: '1000' },
  { country: 'SK', pattern: /^\d{3} ?\d{2}$/, example: '811 01' },
  { country: 'UA', pattern: /^\d{5}$/, example: '01001' },
  { country: 'US', pattern: /^\d{5}(-?\d{4})?$/, example: '90210' },
];

/** The format for an ISO country code (case-insensitive), or `undefined`. */
export function postalFormat(country: string): PostalFormat | undefined {
  const upper = country.toUpperCase();
  return POSTAL_FORMATS.find((f) => f.country === upper);
}

/**
 * `true` when `value` is a postal code of `country`. Case and surrounding /
 * repeated whitespace are forgiven; the separator (`-` or space) may be
 * omitted. Countries without a format pass — there is no rule to fail.
 */
export function isPostalCode(value: unknown, country: string): boolean {
  const format = postalFormat(country);
  if (!format) return true;
  const canonical = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toUpperCase() : '';
  return canonical !== '' && format.pattern.test(canonical);
}
