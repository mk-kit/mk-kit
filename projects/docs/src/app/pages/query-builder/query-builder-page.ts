import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkButton,
  MkQueryBuilder,
  MkTable,
  mkQueryRuleCount,
  mkQueryToPredicate,
  mkQueryToText,
  type MkQueryField,
  type MkQueryGroup,
  type MkTableColumn,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

interface Customer {
  name: string;
  email: string;
  role: string;
  orders: number;
  vip: boolean;
  since: string;
}

const CUSTOMERS: Customer[] = [
  { name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin', orders: 42, vip: true, since: '2023-02-14' },
  { name: 'Grace Hopper', email: 'grace@example.com', role: 'editor', orders: 17, vip: false, since: '2024-06-01' },
  { name: 'Alan Turing', email: 'alan@example.com', role: 'viewer', orders: 8, vip: false, since: '2025-01-20' },
  { name: 'Katherine Johnson', email: 'kat@example.com', role: 'editor', orders: 63, vip: true, since: '2022-11-03' },
  { name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'admin', orders: 29, vip: false, since: '2024-09-12' },
  { name: 'Barbara Liskov', email: 'barbara@example.com', role: 'viewer', orders: 51, vip: true, since: '2023-08-30' },
  { name: 'Linus Torvalds', email: 'linus@example.com', role: 'editor', orders: 3, vip: false, since: '2025-05-05' },
];

/** Query builder demo page. */
@Component({
  selector: 'docs-query-builder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton, MkQueryBuilder, MkTable],
  template: `
    <div class="docs-page docs-container">
      <h1>Query builder</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-query-builder&gt;</code> lets users
        assemble a filter from rules and nested and / or groups, and hands it
        to you as plain JSON (<code class="docs-inline">MkQueryGroup</code>).
        Each field's <code class="docs-inline">type</code> picks the editor and
        the operators: text, number, boolean, date or a select with options.
        Apply the result in the browser with
        <code class="docs-inline">mkQueryToPredicate()</code>, send it to the
        server through <code class="docs-inline">MkTableDataSource.setQuery()</code>,
        or show it back with <code class="docs-inline">mkQueryToText()</code>.
      </p>

      <h2>Filter a table</h2>
      <p>
        Every edit re-filters the table below. Unfinished rules are ignored, so
        a half-typed condition never blanks the list. Try <em>Add group</em> for
        an <em>or</em> branch, and <em>Not</em> to negate a group.
      </p>
      <docs-example [code]="builderCode" column>
        <mk-query-builder [fields]="fields" [(query)]="query" allowNot />
        <div class="summary">
          <span>{{ summary() || 'No conditions — showing everyone.' }}</span>
          <button mkButton size="sm" variant="ghost" tone="neutral" (click)="reset()">Reset</button>
        </div>
        <mk-table [columns]="columns" [data]="filtered()" density="compact" style="width: 100%" />
        <p class="echo">{{ filtered().length }} of {{ all.length }} customers · {{ ruleCount() }} rule(s)</p>
        <details class="json">
          <summary>Query JSON</summary>
          <pre>{{ json() }}</pre>
        </details>
      </docs-example>

      <h2>With a server-side data source</h2>
      <p>
        <code class="docs-inline">MkTableDataSource.setQuery()</code> stores the
        tree — compacted, so empty groups and unfinished rules are dropped — on
        every request as <code class="docs-inline">req.query</code>, next to
        the free-text <code class="docs-inline">req.filter</code>. Translate it
        to your API's shape in the fetcher; the operator names are stable
        strings (<code class="docs-inline">eq</code>,
        <code class="docs-inline">contains</code>,
        <code class="docs-inline">between</code>, …).
      </p>
      <pre class="code"><code>{{ dataSourceCode }}</code></pre>

      <h2>Field definitions</h2>
      <pre class="code"><code>{{ fieldsCode }}</code></pre>
    </div>
  `,
  styles: `
    .summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--mk-space-3);
      margin: var(--mk-space-3) 0;
      font-size: var(--mk-font-size-sm);
      color: var(--mk-text-muted);
    }
    .code {
      margin: var(--mk-space-3) 0 var(--mk-space-5);
      padding: var(--mk-space-4) var(--mk-space-5);
      background: var(--mk-code-bg);
      border: 1px solid var(--mk-border);
      border-radius: var(--mk-radius-md);
      font-family: var(--mk-font-mono);
      font-size: var(--mk-font-size-sm);
      line-height: var(--mk-line-height-normal);
      overflow-x: auto;
    }
    .json {
      margin-top: var(--mk-space-3);
      font-size: var(--mk-font-size-sm);
    }
    .json pre {
      margin: var(--mk-space-2) 0 0;
      padding: var(--mk-space-3);
      background: var(--mk-surface-2);
      border-radius: var(--mk-radius-md);
      font-size: var(--mk-font-size-xs);
      overflow: auto;
    }
  `,
})
export class QueryBuilderPage {
  protected readonly all = CUSTOMERS;
  protected readonly fields: MkQueryField[] = [
    { key: 'name', label: 'Name', placeholder: 'e.g. Ada' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    { key: 'orders', label: 'Orders', type: 'number' },
    { key: 'vip', label: 'VIP', type: 'boolean' },
    { key: 'since', label: 'Customer since', type: 'date' },
  ];

  protected readonly columns: MkTableColumn<Customer>[] = [
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role', format: (v) => String(v)[0].toUpperCase() + String(v).slice(1) },
    { key: 'orders', header: 'Orders', align: 'end' },
    { key: 'vip', header: 'VIP', format: (v) => (v ? 'Yes' : 'No') },
    { key: 'since', header: 'Since' },
  ];

  protected readonly query = signal<MkQueryGroup>(this.initial());
  protected readonly filtered = computed(() => this.all.filter(mkQueryToPredicate(this.query(), this.fields)));
  protected readonly summary = computed(() => mkQueryToText(this.query(), this.fields));
  protected readonly ruleCount = computed(() => mkQueryRuleCount(this.query()));
  protected readonly json = computed(() => JSON.stringify(this.query(), null, 2));

  protected reset(): void {
    this.query.set(this.initial());
  }

  private initial(): MkQueryGroup {
    return {
      id: 'root',
      combinator: 'and',
      rules: [
        { id: 'r1', field: 'role', operator: 'in', value: ['admin', 'editor'] },
        {
          id: 'g1',
          combinator: 'or',
          rules: [
            { id: 'r2', field: 'orders', operator: 'gte', value: 20 },
            { id: 'r3', field: 'vip', operator: 'eq', value: true },
          ],
        },
      ],
    };
  }

  protected readonly builderCode = `<mk-query-builder [fields]="fields" [(query)]="query" allowNot />

readonly query = signal<MkQueryGroup>(mkCreateQueryGroup());
readonly rows = computed(() => this.all.filter(mkQueryToPredicate(this.query(), this.fields)));
readonly summary = computed(() => mkQueryToText(this.query(), this.fields));

// The tree is plain JSON — persist it, share it, replay it
{ "combinator": "and", "rules": [
    { "field": "role", "operator": "in", "value": ["admin", "editor"] },
    { "combinator": "or", "rules": [
        { "field": "orders", "operator": "gte", "value": 20 },
        { "field": "vip", "operator": "eq", "value": true } ] } ] }`;

  protected readonly dataSourceCode = `readonly source = new MkTableDataSource<Customer>((req) =>
  this.http.get<MkDataPage<Customer>>('/api/customers', {
    params: { page: req.page, size: req.pageSize, q: req.filter,
              where: req.query ? JSON.stringify(req.query) : '' },
  }),
);

// Wire the builder to it
<mk-query-builder [fields]="fields" [query]="query()" (queryChange)="source.setQuery($event)" />
<mk-table [columns]="columns" [data]="source.rows()" />`;

  protected readonly fieldsCode = `fields: MkQueryField[] = [
  { key: 'name',   label: 'Name' },                                   // string: contains, equals, starts with, …
  { key: 'orders', label: 'Orders', type: 'number' },                 // eq, gt, between, …
  { key: 'vip',    label: 'VIP', type: 'boolean' },                   // true / false
  { key: 'since',  label: 'Customer since', type: 'date' },           // before, after, between (ISO strings)
  { key: 'role',   label: 'Role', type: 'select',                     // equals, is any of, …
    options: [{ label: 'Admin', value: 'admin' }, { label: 'Editor', value: 'editor' }] },
  { key: 'notes',  label: 'Notes', operators: ['contains', 'empty'] },// restrict the operators
];`;
}
