import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
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
import type { MkSize } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MkFieldContext } from '@mkornas/ui/core';

/**
 * InlineEdit — click a piece of text to edit it in place. The display is a
 * button that swaps to an input on click (or Enter/Space); Enter or blur saves,
 * Escape reverts. Ideal for editable labels in tables and detail panels.
 * Implements `ControlValueAccessor` + a two-way `value` model of `string`.
 *
 * ```html
 * <mk-inline-edit [(value)]="title" placeholder="Untitled" />
 * <mk-inline-edit multiline [(value)]="notes" />
 * ```
 */
@Component({
  selector: 'mk-inline-edit',
  templateUrl: './inline-edit.html',
  styleUrl: './inline-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-inline-edit',
    '[class.mk-inline-edit--sm]': "effectiveSize() === 'sm'",
    '[class.mk-inline-edit--lg]': "effectiveSize() === 'lg'",
    '[class.mk-inline-edit--editing]': 'editing()',
    '[class.mk-inline-edit--invalid]': 'isInvalid()',
    '[class.mk-inline-edit--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkInlineEdit),
      multi: true,
    },
  ],
})
export class MkInlineEdit implements ControlValueAccessor {
  private readonly injector = inject(Injector);
  private readonly field = inject(MkFieldContext, { optional: true });
  protected readonly i18n = inject(MK_I18N);
  private readonly displayRef =
    viewChild<ElementRef<HTMLButtonElement>>('display');
  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('input');

  /** Two-way edited value. */
  readonly value = model<string>('');
  /** Shown (muted) when the value is empty. */
  readonly placeholder = input(this.i18n.empty);
  /** Use a multi-line textarea; Enter inserts a newline, blur/✓ saves. */
  readonly multiline = input(false, { transform: booleanAttribute });
  /** Save when the field loses focus (otherwise blur cancels). */
  readonly saveOnBlur = input(true, { transform: booleanAttribute });
  /** Accessible label for the edit trigger + field. */
  readonly ariaLabel = input(this.i18n.edit);
  /** Disable editing. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  /** Emitted with the new value when an edit is saved. */
  readonly saved = output<string>();
  /** Emitted when an edit is cancelled. */
  readonly cancelled = output<void>();

  protected readonly editing = signal(false);
  protected readonly draft = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly fieldId = this.field?.controlId ?? mkUniqueId('mk-inline-edit');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly displayText = computed(() => this.value() || '');

  protected startEdit(): void {
    if (this.isDisabled() || this.editing()) return;
    this.draft.set(this.value());
    this.editing.set(true);
    afterNextRender(() => this.inputRef()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
    } else if (event.key === 'Enter' && !this.multiline()) {
      event.preventDefault();
      this.save();
    }
  }

  protected onBlur(): void {
    if (!this.editing()) return;
    this.saveOnBlur() ? this.save() : this.cancel();
  }

  protected save(): void {
    if (!this.editing()) return;
    this.editing.set(false);
    const next = this.draft();
    if (next !== this.value()) {
      this.value.set(next);
      this.onChange(next);
      this.saved.emit(next);
    }
    this.onTouched();
    this.restoreFocus();
  }

  protected cancel(): void {
    if (!this.editing()) return;
    this.editing.set(false);
    this.cancelled.emit();
    this.restoreFocus();
  }

  private restoreFocus(): void {
    afterNextRender(() => this.displayRef()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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
