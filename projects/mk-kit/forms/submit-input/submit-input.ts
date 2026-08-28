import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize, MkTone, MkVariant } from '@mk-kit/ui/core';
import { MK_I18N, mkUniqueId } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkIcon } from '@mk-kit/ui/icon';
import { MkFormField } from '../form-field/form-field';
import { MkInputGroup } from '../input-group/input-group';

/**
 * SubmitInput — a short text entry and its action button rendered as one
 * connected control: the "type a code and apply it" pattern (discount codes,
 * gift cards, invite codes, newsletter sign-up, quick search).
 *
 * The button is disabled while the value is empty or blank, shows a spinner
 * while `loading` and emits {@link submitted} with the **trimmed** value on
 * click or on Enter.
 *
 * ## Enter never submits the surrounding form
 *
 * This control is normally dropped inside a bigger form (a checkout, a
 * settings page), where triggering that form's submit would be a bug. So the
 * action button is a `type="button"` and, while `submitOnEnter` is on, the
 * Enter keydown is `preventDefault()`-ed — implicit form submission never
 * fires. Set `submitOnEnter="false"` to restore the native behaviour and let
 * Enter reach the enclosing form.
 *
 * ## Button content
 *
 * The button is configured, not projected: `buttonLabel` sets its text.
 * Passing `buttonIcon` (a registered {@link MkIcon} name) switches it to the
 * square icon-only variant, where `buttonLabel` becomes its `aria-label` — so
 * the action always has an accessible name.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so
 * `[(ngModel)]`, reactive forms and `[(value)]` all work.
 *
 * ```html
 * <mk-submit-input
 *   [(value)]="code"
 *   buttonLabel="Apply"
 *   [loading]="applying()"
 *   placeholder="SUMMER10"
 *   clearable
 *   (submitted)="apply($event)"
 * />
 *
 * <!-- icon-only, inside a field -->
 * <mk-form-field label="Search">
 *   <mk-submit-input buttonIcon="search" buttonLabel="Search" [(ngModel)]="q" />
 * </mk-form-field>
 * ```
 */
@Component({
  selector: 'mk-submit-input',
  templateUrl: './submit-input.html',
  styleUrl: './submit-input.scss',
  exportAs: 'mkSubmitInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkInputGroup, MkButton, MkIcon],
  host: {
    class: 'mk-submit-input',
    '[class.mk-submit-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-submit-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-submit-input--invalid]': 'isInvalid()',
    '[class.mk-submit-input--disabled]': 'isDisabled()',
    '[attr.aria-busy]': 'loading() || null',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkSubmitInput),
      multi: true,
    },
  ],
})
export class MkSubmitInput implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the whole control (input + button). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('');
  /**
   * Accessible name for the inner input when the control is used outside an
   * `mk-form-field` (inside one, the field's `<label>` wins). Defaults to the
   * button's caption.
   */
  readonly label = input<string>('');
  /** Native `type` of the inner input (`text`, `search`, `email`, …). */
  readonly type = input<string>('text');
  /** Native `autocomplete` hint for the inner input. */
  readonly autocomplete = input<string>('off');
  /** Two-way value. `submitted` emits it trimmed; the model keeps what was typed. */
  readonly value = model<string>('');

  /** Button text — or, with `buttonIcon`, the icon button's `aria-label`. */
  readonly buttonLabel = input<string>('');
  /** Registered icon name; switches the button to the icon-only variant. */
  readonly buttonIcon = input<string>('');
  /** Button visual treatment. */
  readonly buttonVariant = input<MkVariant>('solid');
  /** Button colour tone. */
  readonly buttonTone = input<MkTone>('primary');
  /** Shows a spinner in the button and blocks submitting while an action runs. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Show a clear affix while the value is non-empty. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /**
   * Submit on Enter, without submitting an enclosing `<form>`. Turn it off to
   * let Enter bubble to the form as the browser normally would.
   */
  readonly submitOnEnter = input(true, { transform: booleanAttribute });

  /** Emits the current value, trimmed, when the action is triggered. */
  readonly submitted = output<string>();

  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Id of the inner input — the `<label for>` target inside an `mk-form-field`. */
  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-submit-input');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(
    () => this.field?.isRequired() ?? false,
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  /** Fallback accessible name for the input when no field label describes it. */
  protected readonly inputLabel = computed(() =>
    this.labelledBy() ? null : this.label() || this.actionLabel(),
  );
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** The accessible name of the action button in either variant. */
  protected readonly actionLabel = computed(
    () => this.buttonLabel() || this.i18n.submit,
  );
  /** Whether the clear affix is currently rendered. */
  protected readonly showClear = computed(
    () => this.clearable() && !!this.value() && !this.isDisabled(),
  );
  /** Blank values, a disabled control and an in-flight action all block submitting. */
  protected readonly canSubmit = computed(
    () => !this.isDisabled() && !this.loading() && this.value().trim() !== '',
  );

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || !this.submitOnEnter()) return;
    // Swallow the key so the browser's implicit submission of an enclosing
    // <form> never fires — this control owns Enter.
    event.preventDefault();
    this.submit();
  }

  /** Emit `submitted` with the trimmed value, when the control allows it. */
  submit(): void {
    if (!this.canSubmit()) return;
    this.submitted.emit(this.value().trim());
  }

  /** Clear the value and return focus to the input. */
  clear(): void {
    this.value.set('');
    this.onChange('');
    this.inputRef()?.nativeElement.focus();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set(value == null ? '' : String(value));
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
