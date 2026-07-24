import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import type { MkSize } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';
import { MkInputGroup } from '../input-group/input-group';

/**
 * Input — enhances a native `<input>` or `<textarea>` with mk-kit theming and
 * a11y wiring. It is an attribute-selector component so all native semantics,
 * keyboard behaviour and form integration (`ngModel`, reactive forms) come for
 * free; this only layers on tokenised styling and aria state.
 *
 * When placed inside an `mk-form-field` it automatically adopts the field's
 * control id (so the `<label for>` associates), `aria-describedby`,
 * `aria-invalid` and `aria-required`.
 *
 * ```html
 * <input mkInput type="email" placeholder="you@example.com" />
 * <textarea mkInput rows="4" [invalid]="true"></textarea>
 * ```
 */
@Component({
  selector: 'input[mkInput], textarea[mkInput]',
  templateUrl: './input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-input',
    '[class.mk-input--sm]': "effectiveSize() === 'sm'",
    '[class.mk-input--md]': "effectiveSize() === 'md'",
    '[class.mk-input--lg]': "effectiveSize() === 'lg'",
    '[class.mk-input--invalid]': 'isInvalid()',
    '[class.mk-input--grouped]': 'inGroup',
    '[attr.id]': 'resolvedId()',
    '[attr.aria-invalid]': 'isInvalid() || null',
    '[attr.aria-required]': 'isRequired() || null',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class MkInput {
  private readonly field = inject(MkFormField, { optional: true });
  private readonly group = inject(MkInputGroup, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly initialId = this.host.nativeElement.getAttribute('id');

  /** Whether this input sits inside an `mk-input-group` (the group then owns the frame). */
  protected readonly inGroup = !!this.group;

  /** Control size. Ignored when nested in an `mk-form-field` (inherits it). */
  readonly size = input<MkSize>('md');
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field
      ? this.field.size()
      : (this.group?.effectiveSize() ?? this.size()),
  );
  protected readonly isInvalid = computed(
    () =>
      this.invalid() ||
      (this.field?.hasError() ?? false) ||
      (this.group?.isInvalid() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly resolvedId = computed(
    () => this.field?.controlId ?? this.initialId,
  );
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
}
