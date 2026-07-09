import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { MkLiveAnnouncer } from '../../core/a11y/live-announcer.service';
import { MK_I18N } from '../../core/i18n/mk-i18n';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkCheckbox } from '../checkbox/checkbox';
import { MkTableRowDetail } from './table-row-detail';

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
  /** Allow the user to drag-resize this column (needs `resizableColumns`). */
  resizable?: boolean;
  /** Make this column's cells inline-editable (double-click / Enter). */
  editable?: boolean;
  /** Pin (freeze) this column to a side while the body scrolls horizontally. */
  pinned?: 'left' | 'right';
  /** Minimum width in px when resizing (default 60). */
  minWidth?: number;
}

/** Payload emitted by {@link MkTable.sortChange}. */
export interface MkSortChange {
  /** Column key sorted by. */
  key: string;
  /** Resulting direction (`none` when sorting was cleared). */
  direction: MkSortDirection;
}

/** Payload emitted by {@link MkTable.cellEdit} when an editable cell is saved. */
export interface MkCellEdit<T = Record<string, unknown>> {
  /** The edited row. */
  row: T;
  /** The column key that was edited. */
  key: string;
  /** The new (string) value the user entered. */
  value: string;
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
  imports: [MkCheckbox, NgTemplateOutlet],
  host: {
    class: 'mk-table',
    '[class.mk-table--sticky]': 'stickyHeader()',
    '[class.mk-table--zebra]': 'zebra()',
    '[class.mk-table--hover]': 'hover()',
    '[class.mk-table--compact]': "density() === 'compact'",
    '[class.mk-table--clickable]': 'clickableRows()',
    '[class.mk-table--selectable]': 'selectable()',
    '[class.mk-table--expandable]': 'expandable()',
  },
})
export class MkTable<T = Record<string, unknown>> {
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly i18n = inject(MK_I18N);
  private readonly document = inject(DOCUMENT);

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
  /**
   * Render a leading expander column. Each row can reveal a detail panel
   * supplied via an `<ng-template mkTableRowDetail let-row>`.
   */
  readonly expandable = input(false, { transform: booleanAttribute });
  /** Allow only one row expanded at a time (accordion). */
  readonly singleExpand = input(false, { transform: booleanAttribute });
  /** Enable drag-to-resize on columns marked `resizable` (data-grid pro). */
  readonly resizableColumns = input(false, { transform: booleanAttribute });
  /** Enable drag-to-reorder of column headers (data-grid pro). */
  readonly reorderableColumns = input(false, { transform: booleanAttribute });

  /** Emitted when the sort column/direction changes. */
  readonly sortChange = output<MkSortChange>();
  /** Emitted when a row is clicked (enable via `clickableRows`). */
  readonly rowClick = output<T>();
  /** Emitted with the new selection whenever it changes (enable via `selectable`). */
  readonly selectionChange = output<T[]>();
  /** Emitted with the currently expanded rows whenever they change. */
  readonly expandedChange = output<T[]>();
  /** Emitted when a column is resized: `{ key, width }` (px). */
  readonly columnResize = output<{ key: string; width: number }>();
  /** Emitted with the new column key order after a reorder. */
  readonly columnReorder = output<string[]>();
  /** Emitted when an inline-editable cell is saved. */
  readonly cellEdit = output<MkCellEdit<T>>();

  /** User-set column widths (px), keyed by column key. */
  private readonly colWidths = signal<Record<string, number>>({});
  /** User-set column order (keys); `null` = the input order. */
  private readonly colOrder = signal<string[] | null>(null);
  /** The cell currently being inline-edited. */
  protected readonly editing = signal<{ index: number; key: string } | null>(
    null,
  );

  /** Columns in display order, honouring any user reordering. */
  protected readonly orderedColumns = computed<MkTableColumn<T>[]>(() => {
    const cols = this.columns();
    const order = this.colOrder();
    if (!order) return cols;
    const byKey = new Map(cols.map((c) => [c.key, c]));
    const ordered = order.map((k) => byKey.get(k)).filter((c): c is MkTableColumn<T> => !!c);
    // Append any columns not present in the saved order (e.g. newly added).
    for (const c of cols) if (!order.includes(c.key)) ordered.push(c);
    return ordered;
  });

  /** The rendered width for a column, if the user resized it. */
  protected colStyleWidth(col: MkTableColumn<T>): string | null {
    const w = this.colWidths()[col.key];
    if (w != null) return `${w}px`;
    return col.width ?? null;
  }

  /** Sticky offset (px) for a pinned column, summing the pinned ones before it. */
  protected pinnedOffset(col: MkTableColumn<T>): number {
    const side = col.pinned;
    if (!side) return 0;
    const cols = this.orderedColumns().filter((c) => c.pinned === side);
    const idx = cols.indexOf(col);
    const before = side === 'left' ? cols.slice(0, idx) : cols.slice(idx + 1);
    let offset = 0;
    for (const c of before) offset += this.colWidths()[c.key] ?? this.numericWidth(c);
    // Account for the leading select / expander columns on the left.
    if (side === 'left') {
      offset += (this.selectable() ? 44 : 0) + (this.expandable() ? 44 : 0);
    }
    return offset;
  }

  private numericWidth(col: MkTableColumn<T>): number {
    const w = col.width ? parseInt(col.width, 10) : NaN;
    return Number.isFinite(w) ? w : 150;
  }

  // --- Column resize --------------------------------------------------------
  private resizeKey: string | null = null;
  private resizeStartX = 0;
  private resizeStartW = 0;
  private resizeMin = 60;

  /** Begin a drag-resize from a header handle. */
  protected startResize(event: PointerEvent, col: MkTableColumn<T>): void {
    if (!this.resizableColumns() || !col.resizable) return;
    event.preventDefault();
    event.stopPropagation();
    const th = (event.target as HTMLElement).closest('th') as HTMLElement | null;
    this.resizeKey = col.key;
    this.resizeStartX = event.clientX;
    this.resizeStartW =
      this.colWidths()[col.key] ?? th?.getBoundingClientRect().width ?? this.numericWidth(col);
    this.resizeMin = col.minWidth ?? 60;
    this.document.addEventListener('pointermove', this.onResizeMove);
    this.document.addEventListener('pointerup', this.onResizeEnd);
  }

  private readonly onResizeMove = (event: PointerEvent): void => {
    if (!this.resizeKey) return;
    const width = Math.max(
      this.resizeMin,
      Math.round(this.resizeStartW + (event.clientX - this.resizeStartX)),
    );
    this.colWidths.update((w) => ({ ...w, [this.resizeKey as string]: width }));
  };

  private readonly onResizeEnd = (): void => {
    if (this.resizeKey) {
      this.columnResize.emit({
        key: this.resizeKey,
        width: this.colWidths()[this.resizeKey],
      });
    }
    this.resizeKey = null;
    this.document.removeEventListener('pointermove', this.onResizeMove);
    this.document.removeEventListener('pointerup', this.onResizeEnd);
  };

  // --- Column reorder (native drag) -----------------------------------------
  protected readonly dragKey = signal<string | null>(null);

  protected onColDragStart(event: DragEvent, col: MkTableColumn<T>): void {
    if (!this.reorderableColumns()) return;
    this.dragKey.set(col.key);
    event.dataTransfer?.setData('text/plain', col.key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected onColDragOver(event: DragEvent): void {
    if (this.reorderableColumns() && this.dragKey()) event.preventDefault();
  }

  protected onColDrop(event: DragEvent, target: MkTableColumn<T>): void {
    const from = this.dragKey();
    this.dragKey.set(null);
    if (!from || from === target.key) return;
    event.preventDefault();
    const order = this.orderedColumns().map((c) => c.key);
    const fromIdx = order.indexOf(from);
    const toIdx = order.indexOf(target.key);
    if (fromIdx < 0 || toIdx < 0) return;
    order.splice(toIdx, 0, order.splice(fromIdx, 1)[0]);
    this.colOrder.set(order);
    this.columnReorder.emit(order);
  }

  protected onColDragEnd(): void {
    this.dragKey.set(null);
  }

  // --- Inline cell edit -----------------------------------------------------
  protected isEditing(index: number, col: MkTableColumn<T>): boolean {
    const e = this.editing();
    return !!e && e.index === index && e.key === col.key;
  }

  protected startEdit(index: number, col: MkTableColumn<T>, event?: Event): void {
    if (!col.editable) return;
    event?.stopPropagation();
    this.editing.set({ index, key: col.key });
  }

  protected commitEdit(row: T, col: MkTableColumn<T>, value: string): void {
    this.editing.set(null);
    this.cellEdit.emit({ row, key: col.key, value });
  }

  protected cancelEdit(): void {
    this.editing.set(null);
  }

  protected onEditKeydown(
    event: KeyboardEvent,
    row: T,
    col: MkTableColumn<T>,
  ): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitEdit(row, col, (event.target as HTMLInputElement).value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  /** The projected row-detail template (enable via `expandable`). */
  protected readonly rowDetail = contentChild(MkTableRowDetail);

  private readonly sortKey = signal<string | null>(null);
  private readonly sortDir = signal<Exclude<MkSortDirection, 'none'> | null>(
    null,
  );
  /** Stable id prefix so each detail row can be referenced by aria-controls. */
  private readonly detailIdBase = mkUniqueId('mk-table-detail');

  /** Total rendered columns, including the select and expander columns. */
  protected readonly totalColumns = computed(
    () =>
      this.columns().length +
      (this.selectable() ? 1 : 0) +
      (this.expandable() ? 1 : 0),
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

  // --- Expansion ------------------------------------------------------------
  private readonly expandedKeys = signal<Set<unknown>>(new Set());

  /** Whether `row`'s detail panel is currently expanded. */
  protected isExpanded(row: T): boolean {
    return this.expandedKeys().has(this.rowKey(row));
  }

  /** The DOM id of a row's detail panel (for `aria-controls`). */
  protected detailId(index: number): string {
    return `${this.detailIdBase}-${index}`;
  }

  /** Toggle a row's detail panel, honouring `singleExpand`. */
  protected toggleExpand(row: T, event?: Event): void {
    event?.stopPropagation();
    const rk = this.rowKey(row);
    const open = this.expandedKeys().has(rk);
    const next = this.singleExpand() ? new Set<unknown>() : new Set(this.expandedKeys());
    if (open) next.delete(rk);
    else next.add(rk);
    this.expandedKeys.set(next);
    this.expandedChange.emit(
      this.data().filter((r) => next.has(this.rowKey(r))),
    );
  }
}
