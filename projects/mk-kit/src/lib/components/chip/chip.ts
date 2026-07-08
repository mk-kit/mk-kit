import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  model,
  output,
} from '@angular/core';
import type { MkSize, MkTone } from '../../core/types';

/** Visual treatment for a {@link MkChip}. */
export type MkChipVariant = 'solid' | 'soft' | 'outline';

/**
 * Chip — an interactive, optionally removable/selectable token. Use it for
 * filters, active selections or editable input tokens. For a purely decorative
 * label use {@link MkTag} instead.
 *
 * ```html
 * <mk-chip removable (removed)="drop(item)">{{ item.name }}</mk-chip>
 * <mk-chip selectable [(selected)]="active" tone="primary">Filter</mk-chip>
 * ```
 */
@Component({
  selector: 'mk-chip',
  templateUrl: './chip.html',
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-chip',
    '[class.mk-chip--sm]': "size() === 'sm'",
    '[class.mk-chip--md]': "size() === 'md'",
    '[class.mk-chip--lg]': "size() === 'lg'",
    '[class.mk-chip--solid]': "variant() === 'solid'",
    '[class.mk-chip--soft]': "variant() === 'soft'",
    '[class.mk-chip--outline]': "variant() === 'outline'",
    '[class.mk-chip--selectable]': 'selectable()',
    '[class.mk-chip--selected]': 'selectable() && selected()',
    '[class.mk-chip--disabled]': 'disabled()',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': "selectable() ? 'button' : null",
    '[attr.tabindex]': 'hostTabindex()',
    '[attr.aria-pressed]': 'selectable() ? selected() : null',
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkChip {
  /** Semantic color tone. */
  readonly tone = input<MkTone>('neutral');
  /** Visual treatment. */
  readonly variant = input<MkChipVariant>('soft');
  /** Size scale. */
  readonly size = input<MkSize>('md');
  /** Make the chip toggle a selected state on click / Enter / Space. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Show a trailing remove button and enable Delete/Backspace removal. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Disable all interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible label for the remove button. */
  readonly removeLabel = input('Remove');

  /** Two-way selected state (only meaningful when `selectable`). */
  readonly selected = model(false);
  /** Emitted when the chip is removed via the button or Delete/Backspace. */
  readonly removed = output<void>();

  protected hostTabindex(): number | null {
    return this.selectable() && !this.disabled() ? 0 : null;
  }

  protected onClick(): void {
    if (this.disabled()) return;
    if (this.selectable()) this.selected.set(!this.selected());
  }

  protected onKeydown(event: Event): void {
    if (this.disabled()) return;
    const key = (event as KeyboardEvent).key;
    if (this.selectable() && (key === 'Enter' || key === ' ')) {
      event.preventDefault();
      this.selected.set(!this.selected());
    } else if (this.removable() && (key === 'Delete' || key === 'Backspace')) {
      event.preventDefault();
      this.remove();
    }
  }

  protected onRemoveClick(event: Event): void {
    event.stopPropagation();
    this.remove();
  }

  private remove(): void {
    if (this.disabled()) return;
    this.removed.emit();
  }
}
