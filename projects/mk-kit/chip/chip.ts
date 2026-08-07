import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { MK_I18N, mkUniqueId } from '@mkornas/ui/core';
import type { MkSize, MkTone } from '@mkornas/ui/core';

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
  protected readonly i18n = inject(MK_I18N);

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
  readonly removeLabel = input(this.i18n.remove);

  /** Id of the projected content, so the remove button's name can include it. */
  protected readonly contentId = mkUniqueId('mk-chip-content');
  /** Id of the sr-only "Remove" text inside the remove button. */
  protected readonly removeTextId = mkUniqueId('mk-chip-remove');
  /**
   * A consumer-supplied `removeLabel`, or `null` when it is still the i18n
   * default. With the default the button is named via `aria-labelledby`
   * ("Remove <chip text>") so N chips don't get N identical names;
   * `aria-labelledby` would beat `aria-label` in the accname algorithm, so the
   * two bindings are branched rather than stacked.
   */
  protected readonly customRemoveLabel = computed(() => {
    const label = this.removeLabel();
    return label === this.i18n.remove ? null : label;
  });

  /** Two-way selected state (only meaningful when `selectable`). */
  readonly selected = model(false);
  /** Emitted when the chip is removed via the button or Delete/Backspace. */
  readonly removed = output<void>();

  protected hostTabindex(): number | null {
    // Removable chips advertise Delete/Backspace removal, so they must be
    // focusable even when they are not selectable.
    return (this.selectable() || this.removable()) && !this.disabled()
      ? 0
      : null;
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
