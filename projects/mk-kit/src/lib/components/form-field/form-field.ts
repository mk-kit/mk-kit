import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';

/**
 * FormField — an accessible wrapper that provides a real `<label>`, optional
 * hint text, error text and a required indicator for any nested control
 * (`input[mkInput]`, `mk-select`, `mk-checkbox`, …).
 *
 * It generates stable ids (via `mkUniqueId`) and exposes them so nested
 * controls can wire `aria-labelledby` / `aria-describedby` / `aria-invalid`
 * automatically by injecting this component. When an `error` is present the
 * hint is hidden and the error is announced through a `role="alert"` region.
 *
 * ```html
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
    '[class.mk-form-field--required]': 'required()',
    '[class.mk-form-field--disabled]': 'disabled()',
  },
})
export class MkFormField {
  /** Visible field label. Rendered as a real `<label for>`. */
  readonly label = input<string>('');
  /** Optional helper text shown below the control (hidden while an error shows). */
  readonly hint = input<string>('');
  /** Error message; when non-empty the field is marked invalid. */
  readonly error = input<string | null>(null);
  /** Marks the field required (adds an indicator + `aria-required`). */
  readonly required = input(false, { transform: booleanAttribute });
  /** Visually reflect a disabled control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Control size; nested controls inherit it. */
  readonly size = input<MkSize>('md');

  /** Id for the nested interactive control — adopt on your control element. */
  readonly controlId = mkUniqueId('mk-field');
  /** Id of the `<label>` element (for `aria-labelledby`). */
  readonly labelId = `${this.controlId}-label`;
  /** Id of the hint element. */
  readonly hintId = `${this.controlId}-hint`;
  /** Id of the error element. */
  readonly errorId = `${this.controlId}-error`;

  /** Whether the field currently has an error. */
  readonly hasError = computed(() => !!this.error());
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
