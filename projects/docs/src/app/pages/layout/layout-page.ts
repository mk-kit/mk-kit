import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MkBreakpointService,
  MkButton,
  MkFlex,
  MkFlexItem,
  MkGrid,
  MkGridItem,
  MkInput,
  MkStack,
  MkTag,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Layout primitives — `mk-stack`, `mk-flex`, `mk-grid`, their child
 * directives and the responsive values behind them.
 */
@Component({
  selector: 'docs-layout-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkButton,
    MkFlex,
    MkFlexItem,
    MkGrid,
    MkGridItem,
    MkInput,
    MkStack,
    MkTag,
    RouterLink,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Layout</h1>
      <p class="docs-lead">
        Three containers cover most page structure without a stylesheet:
        <code class="docs-inline">&lt;mk-stack&gt;</code> lines children up with a
        gap, <code class="docs-inline">&lt;mk-flex&gt;</code> is flexbox with its
        options as inputs, <code class="docs-inline">&lt;mk-grid&gt;</code> is a
        CSS grid that takes a column count, a track list or a minimum column
        width. Gaps use the <code class="docs-inline">--mk-space-*</code> scale
        (so they follow the density modes), and every input accepts a
        per-breakpoint map such as
        <code class="docs-inline">{{ '{' }} xs: 1, md: 2, xl: 4 {{ '}' }}</code>.
      </p>

      <h2>Stack</h2>
      <p>
        Vertical by default, <code class="docs-inline">gap</code> of
        <code class="docs-inline">4</code> (16px). Set
        <code class="docs-inline">direction="row"</code> for a horizontal run —
        a row of buttons, a label beside a value — and
        <code class="docs-inline">align</code> /
        <code class="docs-inline">justify</code> in plain words
        (<code class="docs-inline">start</code>,
        <code class="docs-inline">center</code>,
        <code class="docs-inline">end</code>,
        <code class="docs-inline">between</code>, …).
      </p>
      <docs-example [code]="stackCode" column>
        <mk-stack gap="3">
          <div class="box">Heading</div>
          <div class="box">Body copy</div>
          <mk-stack direction="row" gap="2" justify="end">
            <button mkButton variant="ghost" tone="neutral">Cancel</button>
            <button mkButton>Save</button>
          </mk-stack>
        </mk-stack>
      </docs-example>

      <h2>Flex</h2>
      <p>
        Horizontal by default, no gap unless asked. For the cases where "one
        after another" isn't the point: a space-between header, a centred
        empty state, a wrapping cloud of tags. Children opt into
        <code class="docs-inline">mkFlexItem</code> to
        <code class="docs-inline">grow</code>, pin their size with
        <code class="docs-inline">[shrink]="0"</code>, set a
        <code class="docs-inline">basis</code>, override
        <code class="docs-inline">alignSelf</code> or change their
        <code class="docs-inline">order</code>.
      </p>
      <docs-example [code]="flexCode" column>
        <mk-stack gap="4">
          <mk-flex align="center" justify="between" gap="3">
            <strong>Orders</strong>
            <button mkButton size="sm">New order</button>
          </mk-flex>
          <mk-flex gap="2">
            <input mkInput mkFlexItem grow placeholder="Search orders…" aria-label="Search orders" />
            <button mkButton variant="outline" tone="neutral">Search</button>
          </mk-flex>
          <mk-flex wrap gap="2">
            @for (tag of tags; track tag) {
              <mk-tag tone="neutral">{{ tag }}</mk-tag>
            }
          </mk-flex>
        </mk-stack>
      </docs-example>

      <h2>Grid</h2>
      <p>
        <code class="docs-inline">columns</code> takes a count (equal tracks that
        cannot be blown out by long content) or a raw
        <code class="docs-inline">grid-template-columns</code> string like
        <code class="docs-inline">"240px 1fr"</code>. Cells span with
        <code class="docs-inline">mkGridItem</code> —
        <code class="docs-inline">colSpan</code>,
        <code class="docs-inline">rowSpan</code>,
        <code class="docs-inline">colStart</code>, or
        <code class="docs-inline">colSpan="all"</code> for a full-width row.
        <strong>Resize the window</strong>: this grid is one column on phones, two
        from <code class="docs-inline">sm</code>, four from
        <code class="docs-inline">lg</code>, and the revenue tile spans two of
        them.
      </p>
      <docs-example [code]="gridCode" column>
        <mk-grid [columns]="{ xs: 1, sm: 2, lg: 4 }" gap="3">
          <div class="box box--accent" mkGridItem [colSpan]="{ xs: 'all', lg: 2 }">Revenue · spans 2</div>
          <div class="box">Users</div>
          <div class="box">Orders</div>
          <div class="box">Churn</div>
          <div class="box">Refunds</div>
          <div class="box">Tickets</div>
        </mk-grid>
      </docs-example>

      <h3>Auto-fill by minimum width</h3>
      <p>
        Skip breakpoints altogether with
        <code class="docs-inline">minColumnWidth</code>: as many columns of at
        least that width as fit, one per row when nothing fits. Add
        <code class="docs-inline">autoFit</code> to let a short last row stretch
        instead of leaving empty tracks.
      </p>
      <docs-example [code]="autoGridCode" column>
        <mk-grid minColumnWidth="9rem" gap="3">
          @for (n of [1, 2, 3, 4, 5, 6, 7]; track n) {
            <div class="box">Card {{ n }}</div>
          }
        </mk-grid>
      </docs-example>

      <h2>Responsive values</h2>
      <p>
        Any layout input takes either a plain value or a mobile-first map keyed
        by breakpoint — <code class="docs-inline">xs</code> (base),
        <code class="docs-inline">sm</code> ≥ 640,
        <code class="docs-inline">md</code> ≥ 768,
        <code class="docs-inline">lg</code> ≥ 1024,
        <code class="docs-inline">xl</code> ≥ 1280,
        <code class="docs-inline">2xl</code> ≥ 1536 px. A key applies from its
        breakpoint up until the next key given, so
        <code class="docs-inline">{{ '{' }} xs: 'column', md: 'row' {{ '}' }}</code>
        stacks on phones and sits side by side from tablets up. Values resolve
        in JavaScript through
        <a routerLink="/core-services" fragment="breakpoints">MkBreakpointService</a>,
        so the same maps drive your own <code class="docs-inline">computed()</code>
        signals. Override the scale with
        <code class="docs-inline">MK_BREAKPOINTS</code>.
      </p>
      <docs-example [code]="responsiveCode" column>
        <p class="echo">
          Current breakpoint: <strong>{{ bp.current() }}</strong> ·
          up('md'): {{ bp.up('md')() }} · down('lg'): {{ bp.down('lg')() }}
        </p>
        <mk-stack [direction]="{ xs: 'column', md: 'row' }" [gap]="{ xs: 2, md: 6 }">
          <div class="box" mkFlexItem grow [order]="{ xs: 2, md: 1 }">Main (first from md)</div>
          <div class="box" mkFlexItem [basis]="{ md: '14rem' }" [shrink]="0" [order]="{ xs: 1, md: 2 }">Sidebar (first on phones)</div>
        </mk-stack>
      </docs-example>
    </div>
  `,
  styles: `
    .box {
      padding: var(--mk-space-3) var(--mk-space-4);
      border: var(--mk-border-width) dashed var(--mk-border-strong, var(--mk-border));
      border-radius: var(--mk-radius-md);
      background: var(--mk-surface-2);
      font-size: var(--mk-font-size-sm);
      text-align: center;
    }
    .box--accent {
      border-style: solid;
      border-color: var(--mk-primary);
      background: var(--mk-primary-subtle, var(--mk-surface-2));
    }
  `,
})
export class LayoutPage {
  protected readonly bp = inject(MkBreakpointService);
  protected readonly tags = ['angular', 'signals', 'zoneless', 'standalone', 'a11y', 'i18n', 'rtl', 'dark mode'];

  protected readonly stackCode = `<mk-stack gap="3">
  <div>Heading</div>
  <div>Body copy</div>
  <mk-stack direction="row" gap="2" justify="end">
    <button mkButton variant="ghost" tone="neutral">Cancel</button>
    <button mkButton>Save</button>
  </mk-stack>
</mk-stack>`;

  protected readonly flexCode = `<mk-flex align="center" justify="between" gap="3">
  <strong>Orders</strong>
  <button mkButton size="sm">New order</button>
</mk-flex>

<mk-flex gap="2">
  <input mkInput mkFlexItem grow placeholder="Search orders…" />
  <button mkButton variant="outline" tone="neutral">Search</button>
</mk-flex>

<mk-flex wrap gap="2">
  @for (tag of tags; track tag) { <mk-tag>{{ tag }}</mk-tag> }
</mk-flex>`;

  protected readonly gridCode = `<mk-grid [columns]="{ xs: 1, sm: 2, lg: 4 }" gap="3">
  <mk-card mkGridItem [colSpan]="{ xs: 'all', lg: 2 }">Revenue</mk-card>
  <mk-card>Users</mk-card>
  …
</mk-grid>

<!-- explicit tracks -->
<mk-grid columns="240px 1fr" gap="6">
  <aside>…</aside>
  <main>…</main>
</mk-grid>`;

  protected readonly autoGridCode = `<mk-grid minColumnWidth="9rem" gap="3">
  @for (card of cards; track card.id) { <mk-card>…</mk-card> }
</mk-grid>

<!-- stretch a short last row -->
<mk-grid minColumnWidth="16rem" autoFit gap="4">…</mk-grid>`;

  protected readonly responsiveCode = `<mk-stack [direction]="{ xs: 'column', md: 'row' }" [gap]="{ xs: 2, md: 6 }">
  <main mkFlexItem grow [order]="{ xs: 2, md: 1 }">…</main>
  <aside mkFlexItem [basis]="{ md: '14rem' }" [shrink]="0" [order]="{ xs: 1, md: 2 }">…</aside>
</mk-stack>

// The same maps in code:
private readonly bp = inject(MkBreakpointService);
readonly columns = computed(() => this.bp.resolve({ xs: 1, md: 2, xl: 4 }));
readonly compact = this.bp.down('md');   // Signal<boolean>

// Your own scale:
{ provide: MK_BREAKPOINTS, useValue: { sm: 600, md: 900, lg: 1200, xl: 1536, '2xl': 1920 } }`;
}
