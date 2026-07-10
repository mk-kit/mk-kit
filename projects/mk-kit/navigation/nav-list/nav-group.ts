import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MkNavList } from './nav-list';

/**
 * A titled section within an `<mk-nav-list>` — the "MAIN" / "SETTINGS" groupings
 * common in admin/CMS sidebars. Static by default; set `collapsible` to make
 * the label a toggle that expands/collapses its items (`aria-expanded` +
 * region). In a collapsed icon rail the label becomes a divider.
 *
 * ```html
 * <mk-nav-list>
 *   <mk-nav-group label="Main">
 *     <mk-nav-item label="Dashboard" href="/" />
 *   </mk-nav-group>
 *   <mk-nav-group label="Settings" collapsible>
 *     <mk-nav-item label="Team" href="/team" />
 *   </mk-nav-group>
 * </mk-nav-list>
 * ```
 */
@Component({
  selector: 'mk-nav-group',
  templateUrl: './nav-group.html',
  styleUrl: './nav-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-nav-group',
    role: 'group',
    '[attr.aria-label]': 'label() || null',
    '[class.mk-nav-group--collapsed-rail]': 'railCollapsed()',
    '[class.mk-nav-group--closed]': 'collapsible() && !expanded()',
  },
})
export class MkNavGroup {
  private readonly list = inject(MkNavList, { optional: true });

  /** Section title. */
  readonly label = input('');
  /** Make the label a toggle that shows/hides the items. */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Whether the section is expanded (two-way; only meaningful when collapsible). */
  readonly expanded = model(true);

  /** Id of the items region (for `aria-controls`). */
  readonly regionId = mkUniqueId('mk-nav-group');

  /** Whether the enclosing list is a collapsed icon rail. */
  protected readonly railCollapsed = computed(
    () => this.list?.collapsed() ?? false,
  );
  /** Items are visible unless collapsible-and-closed. */
  protected readonly itemsVisible = computed(
    () => !this.collapsible() || this.expanded(),
  );

  protected toggle(): void {
    if (this.collapsible()) this.expanded.update((v) => !v);
  }
}
