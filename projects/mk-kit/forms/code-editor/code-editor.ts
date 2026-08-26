import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MkFormField } from '../form-field/form-field';
import { mkHighlight, type MkCodeLanguage } from '@mk-kit/ui/core';

export type { MkCodeLanguage } from '@mk-kit/ui/core';

/** The validity of the editor's current content. */
export interface MkCodeValidity {
  valid: boolean;
  /** Parser error message, or `null` when valid / not validated. */
  error: string | null;
}

/**
 * How long (ms) after the last keystroke the expensive derivations (highlight
 * re-render, JSON validation) wait before recomputing. The textarea text itself
 * is always live — only the overlay/validation lag, invisibly, while typing.
 */
const MK_CODE_EDITOR_DEBOUNCE_MS = 180;

/**
 * CodeEditor — a lightweight, dependency-free code field with syntax
 * highlighting, JSON validation and pretty-printing. A `<textarea>` provides
 * editing and a synced highlight layer sits behind it, so it stays fully
 * accessible (real textarea semantics, `aria-invalid`, form-field wiring)
 * without pulling in a heavyweight editor.
 *
 * With `language="json"` it validates on every change (exposing an inline error
 * + `(validate)` output) and offers `format()` to pretty-print. Ideal for a CMS
 * `json` field or plugin/settings JSONB editing.
 *
 * Keyboard: Tab inserts `tabSize` spaces; press Escape then Tab to move focus
 * out (so it is never a keyboard trap). Implements `ControlValueAccessor` over a
 * string value with a two-way `value` model.
 *
 * ```html
 * <mk-code-editor #editor language="json" [(value)]="config" [rows]="10" />
 * <button mkButton (click)="editor.format()">Format</button>
 * ```
 */
@Component({
  selector: 'mk-code-editor',
  exportAs: 'mkCodeEditor',
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-code-editor',
    '[class.mk-code-editor--sm]': "effectiveSize() === 'sm'",
    '[class.mk-code-editor--md]': "effectiveSize() === 'md'",
    '[class.mk-code-editor--lg]': "effectiveSize() === 'lg'",
    '[class.mk-code-editor--invalid]': 'isInvalid()',
    '[class.mk-code-editor--disabled]': 'isDisabled()',
    '[class.mk-code-editor--wrap]': 'wrap()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkCodeEditor),
      multi: true,
    },
  ],
})
export class MkCodeEditor implements ControlValueAccessor, OnDestroy {
  private readonly field = inject(MkFormField, { optional: true });
  private readonly textareaRef =
    viewChild<ElementRef<HTMLTextAreaElement>>('textarea');
  private readonly highlightRef = viewChild<ElementRef<HTMLElement>>('highlight');
  private readonly gutterRef = viewChild<ElementRef<HTMLElement>>('gutter');

  /** Language for highlighting + validation. */
  readonly language = input<MkCodeLanguage>('plaintext');
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('');
  /** Render read-only (still focusable/selectable). */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force invalid styling when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Visible rows (minimum height). */
  readonly rows = input(8, { transform: numberAttribute });
  /** Show a line-number gutter. */
  readonly lineNumbers = input(true, { transform: booleanAttribute });
  /** Number of spaces inserted by Tab. */
  readonly tabSize = input(2, { transform: numberAttribute });
  /** Soft-wrap long lines instead of scrolling horizontally. */
  readonly wrap = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Accessible label when used standalone (no form field). */
  readonly ariaLabel = input<string>('');

  /** Two-way editor content. */
  readonly value = model<string>('');

  /** Emits the content validity whenever it changes (JSON only). */
  readonly validate = output<MkCodeValidity>();

  private readonly cvaDisabled = signal(false);
  /**
   * Debounced mirror of `value` that the expensive derivations (highlight,
   * JSON validation) read. Typing schedules a trailing update; programmatic
   * writes (`writeValue`, `format()`, `[(value)]` at rest) flush synchronously
   * so the overlay never lags when the user is not typing.
   */
  private readonly debouncedValue = signal('');
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Set true by Escape so the next Tab moves focus instead of indenting. */
  private escapeArmed = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  readonly editorId = this.field?.controlId ?? mkUniqueId('mk-code-editor');
  readonly errorId = `${this.editorId}-json-error`;

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** Parse error for JSON content, or `null` when valid / empty / plaintext. */
  protected readonly jsonError = computed<string | null>(() => {
    if (this.language() !== 'json') return null;
    const text = this.debouncedValue().trim();
    if (!text) return null;
    try {
      JSON.parse(text);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Invalid JSON';
    }
  });

  protected readonly isInvalid = computed(
    () =>
      this.invalid() || (this.field?.hasError() ?? false) || !!this.jsonError(),
  );

  /** `aria-describedby` merging the field's ids with the JSON error id. */
  protected readonly ariaDescribedBy = computed(() => {
    const ids: string[] = [];
    const fieldIds = this.describedBy();
    if (fieldIds) ids.push(fieldIds);
    if (this.jsonError()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  /**
   * Highlighted HTML for the layer behind the textarea. Reads the debounced
   * value: while typing the (transparent-text) textarea sits above the overlay,
   * so a briefly stale highlight is invisible; at rest both are identical.
   */
  protected readonly highlightedHtml = computed(() =>
    mkHighlight(this.debouncedValue(), this.language()),
  );

  /** Cache so `lines()` returns the same array while the count is unchanged. */
  private cachedLines: number[] = [1];

  /**
   * Line numbers to render in the gutter. Counts newlines in the LIVE value
   * (cheap single scan, no `split()` allocation) so the gutter never lags the
   * textarea, and returns a cached array while the count is unchanged so the
   * `@for` never re-diffs on same-line edits.
   */
  protected readonly lines = computed(() => {
    const text = this.value();
    let count = 1;
    for (let i = text.indexOf('\n'); i !== -1; i = text.indexOf('\n', i + 1)) {
      count++;
    }
    if (count !== this.cachedLines.length) {
      this.cachedLines = Array.from({ length: count }, (_, i) => i + 1);
    }
    return this.cachedLines;
  });

  constructor() {
    // Keep the debounced mirror in sync for value changes that do not come
    // from typing (e.g. the `[(value)]` binding written by the parent). Typing
    // schedules its own trailing timer in `onInput`, so while one is pending
    // the timer callback is left to settle on the latest value.
    effect(() => {
      const text = this.value();
      if (this.debounceTimer === null) {
        untracked(() => this.debouncedValue.set(text));
      }
    });

    // Surface validity changes for JSON.
    effect(() => {
      const error = this.jsonError();
      // Read language so plaintext still resets validity once.
      this.language();
      this.validate.emit({ valid: !error, error });
    });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /** Trailing-edge debounce for the expensive derivations while typing. */
  private scheduleDerivations(): void {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.debouncedValue.set(this.value());
    }, MK_CODE_EDITOR_DEBOUNCE_MS);
  }

  /** Cancels any pending debounce and syncs the derivations immediately. */
  private flushDerivations(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.debouncedValue.set(this.value());
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.value.set(text);
    this.onChange(text);
    this.scheduleDerivations();
  }

  protected onBlur(): void {
    this.onTouched();
  }

  /** Keep the highlight layer + gutter aligned with the textarea scroll. */
  protected onScroll(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    const hl = this.highlightRef()?.nativeElement;
    if (hl) {
      hl.scrollTop = ta.scrollTop;
      hl.scrollLeft = ta.scrollLeft;
    }
    const gutter = this.gutterRef()?.nativeElement;
    if (gutter) gutter.scrollTop = ta.scrollTop;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Arm the keyboard-trap escape hatch (do not swallow the event).
      this.escapeArmed = true;
      return;
    }
    if (event.key === 'Tab') {
      if (this.escapeArmed) {
        // Let focus move out of the editor.
        this.escapeArmed = false;
        return;
      }
      if (this.readOnly() || this.isDisabled()) return;
      event.preventDefault();
      this.insertText(' '.repeat(Math.max(1, this.tabSize())));
      return;
    }
    this.escapeArmed = false;
  }

  /** Insert text at the caret, preserving undo history where supported. */
  private insertText(text: string): void {
    const ta = this.textareaRef()?.nativeElement;
    if (!ta) return;
    // execCommand keeps the caret + native undo stack and fires `input`.
    ta.focus();
    const inserted =
      typeof document.execCommand === 'function' &&
      document.execCommand('insertText', false, text);
    if (!inserted) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = ta.value.slice(0, start) + text + ta.value.slice(end);
      ta.value = next;
      ta.selectionStart = ta.selectionEnd = start + text.length;
      this.value.set(next);
      this.onChange(next);
      this.scheduleDerivations();
    }
  }

  // --- Public API (via exportAs) --------------------------------------------

  /** The parsed JSON value, or `undefined` when empty / invalid / plaintext. */
  parsed(): unknown {
    if (this.language() !== 'json') return undefined;
    const text = this.value().trim();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  /** Pretty-print valid JSON with `tabSize` indentation. No-op otherwise. */
  format(): void {
    if (this.language() !== 'json') return;
    const text = this.value().trim();
    if (!text) return;
    try {
      const formatted = JSON.stringify(JSON.parse(text), null, this.tabSize());
      if (formatted !== this.value()) {
        this.value.set(formatted);
        this.onChange(formatted);
        this.flushDerivations();
      }
    } catch {
      // Leave invalid JSON untouched.
    }
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    // Programmatic writes must never show a stale overlay / validation.
    this.flushDerivations();
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
