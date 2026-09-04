import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';
import type { Observable, Unsubscribable } from 'rxjs';
import { mkQueryCompact, type MkQueryGroup } from '@mk-kit/ui/core';
import { mkCompactFilters, type MkSortChange, type MkTableFilters } from './table/table';
import type { MkSort, MkSortState } from './sort/sort';

/** The request handed to a {@link MkDataFetcher} on every load. */
export interface MkDataRequest {
  /** 1-based page index, matching `mk-pagination`. */
  page: number;
  /** Number of rows per page. */
  pageSize: number;
  /** Active sort, or `null` when unsorted (cleared sorts normalise to `null`). */
  sort: MkSortState | null;
  /** Free-text filter query (`''` = none). */
  filter: string;
  /** Structured filter from `mk-query-builder` (`null` = none). Compacted: no empty groups or unfinished rules. */
  query: MkQueryGroup | null;
  /**
   * Per-column filters from `mk-table`'s header filter row (`null` = none),
   * keyed by column key with empty entries dropped — see
   * {@link MkTableDataSource.setFilters}.
   */
  filters: MkTableFilters | null;
}

/** One page of server data returned by a {@link MkDataFetcher}. */
export interface MkDataPage<T> {
  /** The rows for the requested page. */
  rows: T[];
  /** Total number of rows across ALL pages (drives the pager). */
  total: number;
}

/**
 * Loads one page of data for a {@link MkDataRequest}. May return a `Promise`
 * (e.g. `fetch`) or an `Observable` (e.g. `HttpClient`); an Observable is
 * treated as single-shot — the first emission wins and the subscription is
 * released.
 */
export type MkDataFetcher<T> = (
  req: MkDataRequest,
) => Promise<MkDataPage<T>> | Observable<MkDataPage<T>>;

/** Construction options for {@link MkTableDataSource}. */
export interface MkTableDataSourceOptions {
  /** Initial rows per page (default 10, matching `mk-pagination`). */
  pageSize?: number;
  /** Debounce for {@link MkTableDataSource.setFilter} in ms (default 300). */
  filterDebounce?: number;
}

/** Default debounce applied to {@link MkTableDataSource.setFilter}. */
const DEFAULT_FILTER_DEBOUNCE = 300;
/** Default page size, matching `mk-pagination`. */
const DEFAULT_PAGE_SIZE = 10;

/** Normalise any of the kit's sort payload shapes to `MkSortState | null`. */
function normalizeSort(
  sort: MkSortState | MkSortChange | null | undefined,
): MkSortState | null {
  if (!sort) return null;
  const active = 'active' in sort ? sort.active : sort.key;
  if (!active || sort.direction === 'none') return null;
  return { active, direction: sort.direction };
}

/** Whether two normalised sort states describe the same ordering. */
function sameSort(a: MkSortState | null, b: MkSortState | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.active === b.active && a.direction === b.direction;
}

/** JSON with object keys sorted, so `{ a, b }` and `{ b, a }` compare equal. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v as object)
            .sort()
            .map((k) => [k, (v as Record<string, unknown>)[k]]),
        )
      : v,
  );
}

/** Duck-typed Observable check, so rxjs is a type-only dependency here. */
function isSubscribable<T>(
  value: Promise<T> | Observable<T>,
): value is Observable<T> {
  return typeof (value as Observable<T>).subscribe === 'function';
}

/**
 * Server-side data adapter for `mk-table` — the page/sort/filter plumbing every
 * admin screen otherwise hand-rolls. A plain class (no component, no injection
 * required): give it a fetcher and bind its signals; every setter re-queries
 * the server and **stale responses never overwrite newer state** (latest-wins).
 *
 * - `setFilter` is debounced (default 300 ms); page, sort and page size load
 *   immediately. Sort, filter and page-size changes reset to page 1.
 * - `rows` keeps its previous value while loading and on error, so the table
 *   never blanks mid-transition; `error` is cleared by the next successful
 *   load.
 * - Created in an injection context (a component field initialiser) it hooks
 *   `DestroyRef` and cleans up automatically; anywhere else, call
 *   {@link destroy} yourself.
 *
 * ```ts
 * interface User { id: number; name: string; email: string; }
 *
 * @Component({
 *   imports: [MkTable, MkPagination, MkInput],
 *   template: `
 *     <input
 *       mkInput
 *       type="search"
 *       placeholder="Search users…"
 *       (input)="ds.setFilter($any($event.target).value)"
 *     />
 *
 *     <mk-table
 *       [columns]="columns"
 *       [data]="ds.rows()"
 *       (sortChange)="ds.setSort($event)"
 *     />
 *     @if (ds.error()) { <p role="alert">Failed to load.</p> }
 *     @if (ds.empty()) { <p>No users match.</p> }
 *
 *     <mk-pagination
 *       [total]="ds.total()"
 *       [pageSize]="ds.pageSize()"
 *       [page]="ds.page()"
 *       (pageChange)="ds.setPage($event)"
 *     />
 *   `,
 * })
 * export class UsersPage {
 *   private readonly http = inject(HttpClient);
 *
 *   readonly columns: MkTableColumn<User>[] = [
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'email', header: 'Email', sortable: true },
 *   ];
 *
 *   // Field initialiser = injection context, so cleanup is automatic.
 *   readonly ds = new MkTableDataSource<User>(
 *     (req) =>
 *       this.http.get<MkDataPage<User>>('/api/users', {
 *         params: {
 *           page: req.page,
 *           size: req.pageSize,
 *           q: req.filter,
 *           ...(req.sort && {
 *             sort: `${req.sort.active},${req.sort.direction}`,
 *           }),
 *         },
 *       }),
 *     { pageSize: 20 },
 *   );
 * }
 * ```
 *
 * With a custom `mkSort` table, forward the directive instead of binding:
 *
 * ```ts
 * private readonly sort = viewChild.required(MkSort);
 * constructor() {
 *   afterNextRender(() => this.ds.connectSort(this.sort()));
 * }
 * ```
 */
export class MkTableDataSource<T> {
  private readonly fetcher: MkDataFetcher<T>;
  private readonly debounceMs: number;

  private readonly _rows = signal<T[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<unknown | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(DEFAULT_PAGE_SIZE);
  private readonly _sort = signal<MkSortState | null>(null);
  private readonly _filter = signal('');
  private readonly _query = signal<MkQueryGroup | null>(null);
  private readonly _filters = signal<MkTableFilters | null>(null);

  /** Rows of the current page (`[]` until the first load lands). */
  readonly rows = this._rows.asReadonly();
  /** Total row count across all pages (feed to `mk-pagination`'s `total`). */
  readonly total = this._total.asReadonly();
  /** True while the LATEST request is in flight. */
  readonly loading = this._loading.asReadonly();
  /** The last load's error, or `null`; cleared by the next successful load. */
  readonly error = this._error.asReadonly();
  /** Current 1-based page. */
  readonly page = this._page.asReadonly();
  /** Current page size. */
  readonly pageSize = this._pageSize.asReadonly();
  /** Current sort, or `null` when unsorted. */
  readonly sort = this._sort.asReadonly();
  /** Current filter query (updates immediately, even while debouncing). */
  readonly filter = this._filter.asReadonly();
  /** Current structured query, or `null`. */
  readonly query = this._query.asReadonly();
  /** Current per-column filters, or `null`. */
  readonly filters = this._filters.asReadonly();
  /** True when a settled load reported no rows at all. */
  readonly empty: Signal<boolean> = computed(
    () => !this._loading() && this._total() === 0,
  );

  /** Monotonic request id — settles from older epochs are discarded. */
  private epoch = 0;
  /** Subscription to an in-flight Observable fetch, if any. */
  private activeSub: Unsubscribable | null = null;
  /** Pending filter-debounce timer. */
  private filterTimer: ReturnType<typeof setTimeout> | null = null;
  /** Subscriptions created by {@link connectSort}, keyed for idempotence. */
  private readonly sortSubs = new Map<MkSort, Unsubscribable>();
  private destroyed = false;

  constructor(fetcher: MkDataFetcher<T>, opts?: MkTableDataSourceOptions) {
    this.fetcher = fetcher;
    this.debounceMs = opts?.filterDebounce ?? DEFAULT_FILTER_DEBOUNCE;
    if (opts?.pageSize != null) this._pageSize.set(opts.pageSize);

    // Auto-cleanup when constructed in an injection context (a component
    // field initialiser). Outside one, inject() throws and the consumer owns
    // calling destroy().
    try {
      inject(DestroyRef).onDestroy(() => this.destroy());
    } catch {
      // Not in an injection context — manual destroy().
    }

    this.load();
  }

  /** Jump to a 1-based page and load it immediately. */
  setPage(page: number): void {
    const next = Math.max(1, Math.floor(page));
    if (next === this._page()) return;
    this._page.set(next);
    this.load();
  }

  /** Change the page size; resets to page 1 and loads immediately. */
  setPageSize(size: number): void {
    const next = Math.max(1, Math.floor(size));
    if (next === this._pageSize()) return;
    this._pageSize.set(next);
    this._page.set(1);
    this.load();
  }

  /**
   * Change the sort; resets to page 1 and loads immediately. Accepts either
   * the `mkSort` directive's {@link MkSortState} or `mk-table`'s
   * {@link MkSortChange} payload; a cleared sort (`direction: 'none'` or an
   * empty column id) normalises to `null`. A no-op when the sort is unchanged.
   */
  setSort(sort: MkSortState | MkSortChange | null): void {
    const next = normalizeSort(sort);
    if (sameSort(next, this._sort())) return;
    this._sort.set(next);
    this._page.set(1);
    this.load();
  }

  /**
   * Change the free-text filter. The `filter` signal updates (and the page
   * resets to 1) immediately, but the request is debounced — `refresh()`
   * flushes it early. A no-op when the query is unchanged.
   */
  setFilter(query: string): void {
    if (query === this._filter()) return;
    this._filter.set(query);
    this._page.set(1);
    this.cancelDebounce();
    if (this.destroyed) return;
    this.filterTimer = setTimeout(() => {
      this.filterTimer = null;
      this.load();
    }, this.debounceMs);
  }

  /**
   * Set (or clear with `null`) the structured query from `mk-query-builder`.
   * Empty groups and unfinished rules are dropped before the request; a query
   * with nothing left is sent as `null`. Resets to page 1 and loads at once.
   */
  setQuery(query: MkQueryGroup | null): void {
    const compact = query ? mkQueryCompact(query) : null;
    const next = compact && compact.rules.length ? compact : null;
    if (JSON.stringify(next) === JSON.stringify(this._query())) return;
    this._query.set(next);
    this._page.set(1);
    this.load();
  }

  /**
   * Set (or clear with `null` / `{}`) the per-column filters from `mk-table`'s
   * header filter row — bind `(filtersChange)="ds.setFilters($event)"` and
   * turn the table's `clientFilter` off. Empty entries are dropped before the
   * request; nothing left is sent as `null`. Resets to page 1 and loads at
   * once (the table already debounces nothing, so debounce the fetcher if
   * your API needs it). A no-op when unchanged.
   */
  setFilters(filters: MkTableFilters | null): void {
    const next = mkCompactFilters(filters);
    if (canonicalJson(next) === canonicalJson(this._filters())) return;
    this._filters.set(next);
    this._page.set(1);
    this.load();
  }

  /**
   * Re-run the current request immediately (e.g. after a mutation). Flushes a
   * pending debounced filter, since the request reads the live filter value.
   */
  refresh(): void {
    this.load();
  }

  /**
   * Back to page 1 and load — the "filters changed outside the search box"
   * case. Unlike {@link setPage}, this loads even when already on page 1, so
   * callers no longer need `page() === 1 ? refresh() : setPage(1)`.
   */
  reload(): void {
    this._page.set(1);
    this.load();
  }

  /**
   * Pipe an `mkSort` directive's changes into {@link setSort}. Idempotent per
   * directive instance; all subscriptions are released by {@link destroy}.
   */
  connectSort(sort: MkSort): void {
    if (this.destroyed || this.sortSubs.has(sort)) return;
    this.sortSubs.set(
      sort,
      sort.sortChange.subscribe((state) => this.setSort(state)),
    );
  }

  /**
   * Cancel pending work: the debounce timer, any in-flight Observable fetch,
   * and `connectSort` subscriptions. In-flight Promise settles are discarded.
   * Called automatically on host destroy when created in an injection context.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.epoch++; // Anything still in flight settles stale.
    this.cancelDebounce();
    this.unsubscribeActive();
    for (const sub of this.sortSubs.values()) sub.unsubscribe();
    this.sortSubs.clear();
    this._loading.set(false);
  }

  /** Start a load for the current request state; supersedes any in flight. */
  private load(): void {
    if (this.destroyed) return;
    this.cancelDebounce();
    this.unsubscribeActive();
    const epoch = ++this.epoch;
    this._loading.set(true);
    const req: MkDataRequest = {
      page: this._page(),
      pageSize: this._pageSize(),
      sort: this._sort(),
      filter: this._filter(),
      query: this._query(),
      filters: this._filters(),
    };
    let result: Promise<MkDataPage<T>> | Observable<MkDataPage<T>>;
    try {
      result = this.fetcher(req);
    } catch (err) {
      this.settleError(epoch, err);
      return;
    }
    if (isSubscribable(result)) {
      this.runObservable(result, epoch);
    } else {
      result.then(
        (page) => this.settleSuccess(epoch, page),
        (err) => this.settleError(epoch, err),
      );
    }
  }

  /** Subscribe single-shot: first emission (or error) settles, then release. */
  private runObservable(source: Observable<MkDataPage<T>>, epoch: number): void {
    let done = false;
    let sync = true;
    const sub = source.subscribe({
      next: (page) => {
        if (done) return;
        done = true;
        this.settleSuccess(epoch, page);
        if (!sync) this.clearSub(sub);
      },
      error: (err) => {
        if (done) return;
        done = true;
        this.settleError(epoch, err);
        if (!sync) this.clearSub(sub);
      },
    });
    sync = false;
    if (done) sub.unsubscribe();
    else this.activeSub = sub;
  }

  /** Apply a successful settle, unless a newer request superseded it. */
  private settleSuccess(epoch: number, page: MkDataPage<T>): void {
    if (epoch !== this.epoch || this.destroyed) return;
    this._rows.set(page.rows);
    this._total.set(page.total);
    this._error.set(null);
    this._loading.set(false);
  }

  /** Record a failed settle (rows/total untouched), unless superseded. */
  private settleError(epoch: number, err: unknown): void {
    if (epoch !== this.epoch || this.destroyed) return;
    this._error.set(err);
    this._loading.set(false);
  }

  private cancelDebounce(): void {
    if (this.filterTimer != null) {
      clearTimeout(this.filterTimer);
      this.filterTimer = null;
    }
  }

  private unsubscribeActive(): void {
    if (this.activeSub) {
      this.activeSub.unsubscribe();
      this.activeSub = null;
    }
  }

  private clearSub(sub: Unsubscribable): void {
    if (this.activeSub === sub) this.activeSub = null;
    sub.unsubscribe();
  }
}

/** Options for {@link mkClientFetcher}. */
export interface MkClientFetcherOptions<T> {
  /** Row matcher for `setFilter` text; default: case-insensitive substring over every string/number field. */
  match?: (row: T, query: string) => boolean;
  /** Comparator for an active sort; default: locale compare on `row[sort.active]`. */
  compare?: (a: T, b: T, sort: MkSortState) => number;
}

/**
 * In-memory {@link MkDataFetcher}: filter, sort and slice a full row set that
 * the app already holds (an API that returns everything). Lets a client-side
 * list use {@link MkTableDataSource} — same pager, footer and API as a
 * server-paged one — without hand-rolling `filtered/sorted/paged` computeds.
 *
 * ```ts
 * ds = new MkTableDataSource(mkClientFetcher(() => this.rows()));
 * ```
 */
export function mkClientFetcher<T>(
  rows: () => readonly T[],
  opts: MkClientFetcherOptions<T> = {},
): (req: MkDataRequest) => Promise<MkDataPage<T>> {
  const match =
    opts.match ??
    ((row: T, q: string) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        (typeof v === 'string' || typeof v === 'number') &&
        String(v).toLowerCase().includes(q),
      ));
  const compare =
    opts.compare ??
    ((a: T, b: T, sort: MkSortState) => {
      const av = (a as Record<string, unknown>)[sort.active];
      const bv = (b as Record<string, unknown>)[sort.active];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    });
  return (req) => {
    const q = req.filter.trim().toLowerCase();
    let out = q ? rows().filter((r) => match(r, q)) : [...rows()];
    if (req.sort && req.sort.direction !== 'none') {
      const dir = req.sort.direction === 'desc' ? -1 : 1;
      out = [...out].sort((a, b) => dir * compare(a, b, req.sort as MkSortState));
    }
    const start = (req.page - 1) * req.pageSize;
    return Promise.resolve({ rows: out.slice(start, start + req.pageSize), total: out.length });
  };
}
