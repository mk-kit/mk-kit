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
import { MkLiveAnnouncer } from '@mkornas/ui/core';
import { MK_I18N } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MkCheckbox } from '@mkornas/ui/forms';
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

/** Payload emitted by {@link MkTable.columnResize} after a column resize. */
export interface MkColumnResize {
  /** The resized column's key. */
  key: string;
  /** The new width in pixels. */
  width: number;
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
  protected readonly i18n = inject(MK_I18N);
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
  /** Emitted when a column is resized (px). */
  readonly columnResize = output<MkColumnResize>();
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
    const seen = new Set(order);
    for (const c of cols) if (!seen.has(c.key)) ordered.push(c);
    return ordered;
  });

  /** The rendered width for a column, if the user resized it. */
  protected colStyleWidth(col: MkTableColumn<T>): string | null {
    const w = this.colWidths()[col.key];
    if (w != null) return `${w}px`;
    return col.width ?? null;
  }

  /** Sticky offsets for every pinned column, computed once per layout change. */
  private readonly pinnedOffsets = computed<Map<string, number>>(() => {
    const map = new Map<string, number>();
    const cols = this.orderedColumns();
    const widths = this.colWidths();
    // Account for the leading select / expander columns on the left.
    let left = (this.selectable() ? 44 : 0) + (this.expandable() ? 44 : 0);
    for (const c of cols) {
      if (c.pinned !== 'left') continue;
      map.set(c.key, left);
      left += widths[c.key] ?? this.numericWidth(c);
    }
    let right = 0;
    for (let i = cols.length - 1; i >= 0; i--) {
      const c = cols[i];
      if (c.pinned !== 'right') continue;
      map.set(c.key, right);
      right += widths[c.key] ?? this.numericWidth(c);
    }
    return map;
  });

  /** Sticky offset (px) for a pinned column. */
  protected pinnedOffset(col: MkTableColumn<T>): number {
    return this.pinnedOffsets().get(col.key) ?? 0;
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

  private resizeRaf: number | null = null;
  private pendingResizeX = 0;

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
    this.document.addEventListener('pointercancel', this.onResizeEnd);
  }

  /** rAF-coalesced: at most one width write (and CD pass) per frame. */
  private readonly onResizeMove = (event: PointerEvent): void => {
    if (!this.resizeKey) return;
    this.pendingResizeX = event.clientX;
    if (this.resizeRaf != null) return;
    this.resizeRaf = this.document.defaultView?.requestAnimationFrame(() => {
      this.resizeRaf = null;
      this.applyPendingResize();
    }) ?? null;
  };

  private applyPendingResize(): void {
    if (!this.resizeKey) return;
    const width = Math.max(
      this.resizeMin,
      Math.round(this.resizeStartW + (this.pendingResizeX - this.resizeStartX)),
    );
    this.colWidths.update((w) => ({ ...w, [this.resizeKey as string]: width }));
  }

  private readonly onResizeEnd = (): void => {
    if (this.resizeRaf != null) {
      // Flush (don't drop) the last pending move so a fast drag lands exactly.
      this.document.defaultView?.cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = null;
      this.applyPendingResize();
    }
    if (this.resizeKey) {
      const col = this.columns().find((c) => c.key === this.resizeKey);
      const width =
        this.colWidths()[this.resizeKey] ?? Math.round(this.resizeStartW);
      this.columnResize.emit({ key: this.resizeKey, width });
      if (col) this.announcer.announce(this.i18n.columnWidth(col.header, width));
    }
    this.resizeKey = null;
    this.document.removeEventListener('pointermove', this.onResizeMove);
    this.document.removeEventListener('pointerup', this.onResizeEnd);
    this.document.removeEventListener('pointercancel', this.onResizeEnd);
  };

  /** Keyboard column resize on the focused separator (APG window splitter). */
  protected onResizeKeydown(event: KeyboardEvent, col: MkTableColumn<T>): void {
    if (!this.resizableColumns() || !col.resizable) return;
    const step = event.shiftKey ? 1 : 10;
    let delta = 0;
    if (event.key === 'ArrowLeft') delta = -step;
    else if (event.key === 'ArrowRight') delta = step;
    else return;
    event.preventDefault();
    event.stopPropagation();
    const min = col.minWidth ?? 60;
    const th = (event.target as HTMLElement).closest('th');
    const current =
      this.colWidths()[col.key] ??
      th?.getBoundingClientRect().width ??
      this.numericWidth(col);
    const width = Math.max(min, Math.round(current + delta));
    this.colWidths.update((w) => ({ ...w, [col.key]: width }));
    this.columnResize.emit({ key: col.key, width });
    this.announcer.announce(this.i18n.columnWidth(col.header, width));
  }

  /** The current width of a column, for the separator's aria-valuenow. */
  protected resizeValueNow(col: MkTableColumn<T>): number {
    return Math.round(this.colWidths()[col.key] ?? this.numericWidth(col));
  }

  ngOnDestroy(): void {
    if (this.resizeRaf != null) {
      this.document.defaultView?.cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = null;
    }
    this.document.removeEventListener('pointermove', this.onResizeMove);
    this.document.removeEventListener('pointerup', this.onResizeEnd);
    this.document.removeEventListener('pointercancel', this.onResizeEnd);
  }

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
    const toIdx = order.indexOf(target.key);
    this.moveColumn(from, toIdx);
  }

  protected onColDragEnd(): void {
    this.dragKey.set(null);
  }

  /** Move a column to `toIdx` in the display order and announce it. */
  private moveColumn(key: string, toIdx: number): void {
    const order = this.orderedColumns().map((c) => c.key);
    const fromIdx = order.indexOf(key);
    if (fromIdx < 0 || toIdx < 0 || toIdx >= order.length || fromIdx === toIdx) {
      return;
    }
    order.splice(toIdx, 0, order.splice(fromIdx, 1)[0]);
    this.colOrder.set(order);
    this.columnReorder.emit(order);
    const col = this.columns().find((c) => c.key === key);
    if (col) {
      this.announcer.announce(
        this.i18n.columnMoved(col.header, toIdx + 1, order.length),
      );
    }
  }

  /** Keyboard column reorder: Alt+Arrow moves the focused header. */
  protected onReorderKeydown(event: KeyboardEvent, col: MkTableColumn<T>): void {
    if (!this.reorderableColumns() || col.pinned || !event.altKey) return;
    const order = this.orderedColumns().map((c) => c.key);
    const idx = order.indexOf(col.key);
    if (event.key === 'ArrowLeft' && idx > 0) {
      event.preventDefault();
      this.moveColumn(col.key, idx - 1);
    } else if (event.key === 'ArrowRight' && idx < order.length - 1) {
      event.preventDefault();
      this.moveColumn(col.key, idx + 1);
    }
  }

  // --- Inline cell edit -----------------------------------------------------
  protected isEditing(index: number, col: MkTableColumn<T>): boolean {
    const e = this.editing();
    return !!e && e.index === index && e.key === col.key;
  }

  /** The cell element being edited, so focus can be restored after. */
  private editingCell: HTMLElement | null = null;

  protected startEdit(index: number, col: MkTableColumn<T>, event?: Event): void {
    if (!col.editable) return;
    event?.stopPropagation();
    this.editingCell =
      ((event?.target as HTMLElement | null)?.closest('td') as HTMLElement | null) ??
      null;
    this.editing.set({ index, key: col.key });
  }

  /** Keyboard path into edit mode (Enter / F2 on a focused editable cell). */
  protected onCellKeydown(
    event: KeyboardEvent,
    index: number,
    col: MkTableColumn<T>,
  ): void {
    if (!col.editable || this.isEditing(index, col)) return;
    if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      event.stopPropagation();
      this.startEdit(index, col, event);
    }
  }

  protected commitEdit(
    row: T,
    col: MkTableColumn<T>,
    value: string,
    restoreFocus = false,
  ): void {
    this.editing.set(null);
    this.cellEdit.emit({ row, key: col.key, value });
    this.announcer.announce(this.i18n.cellSaved(value));
    if (restoreFocus) this.editingCell?.focus();
    this.editingCell = null;
  }

  protected cancelEdit(restoreFocus = false): void {
    this.editing.set(null);
    if (restoreFocus) this.editingCell?.focus();
    this.editingCell = null;
  }

  protected onEditKeydown(
    event: KeyboardEvent,
    row: T,
    col: MkTableColumn<T>,
  ): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitEdit(row, col, (event.target as HTMLInputElement).value, true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelEdit(true);
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
    const compare = (a: T, b: T): number => {
      const av = (a as Record<string, unknown>)[key];
      const bv = (b as Record<string, unknown>)[key];
      if (av == null && bv == null) return 0;
      if (av == null) return -1;
      if (bv == null) return 1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    };
    // Negate the comparator for desc (instead of reversing) so the sort stays
    // stable and null ordering is consistent in both directions.
    return [...rows].sort(dir === 'desc' ? (a, b) => -compare(a, b) : compare);
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
        ? this.i18n.sortingCleared(col.header)
        : this.i18n.sortedBy(col.header, direction),
    );
  }

  protected onRowClick(row: T): void {
    if (this.clickableRows()) this.rowClick.emit(row);
  }

  /** Keyboard activation for clickable rows (Enter / Space). */
  protected onRowKeydown(event: KeyboardEvent, row: T): void {
    if (!this.clickableRows()) return;
    if (event.target !== event.currentTarget) return; // ignore inner controls
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.rowClick.emit(row);
    }
  }

  /** Stable row identity for `@for` tracking (trackKey when set, else the row). */
  protected trackRow = (row: T): unknown => this.rowKey(row);

  /** Leading cell text used to label per-row controls for screen readers. */
  protected rowLabel(row: T): string {
    const first = this.orderedColumns()[0];
    return first ? this.cellText(row, first) : '';
  }

  // --- Selection ------------------------------------------------------------
  private rowKey(row: T): unknown {
    const key = this.trackKey();
    return key ? (row as Record<string, unknown>)[key] : row;
  }

  /** Selected row keys as a Set — O(1) membership per cell per CD pass. */
  private readonly selectedKeys = computed<Set<unknown>>(
    () => new Set(this.selected().map((r) => this.rowKey(r))),
  );

  /** Whether `row` is currently selected. */
  protected isSelected(row: T): boolean {
    return this.selectedKeys().has(this.rowKey(row));
  }

  /** True when every visible row is selected. */
  protected readonly allSelected = computed<boolean>(() => {
    const rows = this.sortedData();
    const keys = this.selectedKeys();
    return rows.length > 0 && rows.every((row) => keys.has(this.rowKey(row)));
  });

  /** True when some — but not all — visible rows are selected. */
  protected readonly someSelected = computed<boolean>(() => {
    const keys = this.selectedKeys();
    return (
      this.sortedData().some((row) => keys.has(this.rowKey(row))) &&
      !this.allSelected()
    );
  });

  private commitSelection(next: T[]): void {
    this.selected.set(next);
    this.selectionChange.emit(next);
  }

  /** Toggle a single row's selection without triggering `rowClick`. */
  protected toggleRow(row: T): void {
    const rk = this.rowKey(row);
    const current = this.selected();
    const next = this.selectedKeys().has(rk)
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
