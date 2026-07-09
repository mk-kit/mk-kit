import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { MkLiveAnnouncer } from '../../core/a11y/live-announcer.service';
import { MK_I18N } from '../../core/i18n/mk-i18n';
import { MkCheckbox } from '../checkbox/checkbox';

/** Horizontal text alignment for a table column. */
export type MkTableAlign = 'start' | 'center' | 'end';
/** Sort direction; `none` means unsorted. */
export type MkSortDirection = 'asc' | 'desc' | 'none';
/** Row vertical density. */
export type MkTableDensity = 'comfortable' | 'compact';

/** Column definition for {@link MkTable}. */
export interface MkTableColumn<T = Record<string, unknown>> {
  /** Property key on each row object supplying the cell value. */
  key: string;
  /** Visible column header text. */
  header: string;
  /** Allow sorting by this column. */
  sortable?: boolean;
  /** Cell/header alignment (default `start`). */
  align?: MkTableAlign;
  /** Fixed column width (any CSS length). */
  width?: string;
  /** Optional formatter turning the raw value into display text. */
  format?: (value: unknown, row: T) => string;
}

/** Payload emitted by {@link MkTable.sortChange}. */
export interface MkSortChange {
  /** Column key sorted by. */
  key: string;
  /** Resulting direction (`none` when sorting was cleared). */
  direction: MkSortDirection;
}

/**
 * Table — a themed data table built on a native `<table>` for accessibility.
 * Supply `columns` and `data`; opt into sortable columns, sticky header,
 * zebra striping, hover and density. Sorting is fully keyboard operable
 * (Enter/Space on a header) and announces changes via {@link MkLiveAnnouncer}.
 *
 * ```html
 * <mk-table
 *   [columns]="columns"
 *   [data]="rows()"
 *   stickyHeader
 *   zebra
 *   (sortChange)="onSort($event)"
 *   (rowClick)="open($event)" />
 * ```
 */
@Component({
  selector: 'mk-table',
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCheckbox],
  host: {
    class: 'mk-table',
    '[class.mk-table--sticky]': 'stickyHeader()',
    '[class.mk-table--zebra]': 'zebra()',
    '[class.mk-table--hover]': 'hover()',
    '[class.mk-table--compact]': "density() === 'compact'",
    '[class.mk-table--clickable]': 'clickableRows()',
    '[class.mk-table--selectable]': 'selectable()',
  },
})
export class MkTable<T = Record<string, unknown>> {
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly i18n = inject(MK_I18N);

  /** Column definitions (order = display order). */
  readonly columns = input.required<MkTableColumn<T>[]>();
  /** Row objects to render. */
  readonly data = input<T[]>([]);
  /** Pin the header to the top of the scroll container. */
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  /** Alternate row background for readability. */
  readonly zebra = input(false, { transform: booleanAttribute });
  /** Highlight rows on hover. */
  readonly hover = input(true, { transform: booleanAttribute });
  /** Row density. */
  readonly density = input<MkTableDensity>('comfortable');
  /** Style rows as clickable and emit `rowClick`. */
  readonly clickableRows = input(false, { transform: booleanAttribute });
  /** Message shown when there are no rows. */
  readonly emptyMessage = input(this.i18n.noData);
  /** Render a leading checkbox column for row selection. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /**
   * Two-way bound array of selected rows. Use `[(selected)]` to bind, or read
   * `selectionChange`. Rows are compared by {@link trackKey} when set, else by
   * referential identity.
   */
  readonly selected = model<T[]>([]);
  /**
   * Property name identifying a row for selection equality. When omitted rows
   * are matched by reference.
   */
  readonly trackKey = input<string>();

  /** Emitted when the sort column/direction changes. */
  readonly sortChange = output<MkSortChange>();
  /** Emitted when a row is clicked (enable via `clickableRows`). */
  readonly rowClick = output<T>();
  /** Emitted with the new selection whenever it changes (enable via `selectable`). */
  readonly selectionChange = output<T[]>();

  private readonly sortKey = signal<string | null>(null);
  private readonly sortDir = signal<Exclude<MkSortDirection, 'none'> | null>(
    null,
  );

  /** Data sorted by the active column, or the input order when unsorted. */
  protected readonly sortedData = computed<T[]>(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const rows = this.data();
    if (!key || !dir) return rows;
    const sorted = [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[key];
      const bv = (b as Record<string, unknown>)[key];
      if (av == null && bv == null) return 0;
      if (av == null) return -1;
      if (bv == null) return 1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return dir === 'desc' ? sorted.reverse() : sorted;
  });

  /** `aria-sort` value for a header cell. */
  protected ariaSort(col: MkTableColumn<T>): string | null {
    if (!col.sortable) return null;
    if (this.sortKey() !== col.key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  /** Glyph indicating a column's sort state. */
  protected sortGlyph(col: MkTableColumn<T>): string {
    if (this.sortKey() !== col.key) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  /** Rendered text for a cell, applying the column formatter if present. */
  protected cellText(row: T, col: MkTableColumn<T>): string {
    const raw = (row as Record<string, unknown>)[col.key];
    if (col.format) return col.format(raw, row);
    return raw == null ? '' : String(raw);
  }

  protected onSort(col: MkTableColumn<T>): void {
    if (!col.sortable) return;
    let direction: MkSortDirection;
    if (this.sortKey() !== col.key) {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
      direction = 'asc';
    } else if (this.sortDir() === 'asc') {
      this.sortDir.set('desc');
      direction = 'desc';
    } else {
      // desc -> cleared
      this.sortKey.set(null);
      this.sortDir.set(null);
      direction = 'none';
    }
    this.sortChange.emit({ key: col.key, direction });
    this.announcer.announce(
      direction === 'none'
        ? `${col.header} unsorted`
        : `Sorted by ${col.header}, ${
            direction === 'asc' ? 'ascending' : 'descending'
          }`,
    );
  }

  protected onHeaderKeydown(event: Event, col: MkTableColumn<T>): void {
    if (!col.sortable) return;
    const key = (event as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.onSort(col);
    }
  }

  protected onRowClick(row: T): void {
    if (this.clickableRows()) this.rowClick.emit(row);
  }

  // --- Selection ------------------------------------------------------------
  private rowKey(row: T): unknown {
    const key = this.trackKey();
    return key ? (row as Record<string, unknown>)[key] : row;
  }

  /** Whether `row` is currently selected. */
  protected isSelected(row: T): boolean {
    const rk = this.rowKey(row);
    return this.selected().some((r) => this.rowKey(r) === rk);
  }

  /** True when every visible row is selected. */
  protected readonly allSelected = computed<boolean>(() => {
    const rows = this.sortedData();
    return rows.length > 0 && rows.every((row) => this.isSelected(row));
  });

  /** True when some — but not all — visible rows are selected. */
  protected readonly someSelected = computed<boolean>(
    () => this.sortedData().some((row) => this.isSelected(row)) && !this.allSelected(),
  );

  private commitSelection(next: T[]): void {
    this.selected.set(next);
    this.selectionChange.emit(next);
  }

  /** Toggle a single row's selection without triggering `rowClick`. */
  protected toggleRow(row: T): void {
    const rk = this.rowKey(row);
    const current = this.selected();
    const next = current.some((r) => this.rowKey(r) === rk)
      ? current.filter((r) => this.rowKey(r) !== rk)
      : [...current, row];
    this.commitSelection(next);
  }

  /** Select or deselect all visible rows. */
  protected toggleAll(): void {
    const rows = this.sortedData();
    const current = this.selected();
    if (this.allSelected()) {
      const visible = new Set(rows.map((r) => this.rowKey(r)));
      this.commitSelection(current.filter((r) => !visible.has(this.rowKey(r))));
    } else {
      const has = new Set(current.map((r) => this.rowKey(r)));
      this.commitSelection([
        ...current,
        ...rows.filter((r) => !has.has(this.rowKey(r))),
      ]);
    }
  }
}
