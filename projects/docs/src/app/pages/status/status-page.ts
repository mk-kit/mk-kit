import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  MkButton,
  type MkNotification,
  MkNotificationCenter,
  MkResult,
  MkTourService,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation page for the status & notification components: Result,
 * Notification center, and Tour.
 */
@Component({
  selector: 'docs-status-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton, MkNotificationCenter, MkResult],
  template: `
    <div class="docs-page docs-container">
      <h1>Status &amp; notifications</h1>
      <p class="docs-lead">
        Components for communicating outcomes and updates: full-page
        <code class="docs-inline">Result</code> states, a bell-triggered
        <code class="docs-inline">Notification center</code>, and guided
        <code class="docs-inline">Tour</code> walkthroughs — all themed with
        <code class="docs-inline">--mk-*</code> tokens and fully accessible.
      </p>

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
      .docs-status {
        display: inline-flex;
        align-items: center;
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
export class StatusPage {
  private readonly tour = inject(MkTourService);

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

  // --------------------------- Code snippets ---------------------------
  protected readonly resultCode = `<mk-result status="success" resultTitle="Payment complete"
  subtitle="Your order #A-1042 is confirmed and on its way.">
  <button mkButton mkResultActions>View order</button>
  <button mkButton variant="ghost" mkResultActions>Back home</button>
</mk-result>

<mk-result status="404" resultTitle="Page not found"
  subtitle="We couldn't find the page you were looking for.">
  <button mkButton variant="outline" mkResultActions>Go home</button>
</mk-result>`;

  protected readonly notificationCode = `<mk-notification-center
  [(notifications)]="notifications"
  (itemClick)="onNotificationClick($event)" />

// notifications = signal<MkNotification[]>([
//   { id: 1, title: 'Ada mentioned you', body: '…', time: '2m ago' },
//   { id: 3, title: 'New teammate joined', body: '…', time: '1h ago', read: true },
// ]);`;

  protected readonly tourCode = `private readonly tour = inject(MkTourService);

startTour(): void {
  this.tour.start([
    { target: '#tour-step-1', title: 'Create', body: 'Start a new project here.' },
    { target: '#tour-step-2', title: 'Inbox', body: 'Your mentions land here.', placement: 'bottom' },
  ]);
}`;
}
