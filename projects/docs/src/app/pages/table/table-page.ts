import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkDescItem,
  MkDescriptionList,
  MkInlineEdit,
  MkTable,
  MkTableCell,
  MkTableRowDetail,
  MkTag,
  type MkSortChange,
  type MkTableColumn,
  type MkTone,
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
    MkTableCell,
    MkTableRowDetail,
    MkTag,
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
          <tr>
            <td><code class="docs-inline">groupBy</code></td>
            <td><code class="docs-inline">string | ((row: T) =&gt; unknown) | null</code></td>
            <td><code class="docs-inline">null</code></td>
            <td>Group rows under sticky, collapsible headers.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">groupLabel</code></td>
            <td><code class="docs-inline">(value, rows) =&gt; string</code></td>
            <td><code class="docs-inline">String(value)</code></td>
            <td>Formats a group header's label.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">groupToggle</code></td>
            <td><code class="docs-inline">output&lt;MkGroupToggle&gt;</code></td>
            <td>—</td>
            <td><code class="docs-inline">{{ '{' }} key, collapsed {{ '}' }}</code> per header toggle.</td>
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

      <h2>Custom cell templates</h2>
      <p>
        A <code class="docs-inline">format</code> callback can only return a
        string. For anything richer — a status tag, an avatar, a progress bar, an
        action button — project an
        <code class="docs-inline">&lt;ng-template mkTableCell="key"&gt;</code>
        named after the column
        <code class="docs-inline">key</code>. The cell value is the template's
        implicit context (<code class="docs-inline">let-value</code>) and the whole
        row is available as <code class="docs-inline">let-row="row"</code>. A column
        that has both a template and a <code class="docs-inline">format</code> uses
        the template for display; <code class="docs-inline">format</code> still
        feeds the sort and export paths that need a string.
      </p>
      <docs-example [code]="cellTemplateCode" column>
        <mk-table
          [columns]="columns"
          [data]="users"
          hover
          style="width: 100%"
        >
          <ng-template mkTableCell="status" let-value>
            <mk-tag [tone]="statusTone(value)">{{ value }}</mk-tag>
          </ng-template>
          <ng-template mkTableCell="orders" let-value let-row="row">
            <strong>{{ value }}</strong>
            <span style="color: var(--mk-text-muted)"> · {{ row.name }}</span>
          </ng-template>
        </mk-table>
      </docs-example>

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

      <h2>Grouped rows</h2>
      <p>
        Set <code class="docs-inline">groupBy</code> to a column key (or an
        accessor function) to render rows under collapsible group headers with
        a row count. Headers stay sticky below the column header, sorting
        applies within each group, and
        <code class="docs-inline">groupLabel</code> customises the header text.
        Listen to <code class="docs-inline">(groupToggle)</code> or call
        <code class="docs-inline">collapseAllGroups()</code> /
        <code class="docs-inline">expandAllGroups()</code>.
      </p>
      <docs-example [code]="groupedCode" column>
        <mk-table
          [columns]="columns"
          [data]="users"
          groupBy="role"
          hover
          trackKey="email"
          (groupToggle)="onGroupToggle($event)"
          style="width: 100%"
        />
        <p class="echo">Last toggle: {{ groupStatus() }}</p>
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

      <h2>Stacked cards on narrow screens</h2>
      <p>
        Set <code class="docs-inline">stackAt</code> to a pixel width and each
        row becomes a <strong>card</strong> below it: the column header moves
        beside its value, and the table stops being a grid nobody can read on a
        phone. The threshold is measured on the table's own box, not the
        window — a table in a narrow sidebar stacks while the screen around it
        is enormous.
      </p>
      <p>
        Each column says what it becomes via
        <code class="docs-inline">stack</code>:
        <code class="docs-inline">'title'</code> for the card's heading (no
        label — the value identifies the record),
        <code class="docs-inline">'footer'</code> for an actions cell, and
        <code class="docs-inline">'hide'</code> to drop it entirely. Hidden
        columns are not rendered at all, so a screen reader does not read them
        either — which is the difference between this and hiding cells in CSS.
      </p>
      <p>
        The DOM stays a real <code class="docs-inline">&lt;table&gt;</code>, so
        selection, expandable rows, inline edit and your own
        <code class="docs-inline">mkTableCell</code> templates keep working
        unchanged. Because <code class="docs-inline">display: block</code>
        strips a table of its implicit roles, the component re-applies
        <code class="docs-inline">role="table|rowgroup|row|cell"</code> while
        stacked; axe passes in both layouts.
      </p>
      <p>
        <strong>Resize this page narrower than 640px</strong> to see the table
        below flip. Pair it with
        <code class="docs-inline">data-mk-density="touch"</code> on a tablet or
        kiosk so the controls inside the cards are finger-sized too.
      </p>
      <docs-example [code]="stackCode" column>
        <mk-table [columns]="stackColumns" [data]="stackRows" [stackAt]="640" />
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
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd> (on a group header)</td><td>Collapse / expand the group (the header is a real button).</td></tr>
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

  // ----- Custom cell templates ----------------------------------------
  protected statusTone(status: string): MkTone {
    switch (status) {
      case 'active':
        return 'success';
      case 'invited':
        return 'info';
      case 'suspended':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  protected readonly cellTemplateCode = `<mk-table [columns]="columns" [data]="users">
  <ng-template mkTableCell="status" let-value>
    <mk-tag [tone]="statusTone(value)">{{ value }}</mk-tag>
  </ng-template>
  <ng-template mkTableCell="orders" let-value let-row="row">
    <strong>{{ value }}</strong> · {{ row.name }}
  </ng-template>
</mk-table>`;

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

  protected readonly stackColumns: MkTableColumn<Record<string, unknown>>[] = [
    { key: 'order', header: 'Order', stack: 'title' },
    { key: 'total', header: 'Total', align: 'end', stack: 'title' },
    { key: 'customer', header: 'Customer' },
    { key: 'placed', header: 'Placed' },
    { key: 'payment', header: 'Payment' },
    { key: 'id', header: 'Internal id', stack: 'hide' },
  ];
  protected readonly stackRows = [
    {
      order: '#1042',
      total: '86,00 zł',
      customer: 'Anna Kowalska',
      placed: 'Today, 18:24',
      payment: 'BLIK',
      id: 'ord_9f2c',
    },
    {
      order: '#1041',
      total: '32,50 zł',
      customer: 'Marek Wiśniewski',
      placed: 'Today, 18:02',
      payment: 'Cash',
      id: 'ord_9f2b',
    },
  ];

  protected readonly stackCode = `columns: MkTableColumn<Order>[] = [
  { key: 'order',    header: 'Order', stack: 'title' },   // card heading
  { key: 'total',    header: 'Total', stack: 'title' },   // beside it
  { key: 'customer', header: 'Customer' },                // label + value
  { key: 'actions',  header: '',      stack: 'footer' },  // buttons, no label
  { key: 'id',       header: 'Internal id', stack: 'hide' },
];

<mk-table [columns]="columns" [data]="rows()" [stackAt]="640" />
// Below 640px of TABLE width each row becomes a card.`;

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

  protected readonly groupStatus = signal('—');
  protected onGroupToggle(e: { key: unknown; collapsed: boolean }): void {
    this.groupStatus.set(`${e.key} ${e.collapsed ? 'collapsed' : 'expanded'}`);
  }

  protected readonly groupedCode = `<mk-table
  [columns]="columns"
  [data]="users"
  groupBy="role"
  [groupLabel]="labelFn"
  (groupToggle)="onGroupToggle($event)" />`;

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
