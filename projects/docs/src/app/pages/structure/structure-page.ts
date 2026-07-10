import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkBadge,
  MkButton,
  MkDrawer,
  MkFormField,
  MkInput,
  MkPageHeader,
  MkSplitter,
  MkScrollArea,
  MkToolbar,
} from '@mkornas/ui';
import { FormsModule } from '@angular/forms';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the admin/CMS structural components of
 * `@mkornas/ui`: PageHeader, Toolbar and Drawer.
 */
@Component({
  selector: 'docs-structure-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkPageHeader,
    MkToolbar,
    MkDrawer,
    MkSplitter,
    MkScrollArea,
    MkButton,
    MkBadge,
    MkFormField,
    MkInput,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Structure</h1>
      <p class="docs-lead">
        Layout building blocks for admin apps and CMSes: a page header, an action
        toolbar, and a slide-out drawer. They compose with the rest of the
        library (breadcrumbs, tabs, buttons, badges, forms) via projection slots.
      </p>

      <!-- ============================================================ -->
      <h2>Page header</h2>
      <p>
        The standard page-title block: title + description, inline meta, a
        right-aligned actions cluster, plus optional
        <code class="docs-inline">mkPageHeaderBreadcrumb</code> and
        <code class="docs-inline">mkPageHeaderTabs</code> slots.
      </p>
      <docs-example [code]="pageHeaderCode" column>
        <div style="width: 100%; border: 1px solid var(--mk-border-subtle); border-radius: var(--mk-radius-lg); padding: var(--mk-space-5); background: var(--mk-surface);">
          <mk-page-header
            heading="Articles"
            description="Create, edit and publish the posts that appear on your site."
          >
            <nav mkPageHeaderBreadcrumb class="crumbs" aria-label="Breadcrumb">
              Dashboard <span aria-hidden="true">/</span> Content
              <span aria-hidden="true">/</span> <strong>Articles</strong>
            </nav>
            <mk-badge mkPageHeaderMeta tone="success">Live</mk-badge>
            <div mkPageHeaderActions>
              <button mkButton variant="outline">Import</button>
              <button mkButton>New article</button>
            </div>
          </mk-page-header>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>heading</code></td><td><code>string</code></td><td><code>''</code></td><td>The page title.</td></tr>
          <tr><td><code>description</code></td><td><code>string</code></td><td><code>''</code></td><td>Muted line under the title.</td></tr>
          <tr><td><code>mkPageHeaderBreadcrumb</code></td><td>slot</td><td>—</td><td>Projected above the title (e.g. an <code>mk-breadcrumb</code>).</td></tr>
          <tr><td><code>mkPageHeaderMeta</code></td><td>slot</td><td>—</td><td>Inline meta next to the title (badges, status).</td></tr>
          <tr><td><code>mkPageHeaderActions</code></td><td>slot</td><td>—</td><td>Right-aligned actions cluster.</td></tr>
          <tr><td><code>mkPageHeaderTabs</code></td><td>slot</td><td>—</td><td>Tabs row under the header.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Toolbar</h2>
      <p>
        A horizontal action bar — content on the start side, anything marked
        <code class="docs-inline">mkToolbarEnd</code> pushed to the end. Great
        above tables and lists.
      </p>
      <docs-example [code]="toolbarCode" column>
        <mk-toolbar bordered aria-label="Users actions" style="width: 100%;">
          <strong>Users</strong>
          <mk-badge tone="neutral">248</mk-badge>
          <span mkToolbarEnd>
            <button mkButton variant="ghost">Filter</button>
            <button mkButton variant="outline">Export</button>
            <button mkButton>Invite</button>
          </span>
        </mk-toolbar>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>bordered</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Draw the bordered, surfaced variant.</td></tr>
          <tr><td><code>aria-label</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible name for the toolbar region.</td></tr>
          <tr><td><code>mkToolbarEnd</code></td><td>slot</td><td>—</td><td>Content pushed to the end side; everything else stays at the start.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Drawer</h2>
      <p>
        A slide-out panel driven by a two-way
        <code class="docs-inline">open</code>. It traps focus, closes on backdrop
        or Escape, restores focus, and locks scroll while modal. Anchor it to any
        edge with <code class="docs-inline">side</code>.
      </p>
      <docs-example [code]="drawerCode">
        <div style="display: flex; gap: var(--mk-space-3); flex-wrap: wrap;">
          <button mkButton (click)="endOpen.set(true)">Open filters (end)</button>
          <button mkButton variant="outline" (click)="startOpen.set(true)">Open nav (start)</button>
        </div>
      </docs-example>

      <mk-drawer [(open)]="endOpen" side="end" heading="Filters" size="22rem">
        <mk-form-field label="Search">
          <input mkInput placeholder="Keyword…" [(ngModel)]="keyword" />
        </mk-form-field>
        <mk-form-field label="Status" style="margin-top: var(--mk-space-3);">
          <input mkInput placeholder="Any" />
        </mk-form-field>
        <div mkDrawerFooter>
          <button mkButton variant="ghost" (click)="endOpen.set(false)">Cancel</button>
          <button mkButton (click)="endOpen.set(false)">Apply</button>
        </div>
      </mk-drawer>

      <mk-drawer [(open)]="startOpen" side="start" heading="Navigation" size="18rem">
        <p>Put an <code class="docs-inline">mk-nav-list</code> here for a mobile menu.</p>
        <p style="color: var(--mk-text-muted);">Keyword bound from the other drawer: {{ keyword() || '—' }}</p>
      </mk-drawer>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>open</code></td><td><code>model&lt;boolean&gt;</code></td><td><code>false</code></td><td>Two-way visibility of the panel.</td></tr>
          <tr><td><code>side</code></td><td><code>'start' | 'end' | 'top' | 'bottom'</code></td><td><code>'end'</code></td><td>Edge the drawer slides in from.</td></tr>
          <tr><td><code>size</code></td><td><code>string</code></td><td><code>'20rem'</code></td><td>Panel width (or height for top/bottom), any CSS length.</td></tr>
          <tr><td><code>heading</code></td><td><code>string</code></td><td><code>''</code></td><td>Title shown in the panel header.</td></tr>
          <tr><td><code>hasBackdrop</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Dim the page behind the panel.</td></tr>
          <tr><td><code>closeOnBackdrop</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Clicking the backdrop closes the drawer.</td></tr>
          <tr><td><code>closeOnEscape</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Escape closes the drawer.</td></tr>
          <tr><td><code>trapFocus</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Keep Tab focus inside while open; focus is restored on close.</td></tr>
          <tr><td><code>hideClose</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Hide the built-in close button.</td></tr>
          <tr><td><code>mkDrawerHeader</code> / <code>mkDrawerFooter</code></td><td>slot</td><td>—</td><td>Custom header content / pinned footer actions.</td></tr>
        </tbody>
      </table>

      <h2>Splitter</h2>
      <p>
        <code class="docs-inline">&lt;mk-splitter&gt;</code> gives two resizable
        panes with a draggable, keyboard-operable separator (ARIA
        <code class="docs-inline">separator</code>). Drag the handle, or focus it
        and use Arrow keys (Home/End jump to the bounds). Project the panes with
        <code class="docs-inline">mkSplitterStart</code> /
        <code class="docs-inline">mkSplitterEnd</code>.
      </p>
      <docs-example [code]="splitterCode" [column]="true">
        <mk-splitter
          [(position)]="splitPos"
          [min]="20"
          [max]="80"
          style="height: 12rem; border: var(--mk-border-width) solid var(--mk-border);
                 border-radius: var(--mk-radius-md); overflow: hidden;"
        >
          <div mkSplitterStart style="padding: var(--mk-space-3); background: var(--mk-surface-2);">
            <strong>Sidebar</strong>
            <p style="color: var(--mk-text-muted); font-size: var(--mk-font-size-sm);">
              {{ splitPos() }}% wide
            </p>
          </div>
          <div mkSplitterEnd style="padding: var(--mk-space-3);">
            <strong>Content</strong>
            <p style="color: var(--mk-text-muted); font-size: var(--mk-font-size-sm);">
              Drag the divider, or Tab to it and use Arrow / Home / End.
            </p>
          </div>
        </mk-splitter>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>position</code></td><td><code>model&lt;number&gt;</code></td><td><code>50</code></td><td>Two-way separator position = start-pane size, in percent.</td></tr>
          <tr><td><code>orientation</code></td><td><code>'horizontal' | 'vertical'</code></td><td><code>'horizontal'</code></td><td>Split direction (horizontal = side-by-side panes).</td></tr>
          <tr><td><code>min</code> / <code>max</code></td><td><code>number</code></td><td><code>10</code> / <code>90</code></td><td>Bounds (%) the start pane is clamped to.</td></tr>
          <tr><td><code>step</code></td><td><code>number</code></td><td><code>5</code></td><td>Percent moved per Arrow key press.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Freeze the separator.</td></tr>
          <tr><td><code>ariaLabel</code></td><td><code>string</code></td><td><code>'Resize panes'</code></td><td>Accessible name for the separator handle.</td></tr>
          <tr><td><code>mkSplitterStart</code> / <code>mkSplitterEnd</code></td><td>slot</td><td>—</td><td>The two projected panes.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>←</kbd> / <kbd>→</kbd> (or <kbd>↑</kbd> / <kbd>↓</kbd> when vertical)</td><td>Shrink / grow the start pane by <code>step</code>.</td></tr>
          <tr><td><kbd>Home</kbd></td><td>Jump to <code>min</code>.</td></tr>
          <tr><td><kbd>End</kbd></td><td>Jump to <code>max</code>.</td></tr>
        </tbody>
      </table>

      <h2>Scroll area</h2>
      <p>
        <code class="docs-inline">&lt;mk-scroll-area&gt;</code> wraps overflowing
        content with themed, auto-hiding custom scrollbars (the native ones are
        hidden) while keeping real, keyboard-accessible native scrolling. Set
        <code class="docs-inline">maxHeight</code> and
        <code class="docs-inline">orientation</code>.
      </p>
      <docs-example [code]="scrollAreaCode" [column]="true">
        <mk-scroll-area maxHeight="12rem" style="max-width: 26rem;">
          <div style="padding: var(--mk-space-3); display: grid; gap: var(--mk-space-2);">
            @for (n of scrollItems; track n) {
              <div style="padding: var(--mk-space-2) var(--mk-space-3); background: var(--mk-surface-2); border-radius: var(--mk-radius-sm);">
                Item {{ n }}
              </div>
            }
          </div>
        </mk-scroll-area>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>maxHeight</code></td><td><code>string</code></td><td><code>''</code></td><td>CSS max-height that makes the content scroll.</td></tr>
          <tr><td><code>orientation</code></td><td><code>'vertical' | 'horizontal' | 'both'</code></td><td><code>'vertical'</code></td><td>Which axes may scroll.</td></tr>
          <tr><td><code>hideDelay</code></td><td><code>number</code></td><td><code>1000</code></td><td>Delay (ms) before the custom scrollbars fade out after scrolling.</td></tr>
          <tr><td><code>ariaLabel</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible name for the scrollable region.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .crumbs {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        display: flex;
        gap: var(--mk-space-2);
        align-items: center;
      }
      .crumbs strong {
        color: var(--mk-text);
        font-weight: var(--mk-font-weight-medium);
      }
    `,
  ],
})
export class StructurePage {
  protected readonly scrollItems = Array.from({ length: 20 }, (_, i) => i + 1);
  protected readonly scrollAreaCode = `<mk-scroll-area maxHeight="12rem">\n  <!-- long content -->\n</mk-scroll-area>`;

  protected readonly endOpen = signal(false);
  protected readonly startOpen = signal(false);
  protected readonly keyword = signal('');
  protected readonly splitPos = signal(35);

  protected readonly splitterCode = `<mk-splitter [(position)]="splitPos" [min]="20" [max]="80">
  <div mkSplitterStart>Sidebar</div>
  <div mkSplitterEnd>Content</div>
</mk-splitter>`;

  protected readonly pageHeaderCode = `<mk-page-header heading="Articles"
  description="Create, edit and publish your posts.">
  <nav mkPageHeaderBreadcrumb>…</nav>
  <mk-badge mkPageHeaderMeta tone="success">Live</mk-badge>
  <div mkPageHeaderActions>
    <button mkButton variant="outline">Import</button>
    <button mkButton>New article</button>
  </div>
</mk-page-header>`;

  protected readonly toolbarCode = `<mk-toolbar bordered aria-label="Users actions">
  <strong>Users</strong>
  <mk-badge tone="neutral">248</mk-badge>
  <span mkToolbarEnd>
    <button mkButton variant="outline">Export</button>
    <button mkButton>Invite</button>
  </span>
</mk-toolbar>`;

  protected readonly drawerCode = `<button mkButton (click)="open.set(true)">Filters</button>

<mk-drawer [(open)]="open" side="end" heading="Filters">
  …filter form…
  <div mkDrawerFooter>
    <button mkButton variant="ghost" (click)="open.set(false)">Cancel</button>
    <button mkButton (click)="open.set(false)">Apply</button>
  </div>
</mk-drawer>`;
}
