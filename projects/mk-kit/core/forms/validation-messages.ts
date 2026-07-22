import type { ValidationErrors } from '@angular/forms';
import type { MkValidationStrings } from '../i18n/mk-i18n';

/**
 * A per-field override map: an error key mapped either to a fixed message or
 * to a function receiving that key's error payload.
 *
 * ```html
 * <mk-form-field label="Age" [errorMessages]="{ min: 'You must be 18 or over' }">
 * ```
 */
export type MkErrorMessages = Readonly<Record<string, string | ((err: any) => string)>>;

/**
 * Resolves the message for the first error on a control, mirroring how
 * `mat-error` shows one message at a time.
 *
 * Lookup order per key: the field's `overrides`, then the i18n `validation`
 * table, then the error payload's own `message` string (so a custom validator
 * can carry its text), then the generic fallback. Keys are visited in the
 * order the validators put them on the control, so composing
 * `[Validators.required, Validators.email]` surfaces "required" while empty.
 *
 * @returns The message, or `null` when there are no errors.
 */
export function mkFirstErrorMessage(
  errors: ValidationErrors | null | undefined,
  strings: MkValidationStrings,
  overrides?: MkErrorMessages,
): string | null {
  if (!errors) return null;

  for (const key of Object.keys(errors)) {
    const payload = errors[key];

    const override = overrides?.[key];
    if (typeof override === 'string') return override;
    if (typeof override === 'function') return override(payload);

    const builtin = (strings as unknown as MkErrorMessages)[key];
    if (typeof builtin === 'string') return builtin;
    if (typeof builtin === 'function') return builtin(payload);

    if (payload && typeof payload === 'object' && typeof payload.message === 'string') {
      return payload.message;
    }
  }

  return errors ? strings.unknown : null;
}
