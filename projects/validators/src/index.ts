/**
 * @mk-kit/validators — zero-dependency validators for Polish and European
 * identifiers. Pure functions: every `is*` takes `unknown`, tolerates the
 * common separators and returns `boolean`; every `parse*` returns a typed
 * object or `null`. Adapters: `@mk-kit/validators/forms` (Angular
 * `ValidatorFn`s) and `@mk-kit/validators/signals` (Standard Schema for
 * Signal Forms and any Standard-Schema-aware library).
 */
export { isPesel, parsePesel, peselCheckDigit, type PeselInfo } from './pesel.js';
export { isNip, normalizeNip, formatNip, nipCheckDigit } from './nip.js';
export {
  isRegon,
  regon9CheckDigit,
  regon14CheckDigit,
  isKrs,
  normalizeKrs,
  isPolishIdCard,
} from './regon.js';
export {
  isIban,
  parseIban,
  formatIban,
  ibanMod97,
  ibanCheckDigits,
  IBAN_LENGTHS,
  type IbanInfo,
} from './iban.js';
export { isVatId, parseVatId, VAT_FORMATS, type VatInfo } from './vat.js';
export {
  isLuhn,
  luhnCheckDigit,
  isCardNumber,
  detectCardBrand,
  CARD_BRAND_NAMES,
  type CardBrand,
} from './luhn.js';
export { isPostalCode, postalFormat, POSTAL_FORMATS, type PostalFormat } from './postal.js';
export { isE164, toE164, DIAL_CODES, type E164Options } from './phone.js';
