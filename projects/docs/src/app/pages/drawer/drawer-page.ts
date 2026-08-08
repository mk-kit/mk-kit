import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkButton,
  MkDrawer,
  MkFormField,
  MkInput,
  MkNavItem,
  MkNavList,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for `MkDrawer` — the declarative slide-out
 * panel from `@mkornas/ui`.
 */
@Component({
  selector: 'docs-drawer-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DocsExample,
    MkDrawer,
    MkButton,
    MkFormField,
    MkInput,
    MkNavList,
    MkNavItem,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Drawer</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-drawer&gt;</code> is a declarative
        slide-out panel driven by a two-way
        <code class="docs-inline">open</code>. It traps focus, closes on backdrop
        click or <kbd>Escape</kbd>, restores focus to the trigger on close, and
        locks page scroll while modal. Anchor it to any edge with
        <code class="docs-inline">side</code> and give it a header, body and pinned
        footer via projection.
      </p>

      <!-- ============================================================ -->
      <h2>Basic</h2>
      <p>
        Bind <code class="docs-inline">[(open)]</code> to a boolean and flip it
        from anywhere. The panel renders its projected content as the body;
        <code class="docs-inline">heading</code> fills the built-in header and
        <code class="docs-inline">mkDrawerFooter</code> pins actions to the
        bottom.
      </p>
      <docs-example [code]="basicCode">
        <button mkButton (click)="filtersOpen.set(true)">Open filters</button>
      </docs-example>

      <mk-drawer [(open)]="filtersOpen" side="end" heading="Filters" size="22rem">
        <mk-form-field label="Search">
          <input mkInput placeholder="Keyword…" [(ngModel)]="keyword" />
        </mk-form-field>
        <mk-form-field label="Status" style="margin-top: var(--mk-space-3);">
          <input mkInput placeholder="Any" />
        </mk-form-field>
        <div mkDrawerFooter>
          <button mkButton variant="ghost" (click)="filtersOpen.set(false)">Cancel</button>
          <button mkButton (click)="filtersOpen.set(false)">Apply</button>
        </div>
      </mk-drawer>

      <!-- ============================================================ -->
      <h2>Sides</h2>
      <p>
        <code class="docs-inline">side</code> picks the edge the drawer slides in
        from — <code class="docs-inline">'start'</code>,
        <code class="docs-inline">'end'</code> (default),
        <code class="docs-inline">'top'</code> or
        <code class="docs-inline">'bottom'</code>. For left/right drawers
        <code class="docs-inline">size</code> is the width; for top/bottom it is
        the height.
      </p>
      <docs-example [code]="sidesCode">
        <div style="display: flex; gap: var(--mk-space-3); flex-wrap: wrap;">
          <button mkButton variant="outline" (click)="navOpen.set(true)">Nav (start)</button>
          <button mkButton variant="outline" (click)="topOpen.set(true)">Banner (top)</button>
          <button mkButton variant="outline" (click)="bottomOpen.set(true)">Actions (bottom)</button>
        </div>
      </docs-example>

      <mk-drawer [(open)]="navOpen" side="start" heading="Navigation" size="18rem">
        <mk-nav-list>
          <mk-nav-item label="Dashboard" href="#" active />
          <mk-nav-item label="Articles" href="#" />
          <mk-nav-item label="Media" href="#" />
          <mk-nav-item label="Settings" href="#" />
        </mk-nav-list>
        <p style="margin-top: var(--mk-space-3); color: var(--mk-text-muted);">
          Keyword from the filters drawer: {{ keyword() || '—' }}
        </p>
      </mk-drawer>

      <mk-drawer [(open)]="topOpen" side="top" heading="What's new" size="10rem">
        <p>A top drawer works well for announcements or a command bar.</p>
      </mk-drawer>

      <mk-drawer [(open)]="bottomOpen" side="bottom" heading="Bulk actions" size="12rem">
        <p>Anchor to the bottom for mobile-style action sheets.</p>
        <div mkDrawerFooter>
          <button mkButton variant="ghost" (click)="bottomOpen.set(false)">Cancel</button>
          <button mkButton (click)="bottomOpen.set(false)">Delete selected</button>
        </div>
      </mk-drawer>

      <!-- ============================================================ -->
      <h2>API</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
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

      <h3>Accessibility &amp; keyboard</h3>
      <p>
        While modal, the drawer sets <code class="docs-inline">role="dialog"</code>
        with <code class="docs-inline">aria-modal="true"</code>, moves focus into
        the panel and marks the rest of the page
        <code class="docs-inline">inert</code>. Closing restores focus to the
        element that opened it.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></td><td>Cycle focus within the panel (focus is trapped while open).</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Close the drawer (unless <code class="docs-inline">closeOnEscape</code> is off).</td></tr>
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
export class DrawerPage {
  protected readonly filtersOpen = signal(false);
  protected readonly navOpen = signal(false);
  protected readonly topOpen = signal(false);
  protected readonly bottomOpen = signal(false);
  protected readonly keyword = signal('');

  protected readonly basicCode = `<button mkButton (click)="open.set(true)">Open filters</button>

<mk-drawer [(open)]="open" side="end" heading="Filters" size="22rem">
  <mk-form-field label="Search">
    <input mkInput placeholder="Keyword…" [(ngModel)]="keyword" />
  </mk-form-field>
  <div mkDrawerFooter>
    <button mkButton variant="ghost" (click)="open.set(false)">Cancel</button>
    <button mkButton (click)="open.set(false)">Apply</button>
  </div>
</mk-drawer>`;

  protected readonly sidesCode = `<mk-drawer [(open)]="navOpen" side="start" heading="Navigation" size="18rem">
  <mk-nav-list>…</mk-nav-list>
</mk-drawer>

<mk-drawer [(open)]="topOpen" side="top" heading="What's new" size="10rem">…</mk-drawer>
<mk-drawer [(open)]="bottomOpen" side="bottom" heading="Bulk actions">…</mk-drawer>`;
}
