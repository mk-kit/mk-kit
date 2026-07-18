/**
 * Per-country dialing metadata for {@link MkPhoneInput}.
 *
 * `mask` is an `mkApplyMask`-style pattern for the **national** number
 * (`0` = digit, everything else is a literal). Masks follow the most common
 * national formatting; countries with several plan lengths use their longest
 * common mobile format. The set covers the countries an admin product is
 * likely to meet — extend or replace it via the `countries` input.
 */
export interface MkPhoneCountry {
  /** ISO 3166-1 alpha-2 code, uppercase (drives the flag + display name). */
  code: string;
  /** International dialing code, digits only (no `+`). */
  dialCode: string;
  /** Mask for the national number, `0` = digit. */
  mask: string;
}

/** The built-in country set (alphabetical by ISO code). */
export const MK_PHONE_COUNTRIES: readonly MkPhoneCountry[] = [
  { code: 'AE', dialCode: '971', mask: '00 000 0000' },
  { code: 'AR', dialCode: '54', mask: '00 0000-0000' },
  { code: 'AT', dialCode: '43', mask: '000 000000' },
  { code: 'AU', dialCode: '61', mask: '000 000 000' },
  { code: 'BE', dialCode: '32', mask: '000 00 00 00' },
  { code: 'BG', dialCode: '359', mask: '00 000 0000' },
  { code: 'BR', dialCode: '55', mask: '(00) 00000-0000' },
  { code: 'CA', dialCode: '1', mask: '(000) 000-0000' },
  { code: 'CH', dialCode: '41', mask: '00 000 00 00' },
  { code: 'CL', dialCode: '56', mask: '0 0000 0000' },
  { code: 'CN', dialCode: '86', mask: '000 0000 0000' },
  { code: 'CO', dialCode: '57', mask: '000 000 0000' },
  { code: 'CZ', dialCode: '420', mask: '000 000 000' },
  { code: 'DE', dialCode: '49', mask: '0000 0000000' },
  { code: 'DK', dialCode: '45', mask: '00 00 00 00' },
  { code: 'EE', dialCode: '372', mask: '0000 0000' },
  { code: 'EG', dialCode: '20', mask: '00 0000 0000' },
  { code: 'ES', dialCode: '34', mask: '000 000 000' },
  { code: 'FI', dialCode: '358', mask: '00 000 0000' },
  { code: 'FR', dialCode: '33', mask: '0 00 00 00 00' },
  { code: 'GB', dialCode: '44', mask: '0000 000000' },
  { code: 'GR', dialCode: '30', mask: '000 000 0000' },
  { code: 'HK', dialCode: '852', mask: '0000 0000' },
  { code: 'HR', dialCode: '385', mask: '00 000 0000' },
  { code: 'HU', dialCode: '36', mask: '00 000 0000' },
  { code: 'ID', dialCode: '62', mask: '000-0000-0000' },
  { code: 'IE', dialCode: '353', mask: '00 000 0000' },
  { code: 'IL', dialCode: '972', mask: '00-000-0000' },
  { code: 'IN', dialCode: '91', mask: '00000 00000' },
  { code: 'IT', dialCode: '39', mask: '000 000 0000' },
  { code: 'JP', dialCode: '81', mask: '00-0000-0000' },
  { code: 'KR', dialCode: '82', mask: '00-0000-0000' },
  { code: 'LT', dialCode: '370', mask: '000 00000' },
  { code: 'LU', dialCode: '352', mask: '000 000 000' },
  { code: 'LV', dialCode: '371', mask: '00 000 000' },
  { code: 'MX', dialCode: '52', mask: '00 0000 0000' },
  { code: 'MY', dialCode: '60', mask: '00-000 0000' },
  { code: 'NG', dialCode: '234', mask: '000 000 0000' },
  { code: 'NL', dialCode: '31', mask: '0 00000000' },
  { code: 'NO', dialCode: '47', mask: '000 00 000' },
  { code: 'NZ', dialCode: '64', mask: '00 000 0000' },
  { code: 'PH', dialCode: '63', mask: '000 000 0000' },
  { code: 'PK', dialCode: '92', mask: '000 0000000' },
  { code: 'PL', dialCode: '48', mask: '000 000 000' },
  { code: 'PT', dialCode: '351', mask: '000 000 000' },
  { code: 'RO', dialCode: '40', mask: '000 000 000' },
  { code: 'RS', dialCode: '381', mask: '00 000 0000' },
  { code: 'SA', dialCode: '966', mask: '00 000 0000' },
  { code: 'SE', dialCode: '46', mask: '00-000 00 00' },
  { code: 'SG', dialCode: '65', mask: '0000 0000' },
  { code: 'SI', dialCode: '386', mask: '00 000 000' },
  { code: 'SK', dialCode: '421', mask: '000 000 000' },
  { code: 'TH', dialCode: '66', mask: '00 000 0000' },
  { code: 'TR', dialCode: '90', mask: '000 000 0000' },
  { code: 'TW', dialCode: '886', mask: '000 000 000' },
  { code: 'UA', dialCode: '380', mask: '00 000 0000' },
  { code: 'US', dialCode: '1', mask: '(000) 000-0000' },
  { code: 'VN', dialCode: '84', mask: '000 000 0000' },
  { code: 'ZA', dialCode: '27', mask: '00 000 0000' },
];

/** Regional-indicator flag emoji for an ISO 3166-1 alpha-2 code. */
export function mkCountryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  const A = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    A + upper.charCodeAt(0) - 65,
    A + upper.charCodeAt(1) - 65,
  );
}
