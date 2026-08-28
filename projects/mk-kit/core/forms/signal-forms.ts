import type { ValidationErrors } from '@angular/forms';
import type { MkValidationStrings } from '../i18n/mk-i18n';
import { type MkErrorMessages, mkFirstErrorMessage } from './validation-messages';

/**
 * The shape of a Signal Forms validation error as `mk-kit` reads it — the
 * `{ kind, message? }` contract of `ValidationError` from
 * `@angular/forms/signals`, plus whatever payload the error class carries
 * (`min`, `maxLength`, `pattern`, …). Declared structurally so `@mk-kit/ui/core`
 * stays free of a runtime dependency on the signals entry point.
 */
export interface MkSignalValidationError {
  /** Identifies the kind of error (`'required'`, `'minLength'`, …). */
  readonly kind: string;
  /** Human-readable message, when the schema supplied one. */
  readonly message?: string;
}

/**
 * Converts Signal Forms errors to the reactive-forms `ValidationErrors` shape
 * the `validation` i18n table is keyed by, so both form systems render the
 * same messages. The built-in kinds map to Angular's classic keys and payloads
 * (`minLength` → `minlength: { requiredLength }`, `minDate` → `mkMinDate`,
 * …); any other kind is kept as-is with its payload spread into the value.
 *
 * @returns The error map in the order the errors were reported, or `null`
 *   when the list is empty.
 */
export function mkSignalErrorsToValidationErrors(
  errors: readonly MkSignalValidationError[] | null | undefined,
): ValidationErrors | null {
  if (!errors || errors.length === 0) return null;
  const out: ValidationErrors = {};
  for (const err of errors) {
    const [key, payload] = toReactiveError(err);
    if (!(key in out)) out[key] = payload;
  }
  return out;
}

function toReactiveError(error: MkSignalValidationError): [string, unknown] {
  const err = error as MkSignalValidationError & Record<string, unknown>;
  const message = err.message;
  switch (err.kind) {
    case 'required':
      return ['required', message ? { message } : true];
    case 'email':
      return ['email', message ? { message } : true];
    case 'min':
      return ['min', { min: err['min'], actual: err['actual'], message }];
    case 'max':
      return ['max', { max: err['max'], actual: err['actual'], message }];
    case 'minLength':
      return ['minlength', { requiredLength: err['minLength'], actualLength: err['actualLength'], message }];
    case 'maxLength':
      return ['maxlength', { requiredLength: err['maxLength'], actualLength: err['actualLength'], message }];
    case 'pattern':
      return ['pattern', { requiredPattern: String(err['pattern'] ?? ''), message }];
    case 'minDate':
      return ['mkMinDate', { min: err['minDate'], actual: err['actual'], message }];
    case 'maxDate':
      return ['mkMaxDate', { max: err['maxDate'], actual: err['actual'], message }];
    default: {
      // Custom / server / compat errors: keep the kind as the key and expose the
      // payload (a `CompatValidationError` carries the reactive payload in
      // `context`) so per-key `errorMessages` functions receive it.
      const rest: Record<string, unknown> = {};
      for (const key of Object.keys(err)) {
        if (key !== 'kind' && key !== 'fieldTree' && key !== 'formField') rest[key] = err[key];
      }
      const context = rest['context'];
      if (context && typeof context === 'object') {
        return [err.kind, { ...context, message: message ?? (context as { message?: string }).message }];
      }
      return [err.kind, Object.keys(rest).length ? rest : message ? { message } : true];
    }
  }
}

/**
 * Resolves the message for the first Signal Forms error on a field, the way
 * `mkFirstErrorMessage` does for reactive forms.
 *
 * Lookup order: the field's `overrides` for that kind, then the `message` the
 * schema attached to the error (`required(p.email, { message: '…' })`), then
 * the i18n `validation` table, then the generic fallback.
 *
 * @returns The message, or `null` when there are no errors.
 */
export function mkSignalErrorMessage(
  errors: readonly MkSignalValidationError[] | null | undefined,
  strings: MkValidationStrings,
  overrides?: MkErrorMessages,
): string | null {
  if (!errors || errors.length === 0) return null;
  const first = errors[0];
  const [key, payload] = toReactiveError(first);
  const override = overrides?.[key];
  if (typeof override === 'string') return override;
  if (typeof override === 'function') return override(payload);
  if (typeof first.message === 'string' && first.message) return first.message;
  return mkFirstErrorMessage({ [key]: payload }, strings);
}
