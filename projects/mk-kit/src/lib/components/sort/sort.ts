import {
  Directive,
  booleanAttribute,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { MkLiveAnnouncer } from '../../core/a11y/live-announcer.service';
import type { MkSortDirection } from '../table/table';

/** Current sort state emitted by {@link MkSort.mkSortChange}. */
export interface MkSortState {
  /** Id of the column being sorted by (empty when cleared). */
  active: string;
  /** Sort direction (`none` when cleared). */
  direction: MkSortDirection;
}

/**
 * The minimal shape {@link MkSort} needs from a header. Implemented by
 * {@link MkSortHeader}; declared separately so the coordinator does not depend
 * on the header's concrete type (avoids a circular import).
 */
export interface MkSortable {
  id(): string;
  start(): 'asc' | 'desc' | undefined;
  disabled(): boolean;
  sortLabel(): string;
}

/**
 * Sort coordinator — apply `mkSort` to a table (or any container) to track
 * which column is sorted and in which direction. It holds no data: register
 * headers with `mkSortHeader`, then re-sort your rows in the
 * `(mkSortChange)` handler. Mirrors the Angular Material `matSort` model but
 * signal-based.
 *
 * Clicking a header cycles asc → desc → unsorted (set `mkSortDisableClear` to
 * cycle asc ↔ desc only). `mkSortStart` flips the initial direction.
 *
 * ```html
 * <table mkSort mkSortActive="name" mkSortDirection="asc"
 *        (mkSortChange)="sortData($event)">
 *   <thead><tr>
 *     <th mkSortHeader="name">Name</th>
 *     <th mkSortHeader="size" mkSortHeaderStart="desc">Size</th>
 *   </tr></thead>
 *   …
 * </table>
 * ```
 */
@Directive({
  selector: '[mkSort]',
  exportAs: 'mkSort',
})
export class MkSort {
  private readonly announcer = inject(MkLiveAnnouncer);

  /** Id of the currently sorted column (two-way; empty when unsorted). */
  readonly active = model<string>('', { alias: 'mkSortActive' });
  /** Current sort direction (two-way). */
  readonly direction = model<MkSortDirection>('none', {
    alias: 'mkSortDirection',
  });
  /** Direction the first click on a header applies. Default `asc`. */
  readonly start = input<'asc' | 'desc'>('asc', { alias: 'mkSortStart' });
  /** Disable sorting for every header. */
  readonly disabled = input(false, {
    transform: booleanAttribute,
    alias: 'mkSortDisabled',
  });
  /** Remove the "unsorted" step so headers cycle asc ↔ desc only. */
  readonly disableClear = input(false, {
    transform: booleanAttribute,
    alias: 'mkSortDisableClear',
  });

  /** Emits the new sort state whenever a header is activated. */
  readonly sortChange = output<MkSortState>({ alias: 'mkSortChange' });

  /** Advance the sort state for the given header (called on click/keyboard). */
  sort(header: MkSortable): void {
    if (this.disabled() || header.disabled()) return;
    const id = header.id();
    if (this.active() !== id) {
      this.active.set(id);
      this.direction.set(this.startFor(header));
    } else {
      const next = this.nextDirection(header, this.direction());
      this.direction.set(next);
      if (next === 'none') this.active.set('');
    }
    const state: MkSortState = {
      active: this.active(),
      direction: this.direction(),
    };
    this.sortChange.emit(state);
    this.announce(header, state.direction);
  }

  /** Whether the given column id is the active, non-cleared sort. */
  isActive(id: string): boolean {
    return this.active() === id && this.direction() !== 'none';
  }

  private startFor(header: MkSortable): MkSortDirection {
    return header.start() ?? this.start();
  }

  private nextDirection(
    header: MkSortable,
    current: MkSortDirection,
  ): MkSortDirection {
    const order: MkSortDirection[] =
      this.startFor(header) === 'desc' ? ['desc', 'asc'] : ['asc', 'desc'];
    if (!this.disableClear()) order.push('none');
    const index = order.indexOf(current);
    return order[(index + 1) % order.length];
  }

  private announce(header: MkSortable, direction: MkSortDirection): void {
    const label = header.sortLabel() || header.id();
    const message =
      direction === 'none'
        ? `${label} unsorted`
        : `Sorted by ${label} ${direction === 'asc' ? 'ascending' : 'descending'}`;
    this.announcer.announce(message, 'polite');
  }
}
