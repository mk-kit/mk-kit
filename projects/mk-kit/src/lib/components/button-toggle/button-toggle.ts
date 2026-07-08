import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MkButtonToggleGroup } from './button-toggle-group';

/**
 * A single segment inside an `mk-button-toggle-group`. Projected content is the
 * label (text, an icon, or both). Its selected state and keyboard behaviour are
 * driven by the parent group.
 *
 * ```html
 * <mk-button-toggle value="bold" aria-label="Bold"><b>B</b></mk-button-toggle>
 * ```
 */
@Component({
  selector: 'mk-button-toggle',
  templateUrl: './button-toggle.html',
  styleUrl: './button-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-button-toggle',
    '[class.mk-button-toggle--selected]': 'selected()',
    '[class.mk-button-toggle--disabled]': 'isDisabled()',
  },
})
export class MkButtonToggle {
  private readonly group = inject<MkButtonToggleGroup>(
    forwardRef(() => MkButtonToggleGroup),
    { optional: true },
  );
  private readonly btnRef = viewChild.required<ElementRef<HTMLButtonElement>>(
    'btn',
  );

  /** The value contributed to the group's selection when this item is on. */
  readonly value = input<unknown>(undefined);
  /** Disable just this item. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether this item is currently selected (owned by the parent group). */
  readonly selected = computed(() => this.group?.isSelected(this) ?? false);
  /** Disabled if the item or the whole group is disabled. */
  readonly isDisabled = computed(
    () => this.disabled() || (this.group?.isDisabled() ?? false),
  );

  /** `radio` in single-select groups; a plain toggle button in multiple mode. */
  protected readonly role = computed(() =>
    this.group && !this.group.multiple() ? 'radio' : null,
  );
  /** `aria-checked` for the radio role; `null` otherwise. */
  protected readonly ariaChecked = computed(() =>
    this.role() === 'radio' ? this.selected() : null,
  );
  /** `aria-pressed` for multiple-select toggle buttons; `null` otherwise. */
  protected readonly ariaPressed = computed(() =>
    this.group?.multiple() ? this.selected() : null,
  );
  /** Roving tabindex position within the group. */
  protected readonly tabIndex = computed(() => this.group?.tabIndexFor(this) ?? 0);

  protected onClick(): void {
    this.group?.select(this);
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.group?.onKeydown(event, this);
  }

  /** Move focus to this item's button. Called by the parent group. */
  focus(): void {
    this.btnRef().nativeElement.focus();
  }
}
