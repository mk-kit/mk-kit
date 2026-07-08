import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import type { MkAccordionItem } from './accordion-item';

/**
 * Groups `<mk-accordion-item>`s. By default only one item can be open at a
 * time (single-open); set `multi` to allow several. Coordinates its children
 * through their two-way `open` models.
 *
 * ```html
 * <mk-accordion [multi]="false">
 *   <mk-accordion-item header="One">…</mk-accordion-item>
 *   <mk-accordion-item header="Two">…</mk-accordion-item>
 * </mk-accordion>
 * ```
 */
@Component({
  selector: 'mk-accordion',
  templateUrl: './accordion.html',
  styleUrl: './accordion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-accordion',
  },
})
export class MkAccordion {
  /** Allow multiple items open simultaneously. */
  readonly multi = input(false, { transform: booleanAttribute });

  /** Registered items collapse siblings on open in single mode. */
  private readonly items = new Set<MkAccordionItem>();

  /** Called by an item just before its open state changes. */
  onItemToggle(source: MkAccordionItem, opening: boolean): void {
    this.items.add(source);
    if (opening && !this.multi()) {
      for (const item of this.items) {
        if (item !== source && item.open()) item.open.set(false);
      }
    }
  }
}
