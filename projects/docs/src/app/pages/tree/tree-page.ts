import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MkTree, type MkTreeNode } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `<mk-tree>` data component of
 * `@mkornas/ui`.
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
