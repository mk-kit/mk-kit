import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  MkAvatar,
  MkBadge,
  MkButton,
  MkCard,
  MkCardHeader,
  MkCardTitle,
  MkChip,
  MkDialogService,
  MkDivider,
  MkList,
  MkListItem,
  MkMenu,
  MkMenuItem,
  MkMenuTrigger,
  MkProgressBar,
  MkStatCard,
  MkTable,
  MkTabs,
  MkTab,
  MkTag,
  MkToastService,
  type MkSortChange,
  type MkTableColumn,
} from '@mk-kit/ui';
import { DashChart } from './dash-chart';

interface Order {
  id: string;
  customer: string;
  plan: string;
  date: string;
  amount: number;
  status: string;
}
interface Activity {
  who: string;
  action: string;
  time: string;
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  label: string;
}
interface Member {
  name: string;
  role: string;
  status: 'online' | 'away' | 'offline';
}
interface Goal {
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'info';
}

/**
 * A realistic admin dashboard assembled entirely from mk-kit components —
 * stat cards, a themed chart, a sortable data table, an activity feed and a
 * team panel, wired to live toasts and a confirm dialog.
 */
@Component({
  selector: 'docs-dashboard-page',
  imports: [
    MkButton,
    MkCard,
    MkCardHeader,
    MkCardTitle,
    MkStatCard,
    MkBadge,
    MkTag,
    MkChip,
    MkAvatar,
    MkDivider,
    MkList,
    MkListItem,
    MkProgressBar,
    MkTable,
    MkTabs,
    MkTab,
    MkMenu,
    MkMenuItem,
    MkMenuTrigger,
    DashChart,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dash">
      <!-- Page header -->
      <header class="dash__head">
        <div>
          <h1 class="dash__title">Analytics</h1>
          <p class="dash__sub">Workspace performance for the last 30 days.</p>
        </div>
        <div class="dash__actions">
          <button mkButton variant="outline" tone="neutral" [mkMenuTriggerFor]="rangeMenu">
            <span aria-hidden="true">📅</span> Last 30 days ▾
          </button>
          <mk-menu #rangeMenu="mkMenu">
            <mk-menu-item (action)="setRange('7 days')">Last 7 days</mk-menu-item>
            <mk-menu-item (action)="setRange('30 days')">Last 30 days</mk-menu-item>
            <mk-menu-item (action)="setRange('quarter')">This quarter</mk-menu-item>
            <mk-menu-item (action)="setRange('year')">This year</mk-menu-item>
          </mk-menu>
          <button mkButton tone="primary" (click)="newReport()">
            <span aria-hidden="true">＋</span> New report
          </button>
        </div>
      </header>

      <!-- KPI row -->
      <section class="dash__kpis" aria-label="Key metrics">
        <mk-stat-card label="Revenue" value="$48,290" delta="+12.4%" deltaTrend="up" hint="vs. last period">
          <span mkStatIcon aria-hidden="true">💰</span>
        </mk-stat-card>
        <mk-stat-card label="Active users" value="8,642" delta="+3.1%" deltaTrend="up" hint="vs. last period">
          <span mkStatIcon aria-hidden="true">👥</span>
        </mk-stat-card>
        <mk-stat-card label="Orders" value="1,204" delta="-2.7%" deltaTrend="down" hint="vs. last period">
          <span mkStatIcon aria-hidden="true">📦</span>
        </mk-stat-card>
        <mk-stat-card label="Churn" value="1.9%" delta="0.0%" deltaTrend="neutral" hint="stable">
          <span mkStatIcon aria-hidden="true">📉</span>
        </mk-stat-card>
      </section>

      <!-- Chart + goals -->
      <section class="dash__cols">
        <mk-card variant="outlined" class="dash__chartcard">
          <mk-card-header>
            <mk-card-title>Performance</mk-card-title>
            <div class="dash__cardactions">
              <mk-badge tone="success" variant="soft">Live</mk-badge>
              <button mkButton iconOnly variant="ghost" tone="neutral" size="sm"
                aria-label="Chart options" [mkMenuTriggerFor]="chartMenu">⋯</button>
              <mk-menu #chartMenu="mkMenu">
                <mk-menu-item (action)="toast.success('Export started')">
                  <span mkMenuItemIcon aria-hidden="true">⬇</span> Export CSV
                </mk-menu-item>
                <mk-menu-item (action)="toast.info('Data refreshed')">
                  <span mkMenuItemIcon aria-hidden="true">↻</span> Refresh
                </mk-menu-item>
                <mk-menu-item danger (action)="removeWidget()">
                  <span mkMenuItemIcon aria-hidden="true">🗑</span> Remove widget
                </mk-menu-item>
              </mk-menu>
            </div>
          </mk-card-header>
          <mk-tabs variant="line">
            <mk-tab label="Revenue">
              <dash-chart [data]="revenue" ariaLabel="Revenue trend over 12 months" />
            </mk-tab>
            <mk-tab label="Orders">
              <dash-chart [data]="orders" ariaLabel="Orders trend over 12 months" />
            </mk-tab>
            <mk-tab label="Users">
              <dash-chart [data]="users" ariaLabel="User growth over 12 months" />
            </mk-tab>
          </mk-tabs>
        </mk-card>

        <mk-card variant="outlined" class="dash__goals">
          <mk-card-header>
            <mk-card-title>Quarterly goals</mk-card-title>
          </mk-card-header>
          <div class="dash__goallist">
            @for (g of goals; track g.label) {
              <div class="dash__goal">
                <div class="dash__goalrow">
                  <span>{{ g.label }}</span>
                  <strong>{{ g.value }}%</strong>
                </div>
                <mk-progress-bar [value]="g.value" [tone]="g.tone" size="sm" />
              </div>
            }
          </div>
        </mk-card>
      </section>

      <!-- Recent orders table -->
      <mk-card variant="outlined" class="dash__tablecard">
        <mk-card-header>
          <mk-card-title>Recent orders</mk-card-title>
          <div class="dash__cardactions">
            <span class="dash__status">{{ tableStatus() }}</span>
            <button mkButton variant="soft" tone="neutral" size="sm" (click)="toast.info('Opening all orders…')">
              View all
            </button>
          </div>
        </mk-card-header>
        <mk-table
          [columns]="orderColumns"
          [data]="orderRows"
          [stickyHeader]="true"
          [zebra]="true"
          [clickableRows]="true"
          density="comfortable"
          (sortChange)="onSort($event)"
          (rowClick)="onRow($event)"
        />
      </mk-card>

      <!-- Activity + team -->
      <section class="dash__cols dash__cols--even">
        <mk-card variant="outlined">
          <mk-card-header>
            <mk-card-title>Recent activity</mk-card-title>
          </mk-card-header>
          <mk-list>
            @for (a of activity; track a.who + a.time) {
              <mk-list-item>
                <mk-avatar mkListLeading [name]="a.who" size="sm" />
                <div>
                  <div><strong>{{ a.who }}</strong> {{ a.action }}</div>
                  <div class="dash__time">{{ a.time }}</div>
                </div>
                <mk-badge mkListTrailing [tone]="a.tone" variant="soft" size="sm">
                  {{ a.label }}
                </mk-badge>
              </mk-list-item>
            }
          </mk-list>
        </mk-card>

        <mk-card variant="outlined">
          <mk-card-header>
            <mk-card-title>Team</mk-card-title>
            <div class="dash__cardactions">
              <button mkButton variant="soft" tone="primary" size="sm" (click)="toast.success('Invite sent')">
                Invite
              </button>
            </div>
          </mk-card-header>
          <div class="dash__filters">
            @for (f of filters; track f) {
              <mk-chip selectable [selected]="activeFilter() === f" (selectedChange)="activeFilter.set(f)">
                {{ f }}
              </mk-chip>
            }
          </div>
          <mk-divider />
          <mk-list>
            @for (m of visibleMembers(); track m.name) {
              <mk-list-item>
                <mk-avatar mkListLeading [name]="m.name" [status]="m.status" size="sm" />
                <div>
                  <div><strong>{{ m.name }}</strong></div>
                  <div class="dash__time">{{ m.role }}</div>
                </div>
                <div mkListTrailing class="dash__membertrail">
                  <mk-tag [tone]="m.role === 'Admin' ? 'primary' : 'neutral'" size="sm">
                    {{ m.role }}
                  </mk-tag>
                  <button mkButton iconOnly variant="ghost" tone="neutral" size="sm"
                    [attr.aria-label]="'Actions for ' + m.name" [mkMenuTriggerFor]="memberMenu">⋯</button>
                  <mk-menu #memberMenu="mkMenu">
                    <mk-menu-item (action)="toast.info('Viewing ' + m.name)">View profile</mk-menu-item>
                    <mk-menu-item (action)="toast.info('Messaging ' + m.name)">Send message</mk-menu-item>
                    <mk-menu-item danger (action)="toast.danger('Removed ' + m.name)">Remove</mk-menu-item>
                  </mk-menu>
                </div>
              </mk-list-item>
            }
          </mk-list>
        </mk-card>
      </section>

      <p class="dash__foot">
        Every element above is a mk-kit component styled only by
        <code class="docs-inline">--mk-*</code> tokens — switch the theme in the
        header and the whole dashboard follows.
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .dash {
        padding: var(--mk-space-6);
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-5);
      }
      .dash__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--mk-space-4);
        flex-wrap: wrap;
      }
      .dash__title {
        margin: 0;
        font-size: var(--mk-font-size-2xl);
        font-weight: var(--mk-font-weight-bold);
        letter-spacing: var(--mk-letter-spacing-tight);
      }
      .dash__sub {
        margin: var(--mk-space-1) 0 0;
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-md);
      }
      .dash__actions {
        display: flex;
        gap: var(--mk-space-2);
        flex-wrap: wrap;
      }
      .dash__kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--mk-space-4);
      }
      .dash__cols {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--mk-space-4);
      }
      .dash__cols--even {
        grid-template-columns: 1fr 1fr;
      }
      @media (max-width: 900px) {
        .dash__cols,
        .dash__cols--even {
          grid-template-columns: 1fr;
        }
      }
      .dash__cardactions {
        display: flex;
        align-items: center;
        gap: var(--mk-space-2);
      }
      .dash__status {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-subtle);
      }
      .dash__goallist {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-4);
        padding-top: var(--mk-space-2);
      }
      .dash__goalrow {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .dash__time {
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-subtle);
      }
      .dash__filters {
        display: flex;
        gap: var(--mk-space-2);
        padding: var(--mk-space-1) 0 var(--mk-space-3);
        flex-wrap: wrap;
      }
      .dash__membertrail {
        display: flex;
        align-items: center;
        gap: var(--mk-space-1);
      }
      .dash__foot {
        color: var(--mk-text-subtle);
        font-size: var(--mk-font-size-sm);
        text-align: center;
        margin: var(--mk-space-2) 0 0;
      }
    `,
  ],
})
export class DashboardPage {
  protected readonly toast = inject(MkToastService);
  private readonly dialog = inject(MkDialogService);

  protected readonly revenue = [28, 31, 30, 35, 34, 40, 38, 44, 43, 47, 46, 48];
  protected readonly orders = [12, 14, 13, 16, 15, 14, 17, 19, 18, 17, 20, 19];
  protected readonly users = [40, 42, 45, 47, 52, 55, 58, 60, 63, 67, 70, 74];

  protected readonly goals: Goal[] = [
    { label: 'Revenue target', value: 82, tone: 'primary' },
    { label: 'New signups', value: 64, tone: 'success' },
    { label: 'Support SLA', value: 91, tone: 'info' },
    { label: 'Churn reduction', value: 38, tone: 'warning' },
  ];

  protected readonly orderColumns: MkTableColumn<Order>[] = [
    { key: 'id', header: 'Order', width: '96px' },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'plan', header: 'Plan' },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, align: 'end',
      format: (v) => '$' + Number(v).toLocaleString() },
    { key: 'status', header: 'Status', align: 'center',
      format: (v) => String(v).toUpperCase() },
  ];
  protected readonly orderRows: Order[] = [
    { id: '#1042', customer: 'Ada Lovelace', plan: 'Enterprise', date: '2026-07-01', amount: 1290, status: 'paid' },
    { id: '#1041', customer: 'Grace Hopper', plan: 'Team', date: '2026-06-29', amount: 480, status: 'paid' },
    { id: '#1040', customer: 'Alan Turing', plan: 'Pro', date: '2026-06-28', amount: 96, status: 'pending' },
    { id: '#1039', customer: 'Katherine Johnson', plan: 'Enterprise', date: '2026-06-27', amount: 1290, status: 'paid' },
    { id: '#1038', customer: 'Edsger Dijkstra', plan: 'Pro', date: '2026-06-26', amount: 96, status: 'refunded' },
    { id: '#1037', customer: 'Barbara Liskov', plan: 'Team', date: '2026-06-25', amount: 480, status: 'paid' },
  ];

  protected readonly activity: Activity[] = [
    { who: 'Grace Hopper', action: 'upgraded to Team', time: '12 minutes ago', tone: 'success', label: 'Upgrade' },
    { who: 'Alan Turing', action: 'started a trial', time: '1 hour ago', tone: 'info', label: 'Trial' },
    { who: 'Edsger Dijkstra', action: 'requested a refund', time: '3 hours ago', tone: 'warning', label: 'Refund' },
    { who: 'Ada Lovelace', action: 'invited 3 teammates', time: 'Yesterday', tone: 'neutral', label: 'Invite' },
  ];

  private readonly members: Member[] = [
    { name: 'Ada Lovelace', role: 'Admin', status: 'online' },
    { name: 'Grace Hopper', role: 'Editor', status: 'online' },
    { name: 'Alan Turing', role: 'Viewer', status: 'away' },
    { name: 'Katherine Johnson', role: 'Editor', status: 'offline' },
  ];
  protected readonly filters = ['All', 'Admin', 'Editor', 'Viewer'];
  protected readonly activeFilter = signal('All');
  protected readonly visibleMembers = computed(() => {
    const f = this.activeFilter();
    return f === 'All' ? this.members : this.members.filter((m) => m.role === f);
  });

  protected readonly tableStatus = signal('Click a header to sort · click a row to open');

  protected setRange(range: string): void {
    this.toast.info(`Range set to ${range}`);
  }
  protected newReport(): void {
    this.toast.success('Report queued', { title: 'New report' });
  }
  protected onSort(e: MkSortChange): void {
    this.tableStatus.set(
      e.direction === 'none'
        ? 'Sorting cleared'
        : `Sorted by ${e.key} (${e.direction})`,
    );
  }
  protected onRow(row: Order): void {
    this.toast.info(`Opening order ${row.id} — ${row.customer}`);
  }
  protected async removeWidget(): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Remove widget?',
      message: 'This removes the Performance widget from your dashboard.',
      confirmText: 'Remove',
      cancelText: 'Keep it',
      tone: 'danger',
    });
    if (ok) this.toast.danger('Widget removed');
  }
}
