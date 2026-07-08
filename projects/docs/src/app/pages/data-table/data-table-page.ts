import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkBadge,
  MkButton,
  MkInput,
  MkPagination,
  MkTable,
  MkToastService,
  type MkSortChange,
  type MkSortDirection,
  type MkTableColumn,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

interface TableUser {
  name: string;
  email: string;
  role: string;
  team: string;
  status: string;
  orders: number;
  joined: string;
}

/**
 * Data table pattern page — one production-grade example wiring together search
 * filtering, client-side sorting, row selection with a bulk-action toolbar and
 * pagination, all driven by signals and a single computed pipeline.
 */
@Component({
  selector: 'docs-data-table-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    FormsModule,
    MkBadge,
    MkButton,
    MkInput,
    MkPagination,
    MkTable,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Data table</h1>
      <p class="docs-lead">
        A production-ready table pattern that combines search filtering,
        column sorting, row selection with a bulk-action toolbar and
        pagination. Filtering and sorting run over the full dataset in the
        component; only the current page slice is handed to
        <code class="docs-inline">mk-table</code>. Everything is driven by
        signals and a single <code class="docs-inline">computed</code> pipeline,
        themed entirely with <code class="docs-inline">--mk-*</code> tokens.
      </p>

      <!-- =================== LIVE EXAMPLE =================== -->
      <section class="dt-card" aria-label="Users">
        <!-- Toolbar: search + bulk actions -->
        <div class="dt-toolbar">
          <div class="dt-search">
            <span class="dt-search__icon" aria-hidden="true">🔎</span>
            <input
              mkInput
              type="search"
              class="dt-search__input"
              placeholder="Search name, email or team…"
              aria-label="Search users"
              [ngModel]="query()"
              (ngModelChange)="onQuery($event)"
            />
          </div>

          @if (selected().length > 0) {
            <div class="dt-bulk" role="status">
              <mk-badge tone="primary" variant="soft">
                {{ selected().length }} selected
              </mk-badge>
              <button
                mkButton
                size="sm"
                variant="soft"
                tone="neutral"
                (click)="exportSelected()"
              >
                Export
              </button>
              <button
                mkButton
                size="sm"
                variant="soft"
                tone="danger"
                (click)="deleteSelected()"
              >
                Delete
              </button>
            </div>
          }
        </div>

        <!-- The table (current page slice only) -->
        <mk-table
          [columns]="columns"
          [data]="pageRows()"
          selectable
          trackKey="email"
          [(selected)]="selected"
          stickyHeader
          zebra
          density="comfortable"
          emptyMessage="No users match your search."
          (sortChange)="onSort($event)"
          class="dt-table"
        />

        <!-- Footer: caption + pagination -->
        <div class="dt-footer">
          <span class="dt-caption">{{ caption() }}</span>
          <mk-pagination
            [total]="filtered().length"
            [pageSize]="pageSize"
            [(page)]="page"
            label="Users pages"
          />
        </div>
      </section>

      <!-- =================== HOW IT WORKS =================== -->
      <h2>How it works</h2>
      <p>
        The template is thin — the logic lives in a chain of computed signals.
        <code class="docs-inline">filtered()</code> narrows the source rows by
        the search <code class="docs-inline">query</code>,
        <code class="docs-inline">sorted()</code> orders that set from the
        <code class="docs-inline">sortKey</code>/<code class="docs-inline">sortDir</code>
        mirrored out of the table's
        <code class="docs-inline">sortChange</code>, and
        <code class="docs-inline">pageRows()</code> slices it to the active
        page. Selection is tracked by <code class="docs-inline">email</code> so
        it survives paging and filtering.
      </p>
      <docs-example [code]="pipelineCode" column>
        <p class="dt-note">
          The live example above is this exact pipeline — try searching,
          sorting a column, selecting rows across pages, then running a bulk
          action.
        </p>
      </docs-example>

      <h2>Template</h2>
      <docs-example [code]="templateCode" column>
        <p class="dt-note">
          <code class="docs-inline">[(selected)]</code> and
          <code class="docs-inline">[(page)]</code> bind two-way straight to
          signals; the table renders only <code class="docs-inline">pageRows()</code>.
        </p>
      </docs-example>

      <!-- =================== PROPS =================== -->
      <h2>Pieces used</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Prop / part</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">selectable</code> <em>(mk-table)</em></td>
            <td><code class="docs-inline">boolean</code></td>
            <td>Renders a leading checkbox column with a header select-all.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selected</code> <em>(mk-table)</em></td>
            <td><code class="docs-inline">model&lt;T[]&gt;</code></td>
            <td>Two-way <code class="docs-inline">[(selected)]</code> array of selected rows.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">trackKey</code> <em>(mk-table)</em></td>
            <td><code class="docs-inline">string</code></td>
            <td>Row identity key for selection equality — here <code class="docs-inline">"email"</code>, so selection persists across pages.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selectionChange</code> <em>(mk-table)</em></td>
            <td><code class="docs-inline">output&lt;T[]&gt;</code></td>
            <td>Fires with the new selection (alternative to <code class="docs-inline">[(selected)]</code>).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">sortChange</code> <em>(mk-table)</em></td>
            <td><code class="docs-inline">output&lt;MkSortChange&gt;</code></td>
            <td>Emits <code class="docs-inline">key</code> + <code class="docs-inline">direction</code> (<code class="docs-inline">asc</code> / <code class="docs-inline">desc</code> / <code class="docs-inline">none</code>) — mirrored into the component to sort the full set.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">sortable</code> <em>(column)</em></td>
            <td><code class="docs-inline">boolean</code></td>
            <td>Enables the keyboard-operable sort header for a column.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">total</code> / <code class="docs-inline">pageSize</code> <em>(mk-pagination)</em></td>
            <td><code class="docs-inline">number</code></td>
            <td>Total items and page size; the page count is derived.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">page</code> <em>(mk-pagination)</em></td>
            <td><code class="docs-inline">model&lt;number&gt;</code></td>
            <td>Two-way <code class="docs-inline">[(page)]</code> 1-based current page.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkInput</code> <em>(search)</em></td>
            <td><code class="docs-inline">attribute</code></td>
            <td>Native <code class="docs-inline">&lt;input&gt;</code> themed by mk-kit; bound with <code class="docs-inline">ngModel</code>.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      h2 {
        margin-top: var(--mk-space-9, 3rem);
      }
      .dt-card {
        display: flex;
        flex-direction: column;
        background: var(--mk-surface);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        overflow: hidden;
      }
      .dt-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mk-space-3);
        flex-wrap: wrap;
        padding: var(--mk-space-4);
        border-bottom: 1px solid var(--mk-border);
      }
      .dt-search {
        position: relative;
        flex: 1 1 16rem;
        min-width: 12rem;
      }
      .dt-search__icon {
        position: absolute;
        top: 50%;
        left: var(--mk-space-3);
        transform: translateY(-50%);
        font-size: var(--mk-font-size-sm);
        pointer-events: none;
        opacity: 0.7;
      }
      .dt-search__input {
        width: 100%;
        padding-left: var(--mk-space-8);
      }
      .dt-bulk {
        display: flex;
        align-items: center;
        gap: var(--mk-space-2);
      }
      .dt-table {
        display: block;
        max-height: 32rem;
        overflow: auto;
      }
      .dt-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mk-space-3);
        flex-wrap: wrap;
        padding: var(--mk-space-3) var(--mk-space-4);
        border-top: 1px solid var(--mk-border);
      }
      .dt-caption {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-subtle);
      }
      .dt-note {
        margin: 0;
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-sm);
      }
    `,
  ],
})
export class DataTablePage {
  private readonly toast = inject(MkToastService);

  // ----- Column definitions --------------------------------------------
  protected readonly columns: MkTableColumn<TableUser>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'team', header: 'Team', sortable: true },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      format: (v) => String(v).toUpperCase(),
    },
    { key: 'orders', header: 'Orders', sortable: true, align: 'end' },
    { key: 'joined', header: 'Joined', sortable: true },
  ];

  // ----- Source data (signal so bulk-delete is reactive) ---------------
  private readonly rows = signal<TableUser[]>([
    { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', team: 'Platform', status: 'active', orders: 42, joined: '2023-01-14' },
    { name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor', team: 'Compilers', status: 'active', orders: 17, joined: '2023-02-02' },
    { name: 'Alan Turing', email: 'alan@example.com', role: 'Viewer', team: 'Research', status: 'invited', orders: 8, joined: '2023-03-19' },
    { name: 'Katherine Johnson', email: 'kat@example.com', role: 'Editor', team: 'Orbital', status: 'active', orders: 63, joined: '2023-03-28' },
    { name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'Admin', team: 'Platform', status: 'suspended', orders: 29, joined: '2023-04-11' },
    { name: 'Barbara Liskov', email: 'barbara@example.com', role: 'Viewer', team: 'Research', status: 'active', orders: 51, joined: '2023-05-06' },
    { name: 'Donald Knuth', email: 'don@example.com', role: 'Admin', team: 'Compilers', status: 'active', orders: 74, joined: '2023-05-22' },
    { name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Editor', team: 'Orbital', status: 'active', orders: 38, joined: '2023-06-15' },
    { name: 'John von Neumann', email: 'john@example.com', role: 'Admin', team: 'Research', status: 'invited', orders: 21, joined: '2023-07-01' },
    { name: 'Tim Berners-Lee', email: 'tim@example.com', role: 'Editor', team: 'Platform', status: 'active', orders: 55, joined: '2023-07-19' },
    { name: 'Linus Torvalds', email: 'linus@example.com', role: 'Admin', team: 'Kernel', status: 'active', orders: 90, joined: '2023-08-03' },
    { name: 'Guido van Rossum', email: 'guido@example.com', role: 'Editor', team: 'Compilers', status: 'suspended', orders: 12, joined: '2023-08-27' },
    { name: 'Ken Thompson', email: 'ken@example.com', role: 'Admin', team: 'Kernel', status: 'active', orders: 47, joined: '2023-09-09' },
    { name: 'Dennis Ritchie', email: 'dennis@example.com', role: 'Admin', team: 'Kernel', status: 'active', orders: 68, joined: '2023-09-30' },
    { name: 'Vint Cerf', email: 'vint@example.com', role: 'Viewer', team: 'Network', status: 'invited', orders: 5, joined: '2023-10-12' },
    { name: 'Radia Perlman', email: 'radia@example.com', role: 'Editor', team: 'Network', status: 'active', orders: 33, joined: '2023-10-25' },
    { name: 'Bjarne Stroustrup', email: 'bjarne@example.com', role: 'Editor', team: 'Compilers', status: 'active', orders: 44, joined: '2023-11-08' },
    { name: 'James Gosling', email: 'james@example.com', role: 'Viewer', team: 'Platform', status: 'suspended', orders: 9, joined: '2023-11-21' },
    { name: 'Anders Hejlsberg', email: 'anders@example.com', role: 'Admin', team: 'Compilers', status: 'active', orders: 61, joined: '2023-12-04' },
    { name: 'Brendan Eich', email: 'brendan@example.com', role: 'Editor', team: 'Network', status: 'active', orders: 27, joined: '2023-12-18' },
    { name: 'Sophie Wilson', email: 'sophie@example.com', role: 'Editor', team: 'Kernel', status: 'active', orders: 39, joined: '2024-01-09' },
    { name: 'Carl Sassenrath', email: 'carl@example.com', role: 'Viewer', team: 'Orbital', status: 'invited', orders: 3, joined: '2024-01-23' },
    { name: 'Fran Allen', email: 'fran@example.com', role: 'Admin', team: 'Research', status: 'active', orders: 58, joined: '2024-02-06' },
    { name: 'Leslie Lamport', email: 'leslie@example.com', role: 'Editor', team: 'Network', status: 'active', orders: 46, joined: '2024-02-20' },
  ]);

  // ----- Interaction state ---------------------------------------------
  protected readonly pageSize = 8;
  protected readonly query = signal('');
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal<Exclude<MkSortDirection, 'none'> | null>(
    null,
  );
  protected readonly selected = signal<TableUser[]>([]);
  protected readonly page = signal(1);

  // ----- Computed pipeline: filter -> sort -> paginate -----------------
  protected readonly filtered = computed<TableUser[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.team.toLowerCase().includes(q),
    );
  });

  protected readonly sorted = computed<TableUser[]>(() => {
    const key = this.sortKey();
    const dir = this.sortDir();
    const rows = this.filtered();
    if (!key || !dir) return rows;
    const out = [...rows].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[key];
      const bv = (b as unknown as Record<string, unknown>)[key];
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return dir === 'desc' ? out.reverse() : out;
  });

  protected readonly pageRows = computed<TableUser[]>(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sorted().slice(start, start + this.pageSize);
  });

  protected readonly caption = computed<string>(() => {
    const total = this.filtered().length;
    if (total === 0) return 'No results';
    const start = (this.page() - 1) * this.pageSize + 1;
    const end = Math.min(this.page() * this.pageSize, total);
    return `Showing ${start}–${end} of ${total}`;
  });

  // ----- Handlers ------------------------------------------------------
  protected onQuery(value: string): void {
    this.query.set(value);
    this.page.set(1); // reset to first page on a new search
  }

  protected onSort(change: MkSortChange): void {
    if (change.direction === 'none') {
      this.sortKey.set(null);
      this.sortDir.set(null);
    } else {
      this.sortKey.set(change.key);
      this.sortDir.set(change.direction);
    }
  }

  protected exportSelected(): void {
    const n = this.selected().length;
    this.toast.success(`Exported ${n} ${n === 1 ? 'user' : 'users'}`);
    this.selected.set([]);
  }

  protected deleteSelected(): void {
    const doomed = new Set(this.selected().map((u) => u.email));
    const n = doomed.size;
    this.rows.update((rows) => rows.filter((u) => !doomed.has(u.email)));
    this.selected.set([]);
    this.page.set(1);
    this.toast.danger(`Deleted ${n} ${n === 1 ? 'user' : 'users'}`);
  }

  // ----- Code snippets -------------------------------------------------
  protected readonly pipelineCode = `readonly pageSize = 8;
readonly query   = signal('');
readonly sortKey = signal<string | null>(null);
readonly sortDir = signal<'asc' | 'desc' | null>(null);
readonly selected = signal<User[]>([]);
readonly page    = signal(1);

// 1) filter over the full dataset
readonly filtered = computed(() => {
  const q = this.query().trim().toLowerCase();
  if (!q) return this.rows();
  return this.rows().filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    u.team.toLowerCase().includes(q));
});

// 2) sort the filtered set (mirrors the table's sortChange)
readonly sorted = computed(() => {
  const key = this.sortKey(), dir = this.sortDir();
  const rows = this.filtered();
  if (!key || !dir) return rows;
  const out = [...rows].sort((a, b) =>
    typeof a[key] === 'number' && typeof b[key] === 'number'
      ? a[key] - b[key]
      : String(a[key]).localeCompare(String(b[key])));
  return dir === 'desc' ? out.reverse() : out;
});

// 3) slice the current page -> handed to [data]
readonly pageRows = computed(() => {
  const start = (this.page() - 1) * this.pageSize;
  return this.sorted().slice(start, start + this.pageSize);
});

onQuery(v: string) { this.query.set(v); this.page.set(1); }
onSort(c: MkSortChange) {
  if (c.direction === 'none') { this.sortKey.set(null); this.sortDir.set(null); }
  else { this.sortKey.set(c.key); this.sortDir.set(c.direction); }
}`;

  protected readonly templateCode = `<!-- search -->
<input mkInput type="search" placeholder="Search…"
  [ngModel]="query()" (ngModelChange)="onQuery($event)" />

<!-- bulk-action toolbar -->
@if (selected().length > 0) {
  <span>{{ selected().length }} selected</span>
  <button mkButton size="sm" variant="soft" (click)="exportSelected()">Export</button>
  <button mkButton size="sm" variant="soft" tone="danger" (click)="deleteSelected()">Delete</button>
}

<!-- table gets only the current page slice -->
<mk-table
  [columns]="columns"
  [data]="pageRows()"
  selectable
  trackKey="email"
  [(selected)]="selected"
  stickyHeader zebra
  (sortChange)="onSort($event)" />

<!-- footer -->
<span>{{ caption() }}</span>
<mk-pagination
  [total]="filtered().length"
  [pageSize]="pageSize"
  [(page)]="page" />`;
}
