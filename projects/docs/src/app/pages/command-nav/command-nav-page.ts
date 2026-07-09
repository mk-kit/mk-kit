import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  type MkCommand,
  MkButton,
  MkCommandPalette,
  MkNavGroup,
  MkNavItem,
  MkNavList,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `mk-command-palette` and
 * `mk-nav-group` navigation components of `@mkornas/ui`.
 */
@Component({
  selector: 'docs-command-nav-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkCommandPalette,
    MkNavList,
    MkNavItem,
    MkNavGroup,
    MkButton,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Command palette &amp; nav groups</h1>
      <p class="docs-lead">
        Keyboard-first navigation for admin apps: a ⌘K command palette and
        collapsible sidebar sections.
      </p>

      <!-- ============================================================ -->
      <h2>Command palette</h2>
      <p>
        Press <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> anywhere, or click the
        button. Type to filter across groups, use <kbd>↑</kbd>/<kbd>↓</kbd> and
        <kbd>Enter</kbd>, <kbd>Esc</kbd> to close.
      </p>
      <docs-example [code]="paletteCode">
        <div style="display: flex; gap: var(--mk-space-3); align-items: center; flex-wrap: wrap;">
          <button mkButton (click)="paletteOpen.set(true)">
            Open command palette <kbd style="margin-left: var(--mk-space-2);">⌘K</kbd>
          </button>
          <span class="echo">Last run: {{ lastCommand() }}</span>
        </div>
      </docs-example>

      <mk-command-palette
        [(open)]="paletteOpen"
        [commands]="commands"
        (commandSelected)="lastCommand.set($event.label)"
      />

      <!-- ============================================================ -->
      <h2>Nav groups</h2>
      <p>
        Group sidebar items under section labels. Plain sections are static; add
        <code class="docs-inline">collapsible</code> to make the label a toggle.
      </p>
      <docs-example [code]="navCode" column>
        <div style="width: 15rem; border: 1px solid var(--mk-border-subtle); border-radius: var(--mk-radius-lg); padding: var(--mk-space-2); background: var(--mk-surface);">
          <mk-nav-list>
            <mk-nav-group label="Main">
              <mk-nav-item label="Dashboard" active (action)="noop()" />
              <mk-nav-item label="Articles" (action)="noop()" />
              <mk-nav-item label="Media" (action)="noop()" />
            </mk-nav-group>
            <mk-nav-group label="Settings" collapsible>
              <mk-nav-item label="Team" (action)="noop()" />
              <mk-nav-item label="Billing" (action)="noop()" />
              <mk-nav-item label="API keys" (action)="noop()" />
            </mk-nav-group>
          </mk-nav-list>
        </div>
      </docs-example>
    </div>
  `,
})
export class CommandNavPage {
  protected readonly paletteOpen = signal(false);
  protected readonly lastCommand = signal('—');

  protected readonly commands: MkCommand[] = [
    { id: 'new-article', label: 'New article', group: 'Create', icon: 'plus', shortcut: 'C', keywords: 'post write' },
    { id: 'new-user', label: 'Invite user', group: 'Create', icon: 'user', keywords: 'team member' },
    { id: 'go-dashboard', label: 'Go to Dashboard', group: 'Navigate', icon: 'home' },
    { id: 'go-media', label: 'Go to Media library', group: 'Navigate', icon: 'download', keywords: 'files images' },
    { id: 'go-settings', label: 'Go to Settings', group: 'Navigate', icon: 'settings' },
    { id: 'toggle-theme', label: 'Toggle dark mode', group: 'Preferences', icon: 'eye' },
    { id: 'search', label: 'Search everything', group: 'Preferences', icon: 'search', shortcut: '/' },
    { id: 'trash', label: 'Empty trash', group: 'Danger', icon: 'trash', hint: 'irreversible', disabled: true },
  ];

  protected noop(): void {}

  protected readonly paletteCode = `commands: MkCommand[] = [
  { id: 'new-article', label: 'New article', group: 'Create', icon: 'plus', shortcut: 'C' },
  { id: 'go-settings', label: 'Go to Settings', group: 'Navigate', icon: 'settings' },
  // …
];

<mk-command-palette [(open)]="open" [commands]="commands"
  (commandSelected)="run($event)" />`;

  protected readonly navCode = `<mk-nav-list>
  <mk-nav-group label="Main">
    <mk-nav-item label="Dashboard" active />
    <mk-nav-item label="Articles" />
  </mk-nav-group>
  <mk-nav-group label="Settings" collapsible>
    <mk-nav-item label="Team" />
    <mk-nav-item label="Billing" />
  </mk-nav-group>
</mk-nav-list>`;
}
