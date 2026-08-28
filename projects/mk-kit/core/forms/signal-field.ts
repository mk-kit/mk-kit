import { Injector, type Signal, computed, inject } from '@angular/core';
import { FORM_FIELD, type FormField } from '@angular/forms/signals';

/**
 * Touched-gate for a control's `invalid` input under Signal Forms.
 *
 * When a control is bound with the `[formField]` directive, Angular writes the
 * field's `invalid()` state straight into the control's `invalid` input — from
 * the first render, before the user has reached the field. mk-kit controls
 * pass that input through this gate so the invalid visual (and `aria-invalid`)
 * only shows once the field is touched or dirty, matching how `mk-form-field`
 * reveals its message and how `submit()` (which marks every field touched)
 * surfaces the remaining problems.
 *
 * Returns a signal that is always `true` for a control that is not bound with
 * `[formField]`, so a standalone `[invalid]="true"` keeps working as before.
 * Call it in a field initializer (an injection context):
 *
 * ```ts
 * private readonly fieldTouched = mkInjectFieldTouched();
 * protected readonly isInvalid = computed(
 *   () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
 * );
 * ```
 *
 * The binding is looked up lazily, on first read: the `FormField` directive
 * itself injects the element's `NG_VALUE_ACCESSOR` (the control) while it is
 * created, so resolving it from the control's constructor would be circular.
 */
export function mkInjectFieldTouched(): Signal<boolean> {
  const injector = inject(Injector);
  let formField: FormField<unknown> | null | undefined;
  const resolve = () =>
    formField === undefined
      ? (formField = injector.get(FORM_FIELD, null, { self: true, optional: true }))
      : formField;
  return computed(() => {
    const field = resolve();
    if (!field) return true;
    const state = field.state();
    return state.touched() || state.dirty();
  });
}
