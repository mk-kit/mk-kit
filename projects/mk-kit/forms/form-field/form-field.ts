import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import type { Subscription } from 'rxjs';
import type { MkErrorMessages, MkSize } from '@mkornas/ui/core';
import { MK_I18N, mkFirstErrorMessage, mkUniqueId } from '@mkornas/ui/core';

/**
 * FormField — an accessible wrapper that provides a real `<label>`, optional
 * hint text, error text and a required indicator for any nested control
 * (`input[mkInput]`, `mk-select`, `mk-checkbox`, …).
 *
 * It generates stable ids (via `mkUniqueId`) and exposes them so nested
 * controls can wire `aria-labelledby` / `aria-describedby` / `aria-invalid`
 * automatically by injecting this component. While an error shows, the hint is
 * hidden and the error is announced through a `role="alert"` region.
 *
 * ## Automatic errors
 *
 * When the projected control is bound to a form (`formControlName`,
 * `[formControl]` or `[(ngModel)]`) the field adopts its `NgControl` and shows
 * the first validation error by itself — no `[error]` binding needed. Messages
 * come from the `validation` i18n table and can be reworded per field with
 * `errorMessages`. As with `mat-error`, an error only appears once the control
 * is touched or dirty, or its form has been submitted; `errorOn` changes that.
 * `required` and the disabled styling are derived from the control too.
 *
 * ```html
 * <!-- automatic: message + required marker come from the validators -->
 * <mk-form-field label="Email">
 *   <input mkInput type="email" formControlName="email" />
 * </mk-form-field>
 *
 * <!-- per-field wording -->
 * <mk-form-field label="Age" [errorMessages]="{ min: 'You must be 18 or over' }">
 *   <mk-number-input formControlName="age" [min]="18" />
 * </mk-form-field>
 *
 * <!-- fully manual: an explicit [error] always wins -->
 * <mk-form-field label="Email" hint="We never share it." required
 *   [error]="emailError()">
 *   <input mkInput type="email" [(ngModel)]="email" />
 * </mk-form-field>
 * ```
 */
@Component({
  selector: 'mk-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-form-field',
    '[class.mk-form-field--sm]': "size() === 'sm'",
    '[class.mk-form-field--md]': "size() === 'md'",
    '[class.mk-form-field--lg]': "size() === 'lg'",
    '[class.mk-form-field--invalid]': 'hasError()',
    '[class.mk-form-field--required]': 'isRequired()',
    '[class.mk-form-field--disabled]': 'isDisabled()',
  },
})
export class MkFormField {
  private readonly i18n = inject(MK_I18N);
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, {
    optional: true,
  });

  /** Visible field label. Rendered as a real `<label for>`. */
  readonly label = input<string>('');
  /** Optional helper text shown below the control (hidden while an error shows). */
  readonly hint = input<string>('');
  /**
   * Explicit error message. When non-null it overrides the automatic message
   * derived from the projected control; `''` suppresses errors entirely.
   */
  readonly error = input<string | null>(null);
  /**
   * Per-field wording for automatic errors, keyed by `ValidationErrors` key.
   * Each value is either a fixed string or a function of the error payload.
   */
  readonly errorMessages = input<MkErrorMessages | null>(null);
  /**
   * When automatic errors become visible. `touched` (the default) matches
   * Material: after the control is touched or dirty, or the form is submitted.
   * `dirty` waits for an actual edit; `always` shows as soon as it is invalid.
   */
  readonly errorOn = input<'touched' | 'dirty' | 'always'>('touched');
  /**
   * Marks the field required (adds an indicator + `aria-required`). Derived
   * from the projected control's validators when it is bound to a form.
   */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Visually reflect a disabled control. Derived from the projected control
   * when it is bound to a form.
   */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Control size; nested controls inherit it. */
  readonly size = input<MkSize>('md');

  /** The projected control's form binding, when it has one. */
  private readonly ngControl = contentChild(NgControl, { descendants: true });

  /**
   * Bumped on every change of the bound control so the computed state below
   * re-reads it. `AbstractControl` is not signal-based, so this bridges its
   * event stream into the reactive graph.
   */
  private readonly controlTick = signal(0);

  /** Id for the nested interactive control — adopt on your control element. */
  readonly controlId = mkUniqueId('mk-field');
  /** Id of the `<label>` element (for `aria-labelledby`). */
  readonly labelId = `${this.controlId}-label`;
  /** Id of the hint element. */
  readonly hintId = `${this.controlId}-hint`;
  /** Id of the error element. */
  readonly errorId = `${this.controlId}-error`;

  constructor() {
    const bump = () => this.controlTick.update((n) => n + 1);
    let sub: Subscription | null = null;

    // `AbstractControl.events` emits on value, status, pristine and touched
    // changes — every input the state below reads. Submitting flips the form's
    // `submitted` flag without touching a control, so watch that separately.
    const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;
    const submitSub = submit?.subscribe(bump) ?? null;

    effect(() => {
      const control = this.ngControl()?.control;
      sub?.unsubscribe();
      sub = control ? control.events.subscribe(bump) : null;
    });

    inject(DestroyRef).onDestroy(() => {
      sub?.unsubscribe();
      submitSub?.unsubscribe();
    });
  }

  /** Whether the surrounding form (if any) has been submitted. */
  private readonly submitted = computed(() => {
    this.controlTick();
    return (
      this.parentFormGroup?.submitted || this.parentForm?.submitted || false
    );
  });

  /** The automatic message for the bound control, when one should show. */
  private readonly autoError = computed<string | null>(() => {
    this.controlTick();
    const control = this.ngControl()?.control;
    if (!control || control.disabled || !control.invalid) return null;

    const gate = this.errorOn();
    const visible =
      gate === 'always' ||
      (gate === 'dirty' ? control.dirty : control.touched || control.dirty) ||
      this.submitted();
    if (!visible) return null;

    return mkFirstErrorMessage(
      control.errors,
      this.i18n.validation,
      this.errorMessages() ?? undefined,
    );
  });

  /** The message actually rendered — an explicit `error` always wins. */
  readonly errorText = computed<string | null>(
    () => this.error() ?? this.autoError(),
  );

  /** Whether the field currently has an error. */
  readonly hasError = computed(() => !!this.errorText());

  /** Required either explicitly or through the bound control's validators. */
  readonly isRequired = computed(() => {
    if (this.required()) return true;
    this.controlTick();
    return this.ngControl()?.control?.hasValidator(Validators.required) ?? false;
  });

  /** Disabled either explicitly or through the bound control. */
  readonly isDisabled = computed(() => {
    if (this.disabled()) return true;
    this.controlTick();
    return this.ngControl()?.control?.disabled ?? false;
  });

  /** Whether the hint should be shown (hidden while an error is present). */
  readonly hintVisible = computed(() => !this.hasError() && !!this.hint());

  /**
   * Space-separated id list for a nested control's `aria-describedby`,
   * or `null` when there is nothing to describe.
   */
  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hintVisible()) ids.push(this.hintId);
    if (this.hasError()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });
}
