import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import type { MkSize } from '../../core/types';
import { MkIcon } from '../icon/icon';

/**
 * EmptyState — a centered placeholder for "nothing here yet" situations: empty
 * tables, no search results, a fresh dashboard, a cleared inbox. Provide a
 * `title` (and usually a `description`), an `icon` or projected media, and
 * call-to-action buttons via the actions slot.
 *
 * Slots: `[mkEmptyStateMedia]` (custom illustration, overrides `icon`), default
 * content (extra body), `[mkEmptyStateActions]` (buttons).
 *
 * ```html
 * <mk-empty-state icon="search" title="No results"
 *   description="Try adjusting your filters.">
 *   <button mkButton mkEmptyStateActions variant="outline">Clear filters</button>
 * </mk-empty-state>
 * ```
 */
@Component({
  selector: 'mk-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkIcon],
  host: {
    class: 'mk-empty-state',
    '[class.mk-empty-state--sm]': "size() === 'sm'",
    '[class.mk-empty-state--lg]': "size() === 'lg'",
  },
})
export class MkEmptyState {
  /** Name of a registered icon shown above the title (ignored if media is projected). */
  readonly icon = input<string>('');
  /** Main heading, e.g. "No invoices yet". */
  readonly title = input<string>('');
  /** Supporting sentence under the title. */
  readonly description = input<string>('');
  /** Overall scale of the block. */
  readonly size = input<MkSize>('md');

  protected readonly iconSize = () =>
    this.size() === 'sm' ? 28 : this.size() === 'lg' ? 48 : 36;
}
