import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  MkAlert,
  MkBanner,
  MkButton,
  MkLoadingBar,
  MkLoadingBarService,
  MkToastService,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation page for the Feedback component group: Alert, Banner, Toast,
 * and the top loading bar.
 */
@Component({
  selector: 'docs-feedback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkAlert, MkBanner, MkButton, MkLoadingBar],
  template: `
    <div class="docs-page docs-container">
      <h1>Feedback</h1>
      <p class="docs-lead">
        Components for communicating status: inline
        <code class="docs-inline">Alert</code> messages, persistent full-width
        <code class="docs-inline">Banner</code>s, stacked
        <code class="docs-inline">Toast</code> notifications, and a top
        <code class="docs-inline">Loading bar</code> for route progress — all
        themed with <code class="docs-inline">--mk-*</code> tokens and fully
        accessible.
      </p>

      <!-- ============================ ALERT ============================ -->
      <h2>Alert</h2>
      <p>
        An inline banner that communicates a contextual status message. Set a
        semantic <code class="docs-inline">tone</code> and a
        <code class="docs-inline">variant</code>, an optional bold
        <code class="docs-inline">title</code>, and mark it
        <code class="docs-inline">dismissible</code> to render a close button
        that emits <code class="docs-inline">dismissed</code>. Danger and
        warning tones announce assertively (<code class="docs-inline"
          >role="alert"</code
        >); other tones use <code class="docs-inline">role="status"</code>.
      </p>

      <h3>Tones</h3>
      <docs-example [code]="alertTonesCode" [column]="true">
        <mk-alert tone="info" title="Heads up">
          A new version of the workspace is available.
        </mk-alert>
        <mk-alert tone="success" title="Saved">
          Your changes were saved successfully.
        </mk-alert>
        <mk-alert tone="warning" title="Storage almost full">
          You have used 92% of your quota.
        </mk-alert>
        <mk-alert tone="danger" title="Payment failed">
          We could not process your card.
        </mk-alert>
        <mk-alert tone="neutral">A plain, tone-neutral note.</mk-alert>
      </docs-example>

      <h3>Variants</h3>
      <docs-example [code]="alertVariantsCode" [column]="true">
        <mk-alert tone="success" variant="soft" title="Soft">
          The default, low-emphasis treatment.
        </mk-alert>
        <mk-alert tone="success" variant="solid" title="Solid">
          A filled, high-emphasis treatment.
        </mk-alert>
        <mk-alert tone="success" variant="outline" title="Outline">
          A bordered, transparent treatment.
        </mk-alert>
      </docs-example>

      <h3>Dismissible</h3>
      <docs-example [code]="alertDismissibleCode" [column]="true">
        @if (alertVisible()) {
          <mk-alert
            tone="info"
            variant="outline"
            title="Dismissible"
            dismissible
            (dismissed)="alertVisible.set(false)"
          >
            Click the close button to dismiss this alert.
          </mk-alert>
        } @else {
          <button mkButton variant="ghost" (click)="alertVisible.set(true)">
            Restore alert
          </button>
        }
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr>
            <th>Input</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkAlertTone</code></td>
            <td><code class="docs-inline">'info'</code></td>
            <td>info | success | warning | danger | neutral.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">MkAlertVariant</code></td>
            <td><code class="docs-inline">'soft'</code></td>
            <td>soft | solid | outline.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">title</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">undefined</code></td>
            <td>Optional bold heading above the message.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">dismissible</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Renders a keyboard-accessible close button.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">(dismissed)</code></td>
            <td><code class="docs-inline">EventEmitter&lt;void&gt;</code></td>
            <td>—</td>
            <td>Emitted when the close button is activated.</td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ LOADING BAR ============================ -->
      <mk-loading-bar />
      <h2>Top loading bar</h2>
      <p>
        <code class="docs-inline">&lt;mk-loading-bar&gt;</code> is a thin progress
        bar fixed to the top of the viewport, driven by
        <code class="docs-inline">MkLoadingBarService</code> — hook it to router
        events for route progress. Watch the very top of the page:
      </p>
      <docs-example [code]="loadingBarCode" [column]="true">
        <div style="display: flex; gap: var(--mk-space-2); flex-wrap: wrap;">
          <button mkButton variant="outline" size="sm" (click)="loadingBar.start()">start()</button>
          <button mkButton variant="outline" size="sm" (click)="loadingBar.set(60)">set(60)</button>
          <button mkButton variant="outline" size="sm" (click)="loadingBar.complete()">complete()</button>
        </div>
      </docs-example>

      <!-- ============================ BANNER ============================ -->
      <h2>Banner</h2>
      <p>
        <code class="docs-inline">&lt;mk-banner&gt;</code> is a persistent,
        full-width notice (tone, optional title, actions slot, dismiss) — heavier
        than an inline alert. Danger/warning banners announce assertively.
      </p>
      <docs-example [code]="bannerCode" [column]="true">
        <div style="display: flex; flex-direction: column; gap: var(--mk-space-3); width: 100%;">
          <mk-banner tone="info" title="New workspace features">
            Boards and timelines are now available on every plan.
            <button mkButton size="sm" variant="outline" mkBannerActions>Learn more</button>
          </mk-banner>
          @if (bannerOpen()) {
            <mk-banner tone="warning" title="Storage almost full" dismissible [(open)]="bannerOpen">
              You've used 90% of your quota.
              <button mkButton size="sm" mkBannerActions>Upgrade</button>
            </mk-banner>
          } @else {
            <button mkButton variant="ghost" size="sm" (click)="bannerOpen.set(true)">Restore dismissed banner</button>
          }
        </div>
      </docs-example>

      <!-- ============================ TOAST ============================ -->
      <h2>Toast</h2>
      <p>
        <code class="docs-inline">MkToastService</code> enqueues transient
        notifications rendered by a single, lazily-mounted container at the
        bottom-right of the viewport. Inject the service and call
        <code class="docs-inline">success()</code>,
        <code class="docs-inline">danger()</code>, or the generic
        <code class="docs-inline">show()</code>. Each toast auto-dismisses after
        <code class="docs-inline">duration</code> ms (pass
        <code class="docs-inline">0</code> to keep it sticky) and can carry an
        action button.
      </p>
      <p>
        <strong>No markup required.</strong> The service auto-mounts its
        container the first time a toast is shown — you never place a container
        component in your templates.
      </p>
      <docs-example [code]="toastCode">
        <button mkButton tone="success" (click)="showSuccessToast()">
          Success
        </button>
        <button mkButton tone="danger" (click)="showDangerToast()">
          Danger
        </button>
        <button mkButton variant="ghost" (click)="showStickyToast()">
          Sticky (duration 0)
        </button>
        <button mkButton variant="ghost" (click)="showActionToast()">
          With action
        </button>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr>
            <th>MkToastConfig</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">message</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Body message (required).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">title</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">undefined</code></td>
            <td>Optional bold heading.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkToastTone</code></td>
            <td><code class="docs-inline">'info'</code></td>
            <td>info | success | warning | danger | neutral.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">duration</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">5000</code></td>
            <td>Auto-dismiss delay in ms; <code class="docs-inline">0</code> keeps it until dismissed.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">dismissible</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code></td>
            <td>Show a close button.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">action</code></td>
            <td><code class="docs-inline">MkToastAction</code></td>
            <td><code class="docs-inline">undefined</code></td>
            <td>Optional <code class="docs-inline">{{ '{' }} label, handler? {{ '}' }}</code> button; the toast dismisses after it runs.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Convenience methods —
        <code class="docs-inline">info</code>,
        <code class="docs-inline">success</code>,
        <code class="docs-inline">warning</code>,
        <code class="docs-inline">danger</code>,
        <code class="docs-inline">neutral</code> — take
        <code class="docs-inline">(message: string, config?: Partial&lt;MkToastConfig&gt;)</code>
        and return the toast id. <code class="docs-inline">show(config)</code>,
        <code class="docs-inline">dismiss(id)</code>, and
        <code class="docs-inline">clear()</code> round out the API.
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class FeedbackPage {
  private readonly toast = inject(MkToastService);
  protected readonly loadingBar = inject(MkLoadingBarService);
  protected readonly loadingBarCode = `// Place once (e.g. in the app shell):
// <mk-loading-bar />
const bar = inject(MkLoadingBarService);
router.events.subscribe(e => {
  if (e instanceof NavigationStart) bar.start();
  if (e instanceof NavigationEnd) bar.complete();
});`;

  protected readonly alertVisible = signal(true);
  protected readonly bannerOpen = signal(true);
  protected readonly bannerCode = `<mk-banner tone="warning" title="Storage almost full" dismissible>
  You've used 90% of your quota.
  <button mkButton size="sm" mkBannerActions>Upgrade</button>
</mk-banner>`;

  // ------------------------------- Toast -------------------------------
  protected showSuccessToast(): void {
    this.toast.success('Your changes were saved.', { title: 'Saved' });
  }

  protected showDangerToast(): void {
    this.toast.danger('We could not reach the server.', {
      title: 'Connection lost',
    });
  }

  protected showStickyToast(): void {
    this.toast.show({
      title: 'Sync in progress',
      message: 'This toast stays until you dismiss it.',
      tone: 'info',
      duration: 0,
    });
  }

  protected showActionToast(): void {
    this.toast.show({
      title: 'Item archived',
      message: 'The record was moved to the archive.',
      tone: 'neutral',
      duration: 8000,
      action: {
        label: 'Undo',
        handler: () => this.toast.success('Restored.'),
      },
    });
  }

  // --------------------------- Code snippets ---------------------------
  protected readonly alertTonesCode = `<mk-alert tone="info" title="Heads up">
  A new version of the workspace is available.
</mk-alert>
<mk-alert tone="success" title="Saved">…</mk-alert>
<mk-alert tone="warning" title="Storage almost full">…</mk-alert>
<mk-alert tone="danger" title="Payment failed">…</mk-alert>
<mk-alert tone="neutral">A plain, tone-neutral note.</mk-alert>`;

  protected readonly alertVariantsCode = `<mk-alert tone="success" variant="soft" title="Soft">…</mk-alert>
<mk-alert tone="success" variant="solid" title="Solid">…</mk-alert>
<mk-alert tone="success" variant="outline" title="Outline">…</mk-alert>`;

  protected readonly alertDismissibleCode = `@if (visible()) {
  <mk-alert
    tone="info"
    variant="outline"
    title="Dismissible"
    dismissible
    (dismissed)="visible.set(false)"
  >
    Click the close button to dismiss this alert.
  </mk-alert>
}

// visible = signal(true);`;

  protected readonly toastCode = `// No markup needed — MkToastService auto-mounts its container.
private readonly toast = inject(MkToastService);

// Convenience methods (message, config?) -> toast id
this.toast.success('Your changes were saved.', { title: 'Saved' });
this.toast.danger('We could not reach the server.', { title: 'Connection lost' });

// Sticky toast — duration 0 keeps it until dismissed
this.toast.show({ message: 'This stays until dismissed.', tone: 'info', duration: 0 });

// Toast with an action button (dismissed after the handler runs)
this.toast.show({
  title: 'Item archived',
  message: 'The record was moved to the archive.',
  duration: 8000,
  action: { label: 'Undo', handler: () => this.toast.success('Restored.') },
});`;
}
