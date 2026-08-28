import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { MkLiveAnnouncer } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MkCheckbox } from '@mk-kit/ui/checkbox';
import { MkTableRowDetail } from './table-row-detail';
import { MkTableCell } from './table-cell';
import { mkDownloadText, mkToCsv, type MkCsvColumn, type MkCsvExportOptions } from '../export';

/** Horizontal text alignment for a table column. */
export type MkTableAlign = 'start' | 'center' | 'end';
/** Sort direction; `none` means unsorted. */
export type MkSortDirection = 'asc' | 'desc' | 'none';
/** Row vertical density. */
export type MkTableDensity = 'comfortable' | 'compact';

/** Which control a column's header filter renders (see {@link MkTableColumn.filter}). */
export type MkTableFilterKind = 'text' | 'select' | 'number' | 'date';

/** One option of a `select` header filter. */
export interface MkTableFilterOption {
  /** The value compared against the cell (by `String()` equality). */
  value: unknown;
  /** Visible option text. */
  label: string;
}

/**
 * An inclusive range accepted as the value of a `number` or `date` filter
 * (dates as `YYYY-MM-DD`, `Date` or a timestamp). Either bound may be omitted.
 */
export interface MkTableFilterRange<V = number | string | Date> {
  min?: V | null;
  max?: V | null;
}

/**
 * Active header filters keyed by column key: a string for `text`, an option
 * value for `select`, a number / date (`>=`) or a {@link MkTableFilterRange}
 * for `number` and `date`. Empty strings and `null` mean "no filter".
 */
export type MkTableFilters = Record<string, unknown>;

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
  /**
   * What becomes of this column when the table stacks into cards
   * (see {@link MkTable.stackAt}). Omitted, the column renders as a labelled
   * field: its `header` on one side, its value on the other.
   *
   * - `'title'` — the card's heading. No label; the value identifies the
   *   record at a glance (an order number, a product name). Mark one, or two
   *   if something short belongs beside it such as a status or a total.
   * - `'footer'` — pinned to the bottom of the card, full width and unlabelled.
   *   Where an actions cell belongs: buttons read as buttons, rather than as
   *   the answer to a label.
   * - `'hide'` — not rendered at all. Not merely invisible: the cell is never
   *   created, so a screen reader does not read it either. For columns that
   *   only earn their place while scanning a grid, and especially for anything
   *   an expandable row detail already repeats.
   */
  stack?: 'title' | 'footer' | 'hide';
  /**
   * The header-row filter control for this column (rendered when the table is
   * {@link MkTable.filterable}). Omitted, a filterable table gives the column a
   * text filter; `false` leaves its filter cell empty.
   *
   * - `'text'` — case-insensitive *contains* on the displayed (formatted) text.
   * - `'select'` — equality against one of {@link filterOptions}; without
   *   options, the distinct values found in `data`.
   * - `'number'` / `'date'` — the control keeps rows whose value is **≥** the
   *   entry. Set `{ min, max }` through {@link MkTable.filters} for an
   *   inclusive range. Dates compare by local calendar day.
   */
  filter?: MkTableFilterKind | false;
  /**
   * Options of a `select` filter — strings / numbers, or `{ value, label }`.
   * Omitted: every distinct value of the column in `data`, sorted.
   */
  filterOptions?: readonly (string | number | MkTableFilterOption)[];
  /** Placeholder of the filter control (text: `i18n.filter`; number / date: `i18n.filterMin`). */
  filterPlaceholder?: string;
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

/** A group of rows produced by {@link MkTable.groupBy}. */
export interface MkTableGroup<T = Record<string, unknown>> {
  /** The shared group value. */
  key: unknown;
  /** Display label for the group header. */
  label: string;
  /** The rows in this group, in display (sorted) order. */
  rows: T[];
}

/** Payload emitted by {@link MkTable.groupToggle}. */
/** Payload of `(treeToggle)`: a parent row was expanded or collapsed. */
export interface MkTreeToggle<T = Record<string, unknown>> {
  /** The parent row. */
  row: T;
  /** Whether its child rows are now shown. */
  expanded: boolean;
}

export interface MkGroupToggle {
  /** The toggled group's value. */
  key: unknown;
  /** Whether the group is now collapsed. */
  collapsed: boolean;
}

/** Options for {@link MkTable.getExportRows} — which rows and columns to export. */
export interface MkTableExportRowsOptions {
  /** Export only the selected rows (default: every row). */
  selectedOnly?: boolean;
  /** Restrict to these column keys, in table order (default: every column). */
  columns?: readonly string[];
}

/** What {@link MkTable.getExportRows} returns: the rows and the columns to write them with. */
export interface MkTableExportRows<T> {
  /**
   * The rows in display order — sorted the way they are shown, tree children
   * flattened under their parent (expanded or not), selection applied when
   * `selectedOnly` was set.
   */
  rows: T[];
  /**
   * The columns in the table's current (user-reordered) order, restricted to
   * the requested keys, each with its header and formatter.
   */
  columns: MkCsvColumn<T>[];
}

/** Options for {@link MkTable.exportCsv}. */
export interface MkTableExportOptions extends MkCsvExportOptions, MkTableExportRowsOptions {
  /** Start the browser download (default `true`); `false` just returns the text. */
  download?: boolean;
}

/** Hard floor (px) for column resize when a column sets no `minWidth`. */
const MIN_COL_WIDTH = 60;
/**
 * Row height (px) assumed by `virtual` until the first row is measured: the
 * comfortable density row — `--mk-space-3` padding twice around a
 * `--mk-font-size-sm` line, plus the 1px row border.
 */
const DEFAULT_ROW_HEIGHT = 44;
/** Rows rendered before the viewport has been measured (SSR, first paint). */
const UNMEASURED_VIEWPORT_ROWS = 20;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;

/** Local calendar day (`YYYY-MM-DD`) of a Date, ISO string or timestamp. */
function dayKey(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && ISO_DAY.test(value)) return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whether a filter value is a `{ min, max }` range rather than a single bound. */
function isFilterRange(v: unknown): v is MkTableFilterRange<unknown> {
  return (
    typeof v === 'object' && v !== null && !(v instanceof Date) && ('min' in v || 'max' in v)
  );
}

/** `null`, `''` and empty ranges all mean "no filter on this column". */
function isEmptyFilter(v: unknown): boolean {
  if (v == null || v === '') return true;
  if (isFilterRange(v)) return isEmptyFilter(v.min) && isEmptyFilter(v.max);
  return false;
}

/** Drop the empty entries of a filter map (`null` when nothing is left). */
export function mkCompactFilters(
  filters: MkTableFilters | null | undefined,
): MkTableFilters | null {
  if (!filters) return null;
  const out: MkTableFilters = {};
  let any = false;
  for (const key of Object.keys(filters)) {
    if (isEmptyFilter(filters[key])) continue;
    out[key] = filters[key];
    any = true;
  }
  return any ? out : null;
}
/** Upper bound advertised on resize separators (`aria-valuemax`). */
const MAX_COL_WIDTH = 2000;

/** One rendered tbody entry: either a group header or a data row. */
type MkTableItem<T> =
  | { kind: 'group'; group: MkTableGroup<T> }
  | {
      kind: 'row';
      row: T;
      /** Nesting depth in tree mode (0 for roots and for flat tables). */
      depth: number;
      /** Whether the row has child rows (tree mode). */
      hasChildren: boolean;
      /** Whether its children are currently shown (tree mode). */
      expanded: boolean;
    };

/**
 * Table — a themed data table built on a native `<table>` for accessibility.
 * Supply `columns` and `data`; opt into sortable columns, sticky header,
 * zebra striping, hover and density. Sorting is fully keyboard operable
 * (Enter/Space on a header) and announces changes via {@link MkLiveAnnouncer}.
 * `virtual` windows the rows of very large tables; `filterable` adds a
 * per-column filter row (`[(filters)]`).
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
/**
 * Shared collator for string sorting. Created lazily at module scope rather
 * than as a `static` class field: a static initializer that *calls* something
 * stops Angular's build optimizer from marking the class IIFE as pure, which
 * pinned `MkTable` — and, through it, the whole table entry point — into every
 * bundle that imported any export of `@mk-kit/ui/table`.
 */
let collator: Intl.Collator | undefined;
const sortCollator = (): Intl.Collator => (collator ??= new Intl.Collator());

@Component({
  selector: 'mk-table',
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkCheckbox, NgTemplateOutlet],
  host: {
    class: 'mk-table',
    '[class.mk-table--sticky]': 'stickyHeader() || isVirtual()',
    '[class.mk-table--virtual]': 'isVirtual()',
    '[class.mk-table--filterable]': 'filterable() && !stacked()',
    '[class.mk-table--zebra]': 'zebra()',
    '[class.mk-table--hover]': 'hover()',
    '[class.mk-table--compact]': "density() === 'compact'",
    '[class.mk-table--clickable]': 'clickableRows()',
    '[class.mk-table--selectable]': 'selectable()',
    '[class.mk-table--expandable]': 'expandable()',
    '[class.mk-table--grouped]': 'groupBy() !== null',
    '[class.mk-table--stacked]': 'stacked()',
  },
})
export class MkTable<T = Record<string, unknown>> {
  private readonly announcer = inject(MkLiveAnnouncer);
  protected readonly i18n = inject(MK_I18N);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  /**
   * True while the table is narrower than {@link stackAt} and rendering cards.
   *
   * Driven by the element's own width rather than the viewport's: the question
   * "do these columns fit" is about the space the table HAS, not the size of
   * the screen. A table in a sidebar or a dialog should stack while the window
   * around it is enormous.
   */
  protected readonly stacked = signal(false);

  constructor() {
    // Keep the sticky offsets (filter row under the header row, group headers
    // under the thead) in sync with the rendered heights — they shift with
    // density, sticky mode, the filter row and grouping itself.
    effect(() => {
      this.stickyHeader();
      this.density();
      this.groupBy();
      this.filterable();
      this.virtual();
      afterNextRender(
        { read: () => this.applyStickyOffsets() },
        { injector: this.injector },
      );
    });

    // Virtual mode: after every render that could change what is on screen,
    // read back the real row / detail heights and the viewport, so the
    // spacers and the window stay honest for whatever density is in force.
    afterRenderEffect({
      read: () => {
        if (!this.isVirtual()) return;
        this.windowRange();
        this.density();
        this.expandedKeys();
        const el = this.scroller()?.nativeElement;
        if (el) untracked(() => this.measureViewport(el));
      },
    });

    // Announce how many rows a change of filters left (the visible count).
    let firstFilters = true;
    effect(() => {
      this.filters();
      if (firstFilters) {
        firstFilters = false;
        return;
      }
      untracked(() => {
        if (!this.clientFilter()) return;
        this.announcer.announce(this.i18n.resultsCount(this.allRows().length));
      });
    });

    // Watch the host's width against `stackAt`. ResizeObserver rather than
    // matchMedia because the trigger is the element's width, not the window's.
    // Skipped entirely on the server and wherever the API is missing, leaving
    // `stacked` false — the grid is the safe fallback, since it renders the
    // same data with nothing dropped.
    afterNextRender(
      {
        read: () => {
          if (!this.isBrowser || typeof ResizeObserver === 'undefined') return;
          const el = this.host.nativeElement;
          const observer = new ResizeObserver(([entry]) => {
            const limit = this.stackAt();
            this.stacked.set(limit > 0 && entry.contentRect.width < limit);
          });
          observer.observe(el);
          // The scroller's height is the virtual viewport; the table grows or
          // shrinks when a density change re-sizes its rows.
          const scroller = this.scroller()?.nativeElement;
          const viewport = new ResizeObserver(() => {
            if (scroller && this.isVirtual()) this.measureViewport(scroller);
          });
          if (scroller) {
            viewport.observe(scroller);
            const table = scroller.querySelector('table');
            if (table) viewport.observe(table);
          }
          this.destroyRef.onDestroy(() => {
            observer.disconnect();
            viewport.disconnect();
          });
        },
      },
      { injector: this.injector },
    );
  }

  /**
   * Measures the header row and the thead and exposes them as the sticky
   * offsets of the filter row and of the group rows.
   */
  private applyStickyOffsets(): void {
    const host = this.host.nativeElement;
    const sticky = this.stickyHeader() || this.isVirtual();
    if (this.filterable()) {
      const headRow = host.querySelector('thead > tr');
      const h = sticky && headRow ? headRow.getBoundingClientRect().height : 0;
      host.style.setProperty('--_filter-top', `${Math.round(h)}px`);
    }
    if (this.groupBy() == null) return;
    const thead = host.querySelector('thead');
    const h = sticky && thead ? thead.getBoundingClientRect().height : 0;
    host.style.setProperty('--_group-top', `${Math.round(h)}px`);
  }

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
  /**
   * Width in px below which each row renders as a CARD instead of a table row.
   * `0` (default) never stacks.
   *
   * Measured on the table's own container, not the viewport — a table in a
   * narrow sidebar should stack on a desktop, and a table on a tablet in
   * landscape should not. Per-column behaviour is set with
   * {@link MkTableColumn.stack}.
   *
   * A grid cannot survive a phone: eight columns become eight unreadable
   * slivers, and horizontal scrolling loses the row you were reading. Cards
   * keep one record together and put its header beside each value.
   */
  readonly stackAt = input(0, { transform: numberAttribute });
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
   * Optional per-row CSS class: called with each row, the returned string is
   * appended to the row's class list (falsy → none). For state the consumer
   * owns — an "active in the side panel" highlight, an unread accent — that
   * `selectable`'s own selected style doesn't cover.
   */
  readonly rowClass = input<((row: T) => string | null | undefined) | null>(
    null,
  );

  /** Resolved class for a row (empty string when no `rowClass` is set). */
  protected rowClassFor(row: T): string {
    return this.rowClass()?.(row) ?? '';
  }
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
  /**
   * Group rows by a column key or an accessor. Renders a collapsible group
   * header row (sticky, with a row count) above each group. Sorting still
   * applies within groups; groups follow their first row's sorted position.
   */
  readonly groupBy = input<string | ((row: T) => unknown) | null>(null);
  /** Formats a group header label; defaults to `String(value)`. */
  readonly groupLabel = input<
    ((value: unknown, rows: T[]) => string) | null
  >(null);

  // --- Virtualisation inputs -------------------------------------------------
  /**
   * Render only the rows in view (plus {@link overscan}) — for tables of
   * thousands of rows. The `<table>` scrolls inside its own box sized by
   * {@link height} / {@link maxHeight} (`max-height: 60vh` when neither is
   * set) with the header pinned; spacer rows keep the scrollbar honest.
   *
   * Works with sorting, selection (select-all still covers every row), tree
   * rows, grouping (group headers are rows too), expandable detail rows (their
   * height is measured once rendered; an unmeasured detail counts as one row)
   * and the header filter row. Falls back to the full render while stacked
   * into cards. Export and select-all always see every row, not the window.
   */
  readonly virtual = input(false, { transform: booleanAttribute });
  /**
   * Height (px) of one row in virtual mode. Leave unset to have it measured
   * from the first rendered row — which follows `density` and
   * `data-mk-density` automatically — starting from 44 (comfortable).
   */
  readonly rowHeight = input<number | null, unknown>(null, {
    transform: (v) => (v == null || v === '' ? null : numberAttribute(v)),
  });
  /** Rows rendered beyond each edge of the viewport in virtual mode. */
  readonly overscan = input(6, { transform: numberAttribute });
  /** Fixed height of the scroll box (CSS length, or px as a number). */
  readonly height = input<string | number | null>(null);
  /** Maximum height of the scroll box (CSS length, or px as a number). */
  readonly maxHeight = input<string | number | null>(null);

  // --- Filter row inputs -----------------------------------------------------
  /**
   * Render a second header row with a filter control per column — a text
   * box, a select, a number or a date field as the column's
   * {@link MkTableColumn.filter} says. Values live in {@link filters}.
   */
  readonly filterable = input(false, { transform: booleanAttribute });
  /**
   * The active filters, keyed by column key (`[(filters)]`; `filtersChange`
   * emits the whole map on every edit). Text filters hold the typed string,
   * select filters the chosen option value, number / date filters the lower
   * bound or a `{ min, max }` range. Set programmatically to pre-filter.
   */
  readonly filters = model<MkTableFilters>({});
  /**
   * Filter rows in the browser (default). Turn off when the server applies
   * the filters — `MkTableDataSource.setFilters($event)` on `filtersChange` —
   * so the page it returns is shown as-is.
   */
  readonly clientFilter = input(true, { transform: booleanAttribute });

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
  /** Emitted when a group header is expanded or collapsed. */
  readonly groupToggle = output<MkGroupToggle>();
  /**
   * Tree rows: the property on each row holding its child rows (`T[]`). When
   * set, the table renders a tree grid — child rows are indented under their
   * parent behind an expand toggle in the first column, sorting applies per
   * sibling group, and ArrowRight / ArrowLeft on a row open / close it.
   */
  readonly childrenKey = input<string | null>(null);
  /** Emitted when a parent row is expanded or collapsed (tree mode). */
  readonly treeToggle = output<MkTreeToggle<T>>();

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

  // ── Stacked (card) layout ────────────────────────────────────────────────
  // Three slots, so a card reads as a record rather than as a form: a heading
  // line, labelled fields, and actions along the bottom. Columns keep their
  // configured order within each slot.

  /** Columns forming the card's heading line. */
  protected readonly stackTitleColumns = computed(() =>
    this.orderedColumns().filter((c) => c.stack === 'title'),
  );
  /** Columns rendered as `label / value` rows in the card body. */
  protected readonly stackFieldColumns = computed(() =>
    this.orderedColumns().filter((c) => !c.stack),
  );
  /** Columns pinned to the bottom of the card, unlabelled. */
  protected readonly stackFooterColumns = computed(() =>
    this.orderedColumns().filter((c) => c.stack === 'footer'),
  );

  /**
   * Whether a stacked cell should show its column header as a label.
   *
   * An empty header means the column never had a name to show — an actions or
   * chevron column — and an empty label box would just be a gap the reader has
   * to account for.
   */
  protected hasStackLabel(col: MkTableColumn<T>): boolean {
    return !!col.header?.trim();
  }

  /** The rendered width for a column, if the user resized it. */
  protected colStyleWidth(col: MkTableColumn<T>): string | null {
    // A card has one column, so a per-column width — configured or dragged —
    // would pin the value box to a grid width that no longer exists.
    if (this.stacked()) return null;
    const w = this.colWidths()[col.key];
    if (w != null) return `${w}px`;
    return col.width ?? null;
  }

  /** Sticky offsets for every pinned column, computed once per layout change. */
  private readonly pinnedOffsets = computed<Map<string, number>>(() => {
    const map = new Map<string, number>();
    const cols = this.orderedColumns();
    const widths = this.colWidths();
    // Account for the leading select / expander columns at the inline start.
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

  /** Pinning freezes a column against horizontal scroll. Cards do not scroll
   *  sideways, so both the class and its inline offset are suppressed. */
  protected isPinned(col: MkTableColumn<T>, side: 'left' | 'right'): boolean {
    return !this.stacked() && col.pinned === side;
  }

  private numericWidth(col: MkTableColumn<T>): number {
    const w = col.width ? parseInt(col.width, 10) : NaN;
    return Number.isFinite(w) ? w : 150;
  }

  // --- Column resize --------------------------------------------------------
  private resizeKey: string | null = null;
  private resizeStartX = 0;
  private resizeStartW = 0;
  private resizeMin = MIN_COL_WIDTH;
  /** +1 in LTR, -1 in RTL — dragging toward the inline-end always widens. */
  private resizeSign: 1 | -1 = 1;

  /** Whether the table currently renders right-to-left (SSR-safe). */
  private isRtl(): boolean {
    const view = this.document.defaultView;
    if (!view) return false;
    return view.getComputedStyle(this.host.nativeElement).direction === 'rtl';
  }

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
    this.resizeSign = this.isRtl() ? -1 : 1;
    this.resizeStartW =
      this.colWidths()[col.key] ?? th?.getBoundingClientRect().width ?? this.numericWidth(col);
    this.resizeMin = col.minWidth ?? MIN_COL_WIDTH;
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
      Math.round(
        this.resizeStartW +
          this.resizeSign * (this.pendingResizeX - this.resizeStartX),
      ),
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
    // Mirror in RTL so pressing toward the inline-end always grows the column.
    if (this.isRtl()) delta = -delta;
    event.preventDefault();
    event.stopPropagation();
    const min = col.minWidth ?? MIN_COL_WIDTH;
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

  /** The resize floor for a column, for the separator's aria-valuemin. */
  protected resizeValueMin(col: MkTableColumn<T>): number {
    return col.minWidth ?? MIN_COL_WIDTH;
  }

  /** Advertised resize ceiling (aria-valuemax) — a sane constant bound. */
  protected readonly resizeValueMax = MAX_COL_WIDTH;

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
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    // Swallow the combo even when the move is a no-op (first column moved
    // further left, last moved right) — otherwise Alt+Arrow falls through to
    // the browser's history Back/Forward and navigates away from the grid.
    event.preventDefault();
    const order = this.orderedColumns().map((c) => c.key);
    const idx = order.indexOf(col.key);
    if (event.key === 'ArrowLeft' && idx > 0) {
      this.moveColumn(col.key, idx - 1);
    } else if (event.key === 'ArrowRight' && idx < order.length - 1) {
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

  /** The inline-edit input, focused once it renders. */
  private readonly editInput =
    viewChild<ElementRef<HTMLInputElement>>('editInput');

  protected startEdit(index: number, col: MkTableColumn<T>, event?: Event): void {
    if (!col.editable) return;
    event?.stopPropagation();
    this.editingCell =
      ((event?.target as HTMLElement | null)?.closest('td') as HTMLElement | null) ??
      null;
    this.editing.set({ index, key: col.key });
    // Explicit focus once the input exists — a dynamically inserted
    // `autofocus` attribute is not honoured after initial page load.
    afterNextRender(() => this.editInput()?.nativeElement.focus(), {
      injector: this.injector,
    });
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

  /** Per-column cell templates, projected as `<ng-template mkTableCell="key">`. */
  private readonly cellTemplates = contentChildren(MkTableCell);
  private readonly cellTemplateByKey = computed(() => {
    const map = new Map<string, MkTableCell>();
    for (const t of this.cellTemplates()) map.set(t.mkTableCell(), t);
    return map;
  });

  /** The template registered for a column, or null to fall back to text. */
  protected cellTemplateFor(key: string) {
    return this.cellTemplateByKey().get(key)?.template ?? null;
  }

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

  /**
   * Shared locale-sensitive collator for string sorting. `localeCompare`
   * re-resolves locale data on every call; one cached `Intl.Collator` makes
   * large-table sorts several-fold faster with the same default-locale order.
   */
  /** Data sorted by the active column, or the input order when unsorted. */
  protected readonly sortedData = computed<T[]>(() =>
    this.sortRows(this.filteredData()),
  );

  // --- Filtering ---------------------------------------------------------------
  /** The filter control a column renders, or `null` for none. */
  protected filterKind(col: MkTableColumn<T>): MkTableFilterKind | null {
    if (col.filter === false) return null;
    return col.filter ?? 'text';
  }

  /** One predicate per active filter, or `null` when nothing is filtered. */
  private readonly rowPredicate = computed<((row: T) => boolean) | null>(() => {
    if (!this.clientFilter()) return null;
    const filters = this.filters();
    const tests: ((row: T) => boolean)[] = [];
    for (const col of this.columns()) {
      const value = filters[col.key];
      if (col.filter === false || isEmptyFilter(value)) continue;
      tests.push(this.columnTest(col, value));
    }
    if (!tests.length) return null;
    return (row) => tests.every((test) => test(row));
  });

  /** Build the predicate for one column's filter value. */
  private columnTest(col: MkTableColumn<T>, value: unknown): (row: T) => boolean {
    const raw = (row: T): unknown => (row as Record<string, unknown>)[col.key];
    switch (col.filter) {
      case 'select': {
        const wanted = String(value);
        return (row) => String(raw(row) ?? '') === wanted;
      }
      case 'number': {
        const [lo, hi] = isFilterRange(value) ? [value.min, value.max] : [value, null];
        const min = isEmptyFilter(lo) ? null : Number(lo);
        const max = isEmptyFilter(hi) ? null : Number(hi);
        return (row) => {
          const v = raw(row);
          const n = typeof v === 'number' ? v : Number(v);
          if (v == null || v === '' || Number.isNaN(n)) return false;
          return (min == null || n >= min) && (max == null || n <= max);
        };
      }
      case 'date': {
        const [lo, hi] = isFilterRange(value) ? [value.min, value.max] : [value, null];
        const min = dayKey(lo);
        const max = dayKey(hi);
        return (row) => {
          const day = dayKey(raw(row));
          if (!day) return false;
          return (!min || day >= min) && (!max || day <= max);
        };
      }
      default: {
        const needle = String(value).trim().toLowerCase();
        if (!needle) return () => true;
        return (row) => this.cellText(row, col).toLowerCase().includes(needle);
      }
    }
  }

  /**
   * Tree mode: which rows survive the filters — a row is kept when it matches
   * or any descendant does, so a matching child keeps its parents.
   */
  private readonly treeKeep = computed<Map<T, boolean>>(() => {
    const keep = this.rowPredicate();
    const map = new Map<T, boolean>();
    if (!keep || !this.childrenKey()) return map;
    const walk = (row: T): boolean => {
      let any = keep(row);
      for (const child of this.childrenOf(row)) if (walk(child)) any = true;
      map.set(row, any);
      return any;
    };
    for (const row of this.data()) walk(row);
    return map;
  });

  /** The input rows with the active filters applied (input order). */
  private readonly filteredData = computed<T[]>(() => {
    const keep = this.rowPredicate();
    const data = this.data();
    if (!keep) return data;
    if (!this.childrenKey()) return data.filter(keep);
    const kept = this.treeKeep();
    return data.filter((row) => kept.get(row) === true);
  });

  /** The child rows of `row` that survive the filters (tree mode). */
  private visibleChildrenOf(row: T): T[] {
    const children = this.childrenOf(row);
    if (!children.length || !this.rowPredicate()) return children;
    const kept = this.treeKeep();
    return children.filter((child) => kept.get(child) === true);
  }

  /** Options of every `select` filter, keyed by column (derived when unset). */
  private readonly selectOptions = computed<Map<string, MkTableFilterOption[]>>(() => {
    const map = new Map<string, MkTableFilterOption[]>();
    for (const col of this.columns()) {
      if (col.filter !== 'select') continue;
      if (col.filterOptions) {
        map.set(
          col.key,
          col.filterOptions.map((o) =>
            typeof o === 'object' ? o : { value: o, label: String(o) },
          ),
        );
        continue;
      }
      const seen = new Map<string, unknown>();
      const walk = (rows: T[]): void => {
        for (const row of rows) {
          const v = (row as Record<string, unknown>)[col.key];
          if (v != null && v !== '') seen.set(String(v), v);
          walk(this.childrenOf(row));
        }
      };
      walk(this.data());
      map.set(
        col.key,
        [...seen.entries()]
          .sort(([a], [b]) => sortCollator().compare(a, b))
          .map(([label, value]) => ({ value, label })),
      );
    }
    return map;
  });

  /** The options a column's select filter offers. */
  protected filterOptionsFor(col: MkTableColumn<T>): MkTableFilterOption[] {
    return this.selectOptions().get(col.key) ?? [];
  }

  /** Whether `option` is the column's current select-filter value. */
  protected isFilterOption(col: MkTableColumn<T>, option: MkTableFilterOption): boolean {
    const v = this.filters()[col.key];
    return !isEmptyFilter(v) && String(v) === String(option.value);
  }

  /** Whether a column has an active filter. */
  protected hasFilter(key: string): boolean {
    return !isEmptyFilter(this.filters()[key]);
  }

  /** The text a column's filter box shows (a range shows its lower bound). */
  protected filterText(key: string): string {
    const v = this.filters()[key];
    if (isEmptyFilter(v)) return '';
    const shown = isFilterRange(v) ? v.min : v;
    if (shown instanceof Date) return dayKey(shown) ?? '';
    return shown == null ? '' : String(shown);
  }

  /** Accessible name of a column's filter control. */
  protected filterLabel(col: MkTableColumn<T>): string {
    return this.i18n.filterColumn(col.header || col.key);
  }

  /** Placeholder of a column's filter control. */
  protected filterPlaceholder(col: MkTableColumn<T>): string {
    if (col.filterPlaceholder != null) return col.filterPlaceholder;
    return this.filterKind(col) === 'text' ? this.i18n.filter : this.i18n.filterMin;
  }

  /**
   * Set one column's filter (`null` / `''` clears it). Updates
   * {@link filters} and emits `filtersChange`; a no-op when unchanged.
   */
  setFilter(key: string, value: unknown): void {
    const current = this.filters();
    const empty = isEmptyFilter(value);
    if (empty ? !(key in current) : Object.is(current[key], value)) return;
    const next = { ...current };
    if (empty) delete next[key];
    else next[key] = value;
    this.filters.set(next);
  }

  /** Clear one column's filter. */
  clearFilter(key: string): void {
    this.setFilter(key, null);
  }

  /** Clear every filter. */
  clearFilters(): void {
    if (Object.keys(this.filters()).length) this.filters.set({});
  }

  /** Text / number / date filter box input. */
  protected onFilterInput(col: MkTableColumn<T>, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    if (col.filter === 'number') {
      const n = text === '' ? NaN : Number(text);
      this.setFilter(col.key, Number.isNaN(n) ? null : n);
    } else {
      this.setFilter(col.key, text);
    }
  }

  /** Select filter change: map the option string back to its original value. */
  protected onFilterSelect(col: MkTableColumn<T>, event: Event): void {
    const chosen = (event.target as HTMLSelectElement).value;
    const option = this.filterOptionsFor(col).find((o) => String(o.value) === chosen);
    this.setFilter(col.key, chosen === '' || !option ? null : option.value);
  }

  /** Escape in a filter box clears that filter (and stays in the box). */
  protected onFilterKeydown(col: MkTableColumn<T>, event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.hasFilter(col.key)) return;
    event.preventDefault();
    event.stopPropagation();
    this.clearFilter(col.key);
  }

  /** Header rows above the body (for `aria-rowindex`). */
  protected readonly headerRows = computed(
    () => 1 + (this.filterable() && !this.stacked() ? 1 : 0),
  );

  /** Sort one sibling group by the active column (input order when unsorted). */
  private sortRows(rows: T[]): T[] {
    const key = this.sortKey();
    const dir = this.sortDir();
    if (!key || !dir) return rows;
    const compare = (a: T, b: T): number => {
      const av = (a as Record<string, unknown>)[key];
      const bv = (b as Record<string, unknown>)[key];
      if (av == null && bv == null) return 0;
      if (av == null) return -1;
      if (bv == null) return 1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return sortCollator().compare(String(av), String(bv));
    };
    // Negate the comparator for desc (instead of reversing) so the sort stays
    // stable and null ordering is consistent in both directions.
    return [...rows].sort(dir === 'desc' ? (a, b) => -compare(a, b) : compare);
  }

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

  /** Raw cell value, handed to an `[mkTableCell]` template unformatted. */
  protected cellValue(row: T, col: MkTableColumn<T>): unknown {
    return (row as Record<string, unknown>)[col.key];
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

  /** Keyboard activation for clickable rows (Enter / Space) and tree keys. */
  protected onRowKeydown(event: KeyboardEvent, row: T): void {
    if (this.onTreeKeydown(event, row)) return;
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

  /**
   * Every data row, in display order, ignoring tree expansion — what
   * "select all" and the header checkbox reason about. Equals `sortedData`
   * for flat tables.
   */
  private readonly allRows = computed<T[]>(() => {
    if (!this.childrenKey()) return this.sortedData();
    const out: T[] = [];
    const walk = (rows: T[]): void => {
      for (const row of this.sortRows(rows)) {
        out.push(row);
        walk(this.visibleChildrenOf(row));
      }
    };
    walk(this.filteredData());
    return out;
  });

  /** True when every visible row is selected. */
  protected readonly allSelected = computed<boolean>(() => {
    const rows = this.allRows();
    const keys = this.selectedKeys();
    return rows.length > 0 && rows.every((row) => keys.has(this.rowKey(row)));
  });

  /** True when some — but not all — visible rows are selected. */
  protected readonly someSelected = computed<boolean>(() => {
    const keys = this.selectedKeys();
    return (
      this.allRows().some((row) => keys.has(this.rowKey(row))) &&
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

  /** Select or deselect all rows (every tree row, expanded or not). */
  protected toggleAll(): void {
    const rows = this.allRows();
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

  // --- Grouping ---------------------------------------------------------------
  /** Group values currently collapsed. */
  private readonly collapsedGroups = signal<Set<unknown>>(new Set());

  /** Rows grouped by {@link groupBy}, or `null` when grouping is off. */
  protected readonly groups = computed<MkTableGroup<T>[] | null>(() => {
    const by = this.groupBy();
    if (by == null) return null;
    const accessor =
      typeof by === 'function'
        ? by
        : (row: T) => (row as Record<string, unknown>)[by];
    const map = new Map<unknown, T[]>();
    for (const row of this.sortedData()) {
      const key = accessor(row);
      const bucket = map.get(key);
      if (bucket) bucket.push(row);
      else map.set(key, [row]);
    }
    const label = this.groupLabel();
    return [...map.entries()].map(([key, rows]) => ({
      key,
      label: label ? label(key, rows) : String(key),
      rows,
    }));
  });

  /**
   * The tbody render list: group headers interleaved with their (expanded)
   * rows when grouping is on, else just the sorted rows.
   */
  protected readonly displayItems = computed<MkTableItem<T>[]>(() => {
    const groups = this.groups();
    const items: MkTableItem<T>[] = [];
    if (!groups) {
      this.pushRows(items, this.sortedData(), 0);
      return items;
    }
    const collapsed = this.collapsedGroups();
    for (const group of groups) {
      items.push({ kind: 'group', group });
      if (!collapsed.has(group.key)) this.pushRows(items, group.rows, 0);
    }
    return items;
  });

  /**
   * Append `rows` as render items. In tree mode each row is followed by its
   * (sorted) children while it is expanded, one level deeper.
   */
  private pushRows(items: MkTableItem<T>[], rows: T[], depth: number): void {
    const tree = !!this.childrenKey();
    const expandedKeys = this.treeExpanded();
    for (const row of rows) {
      const children = tree ? this.visibleChildrenOf(row) : [];
      const hasChildren = children.length > 0;
      const expanded = hasChildren && expandedKeys.has(this.rowKey(row));
      items.push({ kind: 'row', row, depth, hasChildren, expanded });
      if (expanded) this.pushRows(items, this.sortRows(children), depth + 1);
    }
  }

  /** The child rows of `row` (tree mode), or an empty list. */
  private childrenOf(row: T): T[] {
    const key = this.childrenKey();
    if (!key) return [];
    const value = (row as Record<string, unknown>)[key];
    return Array.isArray(value) ? (value as T[]) : [];
  }

  // --- Row virtualisation -------------------------------------------------------
  // Own windowing rather than `mk-virtual-scroll` from `@mk-kit/ui/data`: the
  // rows must stay real `<tr>`s inside the one `<table>` (column widths,
  // sticky header, selection, a11y), the window has to know about group and
  // detail rows, and importing the data entry point would drag ~680 KiB of
  // unrelated components into every table consumer's dependency graph.

  /** The scroll box around the table. */
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  /** Virtual mode in force (cards always render in full). */
  protected readonly isVirtual = computed(() => this.virtual() && !this.stacked());

  /** Current scroll offset of the scroll box (virtual mode). */
  private readonly scrollTop = signal(0);
  /** Measured height of the scroll box (0 until measured / on the server). */
  private readonly viewportHeight = signal(0);
  /** Measured height of the thead — the sticky header hides that much of the top. */
  private readonly headHeight = signal(0);
  /** Row height read back from the first rendered row. */
  private readonly measuredRowHeight = signal<number | null>(null);
  /** Measured heights of expanded detail rows, by row key. */
  private readonly detailHeights = signal<Map<unknown, number>>(new Map());

  /** The row height virtual mode lays rows out with. */
  protected readonly effectiveRowHeight = computed(
    () => this.rowHeight() ?? this.measuredRowHeight() ?? DEFAULT_ROW_HEIGHT,
  );

  private cssLength(v: string | number | null): string | null {
    if (v == null || v === '') return null;
    return typeof v === 'number' ? `${v}px` : v;
  }

  /** `height` of the scroll box. */
  protected readonly scrollHeight = computed(() => this.cssLength(this.height()));
  /** `max-height` of the scroll box (60vh in virtual mode with no size given). */
  protected readonly scrollMaxHeight = computed(() => {
    const max = this.cssLength(this.maxHeight());
    if (max) return max;
    return this.isVirtual() && this.height() == null ? '60vh' : null;
  });

  /**
   * Top offset of every display item, or `null` while every item is exactly
   * one row tall (the common case — then offsets are plain multiplication).
   * Only expanded detail rows make heights vary.
   */
  private readonly itemOffsets = computed<Float64Array | null>(() => {
    if (!this.isVirtual() || !this.expandable() || !this.rowDetail()) return null;
    const expanded = this.expandedKeys();
    if (!expanded.size) return null;
    const items = this.displayItems();
    const rh = this.effectiveRowHeight();
    const details = this.detailHeights();
    const offsets = new Float64Array(items.length + 1);
    let y = 0;
    for (let i = 0; i < items.length; i++) {
      offsets[i] = y;
      y += rh;
      const item = items[i];
      if (item.kind === 'row') {
        const key = this.rowKey(item.row);
        if (expanded.has(key)) y += details.get(key) ?? rh;
      }
    }
    offsets[items.length] = y;
    return offsets;
  });

  /** Full height of the body, spacers included. */
  private readonly totalHeight = computed(() => {
    const offsets = this.itemOffsets();
    if (offsets) return offsets[offsets.length - 1];
    return this.displayItems().length * this.effectiveRowHeight();
  });

  /** Top offset (px) of display item `index`. */
  private offsetOf(index: number): number {
    const offsets = this.itemOffsets();
    return offsets
      ? offsets[Math.min(index, offsets.length - 1)]
      : index * this.effectiveRowHeight();
  }

  /** Index of the display item covering the body offset `y`. */
  private indexAt(y: number): number {
    const count = this.displayItems().length;
    if (count === 0) return 0;
    const offsets = this.itemOffsets();
    if (!offsets) {
      return Math.min(count - 1, Math.max(0, Math.floor(y / this.effectiveRowHeight())));
    }
    let lo = 0;
    let hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (offsets[mid] <= y) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /** The `[start, end)` slice of display items currently rendered. */
  protected readonly windowRange = computed<{ start: number; end: number }>(
    () => {
      const count = this.displayItems().length;
      if (!this.isVirtual()) return { start: 0, end: count };
      const over = Math.max(0, this.overscan());
      const vh = this.viewportHeight();
      const top = Math.max(0, this.scrollTop() - this.headHeight());
      const first = this.indexAt(top);
      const last = vh > 0 ? this.indexAt(top + vh) : first + UNMEASURED_VIEWPORT_ROWS;
      return {
        start: Math.max(0, first - over),
        end: Math.min(count, last + 1 + over),
      };
    },
    { equal: (a, b) => a.start === b.start && a.end === b.end },
  );

  /** Display index of the first rendered item. */
  protected readonly windowStart = computed(() => this.windowRange().start);

  /** The items the tbody renders: the window in virtual mode, else all. */
  protected readonly renderedItems = computed<MkTableItem<T>[]>(() => {
    const items = this.displayItems();
    if (!this.isVirtual()) return items;
    const { start, end } = this.windowRange();
    return items.slice(start, end);
  });

  /** Height (px) of the spacer above the window. */
  protected readonly topSpace = computed(() =>
    this.isVirtual() ? this.offsetOf(this.windowRange().start) : 0,
  );
  /** Height (px) of the spacer below the window. */
  protected readonly bottomSpace = computed(() =>
    this.isVirtual()
      ? Math.max(0, this.totalHeight() - this.offsetOf(this.windowRange().end))
      : 0,
  );

  /** Scroll box scrolled: move the window. */
  protected onScroll(event: Event): void {
    if (!this.isVirtual()) return;
    this.scrollTop.set((event.target as HTMLElement).scrollTop);
  }

  /**
   * Read the viewport, thead, first-row and detail-row heights back from the
   * DOM. Heights are accepted only when they move by more than a pixel:
   * collapsed table borders make the same row measure 44 or 44.5 depending
   * on where it sits, and letting that flip the row height would shift a
   * 10,000-row body by thousands of pixels on every window change. A density
   * change (44 → 36 or 52) still gets through.
   */
  private measureViewport(el: HTMLElement): void {
    const settled = (next: number, current: number | null): boolean =>
      current != null && Math.abs(next - current) <= 1;
    const vh = el.clientHeight;
    if (vh > 0 && vh !== this.viewportHeight()) this.viewportHeight.set(vh);
    const thead = el.querySelector('thead');
    const hh = thead ? thead.getBoundingClientRect().height : 0;
    if (!settled(hh, this.headHeight())) this.headHeight.set(hh);
    if (this.rowHeight() == null) {
      const row = el.querySelector('tr.mk-table__row:not(.mk-table__row--empty)');
      const rh = row ? row.getBoundingClientRect().height : 0;
      if (rh > 0 && !settled(rh, this.measuredRowHeight())) this.measuredRowHeight.set(rh);
    }
    if (!this.expandable()) return;
    const items = this.displayItems();
    let next: Map<unknown, number> | null = null;
    for (const detail of el.querySelectorAll<HTMLElement>('tr.mk-table__detail-row')) {
      const index = Number(detail.dataset['index']);
      const item = items[index];
      if (!item || item.kind !== 'row') continue;
      const h = detail.getBoundingClientRect().height;
      if (!(h > 0)) continue;
      const key = this.rowKey(item.row);
      if (settled(h, this.detailHeights().get(key) ?? null)) continue;
      next ??= new Map(this.detailHeights());
      next.set(key, h);
    }
    if (next) this.detailHeights.set(next);
  }

  /**
   * Scroll a row into view. A number is the row's **display index** — its
   * position among the rendered rows, group headers included, after sorting,
   * filtering and tree expansion; anything else is a row key (the `trackKey`
   * value, or the row object when there is none). Pass `'key'` to look a
   * numeric key up. Returns `false` when the row is not currently displayed
   * (filtered out, under a collapsed parent or group).
   *
   * In virtual mode the row lands at the top of the viewport, just under the
   * header; otherwise it is scrolled to the nearest edge.
   */
  scrollToRow(
    target: unknown,
    by: 'index' | 'key' = typeof target === 'number' ? 'index' : 'key',
  ): boolean {
    const items = this.displayItems();
    const index =
      by === 'index'
        ? (target as number)
        : items.findIndex((it) => it.kind === 'row' && this.rowKey(it.row) === target);
    if (!Number.isInteger(index) || index < 0 || index >= items.length) return false;
    const el = this.scroller()?.nativeElement;
    if (!el) return false;
    if (this.isVirtual()) {
      const vh = this.viewportHeight();
      const max = vh > 0 ? Math.max(0, this.totalHeight() + this.headHeight() - vh) : Infinity;
      const top = Math.min(this.offsetOf(index), max);
      el.scrollTop = top;
      this.scrollTop.set(top);
    } else {
      const row = el.querySelector<HTMLElement>(`tbody > tr[data-index="${index}"]`);
      row?.scrollIntoView?.({ block: 'nearest' });
    }
    return true;
  }

  // --- Tree rows ------------------------------------------------------------
  /** Keys of parent rows whose children are shown. */
  private readonly treeExpanded = signal<Set<unknown>>(new Set());

  /** Whether a parent row's children are currently shown (tree mode). */
  isTreeExpanded(row: T): boolean {
    return this.treeExpanded().has(this.rowKey(row));
  }

  /** Show or hide a parent row's children (tree mode). */
  toggleTreeRow(row: T, event?: Event): void {
    event?.stopPropagation();
    if (this.childrenOf(row).length === 0) return;
    this.setTreeExpanded(row, !this.isTreeExpanded(row));
  }

  /** Expand every parent row (tree mode). */
  expandAllRows(): void {
    const keys = new Set<unknown>();
    const walk = (rows: T[]): void => {
      for (const row of rows) {
        const children = this.childrenOf(row);
        if (children.length) {
          keys.add(this.rowKey(row));
          walk(children);
        }
      }
    };
    walk(this.data());
    this.treeExpanded.set(keys);
  }

  /** Collapse every parent row (tree mode). */
  collapseAllRows(): void {
    this.treeExpanded.set(new Set());
  }

  // --- Export -----------------------------------------------------------------
  /**
   * The rows and columns an export writes — exactly what {@link exportCsv}
   * serialises, for other formats (XLSX, PDF, the clipboard, …): rows in
   * display order with the current sort and header {@link filters} applied
   * (every matching row, never just the virtual window) and tree children
   * (`childrenKey`) flattened under their parent whether or not they are
   * expanded, optionally only the selected ones; columns in the table's
   * current order, restricted to `options.columns` when given, each carrying
   * its header and `format` so what the user saw is what gets written.
   *
   * ```ts
   * const { rows, columns } = table.getExportRows({ selectedOnly: true });
   * const sheet = rows.map((row) =>
   *   Object.fromEntries(columns.map((c) => [c.header ?? c.key, c.format ? c.format(row[c.key], row) : row[c.key]])),
   * );
   * ```
   */
  getExportRows(options: MkTableExportRowsOptions = {}): MkTableExportRows<T> {
    let rows = this.allRows();
    if (options.selectedOnly) {
      const keys = this.selectedKeys();
      rows = rows.filter((r) => keys.has(this.rowKey(r)));
    }
    const only = options.columns ? new Set(options.columns) : null;
    const columns = this.orderedColumns()
      .filter((c) => !only || only.has(c.key))
      .map((c) => ({ key: c.key, header: c.header, format: c.format }));
    return { rows, columns };
  }

  /**
   * The table's rows as CSV: current column order, column formatters applied,
   * sorted and filtered the way they are shown, tree children flattened under
   * their parent whether or not they are expanded. Downloads the file (default name
   * `table.csv`) and returns the text. Built on {@link getExportRows}.
   */
  exportCsv(options: MkTableExportOptions = {}): string {
    const { rows, columns } = this.getExportRows(options);
    // The rows are already flat, so no childrenKey is passed through.
    const csv = mkToCsv(rows, columns, { ...options, childrenKey: undefined });
    if (options.download !== false) {
      let filename = options.filename ?? 'table.csv';
      if (!/\.csv$/i.test(filename)) filename += '.csv';
      mkDownloadText(csv, filename);
    }
    return csv;
  }

  private setTreeExpanded(row: T, expanded: boolean): void {
    const rk = this.rowKey(row);
    if (this.treeExpanded().has(rk) === expanded) return;
    const next = new Set(this.treeExpanded());
    if (expanded) next.add(rk);
    else next.delete(rk);
    this.treeExpanded.set(next);
    this.treeToggle.emit({ row, expanded });
  }

  /**
   * ArrowRight opens and ArrowLeft closes a parent row's children (swapped in
   * RTL). Handled for keys pressed on the row itself or on its tree toggle.
   */
  protected onTreeKeydown(event: KeyboardEvent, row: T): boolean {
    if (!this.childrenKey() || this.childrenOf(row).length === 0) return false;
    const rtl = this.document.defaultView?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === openKey && !this.isTreeExpanded(row)) {
      event.preventDefault();
      this.setTreeExpanded(row, true);
      return true;
    }
    if (event.key === closeKey && this.isTreeExpanded(row)) {
      event.preventDefault();
      this.setTreeExpanded(row, false);
      return true;
    }
    return false;
  }

  /** `@for` identity: group headers by value, rows by {@link trackRow}. */
  protected trackItem = (item: MkTableItem<T>): unknown =>
    item.kind === 'group' ? `mk-group:${String(item.group.key)}` : this.rowKey(item.row);

  /** Whether a group is currently collapsed. */
  protected isGroupCollapsed(key: unknown): boolean {
    return this.collapsedGroups().has(key);
  }

  /** Collapse or expand a group header. */
  protected onGroupToggle(group: MkTableGroup<T>): void {
    const next = new Set(this.collapsedGroups());
    const collapsed = !next.has(group.key);
    if (collapsed) next.add(group.key);
    else next.delete(group.key);
    this.collapsedGroups.set(next);
    this.groupToggle.emit({ key: group.key, collapsed });
  }

  /** Collapse every group. */
  collapseAllGroups(): void {
    const groups = this.groups();
    if (groups) this.collapsedGroups.set(new Set(groups.map((g) => g.key)));
  }

  /** Expand every group. */
  expandAllGroups(): void {
    this.collapsedGroups.set(new Set());
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
