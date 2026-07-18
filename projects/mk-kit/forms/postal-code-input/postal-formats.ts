/**
 * Per-country postal-code formats for {@link MkPostalCodeInput}.
 *
 * `mask` is an `mkApplyMask`-style pattern (`0` = digit, `A` = letter,
 * `*` = alphanumeric, everything else a literal). `pattern` validates the
 * complete formatted value. Countries whose codes vary too much for a fixed
 * mask (e.g. GB) omit `mask` and rely on `pattern` + uppercasing alone.
 */
export interface MkPostalFormat {
  /** ISO 3166-1 alpha-2 code, uppercase. */
  code: string;
  /** Input mask; omitted for free-form (variable-length) codes. */
  mask?: string;
  /** Regex the complete formatted value must match to be valid. */
  pattern: RegExp;
  /** Example of a valid code, used as the default placeholder. */
  example: string;
}

/** The built-in postal formats (alphabetical by ISO code). */
export const MK_POSTAL_FORMATS: readonly MkPostalFormat[] = [
  { code: 'AT', mask: '0000', pattern: /^\d{4}$/, example: '1010' },
  { code: 'AU', mask: '0000', pattern: /^\d{4}$/, example: '2000' },
  { code: 'BE', mask: '0000', pattern: /^\d{4}$/, example: '1000' },
  { code: 'BR', mask: '00000-000', pattern: /^\d{5}-\d{3}$/, example: '01310-100' },
  { code: 'CA', mask: 'A0A 0A0', pattern: /^[A-Z]\d[A-Z] \d[A-Z]\d$/, example: 'K1A 0B1' },
  { code: 'CH', mask: '0000', pattern: /^\d{4}$/, example: '8001' },
  { code: 'CZ', mask: '000 00', pattern: /^\d{3} \d{2}$/, example: '110 00' },
  { code: 'DE', mask: '00000', pattern: /^\d{5}$/, example: '10115' },
  { code: 'DK', mask: '0000', pattern: /^\d{4}$/, example: '1050' },
  { code: 'EE', mask: '00000', pattern: /^\d{5}$/, example: '10111' },
  { code: 'ES', mask: '00000', pattern: /^\d{5}$/, example: '28001' },
  { code: 'FI', mask: '00000', pattern: /^\d{5}$/, example: '00100' },
  { code: 'FR', mask: '00000', pattern: /^\d{5}$/, example: '75001' },
  {
    code: 'GB',
    pattern: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
    example: 'SW1A 1AA',
  },
  { code: 'GR', mask: '000 00', pattern: /^\d{3} \d{2}$/, example: '105 57' },
  { code: 'HR', mask: '00000', pattern: /^\d{5}$/, example: '10000' },
  { code: 'HU', mask: '0000', pattern: /^\d{4}$/, example: '1051' },
  {
    code: 'IE',
    mask: 'A00 ****',
    pattern: /^[A-Z]\d{2} [A-Z\d]{4}$/,
    example: 'D02 X285',
  },
  { code: 'IN', mask: '000000', pattern: /^\d{6}$/, example: '110001' },
  { code: 'IT', mask: '00000', pattern: /^\d{5}$/, example: '00184' },
  { code: 'JP', mask: '000-0000', pattern: /^\d{3}-\d{4}$/, example: '100-0001' },
  { code: 'LT', mask: '00000', pattern: /^\d{5}$/, example: '01100' },
  { code: 'LU', mask: '0000', pattern: /^\d{4}$/, example: '1111' },
  { code: 'LV', mask: '0000', pattern: /^\d{4}$/, example: '1010' },
  { code: 'MX', mask: '00000', pattern: /^\d{5}$/, example: '06000' },
  {
    code: 'NL',
    mask: '0000 AA',
    pattern: /^\d{4} [A-Z]{2}$/,
    example: '1012 AB',
  },
  { code: 'NO', mask: '0000', pattern: /^\d{4}$/, example: '0150' },
  { code: 'NZ', mask: '0000', pattern: /^\d{4}$/, example: '6011' },
  { code: 'PL', mask: '00-000', pattern: /^\d{2}-\d{3}$/, example: '00-950' },
  {
    code: 'PT',
    mask: '0000-000',
    pattern: /^\d{4}-\d{3}$/,
    example: '1100-048',
  },
  { code: 'RO', mask: '000000', pattern: /^\d{6}$/, example: '010011' },
  { code: 'SE', mask: '000 00', pattern: /^\d{3} \d{2}$/, example: '111 29' },
  { code: 'SI', mask: '0000', pattern: /^\d{4}$/, example: '1000' },
  { code: 'SK', mask: '000 00', pattern: /^\d{3} \d{2}$/, example: '811 01' },
  {
    code: 'US',
    mask: '00000-0000',
    pattern: /^\d{5}(-\d{4})?$/,
    example: '90210',
  },
];

/** Look up the built-in format for an ISO country code (case-insensitive). */
export function mkPostalFormat(code: string): MkPostalFormat | undefined {
  const upper = code.toUpperCase();
  return MK_POSTAL_FORMATS.find((f) => f.code === upper);
}
