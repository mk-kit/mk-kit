import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkAvatar,
  MkAvatarGroup,
  MkBadge,
  MkCarousel,
  MkCarouselSlide,
  MkCode,
  MkCountdown,
  MkDiff,
  MkInput,
  MkKanban,
  MkQrCode,
  type MkKanbanColumn,
  MkSkeletonPreset,
  MkVirtualScroll,
  MkCard,
  MkCardFooter,
  MkCardHeader,
  MkCardTitle,
  MkChip,
  MkDescItem,
  MkDescriptionList,
  MkDivider,
  MkList,
  MkListItem,
  MkProgressBar,
  MkSkeleton,
  MkSpinner,
  MkStatCard,
  MkInlineEdit,
  MkTable,
  MkTableRowDetail,
  MkTag,
  type MkSortChange,
  type MkTableColumn,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

interface DemoUser {
  name: string;
  email: string;
  role: string;
  orders: number;
  status: string;
}

/**
 * Data display components demo page — Card, Divider, Badge, Tag, Chip, Avatar,
 * List, Stat card, Progress bar, Spinner, Skeleton and Table.
 */
@Component({
  selector: 'docs-data-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkAvatar,
    MkAvatarGroup,
    MkBadge,
    MkDescriptionList,
    MkDescItem,
    MkCode,
    MkCountdown,
    MkInput,
    MkKanban,
    MkQrCode,
    MkVirtualScroll,
    MkCarousel,
    MkCarouselSlide,
    MkDiff,
    MkSkeletonPreset,
    MkCard,
    MkCardFooter,
    MkCardHeader,
    MkCardTitle,
    MkChip,
    MkDivider,
    MkList,
    MkListItem,
    MkProgressBar,
    MkSkeleton,
    MkSpinner,
    MkStatCard,
    MkInlineEdit,
    MkTable,
    MkTableRowDetail,
    MkTag,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Data display</h1>
      <p class="docs-lead">
        Surfaces, labels and indicators for presenting structured content:
        cards, badges, tags, chips, avatars, lists, stat tiles, progress,
        loaders and a fully sortable data table. Every component is themed with
        <code class="docs-inline">--mk-*</code> tokens and ships with sensible
        accessibility defaults.
      </p>

      <!-- ============================ CARD ============================ -->
      <h2>Card</h2>
      <p>
        A themed surface container. Compose it with the
        <code class="docs-inline">mk-card-header</code>,
        <code class="docs-inline">mk-card-title</code> and
        <code class="docs-inline">mk-card-footer</code> parts, or drop plain
        content straight into the body.
      </p>
      <docs-example [code]="cardCode" column>
        <mk-card variant="elevated" style="max-width: 22rem">
          <mk-card-header>
            <mk-card-title>Monthly revenue</mk-card-title>
            <mk-badge tone="success">Live</mk-badge>
          </mk-card-header>
          Recurring revenue climbed steadily across every plan tier this month.
          <mk-card-footer>
            <mk-tag tone="info" variant="outline">Updated today</mk-tag>
          </mk-card-footer>
        </mk-card>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">'elevated' | 'outlined' | 'filled'</code></td>
            <td><code class="docs-inline">'elevated'</code></td>
            <td>Surface treatment.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">padding</code></td>
            <td><code class="docs-inline">'none' | 'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Internal spacing of body/header/footer.</td>
          </tr>
        </tbody>
      </table>

      <!-- ========================== DIVIDER ========================== -->
      <h2>Divider</h2>
      <p>
        A themed separator rule. Horizontal by default; project content to add a
        centred label, or set
        <code class="docs-inline">orientation="vertical"</code> for an inline
        rule.
      </p>
      <docs-example [code]="dividerCode" column>
        <span>Section one</span>
        <mk-divider />
        <mk-divider>OR</mk-divider>
        <span>Section two</span>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">orientation</code></td>
            <td><code class="docs-inline">'horizontal' | 'vertical'</code></td>
            <td><code class="docs-inline">'horizontal'</code></td>
            <td>Axis the rule is drawn along.</td>
          </tr>
        </tbody>
      </table>

      <!-- =========================== BADGE =========================== -->
      <h2>Badge</h2>
      <p>
        A compact status pill for counts or short state labels. Use
        <code class="docs-inline">dot</code> for a minimal notification
        indicator with no text.
      </p>
      <docs-example [code]="badgeCode">
        <mk-badge tone="success">Active</mk-badge>
        <mk-badge tone="warning" variant="soft">Pending</mk-badge>
        <mk-badge tone="danger" variant="solid">3</mk-badge>
        <mk-badge tone="info" variant="outline">Beta</mk-badge>
        <mk-badge tone="danger" dot aria-label="Unread" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>primary · neutral · success · warning · danger · info</td>
          </tr>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">'solid' | 'soft' | 'outline'</code></td>
            <td><code class="docs-inline">'soft'</code></td>
            <td>Visual treatment.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">dot</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Render as a tiny textless dot.</td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ TAG ============================ -->
      <h2>Tag</h2>
      <p>
        A non-interactive label for categories, keywords or metadata. For an
        interactive token use <code class="docs-inline">mk-chip</code> instead.
      </p>
      <docs-example [code]="tagCode">
        <mk-tag>Design</mk-tag>
        <mk-tag tone="info" variant="outline">Beta</mk-tag>
        <mk-tag tone="success" variant="solid">Stable</mk-tag>
        <mk-tag tone="warning" size="sm">Draft</mk-tag>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'neutral'</code></td>
            <td>Semantic color tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">'solid' | 'soft' | 'outline'</code></td>
            <td><code class="docs-inline">'soft'</code></td>
            <td>Visual treatment.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ CHIP =========================== -->
      <h2>Chip</h2>
      <p>
        An interactive, optionally selectable or removable token — ideal for
        filters and active selections. The filters below are wired to component
        state:
        <strong>{{ selectedFilters().join(', ') || 'none selected' }}</strong>.
      </p>
      <docs-example [code]="chipCode" column>
        <div style="display: flex; gap: var(--mk-space-2); flex-wrap: wrap">
          @for (f of filters; track f) {
            <mk-chip
              selectable
              tone="primary"
              [selected]="selectedFilters().includes(f)"
              (selectedChange)="toggleFilter(f, $event)"
            >
              {{ f }}
            </mk-chip>
          }
        </div>
        <mk-chip removable tone="neutral" (removed)="removedNote.set('Removed the token')">
          Removable
        </mk-chip>
        @if (removedNote()) {
          <span style="color: var(--mk-text-muted)">{{ removedNote() }}</span>
        }
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'neutral'</code></td>
            <td>Semantic color tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">variant</code></td>
            <td><code class="docs-inline">'solid' | 'soft' | 'outline'</code></td>
            <td><code class="docs-inline">'soft'</code></td>
            <td>Visual treatment.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selectable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Toggle a selected state on click / Enter / Space.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">removable</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Show a remove button; Delete/Backspace also remove.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">disabled</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Disable all interaction.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selected</code></td>
            <td><code class="docs-inline">model&lt;boolean&gt;</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Two-way selected state (with <code class="docs-inline">selectedChange</code>).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">removed</code></td>
            <td><code class="docs-inline">output&lt;void&gt;</code></td>
            <td>—</td>
            <td>Emitted when the chip is removed.</td>
          </tr>
        </tbody>
      </table>

      <!-- =========================== AVATAR ========================== -->
      <h2>Avatar</h2>
      <p>
        A user/entity image that falls back to initials derived from
        <code class="docs-inline">name</code>. Wrap several in
        <code class="docs-inline">mk-avatar-group</code> with a
        <code class="docs-inline">max</code> to collapse overflow into a "+N"
        bubble.
      </p>
      <docs-example [code]="avatarCode" column>
        <div style="display: flex; gap: var(--mk-space-3); align-items: center">
          <mk-avatar name="Ada Lovelace" status="online" />
          <mk-avatar name="Grace Hopper" shape="rounded" status="busy" />
          <mk-avatar name="Alan Turing" size="lg" />
        </div>
        <mk-avatar-group [max]="3">
          <mk-avatar name="Ada Lovelace" />
          <mk-avatar name="Grace Hopper" />
          <mk-avatar name="Alan Turing" />
          <mk-avatar name="Katherine Johnson" />
          <mk-avatar name="Edsger Dijkstra" />
        </mk-avatar-group>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">src</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Image URL; auto-falls back on load error.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">name</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Drives initials fallback and default label.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">shape</code></td>
            <td><code class="docs-inline">'circle' | 'rounded'</code></td>
            <td><code class="docs-inline">'circle'</code></td>
            <td>Outline shape.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">status</code></td>
            <td><code class="docs-inline">'online' | 'offline' | 'away' | 'busy'</code></td>
            <td>—</td>
            <td>Presence dot; omit for none.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">max</code> <em>(group)</em></td>
            <td><code class="docs-inline">number</code></td>
            <td>—</td>
            <td>Avatars shown before collapsing to "+N".</td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ LIST =========================== -->
      <h2>List</h2>
      <p>
        A vertical stack of rows with <code class="docs-inline">role="list"</code>
        semantics. Mark items <code class="docs-inline">interactive</code> for
        focus + keyboard activation, and project adornments with
        <code class="docs-inline">mkListLeading</code> /
        <code class="docs-inline">mkListTrailing</code>.
      </p>
      <docs-example [code]="listCode" column>
        <mk-list bordered style="max-width: 24rem; width: 100%">
          @for (u of users; track u.email) {
            <mk-list-item
              interactive
              [selected]="activeEmail() === u.email"
              (activated)="activeEmail.set(u.email)"
            >
              <mk-avatar mkListLeading [name]="u.name" size="sm" />
              {{ u.name }}
              <mk-badge mkListTrailing tone="neutral" variant="soft">
                {{ u.orders }}
              </mk-badge>
            </mk-list-item>
          }
        </mk-list>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">bordered</code> <em>(list)</em></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Hairline separators between items.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">interactive</code> <em>(item)</em></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Focusable/clickable with hover + keyboard.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">selected</code> <em>(item)</em></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Highlight as the current selection.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">disabled</code> <em>(item)</em></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Disable interaction and dim the row.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">activated</code> <em>(item)</em></td>
            <td><code class="docs-inline">output&lt;void&gt;</code></td>
            <td>—</td>
            <td>Emitted on click / Enter / Space.</td>
          </tr>
        </tbody>
      </table>

      <!-- ========================= STAT CARD ========================= -->
      <h2>Stat card</h2>
      <p>
        A compact KPI tile. Shows a label, a primary value and an optional trend
        delta. The trend is conveyed by an arrow glyph and screen-reader phrase
        as well as colour, so it never relies on colour alone.
      </p>
      <docs-example [code]="statCode">
        <mk-stat-card
          label="Revenue"
          value="$48.2k"
          delta="+12%"
          deltaTrend="up"
          hint="vs. last month"
        />
        <mk-stat-card
          label="Churn"
          value="1.9%"
          delta="-0.4pt"
          deltaTrend="down"
          hint="vs. last month"
        />
        <mk-stat-card label="Active users" value="12,480" delta="0" deltaTrend="neutral" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">label</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">''</code></td>
            <td>Metric name shown above the value.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">value</code></td>
            <td><code class="docs-inline">string | number</code></td>
            <td><code class="docs-inline">''</code></td>
            <td>The primary metric value.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">delta</code></td>
            <td><code class="docs-inline">string | number</code></td>
            <td>—</td>
            <td>Change indicator; omit to hide the delta row.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">deltaTrend</code></td>
            <td><code class="docs-inline">'up' | 'down' | 'neutral'</code></td>
            <td><code class="docs-inline">'neutral'</code></td>
            <td>Colourises the delta and picks the arrow.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">hint</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Small supporting note under the delta.</td>
          </tr>
        </tbody>
      </table>

      <!-- ======================== PROGRESS BAR ======================= -->
      <h2>Progress bar</h2>
      <p>
        A determinate (0–100) or indeterminate progress indicator with
        <code class="docs-inline">role="progressbar"</code>. The live value below
        is driven by component state:
        <strong>{{ progress() }}%</strong>.
      </p>
      <docs-example [code]="progressCode" column>
        <mk-progress-bar
          [value]="progress()"
          label="Uploading"
          showValue
          style="width: 100%"
        />
        <div style="display: flex; gap: var(--mk-space-2)">
          <mk-chip selectable (selectedChange)="step(-10)">−10</mk-chip>
          <mk-chip selectable (selectedChange)="step(10)">+10</mk-chip>
        </div>
        <mk-progress-bar indeterminate tone="info" label="Loading" style="width: 100%" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">value</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">0</code></td>
            <td>Completion 0–100 (clamped).</td>
          </tr>
          <tr>
            <td><code class="docs-inline">indeterminate</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Animated bar with no known completion.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>Fill tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Track thickness.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">label</code></td>
            <td><code class="docs-inline">string</code></td>
            <td>—</td>
            <td>Visible caption; also labels the bar.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">showValue</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Show numeric percentage (determinate only).</td>
          </tr>
        </tbody>
      </table>

      <!-- =========================== SPINNER ========================= -->
      <h2>Spinner</h2>
      <p>
        A circular indeterminate loading indicator with
        <code class="docs-inline">role="status"</code> and a visually-hidden
        label announced to assistive tech.
      </p>
      <docs-example [code]="spinnerCode">
        <mk-spinner size="sm" />
        <mk-spinner />
        <mk-spinner size="lg" tone="neutral" label="Fetching results" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">size</code></td>
            <td><code class="docs-inline">'sm' | 'md' | 'lg'</code></td>
            <td><code class="docs-inline">'md'</code></td>
            <td>Size scale.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">tone</code></td>
            <td><code class="docs-inline">MkTone</code></td>
            <td><code class="docs-inline">'primary'</code></td>
            <td>Semantic color tone.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">label</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">'Loading'</code></td>
            <td>Visually-hidden status label.</td>
          </tr>
        </tbody>
      </table>

      <!-- ========================== SKELETON ========================= -->
      <h2>Skeleton</h2>
      <p>
        A shimmering placeholder shown while content loads. It is
        <code class="docs-inline">aria-hidden</code>; mark the surrounding region
        <code class="docs-inline">aria-busy="true"</code> so assistive tech knows
        content is pending.
      </p>
      <docs-example [code]="skeletonCode" column>
        <div style="display: flex; gap: var(--mk-space-3); align-items: center; width: 100%">
          <mk-skeleton shape="circle" [width]="40" [height]="40" />
          <div style="flex: 1">
            <mk-skeleton shape="text" [lines]="3" />
          </div>
        </div>
        <mk-skeleton shape="rect" width="100%" [height]="120" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">shape</code></td>
            <td><code class="docs-inline">'text' | 'rect' | 'circle'</code></td>
            <td><code class="docs-inline">'text'</code></td>
            <td>Placeholder geometry.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">width</code></td>
            <td><code class="docs-inline">string | number</code></td>
            <td>—</td>
            <td>Number (px) or any CSS length.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">height</code></td>
            <td><code class="docs-inline">string | number</code></td>
            <td>—</td>
            <td>Number (px) or any CSS length.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">lines</code></td>
            <td><code class="docs-inline">number</code></td>
            <td><code class="docs-inline">1</code></td>
            <td>Line count for <code class="docs-inline">shape="text"</code>.</td>
          </tr>
        </tbody>
      </table>

      <!-- ============================ TABLE ========================== -->
      <h2>Table</h2>
      <p>
        A themed data table built on a native <code class="docs-inline">&lt;table&gt;</code>.
        Supply <code class="docs-inline">columns</code> and
        <code class="docs-inline">data</code>; opt into sortable columns, a sticky
        header, zebra striping and compact density. Sorting is keyboard operable
        (Enter/Space on a header). Click a header to sort or click a row —
        status:
        <strong>{{ tableStatus() }}</strong>.
      </p>
      <docs-example [code]="tableCode" column>
        <mk-table
          [columns]="columns"
          [data]="users"
          stickyHeader
          zebra
          clickableRows
          density="comfortable"
          (sortChange)="onSort($event)"
          (rowClick)="onRowClick($event)"
          style="width: 100%; max-height: 20rem"
        />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="docs-inline">columns</code> <em>(required)</em></td>
            <td><code class="docs-inline">MkTableColumn&lt;T&gt;[]</code></td>
            <td>—</td>
            <td>Column defs; order = display order.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">data</code></td>
            <td><code class="docs-inline">T[]</code></td>
            <td><code class="docs-inline">[]</code></td>
            <td>Row objects to render.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">stickyHeader</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Pin the header to the scroll container top.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">zebra</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Alternate row background.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">hover</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">true</code></td>
            <td>Highlight rows on hover.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">density</code></td>
            <td><code class="docs-inline">'comfortable' | 'compact'</code></td>
            <td><code class="docs-inline">'comfortable'</code></td>
            <td>Row vertical density.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">clickableRows</code></td>
            <td><code class="docs-inline">boolean</code></td>
            <td><code class="docs-inline">false</code></td>
            <td>Style rows as clickable and emit <code class="docs-inline">rowClick</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">emptyMessage</code></td>
            <td><code class="docs-inline">string</code></td>
            <td><code class="docs-inline">'No data to display'</code></td>
            <td>Shown when there are no rows.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">sortChange</code></td>
            <td><code class="docs-inline">output&lt;MkSortChange&gt;</code></td>
            <td>—</td>
            <td><code class="docs-inline">{{ '{' }} key, direction {{ '}' }}</code>.</td>
          </tr>
          <tr>
            <td><code class="docs-inline">rowClick</code></td>
            <td><code class="docs-inline">output&lt;T&gt;</code></td>
            <td>—</td>
            <td>Emitted when a row is clicked.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each column is an <code class="docs-inline">MkTableColumn</code> with
        <code class="docs-inline">key</code>,
        <code class="docs-inline">header</code>, optional
        <code class="docs-inline">sortable</code>,
        <code class="docs-inline">align</code>,
        <code class="docs-inline">width</code> and a
        <code class="docs-inline">format</code> callback.
      </p>

      <h2>Expandable rows</h2>
      <p>
        Set <code class="docs-inline">expandable</code> to add a leading expander
        column. Each row reveals a detail panel supplied via an
        <code class="docs-inline">&lt;ng-template mkTableRowDetail let-row&gt;</code>
        — the row object is the template's implicit context. Add
        <code class="docs-inline">singleExpand</code> for accordion behaviour.
        Expanded: <strong>{{ expandedNames() }}</strong>.
      </p>
      <docs-example [code]="expandableCode" column>
        <mk-table
          [columns]="columns"
          [data]="users"
          expandable
          hover
          trackKey="email"
          (expandedChange)="onExpand($event)"
          style="width: 100%"
        >
          <ng-template mkTableRowDetail let-row>
            <mk-description-list layout="stacked">
              <mk-desc-item term="Email">{{ row.email }}</mk-desc-item>
              <mk-desc-item term="Role">{{ row.role }}</mk-desc-item>
              <mk-desc-item term="Status">{{ row.status }}</mk-desc-item>
            </mk-description-list>
          </ng-template>
        </mk-table>
      </docs-example>

      <h2>Inline edit</h2>
      <p>
        <code class="docs-inline">&lt;mk-inline-edit&gt;</code> turns text into a
        click-to-edit field: click (or focus + Enter) to edit, Enter or blur
        saves, Escape reverts. Add <code class="docs-inline">multiline</code> for
        a textarea. Its model is a <code class="docs-inline">string</code>.
      </p>
      <docs-example [code]="inlineEditCode" [column]="true">
        <div style="display: grid; gap: var(--mk-space-3); max-width: 22rem;">
          <mk-inline-edit [(value)]="editTitle" ariaLabel="Edit title" />
          <mk-inline-edit multiline [(value)]="editNotes" ariaLabel="Edit notes" />
          <p class="echo">Title: {{ editTitle() || '—' }}</p>
        </div>
      </docs-example>

      <h2>Data-grid pro</h2>
      <p>
        Opt-in power features on the same <code class="docs-inline">mk-table</code>:
        <strong>resize</strong> columns from the header edge, <strong>reorder</strong>
        them by dragging headers, <strong>pin</strong> a column so it stays put
        while the rest scroll horizontally, and <strong>edit</strong> cells
        inline (double-click). Set <code class="docs-inline">resizableColumns</code>
        / <code class="docs-inline">reorderableColumns</code> and mark columns
        <code class="docs-inline">resizable</code> /
        <code class="docs-inline">editable</code> /
        <code class="docs-inline">pinned</code>.
        Last edit: <strong>{{ gridStatus() }}</strong>.
      </p>
      <docs-example [code]="gridProCode" column>
        <mk-table
          [columns]="gridColumns"
          [data]="gridRows()"
          resizableColumns
          reorderableColumns
          zebra
          (cellEdit)="onCellEdit($event)"
          style="width: 100%"
        />
      </docs-example>

      <h2>Description list</h2>
      <p>
        <code class="docs-inline">&lt;mk-description-list&gt;</code> renders a
        semantic <code class="docs-inline">&lt;dl&gt;</code> of term/detail pairs
        for entity-detail and metadata panels. Values may be rich content;
        <code class="docs-inline">grid</code> aligns terms in a column,
        <code class="docs-inline">stacked</code> puts each term above its value.
      </p>
      <docs-example [code]="descListCode" [column]="true">
        <mk-description-list [divided]="true" style="max-width: 30rem;">
          <mk-desc-item term="Status">
            <mk-badge tone="success">Active</mk-badge>
          </mk-desc-item>
          <mk-desc-item term="Owner">Ada Lovelace</mk-desc-item>
          <mk-desc-item term="Plan">Enterprise · 24 seats</mk-desc-item>
          <mk-desc-item term="Created">Jul 1, 2026</mk-desc-item>
        </mk-description-list>
      </docs-example>

      <h2>Code block</h2>
      <p>
        <code class="docs-inline">&lt;mk-code&gt;</code> is a read-only, themed code
        block with syntax highlighting, an optional filename header, line numbers
        and a copy button (it reuses the tokenizer + copy directive).
      </p>
      <docs-example [code]="codeBlockCode" [column]="true">
        <mk-code
          language="json"
          filename="config.json"
          [lineNumbers]="true"
          [code]="sampleJson"
        />
      </docs-example>

      <h2>Virtual scroll</h2>
      <p>
        <code class="docs-inline">&lt;mk-virtual-scroll&gt;</code> renders only the
        rows visible in the viewport (plus a small overscan), so a list of
        thousands of fixed-height items stays smooth. Give the host a height and a
        row template. This list has <strong>10,000 rows</strong>.
      </p>
      <docs-example [code]="virtualScrollCode" [column]="true">
        <mk-virtual-scroll
          [items]="bigList"
          [itemHeight]="36"
          style="height: 16rem; width: 100%; border: var(--mk-border-width) solid var(--mk-border); border-radius: var(--mk-radius-md);"
        >
          <ng-template let-row let-i="index">
            <div style="display: flex; gap: var(--mk-space-3); align-items: center; height: 100%; padding: 0 var(--mk-space-3); border-bottom: var(--mk-border-width) solid var(--mk-border-subtle);">
              <span style="color: var(--mk-text-subtle); width: 4rem; font-variant-numeric: tabular-nums;">#{{ i }}</span>
              <span>{{ row.name }}</span>
            </div>
          </ng-template>
        </mk-virtual-scroll>
      </docs-example>

      <h2>Carousel</h2>
      <p>
        <code class="docs-inline">&lt;mk-carousel&gt;</code> is an accessible
        slides/gallery — prev/next arrows, dot indicators, Arrow-key navigation
        and optional autoplay (pauses on hover/focus). Mark each slide with
        <code class="docs-inline">mkCarouselSlide</code>.
      </p>
      <docs-example [code]="carouselCode" [column]="true">
        <div style="max-width: 30rem; width: 100%;">
          <mk-carousel ariaLabel="Highlights">
            @for (c of slides; track c.title) {
              <div mkCarouselSlide [style.background]="c.bg" style="padding: var(--mk-space-8) var(--mk-space-4); text-align: center; color: #fff;">
                <h3 style="margin: 0 0 var(--mk-space-1);">{{ c.title }}</h3>
                <p style="margin: 0; opacity: 0.85;">{{ c.body }}</p>
              </div>
            }
          </mk-carousel>
        </div>
      </docs-example>

      <h2>Diff</h2>
      <p>
        <code class="docs-inline">&lt;mk-diff&gt;</code> compares two versions of
        text (a revision "before → after") with an LCS line diff and intra-line
        word highlighting. Render <code class="docs-inline">unified</code>
        (single column, +/−) or <code class="docs-inline">split</code>
        (side-by-side).
      </p>
      <docs-example [code]="diffCode" [column]="true">
        <div style="display: flex; flex-direction: column; gap: var(--mk-space-4); width: 100%;">
          <mk-diff [before]="diffBefore" [after]="diffAfter" />
          <mk-diff [before]="diffBefore" [after]="diffAfter" mode="split" beforeLabel="v3" afterLabel="v4" />
        </div>
      </docs-example>

      <h2>Skeleton presets</h2>
      <p>
        <code class="docs-inline">&lt;mk-skeleton-preset&gt;</code> assembles
        ready-made loading layouts — <code class="docs-inline">paragraph</code>,
        <code class="docs-inline">card</code>, <code class="docs-inline">list</code>
        or <code class="docs-inline">table</code> — from the skeleton primitive.
      </p>
      <docs-example [code]="skeletonPresetCode" [column]="true">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: var(--mk-space-6); width: 100%;">
          <mk-skeleton-preset preset="card" />
          <mk-skeleton-preset preset="list" [rows]="3" />
          <mk-skeleton-preset preset="table" [rows]="3" [columns]="4" />
        </div>
      </docs-example>

      <!-- =========================== QR CODE ========================= -->
      <h2>QR code</h2>
      <p>
        <code class="docs-inline">&lt;mk-qr-code&gt;</code> renders a QR code as
        crisp SVG — no dependencies (the encoder, Reed–Solomon ECC and masking are
        implemented in-house). Set <code class="docs-inline">value</code>,
        <code class="docs-inline">ecc</code> (L/M/Q/H) and
        <code class="docs-inline">size</code>; it's theme-aware by default.
      </p>
      <docs-example [code]="qrCode" [column]="true">
        <div style="display: flex; gap: var(--mk-space-6); flex-wrap: wrap; align-items: flex-start;">
          <mk-qr-code [value]="qrValue()" [size]="160" />
          <div style="display: grid; gap: var(--mk-space-2); max-width: 22rem; width: 100%;">
            <input mkInput [value]="qrValue()" (input)="qrValue.set($any($event.target).value)" />
            <p class="echo">Encodes the text above — try editing it.</p>
          </div>
        </div>
      </docs-example>

      <!-- =========================== KANBAN ========================== -->
      <h2>Kanban</h2>
      <p>
        <code class="docs-inline">&lt;mk-kanban&gt;</code> is a board of columns
        whose cards are <strong>draggable between columns</strong> (and reorderable
        within one) with both pointer and keyboard dragging. Bind
        <code class="docs-inline">columns</code> two-way — the model is updated
        immutably on every drop — and listen to
        <code class="docs-inline">cardMoved</code> for move events.
      </p>
      <docs-example [code]="kanbanCode" [column]="true">
        <mk-kanban [(columns)]="board" style="width: 100%" />
      </docs-example>

      <!-- ========================== COUNTDOWN ======================== -->
      <h2>Countdown</h2>
      <p>
        <code class="docs-inline">&lt;mk-countdown&gt;</code> counts down
        <strong>live</strong>, ticking every second toward a target
        <code class="docs-inline">to</code> date and showing the remaining days,
        hours, minutes and seconds. It emits
        <code class="docs-inline">finished</code> once the instant passes.
      </p>
      <docs-example [code]="countdownCode" [column]="true">
        <mk-countdown [to]="launchDate" />
      </docs-example>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      h2 {
        margin-top: var(--mk-space-9, 3rem);
      }
    `,
  ],
})
export class DataPage {
  protected readonly sampleJson =
    '{\n  "theme": "dark",\n  "retries": 3,\n  "features": ["search", "export"]\n}';
  protected readonly bigList = Array.from({ length: 10000 }, (_, i) => ({
    name: `Item number ${i + 1}`,
  }));
  protected readonly slides = [
    { title: 'Fast', body: 'Signals + OnPush everywhere.', bg: 'var(--mk-primary)' },
    { title: 'Accessible', body: 'WCAG 2.1 AA out of the box.', bg: 'var(--mk-success)' },
    { title: 'Themeable', body: 'Every colour is a CSS variable.', bg: 'var(--mk-info)' },
  ];

  // ----- Kanban --------------------------------------------------------
  protected readonly board = signal<MkKanbanColumn[]>([
    {
      id: 'todo',
      title: 'To do',
      cards: [
        { id: 't1', title: 'Draft release notes' },
        { id: 't2', title: 'Audit colour tokens' },
        { id: 't3', title: 'Write kanban docs' },
      ],
    },
    {
      id: 'doing',
      title: 'In progress',
      cards: [
        { id: 'd1', title: 'Ship countdown component' },
        { id: 'd2', title: 'Review DnD a11y' },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      cards: [
        { id: 'x1', title: 'Set up docs site' },
        { id: 'x2', title: 'Publish v1 to npm' },
      ],
    },
  ]);

  protected readonly kanbanCode = `<mk-kanban [(columns)]="board" (cardMoved)="onMoved($event)" />`;

  // ----- Countdown -----------------------------------------------------
  /** A few days out; computed at construction so SSR/build stays stable. */
  protected readonly launchDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  protected readonly countdownCode = `<mk-countdown [to]="launchDate" (finished)="onLaunch()" />`;

  protected readonly codeBlockCode = `<mk-code language="json" filename="config.json"
  lineNumbers [code]="json" />`;
  protected readonly virtualScrollCode = `<mk-virtual-scroll [items]="rows" [itemHeight]="36"
  style="height: 16rem;">
  <ng-template let-row let-i="index">#{{ '{{ i }}' }} — {{ '{{ row.name }}' }}</ng-template>
</mk-virtual-scroll>`;
  protected readonly carouselCode = `<mk-carousel ariaLabel="Highlights">
  <div mkCarouselSlide>…</div>
  <div mkCarouselSlide>…</div>
</mk-carousel>`;

  protected readonly diffBefore = `title: Getting started
theme: light
retries: 3
Draft the quick brown fox.`;
  protected readonly diffAfter = `title: Getting started
theme: dark
retries: 5
Draft the slow brown fox.
published: true`;
  protected readonly diffCode = `<mk-diff [before]="v1" [after]="v2" />
<mk-diff [before]="v1" [after]="v2" mode="split" />`;
  protected readonly skeletonPresetCode = `<mk-skeleton-preset preset="card" />
<mk-skeleton-preset preset="list" [rows]="3" />
<mk-skeleton-preset preset="table" [rows]="3" [columns]="4" />`;

  protected readonly descListCode = `<mk-description-list divided>
  <mk-desc-item term="Status"><mk-badge tone="success">Active</mk-badge></mk-desc-item>
  <mk-desc-item term="Owner">Ada Lovelace</mk-desc-item>
  <mk-desc-item term="Plan">Enterprise · 24 seats</mk-desc-item>
</mk-description-list>`;

  // ----- Chip filters --------------------------------------------------
  protected readonly filters = ['Open', 'In progress', 'Closed'];
  protected readonly selectedFilters = signal<string[]>(['Open']);
  protected readonly removedNote = signal('');

  protected toggleFilter(filter: string, selected: boolean): void {
    this.selectedFilters.update((current) =>
      selected
        ? [...current, filter]
        : current.filter((f) => f !== filter),
    );
  }

  // ----- List selection ------------------------------------------------
  protected readonly activeEmail = signal('ada@example.com');

  // ----- Progress ------------------------------------------------------
  protected readonly progress = signal(40);

  protected step(delta: number): void {
    this.progress.update((v) => Math.min(100, Math.max(0, v + delta)));
  }

  // ----- Table ---------------------------------------------------------
  protected readonly columns: MkTableColumn<DemoUser>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'orders', header: 'Orders', sortable: true, align: 'end' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      format: (v) => String(v).toUpperCase(),
    },
  ];

  protected readonly users: DemoUser[] = [
    { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', orders: 42, status: 'active' },
    { name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor', orders: 17, status: 'active' },
    { name: 'Alan Turing', email: 'alan@example.com', role: 'Viewer', orders: 8, status: 'invited' },
    { name: 'Katherine Johnson', email: 'kat@example.com', role: 'Editor', orders: 63, status: 'active' },
    { name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'Admin', orders: 29, status: 'suspended' },
    { name: 'Barbara Liskov', email: 'barbara@example.com', role: 'Viewer', orders: 51, status: 'active' },
  ];

  protected readonly tableStatus = signal('idle');

  protected onSort(change: MkSortChange): void {
    this.tableStatus.set(
      change.direction === 'none'
        ? `cleared sort on ${change.key}`
        : `sorted by ${change.key} (${change.direction})`,
    );
  }

  protected onRowClick(row: DemoUser): void {
    this.tableStatus.set(`clicked ${row.name}`);
  }

  // ----- Inline edit ---------------------------------------------------
  protected readonly editTitle = signal('Q3 marketing plan');
  protected readonly editNotes = signal('Draft — review before sending.');
  protected readonly inlineEditCode = `<mk-inline-edit [(value)]="title" />
<mk-inline-edit multiline [(value)]="notes" />`;

  // ----- Expandable rows ----------------------------------------------
  protected readonly expandedRows = signal<DemoUser[]>([]);
  protected readonly expandedNames = computed(() => {
    const rows = this.expandedRows();
    return rows.length ? rows.map((r) => r.name).join(', ') : 'none';
  });

  protected onExpand(rows: DemoUser[]): void {
    this.expandedRows.set(rows);
  }

  // ----- Data-grid pro -------------------------------------------------
  protected readonly gridColumns: MkTableColumn<DemoUser>[] = [
    { key: 'name', header: 'Name', pinned: 'left', width: '160px', resizable: true, sortable: true },
    { key: 'email', header: 'Email', resizable: true, editable: true, width: '220px' },
    { key: 'role', header: 'Role', resizable: true, editable: true, width: '140px' },
    { key: 'orders', header: 'Orders', align: 'end', resizable: true, width: '110px' },
    { key: 'status', header: 'Status', align: 'center', editable: true, width: '130px' },
  ];
  protected readonly gridRows = signal<DemoUser[]>(this.users.slice(0, 5));
  protected readonly gridStatus = signal('—');

  // ----- QR code -------------------------------------------------------
  protected readonly qrValue = signal('https://github.com/mkornas/mk-kit');
  protected readonly qrCode = `<mk-qr-code value="https://example.com" ecc="M" [size]="160" />`;

  protected onCellEdit(e: { row: DemoUser; key: string; value: string }): void {
    this.gridRows.update((rows) =>
      rows.map((r) =>
        r === e.row ? { ...r, [e.key]: e.value } : r,
      ),
    );
    this.gridStatus.set(`${e.key} → "${e.value}"`);
  }

  // ----- Code snippets -------------------------------------------------
  protected readonly cardCode = `<mk-card variant="elevated">
  <mk-card-header>
    <mk-card-title>Monthly revenue</mk-card-title>
    <mk-badge tone="success">Live</mk-badge>
  </mk-card-header>
  Recurring revenue climbed steadily this month.
  <mk-card-footer>
    <mk-tag tone="info" variant="outline">Updated today</mk-tag>
  </mk-card-footer>
</mk-card>`;

  protected readonly dividerCode = `<mk-divider />
<mk-divider>OR</mk-divider>
<mk-divider orientation="vertical" />`;

  protected readonly badgeCode = `<mk-badge tone="success">Active</mk-badge>
<mk-badge tone="warning" variant="soft">Pending</mk-badge>
<mk-badge tone="danger" variant="solid">3</mk-badge>
<mk-badge tone="info" variant="outline">Beta</mk-badge>
<mk-badge tone="danger" dot aria-label="Unread" />`;

  protected readonly tagCode = `<mk-tag>Design</mk-tag>
<mk-tag tone="info" variant="outline">Beta</mk-tag>
<mk-tag tone="success" variant="solid">Stable</mk-tag>
<mk-tag tone="warning" size="sm">Draft</mk-tag>`;

  protected readonly chipCode = `<mk-chip
  selectable
  tone="primary"
  [selected]="active().includes(f)"
  (selectedChange)="toggle(f, $event)">
  {{ f }}
</mk-chip>

<mk-chip removable (removed)="drop()">Removable</mk-chip>`;

  protected readonly avatarCode = `<mk-avatar name="Ada Lovelace" status="online" />
<mk-avatar name="Grace Hopper" shape="rounded" status="busy" />
<mk-avatar name="Alan Turing" size="lg" />

<mk-avatar-group [max]="3">
  <mk-avatar name="Ada Lovelace" />
  <mk-avatar name="Grace Hopper" />
  <mk-avatar name="Alan Turing" />
  <mk-avatar name="Katherine Johnson" />
</mk-avatar-group>`;

  protected readonly listCode = `<mk-list bordered>
  @for (u of users; track u.email) {
    <mk-list-item
      interactive
      [selected]="active() === u.email"
      (activated)="active.set(u.email)">
      <mk-avatar mkListLeading [name]="u.name" size="sm" />
      {{ u.name }}
      <mk-badge mkListTrailing>{{ u.orders }}</mk-badge>
    </mk-list-item>
  }
</mk-list>`;

  protected readonly statCode = `<mk-stat-card
  label="Revenue"
  value="$48.2k"
  delta="+12%"
  deltaTrend="up"
  hint="vs. last month" />

<mk-stat-card
  label="Churn"
  value="1.9%"
  delta="-0.4pt"
  deltaTrend="down" />`;

  protected readonly progressCode = `<mk-progress-bar
  [value]="progress()"
  label="Uploading"
  showValue />

<mk-progress-bar indeterminate tone="info" label="Loading" />`;

  protected readonly spinnerCode = `<mk-spinner size="sm" />
<mk-spinner />
<mk-spinner size="lg" tone="neutral" label="Fetching results" />`;

  protected readonly skeletonCode = `<mk-skeleton shape="circle" [width]="40" [height]="40" />
<mk-skeleton shape="text" [lines]="3" />
<mk-skeleton shape="rect" width="100%" [height]="120" />`;

  protected readonly tableCode = `columns: MkTableColumn<User>[] = [
  { key: 'name',   header: 'Name',   sortable: true },
  { key: 'email',  header: 'Email' },
  { key: 'role',   header: 'Role',   sortable: true },
  { key: 'orders', header: 'Orders', sortable: true, align: 'end' },
  { key: 'status', header: 'Status', align: 'center',
    format: (v) => String(v).toUpperCase() },
];

<mk-table
  [columns]="columns"
  [data]="users"
  stickyHeader
  zebra
  clickableRows
  (sortChange)="onSort($event)"
  (rowClick)="onRowClick($event)" />`;

  protected readonly gridProCode = `columns: MkTableColumn<User>[] = [
  { key: 'name',  header: 'Name',  pinned: 'left', resizable: true, sortable: true },
  { key: 'email', header: 'Email', resizable: true, editable: true },
  { key: 'role',  header: 'Role',  resizable: true, editable: true },
  // …
];

<mk-table
  [columns]="columns" [data]="rows()"
  resizableColumns reorderableColumns
  (cellEdit)="onCellEdit($event)" />
// Drag header edges to resize · drag headers to reorder · double-click a cell to edit`;

  protected readonly expandableCode = `<mk-table
  [columns]="columns"
  [data]="users"
  expandable
  trackKey="email"
  (expandedChange)="onExpand($event)"
>
  <ng-template mkTableRowDetail let-row>
    <mk-description-list layout="stacked">
      <mk-desc-item term="Email">{{ row.email }}</mk-desc-item>
      <mk-desc-item term="Role">{{ row.role }}</mk-desc-item>
    </mk-description-list>
  </ng-template>
</mk-table>`;
}
