import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MkButton,
  MkDialog,
  MkDialogService,
  MkDialogTitle,
  MkOverlayRef,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Small custom dialog content component opened via `MkDialogService.open`. It
 * lays out its content with `mk-dialog` (sticky header/title, scrollable body,
 * sticky footer) and closes the surrounding overlay through the injected
 * {@link MkOverlayRef}, optionally returning a result to `afterClosed`.
 */
@Component({
  selector: 'docs-demo-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkDialog, MkDialogTitle, MkButton],
  template: `
    <mk-dialog>
      <mk-dialog-title>Invite teammate</mk-dialog-title>
      <p>
        This is a fully custom dialog body rendered by a standalone component.
        Anything can live here — forms, media, or rich content that scrolls
        independently of the sticky header and footer.
      </p>
      <div mkDialogFooter>
        <button mkButton variant="ghost" tone="neutral" (click)="cancel()">
          Cancel
        </button>
        <button mkButton (click)="send()">Send invite</button>
      </div>
    </mk-dialog>
  `,
})
export class DemoDialogContent {
  private readonly ref = inject<MkOverlayRef<string>>(MkOverlayRef);

  protected cancel(): void {
    this.ref.close();
  }

  protected send(): void {
    this.ref.close('sent');
  }
}

/**
 * Documentation page for `MkDialogService`: confirm, alert & prompt, and
 * custom component dialogs.
 */
@Component({
  selector: 'docs-dialogs-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton, RouterLink],
  template: `
    <div class="docs-page docs-container">
      <h1>Dialogs</h1>
      <p class="docs-lead">
        Modal <code class="docs-inline">Dialog</code>s rendered by
        <code class="docs-inline">MkDialogService</code> — promise-based
        <code class="docs-inline">confirm()</code>,
        <code class="docs-inline">alert()</code>, and
        <code class="docs-inline">prompt()</code> helpers, plus
        <code class="docs-inline">open()</code> for fully custom standalone
        components — themed with <code class="docs-inline">--mk-*</code> tokens
        and fully accessible.
      </p>

      <!-- ======================== BASIC DIALOG ========================= -->
      <h2>Basic dialog</h2>
      <p>
        <code class="docs-inline">MkDialogService</code> renders content on a
        themed <code class="docs-inline">--mk-surface</code> panel with a
        backdrop, focus trap, and Escape handling. Pass a standalone component
        to <code class="docs-inline">open()</code>: lay it out with
        <code class="docs-inline">mk-dialog</code> (sticky header, scrollable
        body, sticky footer) and close it through the injected
        <code class="docs-inline">MkOverlayRef</code>, optionally returning a
        result to <code class="docs-inline">afterClosed</code>.
      </p>
      <docs-example [code]="openCode">
        <button mkButton (click)="openCustom()">Open dialog…</button>
        <span class="docs-status">
          @if (openResult(); as r) {
            Closed with: {{ r }}
          }
        </span>
      </docs-example>

      <p>The projected <code class="docs-inline">mk-dialog</code> markup:</p>
      <docs-example [code]="dialogMarkupCode"></docs-example>

      <!-- ==================== CONFIRM & PROMPT ========================= -->
      <h2>Confirm &amp; prompt (service)</h2>
      <p>
        For the common one-question cases you don't need a component at all —
        the service ships promise-based helpers.
      </p>

      <h3>Confirm</h3>
      <p>
        <code class="docs-inline">confirm()</code> resolves
        <code class="docs-inline">true</code> when confirmed and
        <code class="docs-inline">false</code> on cancel, Escape, or backdrop
        click.
      </p>
      <docs-example [code]="confirmCode">
        <button mkButton tone="danger" (click)="openConfirm()">
          Delete workspace…
        </button>
        <span class="docs-status">
          @if (confirmResult() === null) {
            No result yet.
          } @else if (confirmResult()) {
            Confirmed ✓
          } @else {
            Cancelled ✕
          }
        </span>
      </docs-example>

      <h3>Alert &amp; prompt</h3>
      <p>
        <code class="docs-inline">alert()</code> shows a single-button
        acknowledgement (resolves when dismissed);
        <code class="docs-inline">prompt()</code> collects one value and resolves
        with the string, or <code class="docs-inline">null</code> if cancelled.
      </p>
      <docs-example [code]="alertPromptCode">
        <button mkButton variant="outline" (click)="openAlert()">Show alert…</button>
        <button mkButton variant="outline" (click)="openPrompt()">Rename…</button>
        <span class="docs-status">
          @if (promptResult(); as r) {
            Renamed to: {{ r }}
          }
        </span>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr>
            <th>confirm() data</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">title</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Heading text (required).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">message</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Body message (required).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">confirmText</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">'Confirm'</code></td>
            <td>Confirm button label.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">cancelText</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">'Cancel'</code></td>
            <td>Cancel button label.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">'primary' | 'danger' | 'warning' | 'success'</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>Confirm button tone; <code class="docs-inline">'danger'</code> switches the panel to <code class="docs-inline">alertdialog</code>.</td>
          </tr>
        </tbody>
      </table>

      <!-- ====================== SIZING & PANELS ======================== -->
      <h2>Sizing &amp; panels</h2>
      <p>
        <code class="docs-inline">MkDialogConfig.size</code> picks a panel width
        preset: <code class="docs-inline">sm</code> (32rem, the default) for
        confirmations and single-field prompts,
        <code class="docs-inline">md</code> (45rem) for two-column forms,
        <code class="docs-inline">lg</code> (56rem) for forms with nested
        sections, and <code class="docs-inline">xl</code> (75rem) for tables or
        side-by-side content inside a modal. The panel is always
        <code class="docs-inline">min(target, 92vw)</code>, so it shrinks to fit
        a phone and grows to its target on a desktop. Use
        <code class="docs-inline">panelClass</code> to add your own class(es) to
        the overlay panel for further styling.
      </p>
      <docs-example [code]="sizeCode">
        <button mkButton variant="outline" (click)="openLarge()">
          Open lg dialog…
        </button>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr>
            <th>MkDialogConfig</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">data</code></td>
            <td><code class="docs-inline">TData</code></td>
            <td><code class="docs-inline">null</code></td>
            <td>Injected into the component via <code class="docs-inline">MK_OVERLAY_DATA</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">hasBackdrop</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code></td>
            <td>Render a dimmed scrim behind the panel.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">closeOnBackdropClick</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code></td>
            <td>Close when the backdrop is clicked.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">closeOnEscape</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code></td>
            <td>Close when Escape is pressed.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">trapFocus</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code></td>
            <td>Trap focus within the panel and restore on close.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">panelClass</code></td>
            <td><code class="docs-inline">string | string[]</code></td>
            <td><code class="docs-inline">undefined</code></td>
            <td>Extra class(es) on the panel host element.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">role</code></td>
            <td><code class="docs-inline">'dialog' | 'alertdialog' | …</code></td>
            <td><code class="docs-inline">'dialog'</code></td>
            <td>Accessible role for the panel.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg' | 'xl'</code></td>
            <td><code class="docs-inline">'sm'</code></td>
            <td>Panel width preset — see above.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">ariaLabel</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">undefined</code></td>
            <td>Panel label when no visible title is wired up.</td>
          </tr>
        </tbody>
      </table>

      <!-- =================== FOCUS & ACCESSIBILITY ===================== -->
      <h2>Focus &amp; accessibility</h2>
      <p>
        The panel gets <code class="docs-inline">role="dialog"</code> (or
        <code class="docs-inline">alertdialog</code>), and a projected
        <code class="docs-inline">mk-dialog-title</code> is wired to the panel's
        <code class="docs-inline">aria-labelledby</code> automatically; use
        <code class="docs-inline">ariaLabel</code> when there is no visible
        title.
      </p>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Tab</kbd></td><td>Move to the next focusable element inside the dialog; focus is trapped and wraps from the last element back to the first (<code class="docs-inline">trapFocus</code>, default on).</td></tr>
          <tr><td><kbd>Shift</kbd>+<kbd>Tab</kbd></td><td>Move to the previous focusable element; wraps from the first element to the last.</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Close the dialog (<code class="docs-inline">closeOnEscape</code>, default on) — <code class="docs-inline">confirm()</code> resolves <code class="docs-inline">false</code>, <code class="docs-inline">prompt()</code> resolves <code class="docs-inline">null</code>.</td></tr>
        </tbody>
      </table>
      <p>
        On open, focus moves to the first focusable element in the panel (or the
        panel itself); on close, focus is restored to the element that had it
        before the dialog opened.
      </p>

      <!-- ==================== WHICH SURFACE? =========================== -->
      <h2>Dialog, bottom sheet, or drawer?</h2>
      <p>
        Use a <strong>dialog</strong> for a focal decision or a short task that
        must be resolved before continuing. Prefer a
        <a routerLink="/components/bottom-sheet">bottom sheet</a> for a
        mobile-friendly task surface that slides up from the edge and can be
        dismissed with a swipe. Reach for a
        <a routerLink="/components/drawer">drawer</a> when you need a side
        workspace — filters, details, or secondary navigation — that can stay
        open next to the page.
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .docs-status {
        display: inline-flex;
        align-items: center;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class DialogsPage {
  private readonly dialog = inject(MkDialogService);

  protected readonly confirmResult = signal<boolean | null>(null);
  protected readonly openResult = signal<string | null>(null);
  protected readonly promptResult = signal<string | null>(null);

  // ------------------------------- Dialog ------------------------------
  protected async openConfirm(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Delete workspace?',
      message: 'This permanently removes the workspace and all its data.',
      confirmText: 'Delete',
      cancelText: 'Keep it',
      tone: 'danger',
    });
    this.confirmResult.set(confirmed);
  }

  protected async openCustom(): Promise<void> {
    const ref = this.dialog.open<DemoDialogContent, string>(DemoDialogContent, {
      ariaLabel: 'Invite teammate',
    });
    const result = await ref.afterClosed;
    this.openResult.set(result ?? 'dismissed');
  }

  protected openLarge(): void {
    this.dialog.open<DemoDialogContent, string>(DemoDialogContent, {
      ariaLabel: 'Invite teammate',
      size: 'lg',
    });
  }

  protected async openAlert(): Promise<void> {
    await this.dialog.alert({
      title: 'Export started',
      message: 'Your export is being prepared. We’ll email you when it’s ready.',
    });
  }

  protected async openPrompt(): Promise<void> {
    const name = await this.dialog.prompt({
      title: 'Rename workspace',
      label: 'Workspace name',
      value: 'Acme Inc.',
      required: true,
      confirmText: 'Rename',
    });
    if (name !== null) this.promptResult.set(name);
  }

  // --------------------------- Code snippets ---------------------------
  protected readonly confirmCode = `private readonly dialog = inject(MkDialogService);

async delete(): Promise<void> {
  const confirmed = await this.dialog.confirm({
    title: 'Delete workspace?',
    message: 'This permanently removes the workspace and all its data.',
    confirmText: 'Delete',
    cancelText: 'Keep it',
    tone: 'danger', // switches the panel to role="alertdialog"
  });
  if (confirmed) remove();
}`;

  protected readonly alertPromptCode = `// Single-button acknowledgement
await this.dialog.alert({
  title: 'Export started',
  message: 'We’ll email you when it’s ready.',
});

// Collect one value — resolves to the string, or null on cancel
const name = await this.dialog.prompt({
  title: 'Rename workspace',
  label: 'Workspace name',
  value: 'Acme Inc.',
  required: true,
  confirmText: 'Rename',
});
if (name !== null) rename(name);`;

  protected readonly openCode = `const ref = this.dialog.open<DemoDialogContent, string>(DemoDialogContent, {
  ariaLabel: 'Invite teammate',
});
const result = await ref.afterClosed; // string | undefined`;

  protected readonly sizeCode = `this.dialog.open(EditUserDialog, {
  size: 'lg', // 'sm' (default) | 'md' | 'lg' | 'xl' — always min(target, 92vw)
  panelClass: 'app-edit-user-panel',
});`;

  protected readonly dialogMarkupCode = `@Component({
  selector: 'app-invite-dialog',
  imports: [MkDialog, MkDialogTitle, MkButton],
  template: \`
    <mk-dialog>
      <mk-dialog-title>Invite teammate</mk-dialog-title>
      <p>Custom body content goes here.</p>
      <div mkDialogFooter>
        <button mkButton variant="ghost" (click)="cancel()">Cancel</button>
        <button mkButton (click)="send()">Send invite</button>
      </div>
    </mk-dialog>
  \`,
})
export class InviteDialog {
  private readonly ref = inject<MkOverlayRef<string>>(MkOverlayRef);
  protected cancel() { this.ref.close(); }
  protected send() { this.ref.close('sent'); }
}`;
}
