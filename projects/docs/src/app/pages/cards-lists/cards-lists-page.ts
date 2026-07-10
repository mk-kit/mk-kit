import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkAvatar,
  MkBadge,
  MkCard,
  MkCardFooter,
  MkCardHeader,
  MkCardTitle,
  MkDescItem,
  MkDescriptionList,
  MkDivider,
  MkList,
  MkListItem,
  MkStatCard,
  MkTag,
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
 * Cards & lists demo page — Card, Divider, List, Stat card and
 * Description list.
 */
@Component({
  selector: 'docs-cards-lists-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkAvatar,
    MkBadge,
    MkCard,
    MkCardFooter,
    MkCardHeader,
    MkCardTitle,
    MkDescItem,
    MkDescriptionList,
    MkDivider,
    MkList,
    MkListItem,
    MkStatCard,
    MkTag,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Cards & lists</h1>
      <p class="docs-lead">
        Surfaces and stacks for presenting structured content: card
        containers, divider rules, interactive lists, KPI stat tiles and
        semantic description lists. Every component is themed with
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
export class CardsListsPage {
  // ----- List selection ------------------------------------------------
  protected readonly activeEmail = signal('ada@example.com');

  protected readonly users: DemoUser[] = [
    { name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin', orders: 42, status: 'active' },
    { name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor', orders: 17, status: 'active' },
    { name: 'Alan Turing', email: 'alan@example.com', role: 'Viewer', orders: 8, status: 'invited' },
    { name: 'Katherine Johnson', email: 'kat@example.com', role: 'Editor', orders: 63, status: 'active' },
    { name: 'Edsger Dijkstra', email: 'edsger@example.com', role: 'Admin', orders: 29, status: 'suspended' },
    { name: 'Barbara Liskov', email: 'barbara@example.com', role: 'Viewer', orders: 51, status: 'active' },
  ];

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

  protected readonly descListCode = `<mk-description-list divided>
  <mk-desc-item term="Status"><mk-badge tone="success">Active</mk-badge></mk-desc-item>
  <mk-desc-item term="Owner">Ada Lovelace</mk-desc-item>
  <mk-desc-item term="Plan">Enterprise · 24 seats</mk-desc-item>
</mk-description-list>`;
}
