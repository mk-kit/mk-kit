import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkDescItem,
  MkDescriptionList,
  MkInlineEdit,
  MkInput,
  MkPagination,
  MkSpinner,
  MkTable,
  MkTableCell,
  MkTableDataSource,
  MkTableRowDetail,
  MkTag,
  type MkDataPage,
  type MkDataRequest,
  type MkSortChange,
  type MkTableColumn,
  type MkTone,
  MkButton,
  type MkTreeToggle,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

interface TreeNode {
  id: string;
  name: string;
  role: string;
  headcount: number;
  children?: TreeNode[];
}

interface DemoUser {
  name: string;
  email: string;
  role: string;
  orders: number;
  status: string;
}

interface DemoCustomer {
  name: string;
  email: string;
  city: string;
  orders: number;
}

// ----- Deterministic 57-row "server" dataset for the data-source demo -------
const DS_FIRST = ['Ada', 'Grace', 'Alan', 'Katherine', 'Edsger', 'Barbara', 'Donald', 'Margaret', 'Linus', 'Radia'];
const DS_LAST = ['Lovelace', 'Hopper', 'Turing', 'Johnson', 'Dijkstra', 'Liskov', 'Knuth', 'Hamilton', 'Torvalds', 'Perlman', 'Ritchie', 'Allen'];
const DS_CITIES = ['Warsaw', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Katowice'];

const DS_CUSTOMERS: DemoCustomer[] = Array.from({ length: 57 }, (_, i) => {
  const first = DS_FIRST[i % DS_FIRST.length];
  const last = DS_LAST[i % DS_LAST.length];
  return {
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@example.com`,
    city: DS_CITIES[i % DS_CITIES.length],
    orders: ((i * 37) % 96) + 3,
  };
});

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
    MkInput,
    MkPagination,
    MkSpinner,
    MkTable,
    MkTableCell,
    MkTableRowDetail,
    MkTag,
    MkButton,
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
          <tr><td colspan="4"><strong>Data &amp; identity</strong></td></tr>
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
            <td><code class="docs-inline">trackKey</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Property identifying a row (selection / expansion equality, <code class="docs-inline">&#64;for</code> tracking). Omitted, rows match by reference.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">rowClass</code></td>
            <td><code class="docs-inline">((row: T) =&gt; string | null) | null</code></td>
            <td><code class="docs-inline">null</code></td>
            <td>Per-row CSS class for consumer-owned state (falsy = none).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">emptyMessage</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">'No data to display'</code></td>
            <td>Shown when there are no rows.</td>
          </tr>
          <tr><td colspan="4"><strong>Display &amp; interaction</strong></td></tr>
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
            <td><code class="docs-inline">sortChange</code></td>
            <td><code class="docs-inline">output&lt;MkSortChange&gt;</code></td>
            <td>—</td>
            <td><code class="docs-inline">{{ '{' }} key, direction {{ '}' }}</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">rowClick</code></td>
            <td><code class="docs-inline">output&lt;T&gt;</code></td>
            <td>—</td>
            <td>Emitted when a row is clicked (enable via <code class="docs-inline">clickableRows</code>).</td>
          </tr>
          <tr><td colspan="4"><strong>Selection</strong></td></tr>
          <tr>
            <td><code class="docs-inline">selectable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Render a leading checkbox column (with a tri-state select-all).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selected</code></td>
            <td><code class="docs-inline">model&lt;T[]&gt;</code></td>
            <td><code class="docs-inline">[]</code></td>
            <td>Two-way <code class="docs-inline">[(selected)]</code> array; rows compared by <code class="docs-inline">trackKey</code> when set.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selectionChange</code></td>
            <td><code class="docs-inline">output&lt;T[]&gt;</code></td>
            <td>—</td>
            <td>The new selection on every change.</td>
          </tr>
          <tr><td colspan="4"><strong>Expansion</strong></td></tr>
          <tr>
            <td><code class="docs-inline">expandable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Leading expander column; detail via <code class="docs-inline">&lt;ng-template mkTableRowDetail&gt;</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">singleExpand</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Only one row expanded at a time (accordion).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">expandedChange</code></td>
            <td><code class="docs-inline">output&lt;T[]&gt;</code></td>
            <td>—</td>
            <td>The currently expanded rows whenever they change.</td>
          </tr>
          <tr><td colspan="4"><strong>Tree rows</strong></td></tr>
          <tr>
            <td><code class="docs-inline">childrenKey</code></td>
            <td><code class="docs-inline">string | null</code></td>
            <td><code class="docs-inline">null</code></td>
            <td>Property holding each row's child rows. Renders a treegrid with indent, toggle, per-sibling sorting and Arrow keys.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">(treeToggle)</code></td>
            <td><code class="docs-inline">MkTreeToggle&lt;T&gt;</code></td>
            <td>—</td>
            <td>A parent row was expanded or collapsed: <code class="docs-inline">{{ '{' }} row, expanded {{ '}' }}</code>.</td>
          </tr>
          <tr><td colspan="4"><strong>Grouping</strong></td></tr>
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
            <td><code class="docs-inline">{{ '{' }} key, collapsed {{ '}' }}</code> per header toggle. Also: <code class="docs-inline">collapseAllGroups()</code> / <code class="docs-inline">expandAllGroups()</code> methods.</td>
          </tr>
          <tr><td colspan="4"><strong>Columns &amp; sizing</strong></td></tr>
          <tr>
            <td><code class="docs-inline">resizableColumns</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Enable drag-to-resize on columns marked <code class="docs-inline">resizable</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">reorderableColumns</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Enable drag-to-reorder of column headers (pinned columns stay put).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">columnResize</code></td>
            <td><code class="docs-inline">output&lt;MkColumnResize&gt;</code></td>
            <td>—</td>
            <td><code class="docs-inline">{{ '{' }} key, width {{ '}' }}</code> (px) after a resize.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">columnReorder</code></td>
            <td><code class="docs-inline">output&lt;string[]&gt;</code></td>
            <td>—</td>
            <td>The new column key order after a reorder.</td>
          </tr>
          <tr><td colspan="4"><strong>Editing</strong></td></tr>
          <tr>
            <td><code class="docs-inline">cellEdit</code></td>
            <td><code class="docs-inline">output&lt;MkCellEdit&lt;T&gt;&gt;</code></td>
            <td>—</td>
            <td><code class="docs-inline">{{ '{' }} row, key, value {{ '}' }}</code> when an <code class="docs-inline">editable</code> cell is saved.</td>
          </tr>
          <tr><td colspan="4"><strong>Stacked mode</strong></td></tr>
          <tr>
            <td><code class="docs-inline">stackAt</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">0</code></td>
            <td>Table width (px) below which rows render as cards; <code class="docs-inline">0</code> never stacks. Measured on the table's own box, not the viewport.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Selection is demoed on the
        <a href="/examples/data-table">data-table example page</a> — a full admin
        screen wiring <code class="docs-inline">selectable</code> +
        <code class="docs-inline">[(selected)]</code> to a bulk-actions bar.
      </p>
      <p>
        <strong>Helpers:</strong> the <code class="docs-inline">table</code>
        entry point also exports the
        <code class="docs-inline">MkTableRowDetail</code> and
        <code class="docs-inline">MkTableCell</code> template directives (used
        below) and the payload types
        <code class="docs-inline">MkSortChange</code>,
        <code class="docs-inline">MkColumnResize</code>,
        <code class="docs-inline">MkCellEdit</code>,
        <code class="docs-inline">MkTableGroup</code> and
        <code class="docs-inline">MkGroupToggle</code>, alongside the sort
        directives and <code class="docs-inline">MkTableDataSource</code>.
      </p>

      <h3>MkTableColumn</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Field</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">key</code> <em>(required)</em></td>
            <td><code class="docs-inline">string</code></td>
            <td>Property key on each row supplying the cell value.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">header</code> <em>(required)</em></td>
            <td><code class="docs-inline">string</code></td>
            <td>Visible column header text.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">sortable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td>Allow sorting by this column.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">align</code></td>
            <td><code class="docs-inline">'start' | 'center' | 'end'</code></td>
            <td>Cell/header alignment (default <code class="docs-inline">'start'</code>).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">width</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>Fixed column width (any CSS length).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">format</code></td>
            <td><code class="docs-inline">(value, row) =&gt; string</code></td>
            <td>Formatter turning the raw value into display text.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">resizable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td>Allow drag-resizing (needs <code class="docs-inline">resizableColumns</code>).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">editable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td>Inline-editable cells (double-click / Enter / F2).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">pinned</code></td>
            <td><code class="docs-inline">'left' | 'right'</code></td>
            <td>Freeze the column to a side while the body scrolls horizontally.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">minWidth</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Resize floor in px (default 60).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">stack</code></td>
            <td><code class="docs-inline">'title' | 'footer' | 'hide'</code></td>
            <td>Role in stacked-card mode: card heading, unlabelled footer, or not rendered at all. Omitted = labelled field.</td>
          </tr>
        </tbody>
      </table>

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

      <h2>Tree rows</h2>
      <p>
        Set <code class="docs-inline">childrenKey</code> to the property that holds
        each row's child rows and the table becomes a tree grid: children are
        indented under their parent behind a toggle in the first column,
        sorting applies within each sibling group, ArrowRight / ArrowLeft on a
        row open / close it, and select-all covers every row. Rows carry
        <code class="docs-inline">aria-level</code> and
        <code class="docs-inline">aria-expanded</code>; the table announces as
        a <code class="docs-inline">treegrid</code>. Listen to
        <code class="docs-inline">(treeToggle)</code> or call
        <code class="docs-inline">expandAllRows()</code> /
        <code class="docs-inline">collapseAllRows()</code>. Works together with
        expandable detail rows, selection, grouping and stacked cards.
      </p>
      <docs-example [code]="treeCode" column>
        <div style="display: flex; gap: var(--mk-space-2); margin-bottom: var(--mk-space-3)">
          <button mkButton size="sm" variant="outline" tone="neutral" (click)="treeTable.expandAllRows()">Expand all</button>
          <button mkButton size="sm" variant="outline" tone="neutral" (click)="treeTable.collapseAllRows()">Collapse all</button>
        </div>
        <mk-table
          #treeTable
          [columns]="treeColumns"
          [data]="treeRows"
          childrenKey="children"
          trackKey="id"
          clickableRows
          hover
          (treeToggle)="onTreeToggle($event)"
          style="width: 100%"
        />
        <p class="echo">Last toggle: {{ treeStatus() }}</p>
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

      <!-- =============== MK TABLE DATA SOURCE ======================== -->
      <h2 id="data-source">MkTableDataSource — server-side data</h2>
      <p>
        <code class="docs-inline">MkTableDataSource</code> is the server-side
        adapter for <code class="docs-inline">mk-table</code> — the page /
        sort / filter plumbing every admin screen otherwise hand-rolls. It is
        a plain class (no component, no injection required): give it a
        <em>fetcher</em> that loads one page for an
        <code class="docs-inline">MkDataRequest</code> (returning a
        <code class="docs-inline">Promise</code> from
        <code class="docs-inline">fetch</code> or an
        <code class="docs-inline">Observable</code> from
        <code class="docs-inline">HttpClient</code>) and bind its signals.
        Every setter re-queries the server and <strong>stale responses never
        overwrite newer state</strong> (latest-wins).
      </p>
      <p>
        <code class="docs-inline">setFilter</code> is debounced (300 ms by
        default); page, sort and page-size changes load immediately and reset
        to page 1. <code class="docs-inline">rows</code> keeps its previous
        value while loading and on error, so the table never blanks
        mid-transition. Constructed in an injection context (a component field
        initialiser) it hooks <code class="docs-inline">DestroyRef</code> and
        cleans up automatically.
      </p>
      <p>
        The demo below "fetches" from an in-memory list of
        <strong>57 customers</strong> with a ~300 ms simulated latency — page,
        sort a column or filter and watch the loading row. Clear pages by
        filtering for something that matches nothing (e.g.
        <em>zzz</em>) to see the empty state.
      </p>
      <docs-example [code]="dataSourceCode" column>
        <div class="ds-demo">
          <input
            mkInput
            type="search"
            placeholder="Filter 57 customers…"
            aria-label="Filter customers"
            (input)="ds.setFilter($any($event.target).value)"
            style="max-width: 18rem"
          />
          <mk-table
            [columns]="dsColumns"
            [data]="ds.rows()"
            zebra
            (sortChange)="ds.setSort($event)"
            style="width: 100%"
          />
          @if (ds.loading()) {
            <p class="echo ds-status"><mk-spinner size="sm" /> Loading…</p>
          } @else if (ds.empty()) {
            <p class="echo ds-status">No customers match "{{ ds.filter() }}".</p>
          } @else {
            <p class="echo ds-status">
              {{ ds.total() }} row(s) — page {{ ds.page() }}
            </p>
          }
          <mk-pagination
            [total]="ds.total()"
            [pageSize]="ds.pageSize()"
            [page]="ds.page()"
            (pageChange)="ds.setPage($event)"
          />
        </div>
      </docs-example>

      <p>
        The fetcher's contract — <code class="docs-inline">MkDataRequest</code>
        in, <code class="docs-inline">MkDataPage</code> out:
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">MkDataRequest.page</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>1-based page index, matching <code class="docs-inline">mk-pagination</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">MkDataRequest.pageSize</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Rows per page.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">MkDataRequest.sort</code></td>
            <td><code class="docs-inline">MkSortState | null</code></td>
            <td><code class="docs-inline">{{ '{' }} active, direction {{ '}' }}</code>; cleared sorts normalise to <code class="docs-inline">null</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">MkDataRequest.filter</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>Free-text query (<code class="docs-inline">''</code> = none).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">MkDataPage.rows</code></td>
            <td><code class="docs-inline">T[]</code></td>
            <td>The rows for the requested page.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">MkDataPage.total</code></td>
            <td><code class="docs-inline">number</code></td>
            <td>Total row count across ALL pages (drives the pager).</td>
          </tr>
        </tbody>
      </table>

      <table class="docs-props">
        <thead>
          <tr><th>MkTableDataSource member</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">new MkTableDataSource(fetcher, opts?)</code></td>
            <td><code class="docs-inline">MkDataFetcher&lt;T&gt;, MkTableDataSourceOptions</code></td>
            <td>Options: <code class="docs-inline">pageSize</code> (default 10), <code class="docs-inline">filterDebounce</code> ms (default 300). Loads immediately.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">rows()</code></td>
            <td><code class="docs-inline">Signal&lt;T[]&gt;</code></td>
            <td>Current page's rows; kept during loads and errors.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">total()</code></td>
            <td><code class="docs-inline">Signal&lt;number&gt;</code></td>
            <td>Total across all pages — feed <code class="docs-inline">mk-pagination</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">loading()</code></td>
            <td><code class="docs-inline">Signal&lt;boolean&gt;</code></td>
            <td>True while the LATEST request is in flight.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">error()</code></td>
            <td><code class="docs-inline">Signal&lt;unknown | null&gt;</code></td>
            <td>Last load's error; cleared by the next successful load.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">empty()</code></td>
            <td><code class="docs-inline">Signal&lt;boolean&gt;</code></td>
            <td>True when a settled load reported no rows at all.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">page() / pageSize() / sort() / filter()</code></td>
            <td><code class="docs-inline">Signal&lt;…&gt;</code></td>
            <td>The current request state, as read-only signals.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">setPage(page)</code></td>
            <td><code class="docs-inline">(number) =&gt; void</code></td>
            <td>Jump to a 1-based page; loads immediately.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">setPageSize(size)</code></td>
            <td><code class="docs-inline">(number) =&gt; void</code></td>
            <td>Change the page size; resets to page 1.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">setSort(sort)</code></td>
            <td><code class="docs-inline">(MkSortState | MkSortChange | null) =&gt; void</code></td>
            <td>Accepts <code class="docs-inline">mk-table</code>'s <code class="docs-inline">(sortChange)</code> payload directly; resets to page 1.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">setFilter(query)</code></td>
            <td><code class="docs-inline">(string) =&gt; void</code></td>
            <td>Debounced; resets to page 1. <code class="docs-inline">filter()</code> updates immediately.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">refresh()</code></td>
            <td><code class="docs-inline">() =&gt; void</code></td>
            <td>Re-run the current request now (e.g. after a mutation); flushes a pending debounce.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">connectSort(sort)</code></td>
            <td><code class="docs-inline">(MkSort) =&gt; void</code></td>
            <td>Pipe a custom <code class="docs-inline">mkSort</code> directive's changes into <code class="docs-inline">setSort</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">destroy()</code></td>
            <td><code class="docs-inline">() =&gt; void</code></td>
            <td>Cancel pending work. Automatic when created in an injection context.</td>
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
      .ds-demo {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-3);
        width: 100%;
      }
      .ds-status {
        display: flex;
        align-items: center;
        gap: var(--mk-space-2);
        margin: 0;
        min-height: 1.5rem;
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

  // --- Tree rows -------------------------------------------------------------
  protected readonly treeStatus = signal('—');
  protected onTreeToggle(e: MkTreeToggle<TreeNode>): void {
    this.treeStatus.set((e.expanded ? 'Expanded ' : 'Collapsed ') + e.row.name);
  }
  protected readonly treeColumns: MkTableColumn<TreeNode>[] = [
    { key: 'name', header: 'Team / member', sortable: true },
    { key: 'role', header: 'Role' },
    { key: 'headcount', header: 'Headcount', sortable: true, align: 'end' },
  ];
  protected readonly treeRows: TreeNode[] = [
    {
      id: 'eng', name: 'Engineering', role: 'Department', headcount: 42,
      children: [
        { id: 'web', name: 'Web platform', role: 'Team', headcount: 14, children: [
          { id: 'ada', name: 'Ada Lovelace', role: 'Staff engineer', headcount: 1 },
          { id: 'linus', name: 'Linus Torvalds', role: 'Engineer', headcount: 1 },
        ] },
        { id: 'api', name: 'API', role: 'Team', headcount: 18 },
        { id: 'sre', name: 'SRE', role: 'Team', headcount: 10 },
      ],
    },
    { id: 'design', name: 'Design', role: 'Department', headcount: 7, children: [
      { id: 'grace', name: 'Grace Hopper', role: 'Design lead', headcount: 1 },
    ] },
    { id: 'ops', name: 'Operations', role: 'Department', headcount: 9 },
  ];
  protected readonly treeCode = `<mk-table
  [columns]="columns"
  [data]="departments"
  childrenKey="children"
  trackKey="id"
  clickableRows
  (treeToggle)="onTreeToggle($event)"
/>

// departments: { id, name, headcount, children?: Department[] }[]`;

  protected readonly groupedCode = `<mk-table
  [columns]="columns"
  [data]="users"
  groupBy="role"
  [groupLabel]="labelFn"
  (groupToggle)="onGroupToggle($event)" />`;

  // ----- MkTableDataSource — server-side data --------------------------
  protected readonly dsColumns: MkTableColumn<DemoCustomer>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'city', header: 'City', sortable: true },
    { key: 'orders', header: 'Orders', sortable: true, align: 'end' },
  ];

  /** Fake server: filters, sorts and slices the dataset after ~300 ms. */
  private readonly fetchCustomers = (
    req: MkDataRequest,
  ): Promise<MkDataPage<DemoCustomer>> =>
    new Promise((resolve) => {
      setTimeout(() => {
        const q = req.filter.trim().toLowerCase();
        const filtered = q
          ? DS_CUSTOMERS.filter((c) =>
              `${c.name} ${c.email} ${c.city}`.toLowerCase().includes(q),
            )
          : DS_CUSTOMERS;
        const rows = [...filtered];
        const sort = req.sort;
        if (sort) {
          const dir = sort.direction === 'desc' ? -1 : 1;
          const key = sort.active as keyof DemoCustomer;
          rows.sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp =
              typeof av === 'number' && typeof bv === 'number'
                ? av - bv
                : String(av).localeCompare(String(bv));
            return cmp * dir;
          });
        }
        const start = (req.page - 1) * req.pageSize;
        resolve({
          rows: rows.slice(start, start + req.pageSize),
          total: rows.length,
        });
      }, 300);
    });

  /** Field initialiser = injection context, so cleanup is automatic. */
  protected readonly ds = new MkTableDataSource<DemoCustomer>(
    this.fetchCustomers,
    { pageSize: 8 },
  );

  protected readonly dataSourceCode = `// The fetcher loads ONE page for each MkDataRequest — a Promise (fetch)
// or an Observable (HttpClient) resolving to { rows, total }:
private readonly fetchCustomers = (req: MkDataRequest) =>
  this.http.get<MkDataPage<Customer>>('/api/customers', {
    params: {
      page: req.page,          // 1-based
      size: req.pageSize,
      q: req.filter,           // debounced free-text query
      ...(req.sort && { sort: req.sort.active + ',' + req.sort.direction }),
    },
  });

// Field initialiser = injection context → destroys itself with the page.
readonly ds = new MkTableDataSource<Customer>(this.fetchCustomers, {
  pageSize: 8,
});

<input mkInput type="search"
  (input)="ds.setFilter($any($event.target).value)" />

<mk-table [columns]="columns" [data]="ds.rows()"
  (sortChange)="ds.setSort($event)" />

@if (ds.loading()) { <p>Loading…</p> }
@if (ds.empty())   { <p>No rows match.</p> }
@if (ds.error())   { <p role="alert">Failed to load.</p> }

<mk-pagination
  [total]="ds.total()"
  [pageSize]="ds.pageSize()"
  [page]="ds.page()"
  (pageChange)="ds.setPage($event)" />`;

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
