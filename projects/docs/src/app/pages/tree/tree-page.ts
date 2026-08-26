import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MkTree, type MkTreeNode } from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `<mk-tree>` data component of
 * `@mk-kit/ui`.
 */
@Component({
  selector: 'docs-tree-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkTree],
  template: `
    <div class="docs-page docs-container">
      <h1>Tree</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-tree&gt;</code> renders hierarchical
        data following the ARIA tree pattern (<code class="docs-inline"
          >role="tree"</code
        >
        / <code class="docs-inline">treeitem</code> with
        <code class="docs-inline">aria-level</code> and
        <code class="docs-inline">aria-expanded</code>). Supply
        <code class="docs-inline">nodes</code>; expansion is managed internally.
        A single roving tabindex keeps the whole tree one tab stop.
      </p>
      <p>
        Keyboard: <kbd>↑</kbd>/<kbd>↓</kbd> move, <kbd>→</kbd> expands or steps in,
        <kbd>←</kbd> collapses or steps out, <kbd>Home</kbd>/<kbd>End</kbd> jump,
        <kbd>Enter</kbd>/<kbd>Space</kbd> toggles and selects.
      </p>

      <!-- ============================================================ -->
      <h2>File explorer</h2>
      <p>
        A read-only tree. Parents show a caret; some nodes start
        <code class="docs-inline">expanded</code> and one is
        <code class="docs-inline">disabled</code>.
      </p>
      <docs-example [code]="basicCode" column>
        <div style="width: 100%; max-width: 22rem;">
          <mk-tree [nodes]="files" aria-label="Project files" />
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Selectable</h2>
      <p>
        Add <code class="docs-inline">selectable</code> and bind
        <code class="docs-inline">[(selected)]</code> to a node's
        <code class="docs-inline">value</code>.
      </p>
      <docs-example [code]="selectableCode" column>
        <div style="width: 100%; max-width: 22rem;">
          <mk-tree
            selectable
            [nodes]="categories"
            [(selected)]="picked"
            aria-label="Categories"
          />
          <p class="echo">
            Selected: <code class="docs-inline">{{ picked() ?? '—' }}</code>
          </p>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>API</h2>

      <h3><code class="docs-inline">&lt;mk-tree&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>nodes</code></td><td><code>MkTreeNode[]</code></td><td><code>[]</code></td><td>The hierarchical data to render.</td></tr>
          <tr><td><code>selectable</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Allow choosing a node (adds selection styling + <code>aria-selected</code>).</td></tr>
          <tr><td><code>selected</code></td><td><code>model&lt;unknown&gt;</code></td><td><code>null</code></td><td>Two-way selected value (a node's <code>value</code>, or the node itself if unset).</td></tr>
          <tr><td><code>aria-label</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible name for the tree.</td></tr>
          <tr><td><code>(selectionChange)</code></td><td><code>output&lt;unknown&gt;</code></td><td>—</td><td>Emits the selected value whenever the selection changes.</td></tr>
          <tr><td><code>(nodeToggle)</code></td><td><code>output&lt;MkTreeNode&gt;</code></td><td>—</td><td>Emits a node whenever it is expanded or collapsed.</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">MkTreeNode</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>label</code></td><td><code>string</code></td><td>required</td><td>Text shown for the node.</td></tr>
          <tr><td><code>value</code></td><td><code>unknown</code></td><td>the node</td><td>Value bound to the selection when the node is chosen.</td></tr>
          <tr><td><code>children</code></td><td><code>MkTreeNode[]</code></td><td>—</td><td>Child nodes; a non-empty array makes the node expandable.</td></tr>
          <tr><td><code>expanded</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Expand this node initially.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable selection/toggling (still focusable).</td></tr>
          <tr><td><code>icon</code></td><td><code>string</code></td><td>—</td><td>Optional leading glyph (any short string / emoji).</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>↓</kbd> / <kbd>↑</kbd></td><td>Move to the next / previous visible row.</td></tr>
          <tr><td><kbd>→</kbd></td><td>Expand a collapsed parent, or step into the first child.</td></tr>
          <tr><td><kbd>←</kbd></td><td>Collapse an expanded parent, or step out to the parent row.</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>Jump to the first / last visible row.</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Toggle expansion and select the row (when <code>selectable</code>).</td></tr>
        </tbody>
      </table>
    </div>
  `,
})
export class TreePage {
  protected readonly files: MkTreeNode[] = [
    {
      label: 'src',
      icon: '📁',
      expanded: true,
      children: [
        {
          label: 'app',
          icon: '📁',
          children: [
            { label: 'app.ts', icon: '📄' },
            { label: 'app.html', icon: '📄' },
          ],
        },
        {
          label: 'lib',
          icon: '📁',
          expanded: true,
          children: [
            { label: 'button.ts', icon: '📄' },
            { label: 'tree.ts', icon: '📄' },
          ],
        },
        { label: 'main.ts', icon: '📄' },
      ],
    },
    {
      label: 'node_modules',
      icon: '📦',
      disabled: true,
      children: [{ label: '…', icon: '📄' }],
    },
    { label: 'package.json', icon: '📄' },
    { label: 'README.md', icon: '📄' },
  ];

  protected readonly categories: MkTreeNode[] = [
    {
      label: 'Electronics',
      value: 'electronics',
      expanded: true,
      children: [
        { label: 'Phones', value: 'phones' },
        { label: 'Laptops', value: 'laptops' },
        {
          label: 'Audio',
          value: 'audio',
          children: [
            { label: 'Headphones', value: 'headphones' },
            { label: 'Speakers', value: 'speakers' },
          ],
        },
      ],
    },
    {
      label: 'Home',
      value: 'home',
      children: [
        { label: 'Kitchen', value: 'kitchen' },
        { label: 'Garden', value: 'garden' },
      ],
    },
  ];

  protected readonly picked = signal<unknown>(null);

  protected readonly basicCode = `<mk-tree [nodes]="files" aria-label="Project files" />

// files: MkTreeNode[]
[{ label: 'src', icon: '📁', expanded: true, children: [
  { label: 'app', icon: '📁', children: [ { label: 'app.ts', icon: '📄' } ] },
] }]`;

  protected readonly selectableCode = `<mk-tree selectable
  [nodes]="categories"
  [(selected)]="picked"
  aria-label="Categories" />`;
}
