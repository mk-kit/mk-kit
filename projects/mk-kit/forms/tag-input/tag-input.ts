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
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MK_I18N } from '@mkornas/ui/core';
import type { MkSize } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';
import { MkChip } from '@mkornas/ui/chip';

/**
 * TagInput — a freeform token input: type a value and press Enter (or a
 * separator) to add it as a removable chip. Backspace on an empty field removes
 * the last tag, and pasting a delimited string adds several at once. Unlike
 * `mk-multi-select` the tags are not drawn from a fixed option list. Implements
 * `ControlValueAccessor` + a two-way `value` model of `string[]`.
 *
 * ```html
 * <mk-tag-input placeholder="Add tags…" [(value)]="tags" />
 * ```
 */
@Component({
  selector: 'mk-tag-input',
  templateUrl: './tag-input.html',
  styleUrl: './tag-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkChip],
  host: {
    class: 'mk-tag-input',
    '[class.mk-tag-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-tag-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-tag-input--invalid]': 'isInvalid()',
    '[class.mk-tag-input--disabled]': 'isDisabled()',
    '(click)': 'focusInput()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkTagInput),
      multi: true,
    },
  ],
})
export class MkTagInput implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  protected readonly i18n = inject(MK_I18N);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Two-way list of tags. */
  readonly value = model<string[]>([]);
  /** Placeholder shown in the text field. */
  readonly placeholder = input<string>('');
  /** Maximum number of tags (0 = unlimited). */
  readonly max = input(0, { transform: numberAttribute });
  /** Allow the same tag more than once. */
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  /** Commit the pending text as a tag when the field loses focus. */
  readonly addOnBlur = input(false, { transform: booleanAttribute });
  /**
   * Extra characters that commit the pending text (Enter always does). A
   * pasted string is split on these too. Default: comma.
   */
  readonly separators = input<readonly string[]>([',']);
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  /** Emitted when a tag is added. */
  readonly added = output<string>();
  /** Emitted when a tag is removed. */
  readonly removed = output<string>();

  protected readonly query = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-tag-input');

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
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly atMax = computed(
    () => this.max() > 0 && this.value().length >= this.max(),
  );

  protected focusInput(): void {
    if (!this.isDisabled()) this.inputRef()?.nativeElement.focus();
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key === 'Enter' || this.separators().includes(key)) {
      if (this.query().trim()) {
        event.preventDefault();
        this.commit(this.query());
      } else if (key === 'Enter') {
        event.preventDefault();
      }
    } else if (key === 'Backspace' && this.query() === '') {
      this.removeAt(this.value().length - 1);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (this.splitPattern().test(text)) {
      event.preventDefault();
      for (const part of text.split(this.splitPattern())) this.commit(part);
    }
  }

  protected onBlur(): void {
    if (this.addOnBlur() && this.query().trim()) this.commit(this.query());
    this.onTouched();
  }

  private splitPattern(): RegExp {
    const chars = this.separators()
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('');
    return new RegExp(`[${chars}\\n]`);
  }

  private commit(raw: string): void {
    const tag = raw.trim();
    if (!tag) {
      this.query.set('');
      return;
    }
    if (this.isDisabled() || this.atMax()) return;
    // Keep the typed text when the tag is rejected so nothing is lost silently.
    if (!this.allowDuplicates() && this.value().includes(tag)) return;
    this.query.set('');
    const next = [...this.value(), tag];
    this.setValue(next);
    this.added.emit(tag);
  }

  protected removeAt(index: number): void {
    if (this.isDisabled() || index < 0 || index >= this.value().length) return;
    const tag = this.value()[index];
    const next = this.value().filter((_, i) => i !== index);
    this.setValue(next);
    this.removed.emit(tag);
  }

  private setValue(next: string[]): void {
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string[] | null): void {
    this.value.set(Array.isArray(value) ? value : []);
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
