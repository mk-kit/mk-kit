import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFormField } from '../form-field/form-field';

/** Whether `value` is a valid `#rgb` / `#rrggbb` hex color. */
function isHex(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

/** Expand `#rgb` to `#rrggbb` (native color inputs need 6 digits). */
function toLongHex(value: string): string {
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return value;
}

/**
 * ColorPicker — a compact color control: a live swatch that opens the native OS
 * picker, an editable hex field and an optional row of preset swatches.
 * `ControlValueAccessor` + two-way `value` model over a hex string.
 *
 * ```html
 * <mk-color-picker [(value)]="brand" [swatches]="palette" />
 * ```
 */
@Component({
  selector: 'mk-color-picker',
  templateUrl: './color-picker.html',
  styleUrl: './color-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-color-picker',
    '[class.mk-color-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-color-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-color-picker--invalid]': 'isInvalid()',
    '[class.mk-color-picker--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkColorPicker),
      multi: true,
    },
  ],
})
export class MkColorPicker implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  private readonly nativeRef =
    viewChild<ElementRef<HTMLInputElement>>('native');

  /** Two-way hex color value. */
  readonly value = model('#000000');
  /** Preset swatches (hex strings). */
  readonly swatches = input<readonly string[]>([]);
  /** Show the editable hex text field. */
  readonly hexInput = input(true, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force invalid styling when standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored inside an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Accessible label for the swatch trigger. */
  readonly ariaLabel = input('Choose color');

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-color');
  /** Uncommitted text in the hex field (may be partial while typing). */
  protected readonly hexText = signal('#000000');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Mirror the value into the hex field, incl. external / two-way updates.
    effect(() => this.hexText.set(this.value()));
  }

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.required() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly nativeValue = computed(() => toLongHex(this.value()));

  /** Open the OS color picker (via the hidden native input). */
  protected openNative(): void {
    if (this.isDisabled()) return;
    this.nativeRef()?.nativeElement.click();
  }

  protected onNativeInput(event: Event): void {
    this.setValue((event.target as HTMLInputElement).value);
  }

  protected onHexInput(event: Event): void {
    this.hexText.set((event.target as HTMLInputElement).value);
  }

  protected commitHex(): void {
    let text = this.hexText().trim();
    if (text && !text.startsWith('#')) text = `#${text}`;
    if (isHex(text)) {
      this.setValue(text);
    } else {
      this.hexText.set(this.value()); // revert invalid entry
    }
    this.onTouched();
  }

  protected pickSwatch(hex: string): void {
    if (this.isDisabled()) return;
    this.setValue(hex);
  }

  private setValue(hex: string): void {
    const next = hex.toLowerCase();
    this.value.set(next);
    this.hexText.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    const v = value ?? '#000000';
    this.value.set(v);
    this.hexText.set(v);
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
