import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import type { MkSize } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';

/**
 * InputGroup — wraps a native `input[mkInput]` with leading / trailing affixes
 * (icons, static text, compact buttons) inside one shared control frame. The
 * group carries the border, background and focus ring; the nested input
 * detects the group and drops its own chrome, so the whole assembly reads as
 * a single field.
 *
 * Project affixes with the `mkInputPrefix` / `mkInputSuffix` attributes. Both
 * are optional; interactive suffixes (a clear or scan button) keep their own
 * focus behaviour.
 *
 * Inside an `mk-form-field` the group inherits the field's size and invalid
 * state, and the field's label association still targets the inner input.
 *
 * ```html
 * <mk-input-group>
 *   <mk-icon mkInputPrefix name="search" />
 *   <input mkInput type="search" placeholder="Search…" />
 * </mk-input-group>
 *
 * <mk-form-field label="Price">
 *   <mk-input-group>
 *     <input mkInput type="number" formControlName="price" />
 *     <span mkInputSuffix>zł</span>
 *   </mk-input-group>
 * </mk-form-field>
 * ```
 */
@Component({
  selector: 'mk-input-group',
  templateUrl: './input-group.html',
  styleUrl: './input-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-input-group',
    '[class.mk-input-group--sm]': "effectiveSize() === 'sm'",
    '[class.mk-input-group--md]': "effectiveSize() === 'md'",
    '[class.mk-input-group--lg]': "effectiveSize() === 'lg'",
    '[class.mk-input-group--invalid]': 'isInvalid()',
    '[class.mk-input-group--disabled]': 'isDisabled()',
  },
})
export class MkInputGroup {
  private readonly field = inject(MkFormField, { optional: true });

  /** Control size. Ignored when nested in an `mk-form-field` (inherits it). */
  readonly size = input<MkSize>('md');
  /** Force the invalid visual when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Visually reflect a disabled inner control. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The size the group (and its nested input) renders at. */
  readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  /** Whether the group renders the invalid frame. */
  readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || (this.field?.isDisabled() ?? false),
  );
}
