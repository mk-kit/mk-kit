import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MkButton, MkSnackbarService } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `MkSnackbarService` of `@mkornas/ui`.
 */
@Component({
  selector: 'docs-snackbar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton],
  template: `
    <div class="docs-page docs-container">
      <h1>Snackbar</h1>
      <p class="docs-lead">
        <code class="docs-inline">MkSnackbarService</code> shows a single, brief
        message at the bottom-centre of the viewport with an optional action —
        the Material snackbar model: one at a time, and opening a new one
        replaces the current. For stacked, persistent notifications use
        <code class="docs-inline">MkToastService</code> (on the Feedback page)
        instead.
      </p>

      <!-- ============================================================ -->
      <h2>Basic</h2>
      <p>
        <code class="docs-inline">open(message)</code> auto-dismisses after 5s.
      </p>
      <docs-example [code]="basicCode">
        <button mkButton (click)="basic()">Show snackbar</button>
      </docs-example>

      <!-- ============================================================ -->
      <h2>With an action</h2>
      <p>
        Pass an action label and await the returned ref's
        <code class="docs-inline">onAction()</code>.
      </p>
      <docs-example [code]="actionCode">
        <div style="display: flex; gap: var(--mk-space-3); align-items: center;">
          <button mkButton (click)="withAction()">Archive with Undo</button>
          <span class="echo">Last result: {{ result() }}</span>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Tones</h2>
      <p>
        A tone adds a coloured accent stripe. Danger and warning are announced
        assertively.
      </p>
      <docs-example [code]="toneCode">
        <div style="display: flex; gap: var(--mk-space-3); flex-wrap: wrap;">
          <button mkButton variant="soft" tone="success" (click)="tone('success', 'Changes saved')">Success</button>
          <button mkButton variant="soft" tone="info" (click)="tone('info', 'New update available')">Info</button>
          <button mkButton variant="soft" tone="warning" (click)="tone('warning', 'Low on storage')">Warning</button>
          <button mkButton variant="soft" tone="danger" (click)="tone('danger', 'Failed to sync')">Danger</button>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Persistent &amp; dismissible</h2>
      <p>
        Set <code class="docs-inline">duration: 0</code> to keep it open, and
        <code class="docs-inline">dismissible: true</code> to add a close button.
      </p>
      <docs-example [code]="persistentCode">
        <button mkButton (click)="persistent()">Show persistent</button>
      </docs-example>

      <!-- ============================================================ -->
      <h2>API</h2>

      <h3><code class="docs-inline">MkSnackbarService</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>open(message, action?, config?)</code></td><td>Show a snackbar, replacing any open one. <code>action</code> is the optional button label. Returns an <code>MkSnackbarRef</code>.</td></tr>
          <tr><td><code>dismiss(id)</code></td><td>Dismiss the snackbar with the given id (if it is the active one).</td></tr>
          <tr><td><code>pause()</code> / <code>resume()</code></td><td>Pause / resume the auto-dismiss countdown (used on hover/focus).</td></tr>
          <tr><td><code>active</code></td><td>Readonly signal of the currently visible snackbar, or <code>null</code>.</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">MkSnackbarConfig</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>tone</code></td><td><code>'neutral' | 'info' | 'success' | 'warning' | 'danger'</code></td><td><code>'neutral'</code></td><td>Semantic tone; adds the coloured accent stripe.</td></tr>
          <tr><td><code>duration</code></td><td><code>number</code></td><td><code>5000</code></td><td>Auto-dismiss delay in ms. <code>0</code> keeps it open until dismissed.</td></tr>
          <tr><td><code>dismissible</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Show a close (×) button.</td></tr>
          <tr><td><code>politeness</code></td><td><code>'polite' | 'assertive'</code></td><td><code>'polite'</code></td><td>Live-region politeness for the screen-reader announcement.</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">MkSnackbarRef</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>onAction()</code></td><td>Promise that resolves when the action button is activated.</td></tr>
          <tr><td><code>afterDismissed()</code></td><td>Promise that resolves when the snackbar closes, with the reason: <code>'action' | 'timeout' | 'dismiss'</code>.</td></tr>
          <tr><td><code>dismiss()</code></td><td>Dismiss this snackbar programmatically.</td></tr>
        </tbody>
      </table>
    </div>
  `,
})
export class SnackbarPage {
  private readonly snackbar = inject(MkSnackbarService);
  protected readonly result = signal('—');

  protected basic(): void {
    this.snackbar.open('Message sent');
  }

  protected withAction(): void {
    this.result.set('waiting…');
    const ref = this.snackbar.open('Conversation archived', 'Undo');
    ref.onAction().then(() => this.result.set('Undo clicked'));
    ref.afterDismissed().then((reason) => {
      if (reason !== 'action') this.result.set(`dismissed (${reason})`);
    });
  }

  protected tone(
    tone: 'success' | 'info' | 'warning' | 'danger',
    message: string,
  ): void {
    this.snackbar.open(message, undefined, { tone });
  }

  protected persistent(): void {
    this.snackbar.open('This stays until you close it', undefined, {
      duration: 0,
      dismissible: true,
    });
  }

  protected readonly basicCode = `const snackbar = inject(MkSnackbarService);
snackbar.open('Message sent');`;

  protected readonly actionCode = `const ref = snackbar.open('Conversation archived', 'Undo');
ref.onAction().then(() => restore());
ref.afterDismissed().then(reason => console.log(reason));`;

  protected readonly toneCode = `snackbar.open('Changes saved', undefined, { tone: 'success' });
snackbar.open('Failed to sync', undefined, { tone: 'danger' });`;

  protected readonly persistentCode = `snackbar.open('This stays until you close it', undefined, {
  duration: 0,
  dismissible: true,
});`;
}
