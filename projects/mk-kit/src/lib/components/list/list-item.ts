import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

/**
 * List item — a row inside {@link MkList}. Project leading/trailing adornments
 * with the `mkListLeading` / `mkListTrailing` attributes. Set `interactive`
 * to make the row focusable and clickable (Enter/Space activate it).
 *
 * ```html
 * <mk-list-item interactive [selected]="active()" (activated)="pick()">
 *   <mk-avatar mkListLeading name="Ada" />
 *   Ada Lovelace
 *   <mk-badge mkListTrailing tone="success">New</mk-badge>
 * </mk-list-item>
 * ```
 */
@Component({
  selector: 'mk-list-item',
  templateUrl: './list-item.html',
  styleUrl: './list-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-list-item',
    role: 'listitem',
    '[class.mk-list-item--interactive]': 'interactive()',
    '[class.mk-list-item--selected]': 'selected()',
    '[class.mk-list-item--disabled]': 'disabled()',
    '[attr.tabindex]': 'interactive() && !disabled() ? 0 : null',
    '[attr.aria-selected]': 'interactive() ? selected() : null',
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkListItem {
  /** Make the row focusable/clickable with hover + keyboard activation. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Highlight the row as the current selection. */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Disable interaction and dim the row. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emitted on click / Enter / Space when `interactive`. */
  readonly activated = output<void>();

  protected onClick(): void {
    if (this.disabled() || !this.interactive()) return;
    this.activated.emit();
  }

  protected onKeydown(event: Event): void {
    if (this.disabled() || !this.interactive()) return;
    const key = (event as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.activated.emit();
    }
  }
}
