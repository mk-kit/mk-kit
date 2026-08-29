/**
 * Angular reactive-forms adapters — `@mk-kit/validators/forms`.
 *
 * Only *types* are imported from `@angular/forms`, so this entry adds no
 * runtime dependency; it just produces functions of the `ValidatorFn` shape.
 * Empty values pass (compose with `Validators.required`), like Angular's own.
 * Each error key carries `{ value }` plus, where useful, `{ country }`.
 */
import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isCardNumber, isLuhn } from './luhn.js';
import { isIban } from './iban.js';
import { isNip } from './nip.js';
import { isPesel } from './pesel.js';
import { isE164 } from './phone.js';
import { isPostalCode } from './postal.js';
import { isKrs, isPolishIdCard, isRegon } from './regon.js';
import { isVatId } from './vat.js';

function make(key: string, test: (value: string) => boolean, extra?: Record<string, unknown>): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const str = typeof value === 'string' ? value : String(value);
    return test(str) ? null : { [key]: { value: str, ...extra } };
  };
}

/** Error key `pesel`. */
export function peselValidator(): ValidatorFn {
  return make('pesel', isPesel);
}
/** Error key `nip`. */
export function nipValidator(): ValidatorFn {
  return make('nip', isNip);
}
/** Error key `regon`. */
export function regonValidator(): ValidatorFn {
  return make('regon', isRegon);
}
/** Error key `krs`. */
export function krsValidator(): ValidatorFn {
  return make('krs', isKrs);
}
/** Error key `polishIdCard`. */
export function polishIdCardValidator(): ValidatorFn {
  return make('polishIdCard', isPolishIdCard);
}
/** Error key `iban`. */
export function ibanValidator(): ValidatorFn {
  return make('iban', isIban);
}
/** Error key `vatId`; `country` narrows the accepted prefix. */
export function vatIdValidator(country?: string): ValidatorFn {
  return make('vatId', (v) => isVatId(v, country), country ? { country } : undefined);
}
/** Error key `luhn`. */
export function luhnValidator(): ValidatorFn {
  return make('luhn', isLuhn);
}
/** Error key `cardNumber` — Luhn plus a brand-valid length. */
export function cardNumberValidator(): ValidatorFn {
  return make('cardNumber', isCardNumber);
}
/** Error key `postalCode` with `{ country }`. */
export function postalCodeValidator(country: string): ValidatorFn {
  return make('postalCode', (v) => isPostalCode(v, country), { country });
}
/** Error key `e164` — the value must already be in E.164 form. */
export function e164Validator(): ValidatorFn {
  return make('e164', isE164);
}
