import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import type { MkSortDirection } from '../table/table';
import { MkSort, MkSortable } from './sort';

/**
 * Sort header — attach `mkSortHeader` to a header cell (`<th>`) inside an
 * element carrying `mkSort`. It wraps the projected header text in a real
 * `<button>` (so assistive tech hears an operable control), adds a directional
 * arrow (faint on hover, solid when active), reflects `aria-sort` on the cell,
 * and toggles the sort on click or Enter/Space.
 *
 * ```html
 * <th mkSortHeader="email" mkSortHeaderLabel="Email address">Email</th>
 * ```
 */
@Component({
  selector: '[mkSortHeader]',
  templateUrl: './sort-header.html',
  styleUrl: './sort-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-sort-header',
    '[class.mk-sort-header--active]': 'isActive()',
    '[class.mk-sort-header--disabled]': 'isDisabled()',
    '[attr.aria-sort]': 'ariaSort()',
  },
})
export class MkSortHeader implements MkSortable {
  private readonly sort = inject(MkSort);

  /** Column id this header sorts by (the `mkSortHeader` value). */
  readonly id = input('', { alias: 'mkSortHeader' });
  /** Per-header override for the initial sort direction. */
  readonly start = input<'asc' | 'desc' | undefined>(undefined, {
    alias: 'mkSortHeaderStart',
  });
  /** Disable sorting for just this header. */
  readonly disabled = input(false, {
    transform: booleanAttribute,
    alias: 'mkSortHeaderDisabled',
  });
  /** Accessible label used in sort announcements (defaults to the id). */
  readonly sortLabel = input('', { alias: 'mkSortHeaderLabel' });

  /** Disabled if this header or the whole `mkSort` is disabled. */
  readonly isDisabled = computed(() => this.disabled() || this.sort.disabled());
  /** Whether this header is the active, non-cleared sort. */
  readonly isActive = computed(() => this.sort.isActive(this.id()));
  /** Active direction, or `none` when this header is not the active sort. */
  readonly direction = computed<MkSortDirection>(() =>
    this.isActive() ? this.sort.direction() : 'none',
  );
  /** `aria-sort` value for the header cell. */
  protected readonly ariaSort = computed(() => {
    if (!this.isActive()) return 'none';
    return this.sort.direction() === 'asc' ? 'ascending' : 'descending';
  });

  protected toggle(): void {
    if (!this.isDisabled()) this.sort.sort(this);
  }
}
