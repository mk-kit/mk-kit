/** ITU E.164 country calling codes for the countries the UI kit's phone input knows. */
export const DIAL_CODES: Readonly<Record<string, string>> = {
  AE: '971', AR: '54', AT: '43', AU: '61', BE: '32', BG: '359', BR: '55', CA: '1',
  CH: '41', CL: '56', CN: '86', CO: '57', CZ: '420', DE: '49', DK: '45', EE: '372',
  EG: '20', ES: '34', FI: '358', FR: '33', GB: '44', GR: '30', HK: '852', HR: '385',
  HU: '36', ID: '62', IE: '353', IL: '972', IN: '91', IT: '39', JP: '81', KR: '82',
  LT: '370', LU: '352', LV: '371', MX: '52', MY: '60', NG: '234', NL: '31', NO: '47',
  NZ: '64', PH: '63', PK: '92', PL: '48', PT: '351', RO: '40', RS: '381', SA: '966',
  SE: '46', SG: '65', SI: '386', SK: '421', TH: '66', TR: '90', TW: '886', UA: '380',
  US: '1', VN: '84', ZA: '27',
};

/** `true` for a number already in E.164 form: `+`, 1–15 digits, no leading zero. */
export function isE164(value: unknown): boolean {
  return typeof value === 'string' && /^\+[1-9]\d{6,14}$/.test(value);
}

/** Options for {@link toE164}. */
export interface E164Options {
  /**
   * Country whose calling code is assumed for national numbers (ISO code, or
   * the calling code itself such as `'48'`). Without it, only numbers that
   * already carry `+` or `00` can be normalised.
   */
  defaultCountry?: string;
}

/**
 * Normalises user input to E.164 (`'+48601234567'`): strips spaces, dots,
 * dashes and parentheses, turns a `00` international prefix into `+`, and
 * for national numbers drops one trunk `0` and prepends the default
 * country's calling code. Returns `''` when the result is not E.164.
 */
export function toE164(value: unknown, options: E164Options = {}): string {
  if (typeof value !== 'string') return '';
  let s = value.replace(/[\s().-]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+')) {
    const dc = options.defaultCountry
      ? DIAL_CODES[options.defaultCountry.toUpperCase()] ?? options.defaultCountry.replace(/\D/g, '')
      : '';
    if (!dc) return '';
    s = '+' + dc + s.replace(/^0/, '');
  }
  return isE164(s) ? s : '';
}
