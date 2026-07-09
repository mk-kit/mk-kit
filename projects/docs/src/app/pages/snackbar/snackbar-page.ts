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
