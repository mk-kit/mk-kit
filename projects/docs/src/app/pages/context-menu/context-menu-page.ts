import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  MkContextMenuTrigger,
  MkMenu,
  MkMenuItem,
  MkToastService,
  MkIcon,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

@Component({
  selector: 'docs-context-menu-page',
  imports: [MkContextMenuTrigger, MkMenu, MkMenuItem, DocsExample, MkIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Context menu</h1>
      <p class="docs-lead">
        A right-click (or keyboard) context menu that reuses
        <code class="docs-inline">mk-menu</code>. Attach
        <code class="docs-inline">[mkContextMenuTriggerFor]</code> to any element and
        the menu opens at the pointer — fully keyboard accessible via the
        <kbd>Menu</kbd> key or <kbd>Shift</kbd>+<kbd>F10</kbd>.
      </p>

      <h2>Basic usage</h2>
      <p>
        Right-click the surface below (or focus it and press the context-menu key).
        Last action: <strong>{{ status() }}</strong>
      </p>
      <docs-example [column]="true" [code]="basicCode">
        <div class="ctx-surface" tabindex="0" [mkContextMenuTriggerFor]="fileMenu">
          <mk-icon name="mouse-pointer-click" />
          Right-click anywhere in this box
        </div>
        <mk-menu #fileMenu="mkMenu">
          <mk-menu-item (action)="run('Open')">
            <mk-icon mkMenuItemIcon name="folder-open" /> Open
          </mk-menu-item>
          <mk-menu-item (action)="run('Rename')">
            <mk-icon mkMenuItemIcon name="edit" /> Rename
          </mk-menu-item>
          <mk-menu-item (action)="run('Duplicate')">
            <span mkMenuItemIcon aria-hidden="true">⧉</span> Duplicate
          </mk-menu-item>
          <mk-menu-item disabled>
            <mk-icon mkMenuItemIcon name="lock" /> Locked
          </mk-menu-item>
          <mk-menu-item danger (action)="run('Delete')">
            <mk-icon mkMenuItemIcon name="trash" /> Delete
          </mk-menu-item>
        </mk-menu>
      </docs-example>

      <h2>Per-item context menus</h2>
      <p>
        Each row can share one menu instance — right-click any card to act on it.
      </p>
      <docs-example [column]="true" [code]="rowsCode">
        <div class="ctx-rows">
          @for (item of items; track item) {
            <div class="ctx-row" tabindex="0" [mkContextMenuTriggerFor]="rowMenu"
              (contextmenu)="active.set(item)"
              (focus)="active.set(item)">
              {{ item }}
            </div>
          }
        </div>
        <mk-menu #rowMenu="mkMenu">
          <mk-menu-item (action)="run('Pin ' + active())">Pin</mk-menu-item>
          <mk-menu-item (action)="run('Share ' + active())">Share</mk-menu-item>
          <mk-menu-item danger (action)="run('Remove ' + active())">Remove</mk-menu-item>
        </mk-menu>
      </docs-example>

      <h2>How it works &amp; API</h2>
      <p>
        The directive listens for the host's <code class="docs-inline">contextmenu</code>
        event, prevents the native menu, and calls
        <code class="docs-inline">MkMenu.openAt(x, y)</code> to position the panel at
        the cursor (flipping near viewport edges). It also handles the keyboard
        context-menu key and <code class="docs-inline">Shift+F10</code>, anchoring the
        menu to the element. Focus is trapped within the open menu and restored to the
        host on close.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>[mkContextMenuTriggerFor]</code></td><td><code>MkMenu</code></td><td>The menu instance to open on right-click / keyboard.</td></tr>
          <tr><td><code>mk-menu</code> / <code>mk-menu-item</code></td><td>—</td><td>Same components used by the dropdown menu (icons, <code>disabled</code>, <code>danger</code>, <code>(action)</code>).</td></tr>
          <tr><td><code>MkMenu.openAt(x, y, el?)</code></td><td><code>method</code></td><td>Open the menu at viewport coordinates; restores focus to <code>el</code>.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .ctx-surface {
        display: flex;
        align-items: center;
        gap: var(--mk-space-2);
        width: 100%;
        min-height: 140px;
        justify-content: center;
        border: 2px dashed var(--mk-border-strong);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface-2);
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-md);
        user-select: none;
        cursor: context-menu;
      }
      .ctx-surface:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
      .ctx-rows {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--mk-space-3);
        width: 100%;
      }
      .ctx-row {
        padding: var(--mk-space-5) var(--mk-space-4);
        text-align: center;
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
        cursor: context-menu;
        transition: border-color var(--mk-duration-fast) var(--mk-ease-standard);
      }
      .ctx-row:hover {
        border-color: var(--mk-border-strong);
      }
      .ctx-row:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
    `,
  ],
})
export class ContextMenuPage {
  private readonly toast = inject(MkToastService);
  protected readonly status = signal('—');
  protected readonly active = signal('Report Q3');
  protected readonly items = ['Report Q3', 'Budget.xlsx', 'Roadmap', 'Assets'];

  protected run(label: string): void {
    this.status.set(label);
    this.toast.info(label);
  }

  protected readonly basicCode = `<div tabindex="0" [mkContextMenuTriggerFor]="fileMenu">
  Right-click anywhere in this box
</div>

<mk-menu #fileMenu="mkMenu">
  <mk-menu-item (action)="open()">
    <mk-icon mkMenuItemIcon name="folder-open" /> Open
  </mk-menu-item>
  <mk-menu-item (action)="rename()">Rename</mk-menu-item>
  <mk-menu-item disabled>Locked</mk-menu-item>
  <mk-menu-item danger (action)="remove()">Delete</mk-menu-item>
</mk-menu>`;

  protected readonly rowsCode = `@for (item of items; track item) {
  <div tabindex="0" [mkContextMenuTriggerFor]="rowMenu"
       (contextmenu)="active.set(item)" (focus)="active.set(item)">
    {{ item }}
  </div>
}
<mk-menu #rowMenu="mkMenu" [ariaLabel]="'Actions for ' + active()">
  <mk-menu-item (action)="pin(active())">Pin</mk-menu-item>
  <mk-menu-item danger (action)="remove(active())">Remove</mk-menu-item>
</mk-menu>`;
}
