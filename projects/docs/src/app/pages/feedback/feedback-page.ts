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
  MkDialog,
  MkDialogService,
  MkDialogTitle,
  MkHovercard,
  MkHovercardTrigger,
  MkLoadingBar,
  MkLoadingBarService,
  type MkNotification,
  MkNotificationCenter,
  MkOverlayRef,
  MkPopconfirm,
  MkPopconfirmTrigger,
  MkPopover,
  MkPopoverTrigger,
  MkResult,
  MkToastService,
  MkTooltip,
  MkTourService,
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
 * Documentation page for the Feedback & Overlay component group: Alert,
 * Tooltip, Toast, and Dialog.
 */
@Component({
  selector: 'docs-feedback-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkAlert,
    MkBanner,
    MkButton,
    MkTooltip,
    MkPopover,
    MkPopoverTrigger,
    MkPopconfirm,
    MkPopconfirmTrigger,
    MkLoadingBar,
    MkHovercard,
    MkHovercardTrigger,
    MkNotificationCenter,
    MkResult,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Feedback &amp; Overlay</h1>
      <p class="docs-lead">
        Components for communicating status and surfacing transient content:
        inline <code class="docs-inline">Alert</code> banners, hover/focus
        <code class="docs-inline">Tooltip</code>s, stacked
        <code class="docs-inline">Toast</code> notifications, and modal
        <code class="docs-inline">Dialog</code>s — all themed with
        <code class="docs-inline">--mk-*</code> tokens and fully accessible.
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

      <!-- =========================== TOOLTIP =========================== -->
      <h2>Tooltip</h2>
      <p>
        The <code class="docs-inline">[mkTooltip]</code> directive shows a themed
        tooltip on hover <em>and</em> keyboard focus, hides on blur, mouse-leave,
        or <kbd>Escape</kbd>, and wires the trigger to the tooltip via
        <code class="docs-inline">aria-describedby</code>. Set
        <code class="docs-inline">mkTooltipPlacement</code> to position it.
        Hover or focus the buttons below.
      </p>
      <docs-example [code]="tooltipCode">
        <button mkButton variant="ghost" [mkTooltip]="'Appears on top'">
          Top
        </button>
        <button
          mkButton
          variant="ghost"
          [mkTooltip]="'Appears below'"
          mkTooltipPlacement="bottom"
        >
          Bottom
        </button>
        <button
          mkButton
          variant="ghost"
          [mkTooltip]="'To the left'"
          mkTooltipPlacement="left"
        >
          Left
        </button>
        <button
          mkButton
          variant="ghost"
          [mkTooltip]="'To the right'"
          mkTooltipPlacement="right"
        >
          Right
        </button>
        <span
          class="docs-tip-target"
          tabindex="0"
          [mkTooltip]="'Works on any focusable element'"
          mkTooltipPlacement="bottom-start"
        >
          Any element
        </span>
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
            <td><code class="docs-inline">mkTooltip</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">''</code></td>
            <td>Tooltip text. When empty the tooltip is suppressed.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">mkTooltipPlacement</code></td>
            <td><code class="docs-inline">MkPlacement</code></td>
            <td><code class="docs-inline">'top'</code></td>
            <td>
              top | top-start | top-end | bottom | bottom-start | bottom-end |
              left | right.
            </td>
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

      <!-- ============================ POPOVER ============================ -->
      <h2>Popover</h2>
      <p>
        <code class="docs-inline">&lt;mk-popover&gt;</code> is a non-modal floating
        panel for rich content, opened by click via
        <code class="docs-inline">mkPopoverTriggerFor</code>. It renders in the top
        layer (never clipped), moves focus inside on open, and closes on Escape,
        outside click or Tabbing out.
      </p>
      <docs-example [code]="popoverCode">
        <button mkButton variant="outline" [mkPopoverTriggerFor]="info">
          Shipping details
        </button>
        <mk-popover #info ariaLabel="Shipping details">
          <h4 style="margin: 0 0 var(--mk-space-1);">Free shipping</h4>
          <p style="margin: 0; color: var(--mk-text-muted); font-size: var(--mk-font-size-sm);">
            Orders over $50 ship free and arrive in 2–3 business days.
          </p>
        </mk-popover>
      </docs-example>

      <!-- ============================ POPCONFIRM ============================ -->
      <h2>Popconfirm</h2>
      <p>
        <code class="docs-inline">&lt;mk-popconfirm&gt;</code> is an inline
        confirmation popover for row-level destructive actions — lighter than a
        modal dialog. It emits <code class="docs-inline">(confirm)</code> and
        <code class="docs-inline">(cancel)</code> (the latter also on Escape or
        outside click).
      </p>
      <docs-example [code]="popconfirmCode">
        <button mkButton tone="danger" [mkPopconfirmFor]="del">Delete item</button>
        <mk-popconfirm
          #del
          title="Delete item?"
          message="This can’t be undone."
          confirmText="Delete"
          (confirm)="onDeleted()"
        />
        <p class="echo">{{ deleteStatus() }}</p>
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

      <!-- ============================ DIALOG =========================== -->
      <h2>Dialog</h2>
      <p>
        <code class="docs-inline">MkDialogService</code> renders content on a
        themed <code class="docs-inline">--mk-surface</code> panel with a
        backdrop, focus trap, and Escape handling. Use
        <code class="docs-inline">confirm()</code> for a yes/no prompt, or
        <code class="docs-inline">open()</code> to mount your own standalone
        component.
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

      <h3>Custom dialog</h3>
      <p>
        Pass a standalone component to
        <code class="docs-inline">open()</code>. Lay it out with
        <code class="docs-inline">mk-dialog</code> and close it through the
        injected <code class="docs-inline">MkOverlayRef</code>, optionally
        returning a result to <code class="docs-inline">afterClosed</code>.
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
            <td><code class="docs-inline">ariaLabel</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">undefined</code></td>
            <td>Panel label when no visible title is wired up.</td>
          </tr>
        </tbody>
      </table>

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

      <!-- ============================ HOVERCARD ============================ -->
      <h2>Hovercard</h2>
      <p>
        <code class="docs-inline">&lt;mk-hovercard&gt;</code> is a rich hover
        preview (in the spirit of GitHub user cards), opened on hover/focus of a
        trigger via <code class="docs-inline">[mkHovercardFor]</code>. Unlike a
        tooltip it projects arbitrary content; unlike a popover it opens on hover
        after a short delay and stays open while you move onto the card. Hover the
        mention below.
      </p>
      <docs-example [code]="hovercardCode">
        <p style="margin: 0;">
          Reviewed by
          <a href="#" class="docs-mention" [mkHovercardFor]="ada">@ada</a>
          two hours ago.
        </p>
        <mk-hovercard #ada ariaLabel="Ada Lovelace">
          <div class="docs-hovercard">
            <span class="docs-hovercard-avatar" aria-hidden="true">AL</span>
            <div>
              <strong class="docs-hovercard-name">Ada Lovelace</strong>
              <span class="docs-hovercard-role">Principal Engineer · Core</span>
              <p class="docs-hovercard-bio">
                Works on the compiler and analytical engine. Occasionally writes
                the first program.
              </p>
            </div>
          </div>
        </mk-hovercard>
      </docs-example>

      <!-- ======================= NOTIFICATION CENTER ======================= -->
      <h2>Notification center</h2>
      <p>
        <code class="docs-inline">&lt;mk-notification-center&gt;</code> is a bell
        trigger with an unread-count badge that opens a dropdown listing
        notifications. Bind the list with two-way
        <code class="docs-inline">[(notifications)]</code>; clicking a row marks it
        read (updating the model immutably) and
        <strong>Mark all read</strong> clears every unread item. Click the bell:
      </p>
      <docs-example [code]="notificationCode">
        <mk-notification-center
          [(notifications)]="notifications"
          (itemClick)="onNotificationClick($event)"
        />
        <span class="docs-status">{{ notificationStatus() }}</span>
      </docs-example>

      <!-- ============================ RESULT ============================ -->
      <h2>Result</h2>
      <p>
        <code class="docs-inline">&lt;mk-result&gt;</code> is a centred, full-page
        status state — a success confirmation or an empty 404/403/500 page. Set a
        <code class="docs-inline">status</code> preset (which picks the icon and
        its tone), a <code class="docs-inline">resultTitle</code> and
        <code class="docs-inline">subtitle</code>, and project action buttons into
        the <code class="docs-inline">[mkResultActions]</code> slot.
      </p>
      <docs-example [code]="resultCode" [column]="true">
        <mk-result
          status="success"
          resultTitle="Payment complete"
          subtitle="Your order #A-1042 is confirmed and on its way."
        >
          <button mkButton mkResultActions>View order</button>
          <button mkButton variant="ghost" mkResultActions>Back home</button>
        </mk-result>
        <mk-result
          status="404"
          resultTitle="Page not found"
          subtitle="We couldn't find the page you were looking for."
        >
          <button mkButton variant="outline" mkResultActions>Go home</button>
        </mk-result>
      </docs-example>

      <!-- ============================ TOUR ============================ -->
      <h2>Tour</h2>
      <p>
        <code class="docs-inline">MkTourService</code> walks the user through a
        sequence of <code class="docs-inline">MkTourStep</code>s: for each it dims
        the page, highlights the target with a bright ring, and anchors a coach-mark
        popover to it. Inject the service and call
        <code class="docs-inline">start(steps)</code> — it resolves when the tour
        finishes, is skipped, or Escaped. Start the tour to highlight the two marked
        elements below:
      </p>
      <docs-example [code]="tourCode">
        <button mkButton (click)="startTour()">Take a tour</button>
        <span id="tour-step-1" class="docs-tour-target">Create</span>
        <span id="tour-step-2" class="docs-tour-target">Inbox</span>
      </docs-example>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .docs-tip-target {
        display: inline-flex;
        align-items: center;
        padding: var(--mk-space-2) var(--mk-space-3);
        border: 1px dashed var(--mk-border);
        border-radius: var(--mk-radius-md);
        color: var(--mk-text-muted);
        cursor: help;
      }
      .docs-tip-target:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
      .docs-status {
        display: inline-flex;
        align-items: center;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .docs-mention {
        color: var(--mk-primary);
        font-weight: var(--mk-font-weight-medium);
        text-decoration: none;
      }
      .docs-mention:hover {
        text-decoration: underline;
      }
      .docs-hovercard {
        display: flex;
        gap: var(--mk-space-3);
        max-width: 20rem;
      }
      .docs-hovercard-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--mk-radius-full);
        background: var(--mk-primary);
        color: var(--mk-primary-contrast);
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-bold);
      }
      .docs-hovercard-name {
        display: block;
      }
      .docs-hovercard-role {
        display: block;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .docs-hovercard-bio {
        margin: var(--mk-space-2) 0 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .docs-tour-target {
        display: inline-flex;
        align-items: center;
        padding: var(--mk-space-2) var(--mk-space-3);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class FeedbackPage {
  private readonly toast = inject(MkToastService);
  private readonly dialog = inject(MkDialogService);
  private readonly tour = inject(MkTourService);
  protected readonly loadingBar = inject(MkLoadingBarService);
  protected readonly loadingBarCode = `// Place once (e.g. in the app shell):
// <mk-loading-bar />
const bar = inject(MkLoadingBarService);
router.events.subscribe(e => {
  if (e instanceof NavigationStart) bar.start();
  if (e instanceof NavigationEnd) bar.complete();
});`;

  protected readonly alertVisible = signal(true);
  protected readonly confirmResult = signal<boolean | null>(null);
  protected readonly openResult = signal<string | null>(null);
  protected readonly promptResult = signal<string | null>(null);
  protected readonly deleteStatus = signal('Nothing deleted yet.');
  protected readonly bannerOpen = signal(true);
  protected readonly bannerCode = `<mk-banner tone="warning" title="Storage almost full" dismissible>
  You've used 90% of your quota.
  <button mkButton size="sm" mkBannerActions>Upgrade</button>
</mk-banner>`;

  protected onDeleted(): void {
    this.deleteStatus.set('Item deleted ✓');
  }

  // --------------------------- Notification center ---------------------------
  protected readonly notifications = signal<MkNotification[]>([
    {
      id: 1,
      title: 'Ada mentioned you',
      body: 'Re: “Ship the analytical engine milestone”.',
      time: '2m ago',
    },
    {
      id: 2,
      title: 'Build #482 passed',
      body: 'All 1,204 checks green on main.',
      time: '18m ago',
    },
    {
      id: 3,
      title: 'New teammate joined',
      body: 'Grace Hopper accepted your invite.',
      time: '1h ago',
      read: true,
    },
    {
      id: 4,
      title: 'Weekly digest',
      body: '6 pull requests merged this week.',
      time: 'Yesterday',
      read: true,
    },
  ]);
  protected readonly notificationStatus = signal('No notification opened yet.');

  protected onNotificationClick(item: MkNotification): void {
    this.notificationStatus.set(`Opened: ${item.title}`);
  }

  // ------------------------------- Tour -------------------------------
  protected startTour(): void {
    this.tour.start([
      {
        target: '#tour-step-1',
        title: 'Create',
        body: 'Start a new project from here whenever you need one.',
      },
      {
        target: '#tour-step-2',
        title: 'Inbox',
        body: 'Your mentions and updates land here.',
        placement: 'bottom',
      },
    ]);
  }

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
  protected readonly hovercardCode = `<a href="/u/ada" [mkHovercardFor]="ada">@ada</a>
<mk-hovercard #ada ariaLabel="Ada Lovelace">
  <div class="card">
    <span class="avatar">AL</span>
    <div>
      <strong>Ada Lovelace</strong>
      <span>Principal Engineer · Core</span>
      <p>Works on the compiler and analytical engine.</p>
    </div>
  </div>
</mk-hovercard>`;

  protected readonly notificationCode = `<mk-notification-center
  [(notifications)]="notifications"
  (itemClick)="onNotificationClick($event)" />

// notifications = signal<MkNotification[]>([
//   { id: 1, title: 'Ada mentioned you', body: '…', time: '2m ago' },
//   { id: 3, title: 'New teammate joined', body: '…', time: '1h ago', read: true },
// ]);`;

  protected readonly resultCode = `<mk-result status="success" resultTitle="Payment complete"
  subtitle="Your order #A-1042 is confirmed and on its way.">
  <button mkButton mkResultActions>View order</button>
  <button mkButton variant="ghost" mkResultActions>Back home</button>
</mk-result>

<mk-result status="404" resultTitle="Page not found"
  subtitle="We couldn't find the page you were looking for.">
  <button mkButton variant="outline" mkResultActions>Go home</button>
</mk-result>`;

  protected readonly tourCode = `private readonly tour = inject(MkTourService);

startTour(): void {
  this.tour.start([
    { target: '#tour-step-1', title: 'Create', body: 'Start a new project here.' },
    { target: '#tour-step-2', title: 'Inbox', body: 'Your mentions land here.', placement: 'bottom' },
  ]);
}`;

  protected readonly popoverCode = `<button mkButton [mkPopoverTriggerFor]="info">Shipping details</button>
<mk-popover #info ariaLabel="Shipping details">
  <h4>Free shipping</h4>
  <p>Orders over $50 ship free and arrive in 2–3 business days.</p>
</mk-popover>`;

  protected readonly popconfirmCode = `<button mkButton tone="danger" [mkPopconfirmFor]="del">Delete item</button>
<mk-popconfirm #del title="Delete item?" message="This can’t be undone."
  confirmText="Delete" (confirm)="onDeleted()" />`;

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

  protected readonly tooltipCode = `<button mkButton [mkTooltip]="'Appears on top'">Top</button>

<button mkButton [mkTooltip]="'Appears below'" mkTooltipPlacement="bottom">
  Bottom
</button>

<!-- Works on any focusable element -->
<span tabindex="0" [mkTooltip]="'Works anywhere'" mkTooltipPlacement="right">
  Any element
</span>`;

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
