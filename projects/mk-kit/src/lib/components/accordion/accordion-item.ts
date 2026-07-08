import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  model,
} from '@angular/core';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkAccordion } from './accordion';

/**
 * A collapsible section within an `<mk-accordion>`. The header is a button that
 * toggles a smoothly animated body region wired with `aria-expanded` /
 * `aria-controls`. Open state is two-way bindable via `open`.
 *
 * ```html
 * <mk-accordion-item header="Shipping" [(open)]="shippingOpen">
 *   …body…
 * </mk-accordion-item>
 * ```
 */
@Component({
  selector: 'mk-accordion-item',
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-accordion-item',
    '[class.mk-accordion-item--open]': 'open()',
    '[class.mk-accordion-item--disabled]': 'disabled()',
  },
})
export class MkAccordionItem {
  private readonly accordion = inject(MkAccordion, { optional: true });

  /** Plain-text header (ignored when `[mkAccordionHeader]` is projected). */
  readonly header = input('');
  /** Disable toggling of this item. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Whether the item is expanded (two-way). */
  readonly open = model(false);

  /** Stable id for the trigger button. */
  readonly triggerId = mkUniqueId('mk-acc-trigger');
  /** Stable id for the panel region. */
  readonly panelId = mkUniqueId('mk-acc-panel');

  protected toggle(): void {
    if (this.disabled()) return;
    const next = !this.open();
    this.accordion?.onItemToggle(this, next);
    this.open.set(next);
  }
}
