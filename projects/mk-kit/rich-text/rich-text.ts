import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { MK_I18N, MkFieldContext } from '@mk-kit/ui/core';
import { MkRichTextEngine } from './rich-text-engine';
import { sanitizeInlineHtml } from './sanitize';

/**
 * Rich text — a small WYSIWYG form control over a sanitised HTML string, for
 * single "description"-style fields where the full block editor is overkill.
 * Renders a textarea-like surface with the floating inline formatting toolbar
 * (Bold, Italic, Underline, Strikethrough, Inline code, Link, Clear) on text
 * selection; Enter inserts a line break.
 *
 * Implements `ControlValueAccessor` with a two-way `value` model, so it works
 * with `[(ngModel)]`, reactive forms and `[(value)]`. Every value — written or
 * emitted — passes through {@link sanitizeInlineHtml}, and a visually empty
 * surface (whitespace / lone `<br>`s) normalises to `''` so `required`
 * validation behaves.
 *
 * ```html
 * <mk-rich-text [(ngModel)]="description" placeholder="Describe it…" />
 * <mk-rich-text [(value)]="html" minHeight="8rem" />
 * ```
 */
@Component({
  selector: 'mk-rich-text',
  templateUrl: './rich-text.html',
  styleUrl: './rich-text.scss',
  imports: [MkRichTextEngine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-rich-text-field',
    '[class.mk-rich-text-field--disabled]': 'isDisabled()',
    '[class.mk-rich-text-field--invalid]': 'isInvalid()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkRichText),
      multi: true,
    },
  ],
})
export class MkRichText implements ControlValueAccessor {
  private readonly field = inject(MkFieldContext, { optional: true });
  private readonly i18n = inject(MK_I18N);

  /** Two-way HTML string value (sanitised; `''` when visually empty). */
  readonly value = model<string>('');
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('');
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Minimum height of the editable area (any CSS length). */
  readonly minHeight = input<string>('4.5em');
  /** Accessible label when not labelled by an `mk-form-field`. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });

  private readonly cvaDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly labelledBy = this.field?.labelId ?? null;
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly effectiveAriaLabel = computed(
    () => this.ariaLabel() || this.i18n.blockEditor.editableText,
  );

  /** Sanitised view of the model, rendered into the engine. */
  protected readonly safeHtml = computed(() => sanitizeInlineHtml(this.value()));

  /** User edit: sanitise, normalise the empty state, propagate. */
  protected onContentChange(html: string): void {
    const value = normalizeRichTextValue(html);
    this.value.set(value);
    this.onChange(value);
  }

  protected onFocusChange(focused: boolean): void {
    if (!focused) this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown): void {
    this.value.set(normalizeRichTextValue(value == null ? '' : String(value)));
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

/**
 * Sanitises an HTML string and collapses visually empty markup (whitespace,
 * `&nbsp;`s, lone `<br>`s and empty formatting tags) to `''`.
 */
function normalizeRichTextValue(html: string): string {
  const sanitized = sanitizeInlineHtml(html);
  const text = sanitized
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text === '' ? '' : sanitized;
}
