import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  type MkCommand,
  MkButton,
  MkCommandPalette,
  MkNavGroup,
  MkNavItem,
  MkNavList,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `mk-command-palette` and
 * `mk-nav-group` navigation components of `@mk-kit/ui`.
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

      <h3><code class="docs-inline">&lt;mk-command-palette&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>open</code></td><td><code>model&lt;boolean&gt;</code></td><td><code>false</code></td><td>Whether the palette is open (two-way).</td></tr>
          <tr><td><code>commands</code></td><td><code>MkCommand[]</code></td><td><code>[]</code></td><td>The commands to search and run.</td></tr>
          <tr><td><code>hotkey</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Toggle open with <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>K</kbd> anywhere.</td></tr>
          <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>'Type a command or search…'</code></td><td>Search field placeholder (i18n-aware).</td></tr>
          <tr><td><code>emptyMessage</code></td><td><code>string</code></td><td><code>'No results'</code></td><td>Message shown when nothing matches (i18n-aware).</td></tr>
          <tr><td><code>(commandSelected)</code></td><td><code>output&lt;MkCommand&gt;</code></td><td>—</td><td>Emits the chosen command (its own <code>run</code> callback also fires).</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">MkCommand</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>id</code></td><td><code>string</code></td><td>required</td><td>Stable unique id.</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td>required</td><td>Text shown (and the primary search target).</td></tr>
          <tr><td><code>group</code></td><td><code>string</code></td><td>—</td><td>Section heading this command is grouped under.</td></tr>
          <tr><td><code>hint</code></td><td><code>string</code></td><td>—</td><td>Secondary text shown after the label.</td></tr>
          <tr><td><code>icon</code></td><td><code>string</code></td><td>—</td><td>Name of a registered icon (see <code>MkIconRegistry</code>).</td></tr>
          <tr><td><code>keywords</code></td><td><code>string</code></td><td>—</td><td>Extra search terms (not shown).</td></tr>
          <tr><td><code>shortcut</code></td><td><code>string</code></td><td>—</td><td>Display-only shortcut hint, e.g. <code>⌘S</code>.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the command (skipped by keyboard, not runnable).</td></tr>
          <tr><td><code>run</code></td><td><code>() =&gt; void</code></td><td>—</td><td>Invoked when the command is chosen.</td></tr>
        </tbody>
      </table>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd></td><td>Toggle the palette from anywhere (disable via <code>hotkey</code>).</td></tr>
          <tr><td><kbd>↓</kbd> / <kbd>↑</kbd></td><td>Move through the results (wraps, skips disabled commands).</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>Jump to the first / last enabled result.</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Run the highlighted command and close.</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Close without running anything.</td></tr>
        </tbody>
      </table>

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

      <h3><code class="docs-inline">&lt;mk-nav-group&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Section title. In a collapsed icon rail it becomes a divider.</td></tr>
          <tr><td><code>collapsible</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Make the label a toggle that shows/hides the items (<code>aria-expanded</code> + region).</td></tr>
          <tr><td><code>expanded</code></td><td><code>model&lt;boolean&gt;</code></td><td><code>true</code></td><td>Whether the section is expanded (two-way; only meaningful when collapsible).</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">&lt;mk-nav-item&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Visible label; also the tooltip when the list is collapsed.</td></tr>
          <tr><td><code>href</code></td><td><code>string</code></td><td>—</td><td>Link target. Renders an anchor instead of a button.</td></tr>
          <tr><td><code>active</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Marks the current page (<code>aria-current="page"</code>).</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable interaction.</td></tr>
          <tr><td><code>badge</code></td><td><code>string | number</code></td><td>—</td><td>Optional badge (count or short text).</td></tr>
          <tr><td><code>expanded</code></td><td><code>model&lt;boolean&gt;</code></td><td><code>false</code></td><td>Whether nested child items are expanded (two-way).</td></tr>
          <tr><td><code>(action)</code></td><td><code>output&lt;void&gt;</code></td><td>—</td><td>Emitted when a button-style item is activated.</td></tr>
        </tbody>
      </table>
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
