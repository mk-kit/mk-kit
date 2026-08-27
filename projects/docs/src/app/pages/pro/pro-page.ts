import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkBadge, MkButton, MkCard, MkThemeService } from '@mk-kit/ui';

interface ProWidget {
  name: string;
  status: 'available' | 'building' | 'planned';
  blurb: string;
  entry?: string;
}

const WIDGETS: ProWidget[] = [
  {
    name: 'Dashboard grid',
    status: 'available',
    entry: '@mk-kit/pro/dashboard-grid',
    blurb:
      'Drag, resize and rearrange widgets on a 12-column grid. Per-breakpoint layouts persisted as JSON, static tiles others flow around, keyboard move/resize with screen-reader announcements, RTL, SSR-safe.',
  },
  {
    name: 'Resource scheduler',
    status: 'available',
    entry: '@mk-kit/pro/scheduler',
    blurb: 'Resources as rows — rooms, people, machines. Day / week / month timeline, drag bookings in time and across resources, resize, working hours with optional enforcement, conflict rules, keyboard editing with announcements, RTL.',
  },
  {
    name: 'Admin Starter',
    status: 'planned',
    blurb: 'A finished admin: auth & 2FA, dashboard, CRUD list / detail / form on mk-dynamic-form, users & roles, settings, billing, notifications, audit log. Source code, mock API and tests.',
  },
  { name: 'Gantt', status: 'available', entry: '@mk-kit/pro/gantt', blurb: 'Phases and tasks as a tree, milestones, four dependency types with lag, critical path, auto-schedule cascade, drag / resize / progress, day / week / month zoom, keyboard editing.' },
  { name: 'Export pack', status: 'planned', blurb: 'XLSX with styles and multiple sheets, PDF for tables and charts, large exports off the main thread. CSV and print stay free.' },
  { name: 'Form builder', status: 'planned', blurb: 'Drag-and-drop designer that emits the free mk-dynamic-form schema: field palette, properties, conditions editor, live preview.' },
  { name: 'Pivot grid', status: 'planned', blurb: 'Rows / columns / values with a field chooser, totals and drill-down.' },
];

const STATUS_LABEL: Record<ProWidget['status'], string> = {
  available: 'Available',
  building: 'In progress',
  planned: 'Planned',
};

/**
 * mk-kit Pro — what it is, what's in it, how licensing works. Static until
 * `@mk-kit/pro` is on npm; then the dashboard-grid screenshot becomes a live
 * (watermarked) demo.
 */
@Component({
  selector: 'docs-pro-page',
  imports: [RouterLink, MkBadge, MkButton, MkCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container pro">
      <p class="pro-eyebrow">mk-kit Pro</p>
      <h1>The widgets that take weeks, finished.</h1>
      <p class="docs-lead">
        Everything in <strong>&#64;mk-kit/ui</strong> is MIT and stays that way.
        <strong>&#64;mk-kit/pro</strong> adds the vendor-class widgets every paid
        Angular suite charges for — dashboard grids, schedulers, Gantt, exports —
        and a finished admin starter, built with the same signals-first,
        accessible, themable conventions. One-time price, perpetual use.
      </p>
      <p class="pro-actions">
        <a mkButton href="/#pricing">See pricing</a>
        <a mkButton variant="outline" routerLink="/pro" fragment="license">How licensing works</a>
      </p>

      <h2 id="grid">Dashboard grid <mk-badge tone="success" size="sm">available</mk-badge></h2>
      <p>
        <code class="docs-inline">&lt;mk-dashboard-grid&gt;</code> turns any set of
        components into a rearrangeable dashboard: drag by the grip, resize from
        the corner, or focus a tile and use the arrow keys. Layouts are plain
        JSON per breakpoint — store them wherever you keep user preferences.
        Static tiles stay put and the others flow around them. Phones collapse
        to one column automatically.
      </p>
      <figure class="pro-figure">
        <img
          [src]="theme.isDark() ? '/pro-dashboard-grid-dark.png' : '/pro-dashboard-grid.png'"
          width="1200"
          height="425"
          alt="The mk-kit Pro dashboard grid: five draggable widgets — revenue, orders, a traffic sparkline, notes and a pinned static tile — with an “unlicensed” badge in the corner."
          loading="lazy"
        />
        <figcaption>The demo app in the Pro repository. The live, watermarked demo lands here as soon as the package is on npm.</figcaption>
      </figure>
      <pre class="pro-code"><code>{{ gridCode }}</code></pre>

      <h2 id="scheduler">Resource scheduler <mk-badge tone="success" size="sm">available</mk-badge></h2>
      <p>
        <code class="docs-inline">&lt;mk-scheduler&gt;</code> is the booking
        board: rooms, people or machines as rows, time across. Drag a booking
        later, earlier or onto another resource; resize either end; click an
        empty slot to create. Working hours shade the timeline and can reject
        drops outside them; overlaps can be allowed, reported or refused.
        Keyboard does everything the mouse does, with screen-reader
        announcements. Like the free calendar it never mutates your data — it
        emits the proposed change and your app decides.
      </p>
      <figure class="pro-figure">
        <img
          [src]="theme.isDark() ? '/pro-scheduler-dark.png' : '/pro-scheduler.png'"
          width="1200"
          height="425"
          alt="The mk-kit Pro scheduler in day view: doctors and rooms as rows, bookings as coloured bars, hatched working-hours shading, a red now-line."
          loading="lazy"
        />
        <figcaption>Day view with working-hours shading, a pinned team meeting, a disabled row and a multi-day maintenance block.</figcaption>
      </figure>
      <pre class="pro-code"><code>{{ schedulerCode }}</code></pre>

      <h2 id="gantt">Gantt <mk-badge tone="success" size="sm">available</mk-badge></h2>
      <p>
        <code class="docs-inline">&lt;mk-gantt&gt;</code> plans a project: a task
        table on the left (collapsible phases, dates, progress), the timeline on
        the right with summary brackets, milestone diamonds and dependency
        arrows. Drag a task, resize it, or drag its progress handle; with
        <code class="docs-inline">autoSchedule</code> the successors move with it
        and the change you receive lists the cascade. The critical path is
        computed for you (finish-to-start, start-to-start, finish-to-finish,
        start-to-finish, with lag) and highlighted on request. Zoom by day,
        week or month; everything is keyboard-operable and announced.
      </p>
      <figure class="pro-figure">
        <img
          [src]="theme.isDark() ? '/pro-gantt-dark.png' : '/pro-gantt.png'"
          width="1200"
          height="614"
          alt="The mk-kit Pro Gantt: a task table with Discovery, Design and Build phases beside a day-zoom timeline with bars, a milestone, dependency arrows and the critical path in red."
          loading="lazy"
        />
        <figcaption>Day zoom with the critical path highlighted; a milestone (diamond) and phase summaries (brackets).</figcaption>
      </figure>
      <pre class="pro-code"><code>{{ ganttCode }}</code></pre>

      <h2 id="whats-inside">What's in Pro</h2>
      <div class="pro-grid">
        @for (w of widgets; track w.name) {
          <mk-card variant="outlined" class="pro-widget">
            <div class="pro-widget__head">
              <h3>{{ w.name }}</h3>
              <mk-badge [tone]="w.status === 'available' ? 'success' : w.status === 'building' ? 'primary' : 'neutral'" size="sm">
                {{ statusLabel[w.status] }}
              </mk-badge>
            </div>
            <p>{{ w.blurb }}</p>
            @if (w.entry) {
              <code class="docs-inline">{{ w.entry }}</code>
            }
          </mk-card>
        }
      </div>
      <p>
        Order is by demand: the Admin Starter follows once
        the free library has enough users to justify four weeks of work. Tell us
        what you need through the
        <a href="/#pricing">waitlist</a> — that list decides the order.
      </p>

      <h2 id="license">How licensing works</h2>
      <ul>
        <li>
          <strong>Public on npm, commercial licence.</strong>
          <code class="docs-inline">npm install &#64;mk-kit/pro</code> just works — the
          code is there to read. Using it requires a licence key
          (<code class="docs-inline">LICENSE.md</code> in the package).
        </li>
        <li>
          <strong>Offline, nothing phones home.</strong> Register the key once with
          <code class="docs-inline">provideMkProLicense('mkpro_…')</code>. It's a signed
          token verified against a public key in the package — no network
          calls, works in CI, on-prem and air-gapped.
        </li>
        <li>
          <strong>Evaluate for free, forever.</strong> Without a key every widget
          works and shows a small “unlicensed” badge. Nothing breaks in
          production because of a licence hiccup.
        </li>
        <li>
          <strong>Perpetual, with a year of updates.</strong> A key covers every
          release published before its <em>updates-until</em> date. Renewing
          extends the window; not renewing keeps what you have.
        </li>
        <li>
          <strong>Per developer, unlimited apps and users.</strong> Seats count
          the people who write code against the Pro APIs — not end users,
          servers or environments.
        </li>
      </ul>
      <pre class="pro-code"><code>{{ licenseCode }}</code></pre>

      <h2 id="faq">Questions people ask</h2>
      <dl class="pro-faq">
        <dt>Does Pro change anything in the free library?</dt>
        <dd>No. Pro widgets are separate entry points the free library never imports. Nothing is being moved behind the paywall.</dd>
        <dt>Which Angular versions?</dt>
        <dd>Same as the core: Angular 22, standalone, signals, zoneless-ready, SSR-safe. Pro peer-depends on <code class="docs-inline">&#64;mk-kit/ui</code>.</dd>
        <dt>Can I buy for a team by invoice?</dt>
        <dd>Yes — the Team tier covers five seats; larger teams get an invoice and an enterprise agreement. Use “Talk to us” on the pricing section.</dd>
        <dt>What about support?</dt>
        <dd>Bugs are bugs — report them on GitHub like for the core. Priority support and LTS are part of the enterprise tier.</dd>
      </dl>
      <p class="pro-actions">
        <a mkButton href="/#pricing">Pricing &amp; waitlist</a>
        <a mkButton variant="ghost" routerLink="/components/dynamic-form">See the free dynamic form →</a>
      </p>
    </div>
  `,
  styles: [
    `
      .pro-eyebrow {
        margin: 0 0 var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-semibold);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--mk-primary);
      }
      .pro-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
        margin: var(--mk-space-5) 0;
      }
      .pro h2 {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
      }
      .pro-figure {
        margin: var(--mk-space-4) 0;
      }
      .pro-figure img {
        display: block;
        width: 100%;
        height: auto;
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-bg);
      }
      .pro-figure figcaption {
        margin-top: var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .pro-code {
        margin: var(--mk-space-3) 0 var(--mk-space-6);
        padding: var(--mk-space-4) var(--mk-space-5);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        color: var(--mk-text);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: var(--mk-line-height-normal);
        overflow-x: auto;
        white-space: pre;
      }
      .pro-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: var(--mk-space-3);
        margin: var(--mk-space-4) 0;
      }
      .pro-widget {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
      }
      .pro-widget__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mk-space-2);
      }
      .pro-widget h3 {
        margin: 0;
        font-size: var(--mk-font-size-md);
      }
      .pro-widget p {
        margin: 0;
        font-size: var(--mk-font-size-sm);
      }
      .pro-faq dt {
        font-weight: var(--mk-font-weight-semibold);
        margin-top: var(--mk-space-4);
      }
      .pro-faq dd {
        margin: var(--mk-space-1) 0 0;
        color: var(--mk-text-muted);
        line-height: var(--mk-line-height-relaxed);
      }
    `,
  ],
})
export class ProPage {
  protected readonly theme = inject(MkThemeService);
  protected readonly widgets = WIDGETS;
  protected readonly statusLabel = STATUS_LABEL;

  protected readonly gridCode = `import { MkDashboardGrid, MkDashboardWidget, MkGridLayouts } from '@mk-kit/pro/dashboard-grid';

layouts = signal<MkGridLayouts>({
  lg: [
    { id: 'revenue', x: 0, y: 0, w: 3, h: 2 },
    { id: 'orders',  x: 3, y: 0, w: 3, h: 2 },
    { id: 'traffic', x: 6, y: 0, w: 6, h: 3, minW: 3 },
    { id: 'pinned',  x: 0, y: 2, w: 6, h: 1, static: true },
  ],
});

<mk-dashboard-grid [cols]="12" [rowHeight]="72" [(layouts)]="layouts" (layoutChange)="save($event)">
  <mk-dashboard-widget id="revenue" title="Revenue"><mk-stat-card … /></mk-dashboard-widget>
  <mk-dashboard-widget id="orders"  title="Orders"><mk-stat-card … /></mk-dashboard-widget>
  <mk-dashboard-widget id="traffic" title="Traffic"><mk-line-chart … /></mk-dashboard-widget>
  <mk-dashboard-widget id="pinned"  title="Pinned">Others flow around me.</mk-dashboard-widget>
</mk-dashboard-grid>`;

  protected readonly schedulerCode = `import { MkScheduler, MkSchedulerEventEdit } from '@mk-kit/pro/scheduler';

resources = [
  { id: 'kim', title: 'Dr Kim', group: 'Doctors', availability: [{ days: [1, 2, 3, 4, 5], from: '09:00', to: '17:00' }] },
  { id: 'r1',  title: 'Room 1', group: 'Rooms' },
];

<mk-scheduler
  [resources]="resources"
  [events]="bookings()"
  [(view)]="view"
  [(date)]="date"
  editable
  [allowOverlap]="false"
  enforceAvailability
  (eventChange)="apply($event)"
  (slotClick)="create($event)"
/>

apply(e: MkSchedulerEventEdit) {
  // e.event is the original object; e.resourceId / e.start / e.end the proposal; e.conflicts what it overlaps
  this.bookings.update((all) => all.map((b) => (b.id === e.event.id ? { ...b, resourceId: e.resourceId, start: e.start, end: e.end } : b)));
}`;

  protected readonly ganttCode = `import { MkGantt, MkGanttChange } from '@mk-kit/pro/gantt';

tasks = [
  { id: 'design',  title: 'Design', start: d('2026-09-09'), end: d('2026-09-23') },
  { id: 'wire',    title: 'Wireframes', parentId: 'design', start: d('2026-09-09'), end: d('2026-09-15'), progress: 60 },
  { id: 'visual',  title: 'Visual design', parentId: 'design', start: d('2026-09-14'), end: d('2026-09-21'), progress: 20 },
  { id: 'beta',    title: 'Beta', start: d('2026-10-15'), end: d('2026-10-15'), milestone: true },
];
dependencies = [{ from: 'wire', to: 'visual' }, { from: 'visual', to: 'beta', type: 'FS', lag: 2 * 1440 }];

<mk-gantt [tasks]="tasks" [dependencies]="dependencies" [(zoom)]="zoom" editable criticalPath autoSchedule (taskChange)="apply($event)" />

apply(c: MkGanttChange) {
  // c.task / c.start / c.end / c.progress — and c.cascade[] for successors auto-schedule pushed
}`;

  protected readonly licenseCode = `// main.ts — once per app
import { provideMkProLicense } from '@mk-kit/pro/license';

bootstrapApplication(App, {
  providers: [provideMkProLicense('mkpro_eyJ2IjoxLCJvcmciOi…')],
});`;
}
