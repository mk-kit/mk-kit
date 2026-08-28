import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkOrgChart,
  MkOrgChartNodeDef,
  type MkOrgChartNode,
  mkOrgChartFromFlat,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

interface Person {
  title?: string;
  avatar?: string;
  location?: string;
}

/**
 * Documentation + live demo page for the `<mk-org-chart>` data component of
 * `@mk-kit/ui`.
 */
@Component({
  selector: 'docs-org-chart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkOrgChart, MkOrgChartNodeDef],
  template: `
    <div class="docs-page docs-container">
      <h1>Organisation chart</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-org-chart&gt;</code> draws a
        reporting-line hierarchy from plain nested lists and CSS connectors —
        no canvas, so it themes, prints and scales like every other component.
        Feed it a tree of <code class="docs-inline">nodes</code> or convert a
        flat <code class="docs-inline">parentId</code> list with
        <code class="docs-inline">mkOrgChartFromFlat()</code>. It follows the
        ARIA tree pattern (<code class="docs-inline">role="tree"</code> /
        <code class="docs-inline">treeitem</code> /
        <code class="docs-inline">group</code>) with one roving tab stop.
      </p>
      <p>
        Keyboard (top-down): <kbd>↓</kbd> first child (expands a collapsed node
        first), <kbd>↑</kbd> parent, <kbd>←</kbd>/<kbd>→</kbd> siblings,
        <kbd>Home</kbd>/<kbd>End</kbd> first / last visible node,
        <kbd>Enter</kbd>/<kbd>Space</kbd> select, <kbd>*</kbd> expand all
        siblings, <kbd>+</kbd>/<kbd>-</kbd> expand / collapse. The axes swap for
        <code class="docs-inline">orientation="left"</code> and in RTL.
      </p>

      <!-- ============================================================ -->
      <h2>Basic</h2>
      <p>
        The default card shows an avatar (image from
        <code class="docs-inline">data.avatar</code>, initials otherwise), the
        <code class="docs-inline">label</code> and
        <code class="docs-inline">data.title</code>. The chart scrolls
        horizontally when it outgrows its container.
      </p>
      <docs-example [code]="basicCode" column>
        <mk-org-chart [nodes]="company" aria-label="Company" />
      </docs-example>

      <!-- ============================================================ -->
      <h2>Collapsible + selection</h2>
      <p>
        <code class="docs-inline">collapsible</code> adds a toggle to every
        parent; a node's <code class="docs-inline">expanded: false</code> starts
        it closed, or bind <code class="docs-inline">[(expanded)]</code> to own
        the set of open ids. <code class="docs-inline">selectable</code> +
        <code class="docs-inline">[(selected)]</code> track one node by id;
        <code class="docs-inline">(nodeClick)</code> fires on click or
        <kbd>Enter</kbd>.
      </p>
      <docs-example [code]="collapsibleCode" column>
        <mk-org-chart
          [nodes]="company"
          collapsible
          selectable
          [(selected)]="picked"
          [(expanded)]="open"
          aria-label="Company (collapsible)"
        />
        <p class="echo">
          Selected: <code class="docs-inline">{{ picked() ?? '—' }}</code>
          · Expanded: <code class="docs-inline">{{ open()?.join(', ') || '—' }}</code>
        </p>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Custom node template</h2>
      <p>
        Provide an <code class="docs-inline">ng-template[mkOrgChartNodeDef]</code>
        to render your own card. The context carries
        <code class="docs-inline">node</code> (implicit),
        <code class="docs-inline">depth</code>,
        <code class="docs-inline">expanded</code> and
        <code class="docs-inline">selected</code>. The default card chrome is
        dropped, so style the template yourself. Bind the same array to
        <code class="docs-inline">[mkOrgChartNodeDef]</code> to get a typed
        <code class="docs-inline">node.data</code> (the plain attribute form
        leaves it untyped).
      </p>
      <docs-example [code]="templateCode" column>
        <mk-org-chart [nodes]="company" selectable [(selected)]="picked2" collapsible aria-label="Company (custom cards)">
          <ng-template [mkOrgChartNodeDef]="company" let-node let-depth="depth" let-selected="selected">
            <div class="person" [class.person--selected]="selected" [class.person--lead]="depth === 1">
              <strong>{{ node.label }}</strong>
              <span>{{ node.data?.title }}</span>
              <small>{{ node.data?.location }}</small>
            </div>
          </ng-template>
        </mk-org-chart>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Left-to-right</h2>
      <p>
        <code class="docs-inline">orientation="left"</code> puts the root at
        the inline start and grows sideways — handy for deep, narrow trees. It
        mirrors automatically under <code class="docs-inline">dir="rtl"</code>.
        <code class="docs-inline">zoom</code> (0.5–2) scales the whole chart.
      </p>
      <docs-example [code]="leftCode" column>
        <mk-org-chart [nodes]="company" orientation="left" collapsible [zoom]="0.9" aria-label="Company (sideways)" />
      </docs-example>

      <!-- ============================================================ -->
      <h2>Flat data</h2>
      <p>
        Directory APIs usually return a flat list with a
        <code class="docs-inline">parentId</code> per row.
        <code class="docs-inline">mkOrgChartFromFlat(list)</code> nests it,
        keeping row order among siblings; rows whose parent is missing become
        roots.
      </p>
      <docs-example [code]="flatCode" column>
        <mk-org-chart [nodes]="fromFlat" aria-label="Flat list" />
      </docs-example>

      <!-- ============================================================ -->
      <h2>API</h2>

      <h3><code class="docs-inline">&lt;mk-org-chart&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>nodes</code></td><td><code>MkOrgChartNode[]</code></td><td><code>[]</code></td><td>The hierarchy to render (roots first).</td></tr>
          <tr><td><code>orientation</code></td><td><code>'top' | 'left'</code></td><td><code>'top'</code></td><td>Root at the top, or at the inline start (mirrors in RTL).</td></tr>
          <tr><td><code>selectable</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Allow choosing a node (selection styling + <code>aria-selected</code>).</td></tr>
          <tr><td><code>collapsible</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Show a toggle on every parent so branches can be hidden.</td></tr>
          <tr><td><code>zoom</code></td><td><code>number</code></td><td><code>1</code></td><td>Scale factor for the whole chart (clamped to 0.5–2).</td></tr>
          <tr><td><code>aria-label</code></td><td><code>string</code></td><td>i18n <code>orgChartLabel</code></td><td>Accessible name of the tree.</td></tr>
          <tr><td><code>selected</code></td><td><code>model&lt;string | null&gt;</code></td><td><code>null</code></td><td>Two-way selected node id.</td></tr>
          <tr><td><code>expanded</code></td><td><code>model&lt;string[] | undefined&gt;</code></td><td><code>undefined</code></td><td>Two-way ids of the expanded parents. Unbound = managed internally, seeded from each node's <code>expanded</code>.</td></tr>
          <tr><td><code>(nodeClick)</code></td><td><code>output&lt;MkOrgChartNode&gt;</code></td><td>—</td><td>A card was clicked or activated with Enter/Space.</td></tr>
          <tr><td><code>(nodeToggle)</code></td><td><code>output&lt;{{ '{' }} node, expanded {{ '}' }}&gt;</code></td><td>—</td><td>A branch was expanded or collapsed.</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">MkOrgChartNode&lt;T&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>id</code></td><td><code>string</code></td><td>required</td><td>Unique id — drives selection and expansion.</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td>—</td><td>Primary text of the default card (and its initials).</td></tr>
          <tr><td><code>data</code></td><td><code>T</code></td><td>—</td><td>Payload for the template; the default card reads <code>data.title</code> and <code>data.avatar</code>.</td></tr>
          <tr><td><code>children</code></td><td><code>MkOrgChartNode[]</code></td><td>—</td><td>Direct reports; a non-empty array makes the node a parent.</td></tr>
          <tr><td><code>expanded</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Initial expansion when <code>[(expanded)]</code> is not bound.</td></tr>
        </tbody>
      </table>

      <h3>Helpers</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Export</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mkOrgChartFromFlat(list)</code></td><td>Nest a flat <code>{{ '{' }} id, parentId, label?, data?, expanded? {{ '}' }}[]</code> into <code>MkOrgChartNode[]</code>.</td></tr>
          <tr><td><code>ng-template[mkOrgChartNodeDef]</code></td><td>Custom card; context <code>{{ '{' }} $implicit, node, depth, expanded, selected {{ '}' }}</code>.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action (top-down · left-to-right)</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>↓</kbd> · <kbd>→</kbd></td><td>Expand a collapsed parent, or move to its first child.</td></tr>
          <tr><td><kbd>↑</kbd> · <kbd>←</kbd></td><td>Move to the parent.</td></tr>
          <tr><td><kbd>←</kbd>/<kbd>→</kbd> · <kbd>↑</kbd>/<kbd>↓</kbd></td><td>Previous / next sibling (mirrored in RTL).</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>First / last visible node.</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Select (when <code>selectable</code>) and emit <code>nodeClick</code>; toggles the branch when not selectable.</td></tr>
          <tr><td><kbd>*</kbd></td><td>Expand every sibling.</td></tr>
          <tr><td><kbd>+</kbd> / <kbd>-</kbd></td><td>Expand / collapse the focused node.</td></tr>
        </tbody>
      </table>

      <h3>Theming</h3>
      <p>
        Connector geometry is exposed as private custom properties on the host:
        <code class="docs-inline">--_line</code> (colour, default
        <code class="docs-inline">--mk-border-strong</code>),
        <code class="docs-inline">--_gap-main</code> (parent → children),
        <code class="docs-inline">--_gap-cross</code> (between siblings) and
        <code class="docs-inline">--_card-w</code> (minimum card width).
      </p>
    </div>
  `,
  styles: `
    .person {
      display: grid;
      gap: 2px;
      min-width: 10rem;
      padding: var(--mk-space-2) var(--mk-space-3);
      border: var(--mk-border-width) solid var(--mk-border);
      border-inline-start: 3px solid var(--mk-info);
      border-radius: var(--mk-radius-md);
      background: var(--mk-surface);
      text-align: start;
      font-size: var(--mk-font-size-sm);
    }
    .person span { color: var(--mk-text-muted); }
    .person small { color: var(--mk-text-subtle); font-size: var(--mk-font-size-xs); }
    .person--lead { border-inline-start-color: var(--mk-primary); }
    .person--selected { background: var(--mk-primary-subtle); border-color: var(--mk-primary); }
    .echo { margin-top: var(--mk-space-3); color: var(--mk-text-muted); font-size: var(--mk-font-size-sm); }
  `,
})
export class OrgChartPage {
  protected readonly company: MkOrgChartNode<Person>[] = [
    {
      id: 'ada',
      label: 'Ada Lovelace',
      data: { title: 'Chief Executive', location: 'London' },
      children: [
        {
          id: 'grace',
          label: 'Grace Hopper',
          data: { title: 'CTO', location: 'New York' },
          children: [
            { id: 'linus', label: 'Linus Torvalds', data: { title: 'Kernel lead', location: 'Portland' } },
            { id: 'margaret', label: 'Margaret Hamilton', data: { title: 'Flight software', location: 'Boston' } },
          ],
        },
        {
          id: 'katherine',
          label: 'Katherine Johnson',
          data: { title: 'CFO', location: 'Hampton' },
          expanded: false,
          children: [
            { id: 'dorothy', label: 'Dorothy Vaughan', data: { title: 'Controller', location: 'Hampton' } },
          ],
        },
        { id: 'mary', label: 'Mary Jackson', data: { title: 'COO', location: 'Hampton' } },
      ],
    },
  ];

  protected readonly fromFlat = mkOrgChartFromFlat<Person>([
    { id: 'ceo', label: 'Ada Lovelace', data: { title: 'CEO' } },
    { id: 'cto', label: 'Grace Hopper', parentId: 'ceo', data: { title: 'CTO' } },
    { id: 'cfo', label: 'Katherine Johnson', parentId: 'ceo', data: { title: 'CFO' } },
    { id: 'dev', label: 'Linus Torvalds', parentId: 'cto', data: { title: 'Engineer' } },
  ]);

  protected readonly picked = signal<string | null>('grace');
  protected readonly picked2 = signal<string | null>(null);
  protected readonly open = signal<readonly string[] | undefined>(undefined);

  protected readonly basicCode = `<mk-org-chart [nodes]="company" aria-label="Company" />

// company: MkOrgChartNode<{ title?: string; avatar?: string }>[]
[{ id: 'ada', label: 'Ada Lovelace', data: { title: 'Chief Executive' }, children: [
  { id: 'grace', label: 'Grace Hopper', data: { title: 'CTO' }, children: [ … ] },
  { id: 'mary', label: 'Mary Jackson', data: { title: 'COO' } },
] }]`;

  protected readonly collapsibleCode = `<mk-org-chart
  [nodes]="company"
  collapsible
  selectable
  [(selected)]="picked"
  [(expanded)]="open"
  (nodeClick)="openProfile($event)"
  aria-label="Company" />

// picked = signal<string | null>('grace');
// open = signal<string[] | undefined>(undefined); // unbound → seeded from node.expanded`;

  protected readonly templateCode = `<mk-org-chart [nodes]="company" selectable [(selected)]="picked" collapsible>
  <!-- [mkOrgChartNodeDef]="company" types node.data; plain "mkOrgChartNodeDef" leaves it any -->
  <ng-template [mkOrgChartNodeDef]="company" let-node let-depth="depth" let-selected="selected">
    <div class="person" [class.person--selected]="selected" [class.person--lead]="depth === 1">
      <strong>{{ node.label }}</strong>
      <span>{{ node.data?.title }}</span>
    </div>
  </ng-template>
</mk-org-chart>`;

  protected readonly leftCode = `<mk-org-chart [nodes]="company" orientation="left" collapsible [zoom]="0.9" />`;

  protected readonly flatCode = `import { mkOrgChartFromFlat } from '@mk-kit/ui/data';

const nodes = mkOrgChartFromFlat([
  { id: 'ceo', label: 'Ada Lovelace', data: { title: 'CEO' } },
  { id: 'cto', label: 'Grace Hopper', parentId: 'ceo', data: { title: 'CTO' } },
  { id: 'cfo', label: 'Katherine Johnson', parentId: 'ceo', data: { title: 'CFO' } },
  { id: 'dev', label: 'Linus Torvalds', parentId: 'cto', data: { title: 'Engineer' } },
]);

<mk-org-chart [nodes]="nodes" />`;
}
