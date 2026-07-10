import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkDescItem,
  MkDescriptionList,
  MkInlineEdit,
  MkTable,
  MkTableRowDetail,
  type MkSortChange,
  type MkTableColumn,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

interface DemoUser {
  name: string;
  email: string;
  role: string;
  orders: number;
  status: string;
}

/**
 * Table & data grid demo page — Table, expandable rows, inline edit and the
 * data-grid pro features.
 */
@Component({
  selector: 'docs-table-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkDescItem,
    MkDescriptionList,
    MkInlineEdit,
    MkTable,
    MkTableRowDetail,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Table & data grid</h1>
      <p class="docs-lead">
        A fully sortable data table built on a native
        <code class="docs-inline">&lt;table&gt;</code> — with expandable rows,
        click-to-edit text and opt-in data-grid power features like column
        resize, reorder, pinning and inline cell editing. Every component is
        themed with <code class="docs-inline">--mk-*</code> tokens and ships
        with sensible accessibility defaults.
      </p>

      <!-- ============================ TABLE ========================== -->
      <h2>Table</h2>
      <p>
        A themed data table built on a native <code class="docs-inline">&lt;table&gt;</code>.
        Supply <code class="docs-inline">columns</code> and
        <code class="docs-inline">data</code>; opt into sortable columns, a sticky
        header, zebra striping and compact density. Sorting is keyboard operable
        (Enter/Space on a header). Click a header to sort or click a row —
        status:
        <strong>{{ tableStatus() }}</strong>.
      </p>
      <docs-example [code]="tableCode" column>
        <mk-table
          [columns]="columns"
          [data]="users"
          stickyHeader
          zebra
          clickableRows
          density="comfortable"
          (sortChange)="onSort($event)"
          (rowClick)="onRowClick($event)"
          style="width: 100%; max-height: 20rem"
        />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">columns</code> <em>(required)</em></td>
            <td><code class="docs-inline">MkTableColumn&lt;T&gt;[]</code></td>
            <td>—</td>
            <td>Column defs; order = display order.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">data</code></td>
            <td><code class="docs-inline">T[]</code></td>
            <td><code class="docs-inline">[]</code></td>
            <td>Row objects to render.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">stickyHeader</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Pin the header to the scroll container top.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">zebra</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Alternate row background.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">hover</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code></td>
            <td>Highlight rows on hover.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">density</code></td>
            <td><code class="docs-inline">'comfortable' | 'compact'</code></td>
            <td><code class="docs-inline">'comfortable'</code></td>
            <td>Row vertical density.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">clickableRows</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Style rows as clickable and emit <code class="docs-inline">rowClick</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">emptyMessage</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">'No data to display'</code></td>
            <td>Shown when there are no rows.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">sortChange</code></td>
            <td><code class="docs-inline">output&lt;MkSortChange&gt;</code></td>
            <td>—</td>
            <td><code class="docs-inline">{{ '{' }} key, direction {{ '}' }}</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">rowClick</code></td>
            <td><code class="docs-inline">output&lt;T&gt;</code></td>
            <td>—</td>
            <td>Emitted when a row is clicked.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each column is an <code class="docs-inline">MkTableColumn</code> with
        <code class="docs-inline">key</code>,
        <code class="docs-inline">header</code>, optional
        <code class="docs-inline">sortable</code>,
        <code class="docs-inline">align</code>,
        <code class="docs-inline">width</code> and a
        <code class="docs-inline">format</code> callback.
      </p>

      <h2>Expandable rows</h2>
      <p>
        Set <code class="docs-inline">expandable</code> to add a leading expander
        column. Each row reveals a detail panel supplied via an
        <code class="docs-inline">&lt;ng-template mkTableRowDetail let-row&gt;</code>
        — the row object is the template's implicit context. Add
        <code class="docs-inline">singleExpand</code> for accordion behaviour.
        Expanded: <strong>{{ expandedNames() }}</strong>.
      </p>
      <docs-example [code]="expandableCode" column>
        <mk-table
          [columns]="columns"
          [data]="users"
          expandable
          hover
          trackKey="email"
          (expandedChange)="onExpand($event)"
          style="width: 100%"
        >
          <ng-template mkTableRowDetail let-row>
            <mk-description-list layout="stacked">
              <mk-desc-item term="Email">{{ row.email }}</mk-desc-item>
              <mk-desc-item term="Role">{{ row.role }}</mk-desc-item>
              <mk-desc-item term="Status">{{ row.status }}</mk-desc-item>
            </mk-description-list>
          </ng-template>
        </mk-table>
      </docs-example>

      <h2>Inline edit</h2>
      <p>
        <code class="docs-inline">&lt;mk-inline-edit&gt;</code> turns text into a
        click-to-edit field: click (or focus + Enter) to edit, Enter or blur
        saves, Escape reverts. Add <code class="docs-inline">multiline</code> for
        a textarea. Its model is a <code class="docs-inline">string</code>.
      </p>
      <docs-example [code]="inlineEditCode" [column]="true">
        <div style="display: grid; gap: var(--mk-space-3); max-width: 22rem;">
          <mk-inline-edit [(value)]="editTitle" ariaLabel="Edit title" />
          <mk-inline-edit multiline [(value)]="editNotes" ariaLabel="Edit notes" />
          <p class="echo">Title: {{ editTitle() || '—' }}</p>
        </div>
      </docs-example>

      <h2>Data-grid pro</h2>
      <p>
        Opt-in power features on the same <code class="docs-inline">mk-table</code>:
        <strong>resize</strong> columns from the header edge, <strong>reorder</strong>
        them by dragging headers, <strong>pin</strong> a column so it stays put
        while the rest scroll horizontally, and <strong>edit</strong> cells
        inline (double-click). Set <code class="docs-inline">resizableColumns</code>
        / <code class="docs-inline">reorderableColumns</code> and mark columns
        <code class="docs-inline">resizable</code> /
        <code class="docs-inline">editable</code> /
        <code class="docs-inline">pinned</code>.
        Everything is keyboard operable too: resize with the Arrow keys on a
        focused column separator (hold Shift for 1px steps), reorder with
        Alt+Arrow on a focused header, and start a cell edit with Enter or F2
        on a focused cell.
        Last edit: <strong>{{ gridStatus() }}</strong>.
      </p>
      <docs-example [code]="gridProCode" column>
        <mk-table
          [columns]="gridColumns"
          [data]="gridRows()"
          resizableColumns
          reorderableColumns
          zebra
          (cellEdit)="onCellEdit($event)"
          style="width: 100%"
        />
      </docs-example>

      <p><strong>Keyboard:</strong></p>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd> (on a sortable header)</td><td>Cycle sorting: ascending → descending → cleared. Changes are announced to screen readers.</td></tr>
          <tr><td><kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd> (on a focused column separator)</td><td>Shrink / widen the column by 10&nbsp;px (never below the column's <code class="docs-inline">minWidth</code>, default 60&nbsp;px). The new width is announced.</td></tr>
          <tr><td><kbd>Shift</kbd>+<kbd>ArrowLeft</kbd> / <kbd>Shift</kbd>+<kbd>ArrowRight</kbd> (on a separator)</td><td>Fine-grained resize in 1&nbsp;px steps.</td></tr>
          <tr><td><kbd>Alt</kbd>+<kbd>ArrowLeft</kbd> / <kbd>Alt</kbd>+<kbd>ArrowRight</kbd> (on a focused header)</td><td>Move the column one position left / right (pinned columns cannot be reordered). The new position is announced.</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>F2</kbd> (on a focused editable cell)</td><td>Start inline editing the cell.</td></tr>
          <tr><td><kbd>Enter</kbd> (while editing)</td><td>Save the new value and restore focus to the cell. Blurring the input also saves.</td></tr>
          <tr><td><kbd>Escape</kbd> (while editing)</td><td>Cancel the edit and restore focus to the cell.</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd> (on a focused row, with <code class="docs-inline">clickableRows</code>)</td><td>Activate the row — emits <code class="docs-inline">rowClick</code>.</td></tr>
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
    `,
  ],
})
export class TablePage {
  // ----- Table ---------------------------------------------------------
  protected readonly columns: MkTableColumn<DemoUser>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'orders', header: 'Orders', sortable: true, align: 'end' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      format: (v) => String(v).toUpperCase(),
    },
  ];

  protected readonly users: DemoUser[] = [
    { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', orders: 42, status: 'active' },
    { name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor', orders: 17, status: 'active' },
    { name: 'Alan Turing', email: 'alan@example.com', role: 'Viewer', orders: 8, status: 'invited' },
    { name: 'Katherine Johnson', email: 'kat@example.com', role: 'Editor', orders: 63, status: 'active' },
    { name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'Admin', orders: 29, status: 'suspended' },
    { name: 'Barbara Liskov', email: 'barbara@example.com', role: 'Viewer', orders: 51, status: 'active' },
  ];

  protected readonly tableStatus = signal('idle');

  protected onSort(change: MkSortChange): void {
    this.tableStatus.set(
      change.direction === 'none'
        ? `cleared sort on ${change.key}`
        : `sorted by ${change.key} (${change.direction})`,
    );
  }

  protected onRowClick(row: DemoUser): void {
    this.tableStatus.set(`clicked ${row.name}`);
  }

  // ----- Inline edit ---------------------------------------------------
  protected readonly editTitle = signal('Q3 marketing plan');
  protected readonly editNotes = signal('Draft — review before sending.');
  protected readonly inlineEditCode = `<mk-inline-edit [(value)]="title" />
<mk-inline-edit multiline [(value)]="notes" />`;

  // ----- Expandable rows ----------------------------------------------
  protected readonly expandedRows = signal<DemoUser[]>([]);
  protected readonly expandedNames = computed(() => {
    const rows = this.expandedRows();
    return rows.length ? rows.map((r) => r.name).join(', ') : 'none';
  });

  protected onExpand(rows: DemoUser[]): void {
    this.expandedRows.set(rows);
  }

  // ----- Data-grid pro -------------------------------------------------
  protected readonly gridColumns: MkTableColumn<DemoUser>[] = [
    { key: 'name', header: 'Name', pinned: 'left', width: '160px', resizable: true, sortable: true },
    { key: 'email', header: 'Email', resizable: true, editable: true, width: '220px' },
    { key: 'role', header: 'Role', resizable: true, editable: true, width: '140px' },
    { key: 'orders', header: 'Orders', align: 'end', resizable: true, width: '110px' },
    { key: 'status', header: 'Status', align: 'center', editable: true, width: '130px' },
  ];
  protected readonly gridRows = signal<DemoUser[]>(this.users.slice(0, 5));
  protected readonly gridStatus = signal('—');

  protected onCellEdit(e: { row: DemoUser; key: string; value: string }): void {
    this.gridRows.update((rows) =>
      rows.map((r) =>
        r === e.row ? { ...r, [e.key]: e.value } : r,
      ),
    );
    this.gridStatus.set(`${e.key} → "${e.value}"`);
  }

  // ----- Code snippets -------------------------------------------------
  protected readonly tableCode = `columns: MkTableColumn<User>[] = [
  { key: 'name',   header: 'Name',   sortable: true },
  { key: 'email',  header: 'Email' },
  { key: 'role',   header: 'Role',   sortable: true },
  { key: 'orders', header: 'Orders', sortable: true, align: 'end' },
  { key: 'status', header: 'Status', align: 'center',
    format: (v) => String(v).toUpperCase() },
];

<mk-table
  [columns]="columns"
  [data]="users"
  stickyHeader
  zebra
  clickableRows
  (sortChange)="onSort($event)"
  (rowClick)="onRowClick($event)" />`;

  protected readonly gridProCode = `columns: MkTableColumn<User>[] = [
  { key: 'name',  header: 'Name',  pinned: 'left', resizable: true, sortable: true },
  { key: 'email', header: 'Email', resizable: true, editable: true },
  { key: 'role',  header: 'Role',  resizable: true, editable: true },
  // …
];

<mk-table
  [columns]="columns" [data]="rows()"
  resizableColumns reorderableColumns
  (cellEdit)="onCellEdit($event)" />
// Drag header edges to resize · drag headers to reorder · double-click a cell to edit`;

  protected readonly expandableCode = `<mk-table
  [columns]="columns"
  [data]="users"
  expandable
  trackKey="email"
  (expandedChange)="onExpand($event)"
>
  <ng-template mkTableRowDetail let-row>
    <mk-description-list layout="stacked">
      <mk-desc-item term="Email">{{ row.email }}</mk-desc-item>
      <mk-desc-item term="Role">{{ row.role }}</mk-desc-item>
    </mk-description-list>
  </ng-template>
</mk-table>`;
}
