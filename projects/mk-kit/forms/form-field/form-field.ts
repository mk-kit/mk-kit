import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  type AbstractControl,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { FORM_FIELD, type Field, type FieldState } from '@angular/forms/signals';
import type { Subscription } from 'rxjs';
import type { MkErrorMessages, MkSize } from '@mk-kit/ui/core';
import {
  MK_I18N,
  MkFieldContext,
  mkFirstErrorMessage,
  mkSignalErrorMessage,
  mkUniqueId,
} from '@mk-kit/ui/core';

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
 * ## Signal Forms
 *
 * The same applies to a control bound with Signal Forms' `[formField]`
 * directive (`@angular/forms/signals`): the field adopts the projected
 * `FormField` binding and reads `touched()` / `dirty()` / `invalid()` /
 * `errors()` / `required()` / `disabled()` from its `FieldState`. Errors
 * written by the schema (`required(p.email)`, `minLength(p.name, 2)`, …) are
 * rendered through the same `validation` i18n table, a `message` supplied to
 * the schema rule wins over the table, and `errorMessages` / `errorOn` work
 * unchanged. Calling `submit()` marks every field touched, so errors surface
 * on a failed submit exactly as with `formControlName`. When the control is
 * not projected (or lives deeper), point the field at it with `[field]`.
 *
 * ```html
 * <mk-form-field label="Email">
 *   <input mkInput type="email" [formField]="f.email" />
 * </mk-form-field>
 *
 * <mk-form-field label="Country" [field]="f.country">
 *   <mk-select [formField]="f.country" [options]="countries" />
 * </mk-form-field>
 * ```
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
    '[class.mk-form-field--float]': "labelPosition() === 'float'",
    '[class.mk-form-field--focused]': 'focused()',
    '[class.mk-form-field--filled]': 'hasValue()',
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'focused.set(false)',
    '(input)': 'readDomValue($event.target)',
    '(change)': 'readDomValue($event.target)',
  },
  providers: [
    {
      provide: MkFieldContext,
      useExisting: forwardRef(() => MkFormField),
    },
  ],
})
export class MkFormField implements MkFieldContext {
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
  /**
   * Where the label sits: above the control (default), or `float` — inside
   * the control, sliding up once it is focused or has a value. Floating works
   * with `mkInput` / textarea and any control bound with `ngModel` or a
   * `formControl`; the placeholder stays hidden until the label has moved.
   */
  readonly labelPosition = input<'top' | 'float'>('top');
  /**
   * Signal Forms field to read state from explicitly (`[field]="f.email"`).
   * Not needed when the projected control carries the `[formField]` binding —
   * the wrapper finds that itself; set it when the control is nested deeper
   * or when the wrapper should follow a field it does not contain.
   */
  readonly field = input<Field<unknown> | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The projected control's form binding, when it has one. */
  private readonly ngControl = contentChild(NgControl, { descendants: true });
  /** The projected control's Signal Forms `[formField]` binding, when it has one. */
  private readonly signalField = contentChild(FORM_FIELD, { descendants: true });

  /**
   * The Signal Forms field state driving this wrapper — the explicit `field`
   * input first, else the projected `[formField]` binding. `undefined` for a
   * reactive-forms / template-driven control.
   */
  private readonly fieldState = computed<FieldState<unknown> | undefined>(() => {
    const explicit = this.field();
    if (explicit) return explicit();
    return this.signalField()?.state();
  });

  /** A control inside the field has focus. */
  protected readonly focused = signal(false);
  /** Last value read straight from a native control (fallback when no NgControl). */
  private readonly domValue = signal<string | null>(null);
  /** The field holds a non-empty value (drives the floating label). */
  protected readonly hasValue = computed(() => {
    this.controlTick();
    const state = this.fieldState();
    const control = state ? null : this.ngControl();
    const v = state ? state.value() : control ? control.value : this.domValue();
    if (v == null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });

  /** Track a native control's value for the floating label when nothing else reports it. */
  protected readDomValue(target: EventTarget | null): void {
    const el = target as HTMLInputElement | null;
    if (!el || typeof el.value !== 'string') return;
    this.domValue.set(el.value);
  }

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
    afterNextRender(() => {
      const el = this.host.nativeElement.querySelector<HTMLInputElement>('input, textarea, select');
      if (el) this.readDomValue(el);
    });
    const bump = () => this.controlTick.update((n) => n + 1);
    let sub: Subscription | null = null;

    // `AbstractControl.events` emits on value, status, pristine and touched
    // changes — every input the state below reads. Submitting flips the form's
    // `submitted` flag without touching a control, so watch that separately.
    const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;
    const submitSub = submit?.subscribe(bump) ?? null;

    effect(() => {
      // A `[formField]` binding provides an interop `NgControl` without an
      // `events` stream; its state is read reactively via `fieldState` instead.
      const control = this.signalField()
        ? null
        : (this.ngControl()?.control as Partial<AbstractControl> | null | undefined);
      sub?.unsubscribe();
      sub = control?.events ? control.events.subscribe(bump) : null;
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
    const state = this.fieldState();
    if (state) {
      if (state.disabled() || state.hidden() || !state.invalid()) return null;
      const gate = this.errorOn();
      const visible =
        gate === 'always' ||
        (gate === 'dirty' ? state.dirty() : state.touched() || state.dirty());
      if (!visible) return null;
      return mkSignalErrorMessage(
        state.errors(),
        this.i18n.validation,
        this.errorMessages() ?? undefined,
      );
    }

    this.controlTick();
    const control = this.signalField() ? null : this.ngControl()?.control;
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
    const state = this.fieldState();
    if (state) return state.required();
    this.controlTick();
    return this.ngControl()?.control?.hasValidator(Validators.required) ?? false;
  });

  /** Disabled either explicitly or through the bound control. */
  readonly isDisabled = computed(() => {
    if (this.disabled()) return true;
    const state = this.fieldState();
    if (state) return state.disabled();
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
