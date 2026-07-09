import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkBadge,
  MkButton,
  MkDrawer,
  MkFormField,
  MkInput,
  MkPageHeader,
  MkSplitter,
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
          [(size)]="splitPos"
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
  protected readonly endOpen = signal(false);
  protected readonly startOpen = signal(false);
  protected readonly keyword = signal('');
  protected readonly splitPos = signal(35);

  protected readonly splitterCode = `<mk-splitter [(size)]="splitPos" [min]="20" [max]="80">
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
