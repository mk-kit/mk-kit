import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  MkAccordion,
  MkAccordionHeader,
  MkAccordionItem,
  MkBreadcrumb,
  MkBreadcrumbItem,
  MkButton,
  MkMenu,
  MkMenuItem,
  MkMenuTrigger,
  MkBackToTop,
  MkFab,
  MkFabAction,
  MkNavItem,
  MkNavList,
  MkPagination,
  MkTab,
  MkTabs,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

@Component({
  selector: 'docs-navigation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkButton,
    MkTabs,
    MkTab,
    MkAccordion,
    MkAccordionItem,
    MkAccordionHeader,
    MkBreadcrumb,
    MkBreadcrumbItem,
    MkPagination,
    MkMenu,
    MkMenuTrigger,
    MkMenuItem,
    MkNavList,
    MkNavItem,
    MkFab,
    MkFabAction,
    MkBackToTop,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Navigation &amp; layout</h1>
      <p class="docs-lead">
        Wayfinding and structural components: tabs, accordions, breadcrumbs,
        pagination, dropdown menus, the responsive app shell and the sidebar
        nav list. Every widget follows its ARIA pattern and is driven by
        signals — <code class="docs-inline">input()</code>,
        <code class="docs-inline">model()</code> and
        <code class="docs-inline">output()</code>.
      </p>

      <!-- ============================================================ TABS -->
      <h2>Tabs</h2>
      <p>
        <code class="docs-inline">mk-tabs</code> implements the ARIA tabs
        pattern with roving tabindex, arrow/Home/End keys and an animated
        indicator. Selection is two-way bindable via
        <code class="docs-inline">selectedIndex</code>.
      </p>

      <h3>Line variant</h3>
      <docs-example [code]="tabsCode" [column]="true">
        <mk-tabs variant="line" style="width: 100%">
          <mk-tab label="Overview">
            <p style="margin: var(--mk-space-3) 0 0">
              High-level summary of the workspace and recent activity.
            </p>
          </mk-tab>
          <mk-tab label="Activity">
            <p style="margin: var(--mk-space-3) 0 0">
              A timeline of everything that happened this week.
            </p>
          </mk-tab>
          <mk-tab label="Settings" disabled>
            <p style="margin: var(--mk-space-3) 0 0">
              Preferences (this tab is disabled).
            </p>
          </mk-tab>
        </mk-tabs>
      </docs-example>

      <h3>Pill variant</h3>
      <docs-example [code]="tabsPillCode" [column]="true">
        <mk-tabs variant="pill" [(selectedIndex)]="pillTab" style="width: 100%">
          <mk-tab label="Day">
            <p style="margin: var(--mk-space-3) 0 0">Daily breakdown.</p>
          </mk-tab>
          <mk-tab label="Week">
            <p style="margin: var(--mk-space-3) 0 0">Weekly rollup.</p>
          </mk-tab>
          <mk-tab label="Month">
            <p style="margin: var(--mk-space-3) 0 0">Monthly totals.</p>
          </mk-tab>
        </mk-tabs>
        <p style="margin: var(--mk-space-3) 0 0; color: var(--mk-text-muted)">
          Selected index: {{ pillTab() }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Component</th><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mk-tabs</code></td><td><code>selectedIndex</code></td><td><code>model&lt;number&gt;</code></td><td><code>0</code></td><td>Active tab (two-way).</td></tr>
          <tr><td><code>mk-tabs</code></td><td><code>variant</code></td><td><code>'line' | 'pill'</code></td><td><code>'line'</code></td><td>Tablist style.</td></tr>
          <tr><td><code>mk-tab</code></td><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Text shown in the tablist.</td></tr>
          <tr><td><code>mk-tab</code></td><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Skips selection &amp; keyboard focus.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>ArrowRight</kbd> / <kbd>ArrowDown</kbd></td><td>Select and focus the next enabled tab (wraps to the first).</td></tr>
          <tr><td><kbd>ArrowLeft</kbd> / <kbd>ArrowUp</kbd></td><td>Select and focus the previous enabled tab (wraps to the last).</td></tr>
          <tr><td><kbd>Home</kbd></td><td>Select and focus the first enabled tab.</td></tr>
          <tr><td><kbd>End</kbd></td><td>Select and focus the last enabled tab.</td></tr>
        </tbody>
      </table>

      <!-- ======================================================= ACCORDION -->
      <h2>Accordion</h2>
      <p>
        <code class="docs-inline">mk-accordion</code> coordinates a set of
        collapsible <code class="docs-inline">mk-accordion-item</code>s. By
        default one item is open at a time; add
        <code class="docs-inline">multi</code> to allow several. Each item's
        <code class="docs-inline">open</code> state is two-way bindable.
      </p>

      <h3>Single-open</h3>
      <docs-example [code]="accordionCode" [column]="true">
        <mk-accordion style="width: 100%">
          <mk-accordion-item header="What is mk-kit?" [(open)]="acc1">
            A themable, accessible Angular 22 component library for admin panels.
          </mk-accordion-item>
          <mk-accordion-item header="How is it themed?">
            Entirely through <code class="docs-inline">--mk-*</code> CSS variables.
          </mk-accordion-item>
          <mk-accordion-item>
            <span mkAccordionHeader>🔒 Rich header markup</span>
            Headers can be projected via
            <code class="docs-inline">mkAccordionHeader</code> for icons and badges.
          </mk-accordion-item>
        </mk-accordion>
      </docs-example>

      <h3>Multiple open</h3>
      <docs-example [code]="accordionMultiCode" [column]="true">
        <mk-accordion multi style="width: 100%">
          <mk-accordion-item header="Shipping" [open]="true">
            Ships worldwide in 2–4 business days.
          </mk-accordion-item>
          <mk-accordion-item header="Returns" [open]="true">
            Free returns within 30 days.
          </mk-accordion-item>
          <mk-accordion-item header="Warranty">
            Two-year limited warranty on all hardware.
          </mk-accordion-item>
        </mk-accordion>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Component</th><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mk-accordion</code></td><td><code>multi</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Allow several items open at once.</td></tr>
          <tr><td><code>mk-accordion-item</code></td><td><code>header</code></td><td><code>string</code></td><td><code>''</code></td><td>Plain-text header (ignored when <code>mkAccordionHeader</code> is projected).</td></tr>
          <tr><td><code>mk-accordion-item</code></td><td><code>open</code></td><td><code>model&lt;boolean&gt;</code></td><td><code>false</code></td><td>Expanded state (two-way).</td></tr>
          <tr><td><code>mk-accordion-item</code></td><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Prevents toggling.</td></tr>
          <tr><td><code>[mkAccordionHeader]</code></td><td>—</td><td><code>Directive</code></td><td>—</td><td>Marks projected content as the header.</td></tr>
        </tbody>
      </table>

      <!-- ====================================================== BREADCRUMB -->
      <h2>Breadcrumb</h2>
      <p>
        <code class="docs-inline">mk-breadcrumb</code> renders a
        <code class="docs-inline">nav &gt; ol</code> trail. Items with an
        <code class="docs-inline">href</code> render as links; the final crumb
        is automatically marked <code class="docs-inline">aria-current="page"</code>.
      </p>
      <docs-example [code]="breadcrumbCode" [column]="true">
        <mk-breadcrumb separator="›">
          <mk-breadcrumb-item href="#">Home</mk-breadcrumb-item>
          <mk-breadcrumb-item href="#">Users</mk-breadcrumb-item>
          <mk-breadcrumb-item href="#">Team</mk-breadcrumb-item>
          <mk-breadcrumb-item>Jane Doe</mk-breadcrumb-item>
        </mk-breadcrumb>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Component</th><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mk-breadcrumb</code></td><td><code>separator</code></td><td><code>string</code></td><td><code>'/'</code></td><td>Character drawn between crumbs.</td></tr>
          <tr><td><code>mk-breadcrumb</code></td><td><code>label</code></td><td><code>string</code></td><td><code>'Breadcrumb'</code></td><td>Accessible landmark label.</td></tr>
          <tr><td><code>mk-breadcrumb-item</code></td><td><code>href</code></td><td><code>string?</code></td><td>—</td><td>Link target; renders text when omitted or last.</td></tr>
        </tbody>
      </table>

      <!-- ====================================================== PAGINATION -->
      <h2>Pagination</h2>
      <p>
        <code class="docs-inline">mk-pagination</code> renders previous/next
        controls plus numbered pages that collapse to ellipses for large ranges.
        Supply either <code class="docs-inline">total</code> +
        <code class="docs-inline">pageSize</code> or a direct
        <code class="docs-inline">pageCount</code>; the 1-based
        <code class="docs-inline">page</code> is two-way bindable.
      </p>
      <docs-example [code]="paginationCode" [column]="true">
        <mk-pagination
          [total]="95"
          [pageSize]="10"
          [(page)]="page"
        />
        <p style="margin: var(--mk-space-3) 0 0; color: var(--mk-text-muted)">
          Page {{ page() }} of {{ pageCount() }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>total</code></td><td><code>number</code></td><td><code>0</code></td><td>Item count; paired with <code>pageSize</code>.</td></tr>
          <tr><td><code>pageSize</code></td><td><code>number</code></td><td><code>10</code></td><td>Items per page.</td></tr>
          <tr><td><code>pageCount</code></td><td><code>number</code></td><td><code>0</code></td><td>Explicit page count; overrides <code>total</code>/<code>pageSize</code> when &gt; 0.</td></tr>
          <tr><td><code>page</code></td><td><code>model&lt;number&gt;</code></td><td><code>1</code></td><td>Current 1-based page (two-way; also drives <code>(pageChange)</code>).</td></tr>
          <tr><td><code>siblingCount</code></td><td><code>number</code></td><td><code>1</code></td><td>Page buttons kept either side of the current page.</td></tr>
          <tr><td><code>boundaryCount</code></td><td><code>number</code></td><td><code>1</code></td><td>Page buttons pinned at each end.</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td><code>'Pagination'</code></td><td>Accessible landmark label.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ MENU -->
      <h2>Menu (dropdown)</h2>
      <p>
        <code class="docs-inline">mk-menu</code> implements the ARIA menu
        pattern (roving focus, arrow/Home/End/typeahead, Enter/Space to
        activate). Attach it to any button with
        <code class="docs-inline">[mkMenuTriggerFor]</code> and grab the
        template reference via
        <code class="docs-inline">#menu="mkMenu"</code>.
      </p>
      <docs-example [code]="menuCode" [column]="true">
        <button mkButton variant="outline" tone="neutral" [mkMenuTriggerFor]="menu">
          Actions ▾
        </button>
        <mk-menu #menu="mkMenu">
          <mk-menu-item (action)="onMenuAction('Edit')">
            <span mkMenuItemIcon>✏️</span> Edit
          </mk-menu-item>
          <mk-menu-item (action)="onMenuAction('Duplicate')">
            <span mkMenuItemIcon>⧉</span> Duplicate
          </mk-menu-item>
          <mk-menu-item disabled>
            <span mkMenuItemIcon>📦</span> Archive (disabled)
          </mk-menu-item>
          <mk-menu-item danger (action)="onMenuAction('Delete')">
            <span mkMenuItemIcon>🗑️</span> Delete
          </mk-menu-item>
        </mk-menu>
        <p style="margin: var(--mk-space-3) 0 0; color: var(--mk-text-muted)">
          {{ menuStatus() }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Symbol</th><th>Member</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>[mkMenuTriggerFor]</code></td><td><code>mkMenuTriggerFor</code></td><td><code>MkMenu</code></td><td>Required input — the menu to control. Wires <code>aria-haspopup</code>/<code>aria-expanded</code>.</td></tr>
          <tr><td><code>mk-menu</code></td><td><code>exportAs</code></td><td><code>'mkMenu'</code></td><td>Reference as <code>#menu="mkMenu"</code>.</td></tr>
          <tr><td><code>mk-menu</code></td><td><code>opened</code></td><td><code>Signal&lt;boolean&gt;</code></td><td>Read-only open state.</td></tr>
          <tr><td><code>mk-menu-item</code></td><td><code>action</code></td><td><code>output&lt;void&gt;</code></td><td>Emitted on activation (not when disabled).</td></tr>
          <tr><td><code>mk-menu-item</code></td><td><code>danger</code></td><td><code>boolean</code></td><td>Destructive styling.</td></tr>
          <tr><td><code>mk-menu-item</code></td><td><code>disabled</code></td><td><code>boolean</code></td><td>Prevents selection &amp; focus.</td></tr>
          <tr><td><code>mk-menu-item</code></td><td><code>href</code></td><td><code>string?</code></td><td>Navigates on activation instead of emitting only.</td></tr>
          <tr><td><code>[mkMenuItemIcon]</code></td><td>—</td><td>slot</td><td>Projection slot for a leading icon.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd> / <kbd>ArrowDown</kbd> (on the trigger)</td><td>Open the menu and focus the first enabled item.</td></tr>
          <tr><td><kbd>ArrowDown</kbd> / <kbd>ArrowUp</kbd></td><td>Move focus to the next / previous enabled item (wraps).</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>Focus the first / last enabled item.</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Activate the focused item and close the menu.</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Close the menu and restore focus to the trigger.</td></tr>
          <tr><td><kbd>Tab</kbd></td><td>Close the menu (focus returns to the trigger).</td></tr>
          <tr><td>Printable characters</td><td>Typeahead — focus the next item whose text starts with the typed string (buffer resets after 500&nbsp;ms).</td></tr>
        </tbody>
      </table>

      <!-- ======================================================= APP SHELL -->
      <h2>App shell</h2>
      <p>
        <code class="docs-inline">mk-app-shell</code> is the top-level admin
        layout: a fixed header, a collapsible/responsive sidebar and a main
        content area. Below the mobile breakpoint the sidebar becomes a
        focus-trapped off-canvas drawer with a scrim. This whole docs site is
        already wrapped in one, so here is a representative usage snippet rather
        than a nested live shell.
      </p>
      <docs-example [code]="appShellCode" [column]="true">
        <p style="margin: 0; color: var(--mk-text-muted)">
          The page you are reading is rendered inside a live
          <code class="docs-inline">mk-app-shell</code>. See the snippet for the
          slot and binding wiring.
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Kind</th><th>Type</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>sidebarOpen</code></td><td>input (two-way)</td><td><code>model&lt;boolean&gt;</code></td><td>Mobile drawer open state.</td></tr>
          <tr><td><code>sidebarCollapsed</code></td><td>input (two-way)</td><td><code>model&lt;boolean&gt;</code></td><td>Desktop icon-only rail.</td></tr>
          <tr><td><code>isMobile</code></td><td>signal</td><td><code>Signal&lt;boolean&gt;</code></td><td>True at/below the 1024px breakpoint.</td></tr>
          <tr><td><code>toggleSidebar()</code></td><td>method</td><td><code>void</code></td><td>Toggle the mobile drawer.</td></tr>
          <tr><td><code>openSidebar()</code> / <code>closeSidebar()</code></td><td>method</td><td><code>void</code></td><td>Open / close the mobile drawer.</td></tr>
          <tr><td><code>toggleCollapsed()</code></td><td>method</td><td><code>void</code></td><td>Toggle the desktop collapsed state.</td></tr>
          <tr><td><code>[mkAppHeader]</code></td><td>slot</td><td>—</td><td>Header content.</td></tr>
          <tr><td><code>[mkAppSidebar]</code></td><td>slot</td><td>—</td><td>Sidebar content (e.g. an <code>mk-nav-list</code>).</td></tr>
          <tr><td>default slot</td><td>slot</td><td>—</td><td>Main content area.</td></tr>
        </tbody>
      </table>

      <!-- ======================================================== NAV LIST -->
      <h2>Nav list</h2>
      <p>
        <code class="docs-inline">mk-nav-list</code> is the sidebar navigation.
        Items with an <code class="docs-inline">href</code> render as links;
        otherwise they are buttons that emit
        <code class="docs-inline">action</code>. Nesting
        <code class="docs-inline">mk-nav-item</code>s turns a parent into an
        expandable disclosure, and <code class="docs-inline">collapsed</code>
        drives the whole list into an icon-only rail.
      </p>
      <docs-example [code]="navListCode" [column]="true">
        <mk-nav-list style="width: 100%; max-width: 260px">
          <mk-nav-item label="Dashboard" active (action)="onNav('Dashboard')">
            <span mkNavIcon>▦</span>
          </mk-nav-item>
          <mk-nav-item label="Reports" badge="3" (action)="onNav('Reports')">
            <span mkNavIcon>▤</span>
          </mk-nav-item>
          <mk-nav-item label="Team" (action)="onNav('Team')">
            <span mkNavIcon>◍</span>
            <mk-nav-item label="Members" (action)="onNav('Members')" />
            <mk-nav-item label="Invitations" (action)="onNav('Invitations')" />
          </mk-nav-item>
          <mk-nav-item label="Settings" disabled>
            <span mkNavIcon>⚙</span>
          </mk-nav-item>
        </mk-nav-list>
        <p style="margin: var(--mk-space-3) 0 0; color: var(--mk-text-muted)">
          {{ navStatus() }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Component</th><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mk-nav-list</code></td><td><code>collapsed</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Collapse items to an icon-only rail.</td></tr>
          <tr><td><code>mk-nav-item</code></td><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Visible label; tooltip when collapsed.</td></tr>
          <tr><td><code>mk-nav-item</code></td><td><code>href</code></td><td><code>string?</code></td><td>—</td><td>Renders an anchor instead of a button.</td></tr>
          <tr><td><code>mk-nav-item</code></td><td><code>active</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Marks the current page (<code>aria-current</code>).</td></tr>
          <tr><td><code>mk-nav-item</code></td><td><code>badge</code></td><td><code>string | number</code></td><td>—</td><td>Optional count/short text badge.</td></tr>
          <tr><td><code>mk-nav-item</code></td><td><code>expanded</code></td><td><code>model&lt;boolean&gt;</code></td><td><code>false</code></td><td>Disclosure state for nested items (two-way).</td></tr>
          <tr><td><code>mk-nav-item</code></td><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable interaction.</td></tr>
          <tr><td><code>mk-nav-item</code></td><td><code>action</code></td><td><code>output&lt;void&gt;</code></td><td>—</td><td>Emitted when a button-style item is activated.</td></tr>
          <tr><td><code>[mkNavIcon]</code></td><td>—</td><td>slot</td><td>—</td><td>Projection slot for the leading icon.</td></tr>
        </tbody>
      </table>

      <h2>FAB &amp; speed-dial</h2>
      <p>
        <code class="docs-inline">&lt;mk-fab&gt;</code> is a floating action button
        (fixed to a corner, or <code class="docs-inline">position="static"</code>
        for inline use). Add <code class="docs-inline">mkFabAction</code> buttons
        to turn it into a speed-dial that reveals them on toggle.
      </p>
      <docs-example [code]="fabCode" [column]="true">
        <div style="display: flex; gap: var(--mk-space-6); align-items: flex-end;">
          <mk-fab position="static" label="Create" extended (action)="fabHits.set(fabHits() + 1)">＋</mk-fab>
          <mk-fab position="static" label="Actions">
            ⋯
            <button mkFabAction>📄 Document</button>
            <button mkFabAction>📁 Folder</button>
          </mk-fab>
        </div>
        <p class="echo">Extended FAB clicks: {{ fabHits() }}</p>
      </docs-example>

      <h2>Back to top</h2>
      <p>
        <code class="docs-inline">&lt;mk-back-to-top&gt;</code> appears once the page
        scrolls past <code class="docs-inline">threshold</code> and smooth-scrolls
        back up. It's live on this page — scroll down and look bottom-right.
      </p>
      <docs-example [code]="backToTopCode" [column]="true">
        <p style="color: var(--mk-text-muted);">Scroll this page down to reveal the button.</p>
      </docs-example>

      <mk-back-to-top [threshold]="300" />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      h2 {
        margin-top: var(--mk-space-10);
        padding-top: var(--mk-space-4);
        border-top: 1px solid var(--mk-border);
      }
      h3 {
        margin-top: var(--mk-space-6);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class NavigationPage {
  // FAB / back-to-top
  protected readonly fabHits = signal(0);
  protected readonly fabCode = `<mk-fab label="Actions">
  ⋯
  <button mkFabAction>Document</button>
  <button mkFabAction>Folder</button>
</mk-fab>`;
  protected readonly backToTopCode = `<mk-back-to-top [threshold]="300" />`;

  // Tabs
  protected readonly pillTab = signal(1);

  // Accordion
  protected readonly acc1 = signal(true);

  // Pagination
  protected readonly page = signal(1);
  protected readonly pageCount = computed(() => Math.ceil(95 / 10));

  // Menu
  protected readonly menuStatus = signal('No action yet — open the menu.');
  protected onMenuAction(name: string): void {
    this.menuStatus.set('Last action: ' + name);
  }

  // Nav list
  protected readonly navStatus = signal('No selection yet.');
  protected onNav(name: string): void {
    this.navStatus.set('Navigated to: ' + name);
  }

  protected readonly tabsCode = [
    '<mk-tabs variant="line">',
    '  <mk-tab label="Overview">…panel…</mk-tab>',
    '  <mk-tab label="Activity">…panel…</mk-tab>',
    '  <mk-tab label="Settings" disabled>…panel…</mk-tab>',
    '</mk-tabs>',
  ].join('\n');

  protected readonly tabsPillCode = [
    '<mk-tabs variant="pill" [(selectedIndex)]="pillTab">',
    '  <mk-tab label="Day">…</mk-tab>',
    '  <mk-tab label="Week">…</mk-tab>',
    '  <mk-tab label="Month">…</mk-tab>',
    '</mk-tabs>',
    '',
    '// pillTab = signal(1);',
  ].join('\n');

  protected readonly accordionCode = [
    '<mk-accordion>',
    '  <mk-accordion-item header="What is mk-kit?" [(open)]="acc1">',
    '    …body…',
    '  </mk-accordion-item>',
    '  <mk-accordion-item header="How is it themed?">…</mk-accordion-item>',
    '  <mk-accordion-item>',
    '    <span mkAccordionHeader>🔒 Rich header markup</span>',
    '    …body…',
    '  </mk-accordion-item>',
    '</mk-accordion>',
  ].join('\n');

  protected readonly accordionMultiCode = [
    '<mk-accordion multi>',
    '  <mk-accordion-item header="Shipping" [open]="true">…</mk-accordion-item>',
    '  <mk-accordion-item header="Returns" [open]="true">…</mk-accordion-item>',
    '  <mk-accordion-item header="Warranty">…</mk-accordion-item>',
    '</mk-accordion>',
  ].join('\n');

  protected readonly breadcrumbCode = [
    '<mk-breadcrumb separator="›">',
    '  <mk-breadcrumb-item href="/">Home</mk-breadcrumb-item>',
    '  <mk-breadcrumb-item href="/users">Users</mk-breadcrumb-item>',
    '  <mk-breadcrumb-item href="/users/team">Team</mk-breadcrumb-item>',
    '  <mk-breadcrumb-item>Jane Doe</mk-breadcrumb-item>',
    '</mk-breadcrumb>',
  ].join('\n');

  protected readonly paginationCode = [
    '<mk-pagination',
    '  [total]="95"',
    '  [pageSize]="10"',
    '  [(page)]="page"',
    '  (pageChange)="load($event)"',
    '/>',
    '',
    '// page = signal(1);',
    '// pageCount = computed(() => Math.ceil(95 / 10)); // → 10',
  ].join('\n');

  protected readonly menuCode = [
    '<button mkButton variant="outline" [mkMenuTriggerFor]="menu">',
    '  Actions ▾',
    '</button>',
    '<mk-menu #menu="mkMenu">',
    '  <mk-menu-item (action)="onMenuAction(\'Edit\')">',
    '    <span mkMenuItemIcon>✏️</span> Edit',
    '  </mk-menu-item>',
    '  <mk-menu-item (action)="onMenuAction(\'Duplicate\')">…</mk-menu-item>',
    '  <mk-menu-item disabled>Archive (disabled)</mk-menu-item>',
    '  <mk-menu-item danger (action)="onMenuAction(\'Delete\')">',
    '    <span mkMenuItemIcon>🗑️</span> Delete',
    '  </mk-menu-item>',
    '</mk-menu>',
  ].join('\n');

  protected readonly appShellCode = [
    '<mk-app-shell',
    '  #shell',
    '  [(sidebarOpen)]="open"',
    '  [(sidebarCollapsed)]="collapsed"',
    '>',
    '  <div mkAppHeader>',
    '    <button mkButton iconOnly (click)="shell.toggleSidebar()">☰</button>',
    '    <strong>Acme Admin</strong>',
    '  </div>',
    '',
    '  <mk-nav-list mkAppSidebar [collapsed]="collapsed()">',
    '    <mk-nav-item label="Dashboard" href="/" active />',
    '    <mk-nav-item label="Reports" href="/reports" badge="3" />',
    '  </mk-nav-list>',
    '',
    '  <router-outlet />',
    '</mk-app-shell>',
    '',
    '// open = signal(false);',
    '// collapsed = signal(false);',
    '// shell.toggleCollapsed(); shell.openSidebar(); shell.closeSidebar();',
  ].join('\n');

  protected readonly navListCode = [
    '<mk-nav-list [collapsed]="collapsed()">',
    '  <mk-nav-item label="Dashboard" active href="/">',
    '    <svg mkNavIcon>…</svg>',
    '  </mk-nav-item>',
    '  <mk-nav-item label="Reports" href="/reports" badge="3">',
    '    <svg mkNavIcon>…</svg>',
    '  </mk-nav-item>',
    '  <mk-nav-item label="Team">',
    '    <svg mkNavIcon>…</svg>',
    '    <mk-nav-item label="Members" href="/team/members" />',
    '    <mk-nav-item label="Invitations" href="/team/invites" />',
    '  </mk-nav-item>',
    '</mk-nav-list>',
  ].join('\n');
}
