import type { Signal } from '@angular/core';
import type { MkSize } from '../types';

/**
 * Field context — the contract a field wrapper (`mk-form-field`) exposes to
 * the control nested inside it. Controls inject it optionally
 * (`inject(MkFieldContext, { optional: true })`) to adopt the wrapper's
 * control id and to reflect its required/error state and `aria-describedby`
 * wiring — without depending on the `@mk-kit/ui/forms` entry point.
 *
 * `MkFormField` provides itself under this token; standalone usage (no
 * wrapper) simply yields `null`.
 */
export abstract class MkFieldContext {
  /** Id for the nested interactive control — adopt on your control element. */
  abstract readonly controlId: string;
  /** Id of the field's label element, for `aria-labelledby`. */
  abstract readonly labelId: string;
  /** The field's visual size, mirrored onto the nested control. */
  abstract readonly size: Signal<MkSize>;
  /** Whether the field is required (explicitly or via the bound control). */
  abstract readonly isRequired: Signal<boolean>;
  /** Whether the field currently shows an error. */
  abstract readonly hasError: Signal<boolean>;
  /**
   * Space-separated id list for the nested control's `aria-describedby`,
   * or `null` when there is nothing to describe.
   */
  abstract readonly describedBy: Signal<string | null>;
}
