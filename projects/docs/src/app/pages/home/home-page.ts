import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MkAvatar,
  MkAvatarGroup,
  MkBadge,
  MkButton,
  MkButtonToggle,
  MkButtonToggleGroup,
  MkCard,
  MkCheckbox,
  MkChip,
  MkDatePicker,
  MkDonutChart,
  MkLineChart,
  MkOtp,
  MkPagination,
  MkProgressBar,
  MkProgressRing,
  MkRating,
  MkSkeleton,
  MkSlider,
  MkSparkline,
  MkSpinner,
  MkStatCard,
  MkStep,
  MkStepper,
  MkSwitch,
  MkTable,
  MkTag,
  MkTooltip,
  MkThemeService,
  MkToastService,
  type MkChartSeries,
  type MkChartSlice,
  type MkTableColumn,
} from '@mk-kit/ui';
import { version as uiVersion } from '../../../../../mk-kit/package.json';
import { SITE } from '../../site.config';
import { openInStackBlitz, starterApp } from '../../shared/stackblitz';

interface Feature {
  tag: string;
  title: string;
  body: string;
}
interface Group {
  title: string;
  count: number;
  blurb: string;
}
interface BrandPreset {
  name: string;
  color: string;
}
interface Order {
  id: string;
  customer: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
}
interface Tier {
  name: string;
  price: string;
  per: string;
  blurb: string;
  features: string[];
  cta: string;
  /** Route for a plain link CTA. */
  link?: string;
  /** Opens the AZ Widgets contact form tagged with this topic instead. */
  form?: 'waitlist' | 'team';
  /** Stripe plan — when its Payment Link is configured the CTA becomes a Buy button. */
  buy?: 'developer' | 'team';
  highlight?: boolean;
}
interface Faq {
  q: string;
  a: string;
}
interface Mapping {
  from: string;
  to: string;
  note?: string;
}

/**
 * Public landing page. Rendered full-bleed (the docs sidebar is hidden on this
 * route — see `App.isHome`).
 *
 * The page is its own demo: every illustration is a live library component,
 * and the brand swatches in the hero re-theme the whole page by rewriting the
 * `--mk-primary` token family on the host element — the exact mechanism a
 * consumer uses, shown rather than described.
 */
@Component({
  selector: 'docs-home-page',
  imports: [
    RouterLink,
    MkAvatar,
    MkAvatarGroup,
    MkBadge,
    MkButton,
    MkButtonToggle,
    MkButtonToggleGroup,
    MkCard,
    MkCheckbox,
    MkChip,
    MkDatePicker,
    MkDonutChart,
    MkLineChart,
    MkOtp,
    MkPagination,
    MkProgressBar,
    MkProgressRing,
    MkRating,
    MkSkeleton,
    MkSlider,
    MkSparkline,
    MkSpinner,
    MkStatCard,
    MkStep,
    MkStepper,
    MkSwitch,
    MkTable,
    MkTag,
    MkTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <az-form> hosts are AZ Widgets custom elements.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: {
    '[style.--mk-primary]': 'brand().color',
    '[style.--mk-primary-hover]': 'derived().hover',
    '[style.--mk-primary-active]': 'derived().active',
    '[style.--mk-primary-subtle]': 'derived().subtle',
    '[style.--mk-primary-subtle-hover]': 'derived().subtleHover',
    '[style.--mk-primary-subtle-text]': 'derived().subtleText',
    '[style.--mk-chart-1]': 'brand().color',
  },
  template: `
    <div class="home">
      <!-- ───────────────────────── Hero ───────────────────────── -->
      <section class="hero">
        <div class="hero__glow" aria-hidden="true"></div>
        <div class="wrap hero__grid">
          <div class="hero__copy">
            <p class="eyebrow">v{{ uiVersion }} · Angular 22 · MIT</p>
            <h1 class="hero__title">
              Ship the admin.<br />
              <span class="hero__accent">Skip the component library.</span>
            </h1>
            <p class="hero__lead">
              {{ total }}+ standalone Angular components for dashboards,
              back-offices and internal tools. Data tables, charts, pickers,
              editors, kanban, overlays — themed through CSS variables, dark
              mode included, accessible by default.
            </p>
            <div class="hero__cta">
              <a mkButton tone="primary" size="lg" routerLink="/getting-started">
                Get started
              </a>
              <a mkButton variant="outline" tone="neutral" size="lg" routerLink="/examples/dashboard">
                Open the demo dashboard
              </a>
              <button mkButton variant="ghost" tone="neutral" size="lg" type="button" (click)="openStarter()">
                Try it in StackBlitz ↗
              </button>
            </div>
            <div class="install">
              <code class="install__cmd" aria-label="Install command">
                <span class="install__prompt" aria-hidden="true">$</span>ng add &#64;mk-kit/ui
              </code>
              <button
                mkButton
                variant="ghost"
                tone="neutral"
                size="sm"
                (click)="copyInstall()"
                aria-label="Copy install command"
              >
                {{ copied() ? 'Copied ✓' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Live demo assembled from real components -->
          <div class="hero__demo">
            <mk-card variant="elevated" class="demo">
              <div class="demo__head">
                <div>
                  <p class="demo__title">Revenue</p>
                  <p class="demo__sub">Last 6 months</p>
                </div>
                <div class="demo__controls">
                  <div class="swatches" role="radiogroup" aria-label="Brand colour — re-themes this page">
                    @for (p of presets; track p.name) {
                      <button
                        type="button"
                        class="swatch"
                        role="radio"
                        [attr.aria-checked]="brand().name === p.name"
                        [attr.aria-label]="p.name"
                        [class.swatch--active]="brand().name === p.name"
                        [style.background]="p.color"
                        (click)="brand.set(p)"
                      ></button>
                    }
                  </div>
                  <mk-switch
                    size="sm"
                    aria-label="Dark mode"
                    [checked]="theme.isDark()"
                    (checkedChange)="setDark($event)"
                  />
                </div>
              </div>

              <div class="demo__kpis">
                <mk-stat-card label="MRR" value="$48k" delta="+12.4%" deltaTrend="up" />
                <mk-stat-card label="Active" value="8,642" delta="+3.1%" deltaTrend="up" />
                <mk-stat-card label="Churn" value="1.9%" delta="-0.4%" deltaTrend="down" />
              </div>

              <div class="demo__charts">
                <mk-line-chart
                  [categories]="months"
                  [series]="revenue"
                  area
                  [height]="150"
                  [showLegend]="false"
                  label="Revenue over the last six months"
                />
                <mk-donut-chart
                  [slices]="plans"
                  [size]="150"
                  [thickness]="24"
                  [showLegend]="false"
                  centerLabel="64%"
                  centerSublabel="Pro"
                  label="Revenue by plan"
                />
              </div>

              <mk-table [columns]="columns" [data]="orders" density="compact" [stackAt]="480" />
            </mk-card>

            <!-- The token that just changed — the whole thesis in one line -->
            <p class="tokenline" aria-live="polite">
              <code>--mk-primary: {{ brand().color }};</code>
              <span>← pick a swatch. The whole page re-themes; nothing rebuilds.</span>
            </p>
          </div>
        </div>
      </section>

      <!-- ───────────────────────── Component wall ───────────────────────── -->
      <section class="wall" aria-labelledby="wall-title">
        <div class="wrap">
          <div class="section__head">
            <p class="eyebrow">Live, not screenshots</p>
            <h2 class="section__title" id="wall-title">A sample of the {{ total }}. All of it follows the swatch above.</h2>
          </div>
          <div class="wall__grid">
            <div class="tile"><span class="tile__name">mk-badge · mk-tag</span>
              <div class="tile__row">
                <mk-badge tone="success" variant="soft">Active</mk-badge>
                <mk-badge tone="warning" variant="soft">Pending</mk-badge>
                <mk-badge tone="danger" variant="soft">Failed</mk-badge>
                <mk-tag tone="primary">v{{ uiVersion }}</mk-tag>
              </div>
            </div>
            <div class="tile"><span class="tile__name">mk-chip</span>
              <div class="tile__row">
                <mk-chip tone="primary" removable>Angular</mk-chip>
                <mk-chip removable>Signals</mk-chip>
                <mk-chip selectable [selected]="true">Zoneless</mk-chip>
              </div>
            </div>
            <div class="tile"><span class="tile__name">mk-avatar · mk-avatar-group</span>
              <div class="tile__row">
                <mk-avatar name="Ada Lovelace" status="online" />
                <mk-avatar name="Grace Hopper" status="away" shape="rounded" />
                <mk-avatar-group [max]="2" size="sm">
                  <mk-avatar name="Linus Torvalds" />
                  <mk-avatar name="Margaret Hamilton" />
                  <mk-avatar name="Ken Thompson" />
                  <mk-avatar name="Barbara Liskov" />
                </mk-avatar-group>
              </div>
            </div>
            <div class="tile"><span class="tile__name">mk-progress-ring</span>
              <div class="tile__row">
                <mk-progress-ring [value]="72" [size]="56" showLabel />
                <mk-progress-ring [value]="38" [size]="56" tone="warning" showLabel />
                <mk-progress-ring indeterminate [size]="56" />
              </div>
            </div>
            <div class="tile"><span class="tile__name">mk-rating</span>
              <mk-rating [(value)]="rating" />
            </div>
            <div class="tile"><span class="tile__name">mk-slider</span>
              <mk-slider [(value)]="slider" aria-label="Volume" />
              <span class="tile__value">{{ slider() }}</span>
            </div>
            <div class="tile"><span class="tile__name">mk-switch · mk-checkbox</span>
              <div class="tile__row">
                <mk-switch [checked]="true" aria-label="Notifications" />
                <mk-checkbox [checked]="true">Email me</mk-checkbox>
                <mk-checkbox [indeterminate]="true">Some</mk-checkbox>
              </div>
            </div>
            <div class="tile"><span class="tile__name">mk-button-toggle-group</span>
              <mk-button-toggle-group [(value)]="range" aria-label="Range" size="sm">
                <mk-button-toggle value="day">Day</mk-button-toggle>
                <mk-button-toggle value="week">Week</mk-button-toggle>
                <mk-button-toggle value="month">Month</mk-button-toggle>
              </mk-button-toggle-group>
            </div>
            <div class="tile"><span class="tile__name">mk-otp</span>
              <mk-otp [length]="4" size="sm" [value]="'2026'" />
            </div>
            <div class="tile tile--wide"><span class="tile__name">mk-pagination</span>
              <mk-pagination [total]="165" [pageSize]="12" [(page)]="page" />
            </div>
            <div class="tile tile--wide"><span class="tile__name">mk-stepper</span>
              <mk-stepper [selectedIndex]="1">
                <mk-step label="Account" [completed]="true" />
                <mk-step label="Workspace" />
                <mk-step label="Invite team" optional />
              </mk-stepper>
            </div>
            <div class="tile"><span class="tile__name">mk-progress-bar</span>
              <mk-progress-bar [value]="64" showValue label="Import" />
              <mk-progress-bar indeterminate size="sm" tone="info" />
            </div>
            <div class="tile"><span class="tile__name">mk-skeleton</span>
              <mk-skeleton shape="text" [lines]="3" />
            </div>
            <div class="tile"><span class="tile__name">mk-sparkline</span>
              <div class="tile__row">
                <mk-sparkline [data]="spark" [width]="110" [height]="36" showDot />
                <mk-sparkline [data]="spark" type="bar" [width]="110" [height]="36" color="var(--mk-chart-2)" />
              </div>
            </div>
            <div class="tile"><span class="tile__name">mk-date-picker</span>
              <mk-date-picker [(value)]="date" size="sm" clearable />
            </div>
            <div class="tile tile--wide"><span class="tile__name">button[mkButton]</span>
              <div class="tile__row">
                <button mkButton tone="primary" size="sm">Save</button>
                <button mkButton variant="soft" tone="primary" size="sm">Preview</button>
                <button mkButton variant="outline" tone="neutral" size="sm">Cancel</button>
                <button mkButton variant="ghost" tone="danger" size="sm">Delete</button>
              </div>
            </div>
            <div class="tile"><span class="tile__name">mk-spinner · [mkTooltip]</span>
              <div class="tile__row">
                <mk-spinner size="sm" />
                <mk-spinner size="md" tone="success" />
                <button mkButton variant="outline" tone="neutral" size="sm" mkTooltip="Tooltips are keyboard-reachable">Hover me</button>
              </div>
            </div>
          </div>
          <p class="section__foot">
            <a mkButton variant="outline" tone="neutral" routerLink="/components-index">
              Browse the full index →
            </a>
          </p>
        </div>
      </section>

      <!-- ───────────────────────── Index ───────────────────────── -->
      <section class="wrap section" aria-labelledby="index-title">
        <div class="section__head">
          <p class="eyebrow">What's inside</p>
          <h2 class="section__title" id="index-title">Eight groups, eight entry points, one theme.</h2>
          <p class="section__lead">
            Import <code>&#64;mk-kit/ui/table</code> or <code>&#64;mk-kit/ui/charts</code>
            and ship only what you use. No NgModules, no runtime dependency beyond
            Angular itself.
          </p>
        </div>
        <ol class="index">
          @for (g of groups; track g.title) {
            <li>
              <a class="index__row" routerLink="/components-index">
                <span class="index__count">{{ g.count }}</span>
                <span class="index__title">{{ g.title }}</span>
                <span class="index__blurb">{{ g.blurb }}</span>
              </a>
            </li>
          }
        </ol>
      </section>

      <!-- ───────────────────────── Features ───────────────────────── -->
      <section class="band" aria-labelledby="features-title">
        <div class="wrap section">
          <div class="section__head">
            <p class="eyebrow">Built for Angular 22, not migrated to it</p>
            <h2 class="section__title" id="features-title">The parts you'd otherwise write yourself.</h2>
          </div>
          <div class="features">
            @for (f of features; track f.title) {
              <div class="feature">
                <code class="feature__tag">{{ f.tag }}</code>
                <h3 class="feature__title">{{ f.title }}</h3>
                <p class="feature__body">{{ f.body }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ───────────────────────── Code samples ───────────────────────── -->
      <section class="wrap section samples" aria-label="Code samples">
        <div class="sample">
          <p class="eyebrow">Data table</p>
          <h2 class="section__title">Nine lines, no grid licence.</h2>
          <p class="section__lead">
            Columns are plain objects, rows are your data. Sorting, selection,
            expansion, grouping, sticky headers, column resize and reorder,
            inline edit and mobile stacking are flags. Server-side data plugs in
            through <code>MkTableDataSource</code>.
          </p>
          <pre class="code" tabindex="0"><code>{{ tableSnippet }}</code></pre>
          <a mkButton variant="soft" tone="primary" routerLink="/components/table">Table docs →</a>
        </div>
        <div class="sample">
          <p class="eyebrow">Theming</p>
          <h2 class="section__title">Your brand in one file.</h2>
          <p class="section__lead">
            Every colour, radius, shadow, font and spacing step is a
            <code>--mk-*</code> custom property. Override a handful, get a
            consistent light and dark theme across all {{ total }} components —
            globally, per subtree, at runtime.
          </p>
          <pre class="code" tabindex="0"><code>{{ themeSnippet }}</code></pre>
          <a mkButton variant="soft" tone="primary" routerLink="/theme-builder">Open the theme builder →</a>
        </div>
      </section>

      <!-- ───────────────────────── Coming from PrimeNG ───────────────────────── -->
      <section class="band" aria-labelledby="migrate-title">
        <div class="wrap section migrate">
          <div>
            <p class="eyebrow">Coming from PrimeNG?</p>
            <h2 class="section__title" id="migrate-title">Same jobs, familiar names, MIT for good.</h2>
            <p class="section__lead">
              PrimeNG 22 and later ship under a commercial licence for most
              companies. mk-kit covers the same admin surface — including the
              parts PrimeUI sells separately: charts, a text editor, a scheduler
              and a task board — and stays MIT.
            </p>
            <div class="migrate__actions">
              <a mkButton tone="primary" routerLink="/blog/switching-from-primeng">
                Read: switching from PrimeNG →
              </a>
              <a mkButton variant="outline" tone="neutral" routerLink="/blog/switching-from-angular-material">
                …or from Angular Material
              </a>
            </div>
            <p class="migrate__note">
              A schematic rewrites the imports, selectors and inputs that map
              1:1 and leaves a note everywhere else:
              <code>ng g &#64;mk-kit/ui:migrate-primeng --dry-run</code>
              <a routerLink="/components-index">Full component index →</a>
            </p>
          </div>
          <div class="mapwrap">
            <table class="map">
              <thead>
                <tr><th scope="col">PrimeNG</th><th scope="col">mk-kit</th></tr>
              </thead>
              <tbody>
                @for (m of mappings; track m.from) {
                  <tr>
                    <td><code>{{ m.from }}</code></td>
                    <td><code>{{ m.to }}</code>@if (m.note) { <span class="map__note">{{ m.note }}</span> }</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ───────────────────────── Pricing ───────────────────────── -->
      @if (tiers.length) {
        <section class="wrap section" id="pricing" aria-labelledby="pricing-title">
          <div class="section__head">
            <p class="eyebrow">Pricing</p>
            <h2 class="section__title" id="pricing-title">Free core. Pay for the shortcuts.</h2>
            <p class="section__lead">
              The library is MIT and always will be. Pro adds finished screens,
              premium widgets and a human on the other end of your issues.
              <a routerLink="/pro">See what's in Pro →</a>
            </p>
          </div>
          <div class="tiers">
            @for (t of tiers; track t.name) {
              <mk-card [variant]="t.highlight ? 'elevated' : 'outlined'" class="tier"
                       [class.tier--highlight]="t.highlight">
                <div class="tier__head">
                  <h3 class="tier__name">{{ t.name }}</h3>
                  @if (t.highlight) {
                    <mk-tag tone="primary">{{ buyLink(t) ? 'Available now' : 'Waitlist open' }}</mk-tag>
                  }
                </div>
                <p class="tier__price">
                  {{ t.price }}<span class="tier__per">{{ t.per }}</span>
                </p>
                <p class="tier__blurb">{{ t.blurb }}</p>
                <ul class="tier__features">
                  @for (f of t.features; track f) {
                    <li>{{ f }}</li>
                  }
                </ul>
                @if (buyLink(t); as href) {
                  <a mkButton [tone]="t.highlight ? 'primary' : 'neutral'"
                     [variant]="t.highlight ? 'solid' : 'outline'" fullWidth
                     [href]="href" rel="noopener">
                    Buy {{ t.name }} — {{ t.price }}{{ t.per }}
                  </a>
                } @else if (t.form) {
                  <button mkButton type="button" [tone]="t.highlight ? 'primary' : 'neutral'"
                          [variant]="t.highlight ? 'solid' : 'outline'" fullWidth
                          (click)="openForm(t.form)">
                    {{ t.cta }}
                  </button>
                } @else {
                  <a mkButton [tone]="t.highlight ? 'primary' : 'neutral'"
                     [variant]="t.highlight ? 'solid' : 'outline'" fullWidth
                     [routerLink]="t.link">
                    {{ t.cta }}
                  </a>
                }
              </mk-card>
            }
          </div>

          <!-- AZ Widgets contact forms, opened from the tier buttons above. The
               hosts are kept out of flow; the modal itself is position: fixed
               inside the widget's shadow root, so it still renders. -->
          <div class="az-hosts" aria-hidden="true">
            <az-form #waitlistForm [attr.tenant]="site.azTenant" mode="modal" locale="en"
                     topic="Pro waitlist" headline="Join the Pro waitlist"
                     subheadline="Launch price for the first 100 seats. One email when it opens, nothing else."
                     [attr.theme]="theme.resolvedTheme()"></az-form>
            <az-form #teamForm [attr.tenant]="site.azTenant" mode="modal" locale="en"
                     topic="Team licence" headline="Talk to us about a Team licence"
                     subheadline="Tell us about your team and how you'd like to be invoiced."
                     [attr.theme]="theme.resolvedTheme()"></az-form>
          </div>
        </section>
      }

      <!-- ───────────────────────── Creator ───────────────────────── -->
      <section class="wrap section" aria-labelledby="creator-title">
        <div class="creator">
          <div class="creator__photo">
            <img
              src="founder.webp"
              alt="Mateusz Kornaś, creator of mk-kit"
              width="592"
              height="432"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="creator__body">
            <p class="eyebrow">From the creator</p>
            <h2 class="section__title" id="creator-title">Hi, I'm Mateusz.</h2>
            <p class="creator__text">
              I build admin panels and internal tools for a living, and every
              project used to start the same way: a week of wiring up the same
              tables, pickers and dialogs before the real work could begin.
              mk-kit is that week, done once and properly — accessible,
              themeable, tested — so the next project starts on day one.
            </p>
            <p class="creator__text">
              The library is MIT and stays that way. Pro adds the finished
              screens and premium widgets I would otherwise rebuild for every
              client; the open core is what you would get from me anyway.
            </p>
            <ul class="creator__points">
              <li>I build and maintain mk-kit myself — issues and feature requests land in my inbox.</li>
              <li>Every component ships with tests, an accessibility pass and docs before it is released.</li>
              <li>I use it in my own products every day — the Gastronaut admin runs on it.</li>
            </ul>
            <div class="creator__footer">
              <div class="creator__sign">
                <strong>Mateusz Kornaś</strong>
                <span>Creator of mk-kit</span>
              </div>
              <a mkButton variant="outline" tone="neutral" href="https://mateuszkornas.com" target="_blank" rel="noopener">
                See what else I make ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ───────────────────────── FAQ ───────────────────────── -->
      <section class="band" aria-labelledby="faq-title">
        <div class="wrap section faqwrap">
          <div class="section__head">
            <p class="eyebrow">Questions</p>
            <h2 class="section__title" id="faq-title">Before you install.</h2>
          </div>
          <div class="faq">
            @for (f of faqs; track f.q) {
              <details class="faq__item">
                <summary class="faq__q">{{ f.q }}</summary>
                <p class="faq__a">{{ f.a }}</p>
              </details>
            }
          </div>
        </div>
      </section>

      <!-- ───────────────────────── Final CTA ───────────────────────── -->
      <section class="wrap section final">
        <h2 class="final__title">Your next admin panel is one <code>ng add</code> away.</h2>
        <div class="hero__cta hero__cta--center">
          <a mkButton tone="primary" size="lg" routerLink="/getting-started">Get started</a>
          <a mkButton variant="ghost" tone="neutral" size="lg"
             href="https://github.com/mk-kit/mk-kit" target="_blank" rel="noopener">
            GitHub ↗
          </a>
        </div>
      </section>

      <footer class="footer">
        <div class="wrap footer__row">
          <span>© 2026 Mateusz Kornaś · MIT License</span>
          <nav class="footer__links" aria-label="Footer">
            <a routerLink="/introduction">Docs</a>
            <a routerLink="/components-index">Components</a>
            <a routerLink="/changelog">Changelog</a>
            <a href="https://github.com/mk-kit/mk-kit" target="_blank" rel="noopener">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .home {
        --home-max: 1160px;
        color: var(--mk-text);
      }
      .wrap {
        box-sizing: border-box;
        width: 100%;
        max-width: var(--home-max);
        margin: 0 auto;
        padding-inline: var(--mk-space-6);
      }
      .section {
        padding-block: var(--mk-space-16);
      }
      .band {
        background: var(--mk-surface);
        border-block: 1px solid var(--mk-border-subtle);
      }
      code {
        font-family: var(--mk-font-mono);
        font-size: 0.9em;
        background: var(--mk-surface-2);
        border-radius: var(--mk-radius-sm);
        padding: 0.05em 0.35em;
      }
      .eyebrow {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--mk-primary);
        margin: 0 0 var(--mk-space-3);
      }
      .section__head {
        max-width: 66ch;
        margin-bottom: var(--mk-space-10);
      }
      .section__title {
        font-size: clamp(1.6rem, 3vw, 2.25rem);
        line-height: 1.12;
        letter-spacing: var(--mk-letter-spacing-tight);
        font-weight: var(--mk-font-weight-bold);
        text-wrap: balance;
        margin: 0 0 var(--mk-space-4);
      }
      .section__lead {
        font-size: var(--mk-font-size-lg);
        color: var(--mk-text-muted);
        line-height: 1.6;
        margin: 0;
      }
      .section__foot {
        margin: var(--mk-space-8) 0 0;
      }

      /* Hero ------------------------------------------------------------- */
      .hero {
        position: relative;
        overflow: hidden;
        isolation: isolate;
      }
      .hero__glow {
        position: absolute;
        inset: -30% -10% auto auto;
        width: 70%;
        aspect-ratio: 1;
        border-radius: 50%;
        background: radial-gradient(
          closest-side,
          color-mix(in srgb, var(--mk-primary) 22%, transparent),
          transparent 70%
        );
        z-index: -1;
        pointer-events: none;
      }
      .hero__grid {
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
        gap: var(--mk-space-12);
        align-items: center;
        padding-block: var(--mk-space-16) var(--mk-space-14);
      }
      .hero__copy {
        animation: rise 0.6s var(--mk-ease-standard) both;
      }
      .hero__demo {
        min-width: 0;
        animation: rise 0.6s 0.12s var(--mk-ease-standard) both;
      }
      @keyframes rise {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero__copy,
        .hero__demo {
          animation: none;
        }
      }
      .hero__title {
        font-size: clamp(2.25rem, 4.6vw, 3.6rem);
        line-height: 1.02;
        letter-spacing: -0.03em;
        font-weight: var(--mk-font-weight-bold);
        text-wrap: balance;
        margin: 0 0 var(--mk-space-5);
      }
      .hero__accent {
        color: var(--mk-primary);
        transition: color var(--mk-duration-normal) var(--mk-ease-standard);
      }
      .hero__lead {
        font-size: var(--mk-font-size-lg);
        line-height: 1.6;
        color: var(--mk-text-muted);
        margin: 0 0 var(--mk-space-6);
        max-width: 50ch;
      }
      .hero__cta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-3);
      }
      .hero__cta--center {
        justify-content: center;
      }
      .install {
        display: inline-flex;
        align-items: center;
        gap: var(--mk-space-2);
        margin-top: var(--mk-space-6);
        padding: var(--mk-space-1) var(--mk-space-1) var(--mk-space-1) var(--mk-space-4);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
      }
      .install__cmd {
        background: none;
        padding: 0;
        font-size: var(--mk-font-size-sm);
      }
      .install__prompt {
        color: var(--mk-text-subtle);
        margin-right: 0.5em;
      }

      /* Demo card */
      .demo {
        display: block;
        padding: var(--mk-space-5);
      }
      .demo__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--mk-space-4);
        margin-bottom: var(--mk-space-4);
      }
      .demo__title {
        margin: 0;
        font-weight: var(--mk-font-weight-semibold);
      }
      .demo__sub {
        margin: 0;
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
      }
      .demo__controls {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
      }
      .swatches {
        display: flex;
        gap: var(--mk-space-1);
      }
      .swatch {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid transparent;
        outline-offset: 2px;
        cursor: pointer;
        box-shadow: inset 0 0 0 2px var(--mk-surface);
        padding: 0;
        transition: transform var(--mk-duration-fast) var(--mk-ease-standard);
      }
      .swatch:hover {
        transform: scale(1.12);
      }
      .swatch--active {
        border-color: var(--mk-text);
      }
      .swatch:focus-visible {
        outline: 2px solid var(--mk-focus-ring, var(--mk-primary));
      }
      .demo__kpis {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--mk-space-3);
        margin-bottom: var(--mk-space-4);
      }
      .demo__charts {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: var(--mk-space-4);
        align-items: center;
        margin-bottom: var(--mk-space-4);
      }
      .tokenline {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: var(--mk-space-2) var(--mk-space-3);
        margin: var(--mk-space-3) 0 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .tokenline code {
        color: var(--mk-primary-subtle-text);
        background: var(--mk-primary-subtle);
      }

      /* Component wall --------------------------------------------------- */
      .wall {
        background: var(--mk-surface);
        border-block: 1px solid var(--mk-border-subtle);
        padding-block: var(--mk-space-16);
      }
      .wall__grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-auto-flow: dense;
        gap: var(--mk-space-3);
      }
      .tile {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--mk-space-3);
        min-height: 112px;
        padding: var(--mk-space-4);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-bg);
      }
      .tile--wide {
        grid-column: span 2;
      }
      .tile__name {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-subtle);
      }
      .tile__row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-2);
      }
      .tile__value {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
        font-variant-numeric: tabular-nums;
      }

      /* Index ------------------------------------------------------------ */
      .index {
        list-style: none;
        margin: 0;
        padding: 0;
        border-top: 1px solid var(--mk-border);
      }
      .index__row {
        display: grid;
        grid-template-columns: 4rem 15rem minmax(0, 1fr);
        gap: var(--mk-space-4);
        align-items: baseline;
        padding: var(--mk-space-4) var(--mk-space-2);
        border-bottom: 1px solid var(--mk-border);
        text-decoration: none;
        color: inherit;
        transition: background var(--mk-duration-fast) var(--mk-ease-standard);
      }
      .index__row:hover {
        background: var(--mk-surface);
      }
      .index__row:focus-visible {
        outline: 2px solid var(--mk-focus-ring, var(--mk-primary));
        outline-offset: -2px;
      }
      .index__count {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xl);
        font-weight: var(--mk-font-weight-bold);
        color: var(--mk-primary);
        font-variant-numeric: tabular-nums;
      }
      .index__title {
        font-weight: var(--mk-font-weight-semibold);
      }
      .index__blurb {
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-sm);
      }

      /* Features --------------------------------------------------------- */
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--mk-space-8) var(--mk-space-10);
      }
      .feature__tag {
        display: inline-block;
        color: var(--mk-primary-subtle-text);
        background: var(--mk-primary-subtle);
        margin-bottom: var(--mk-space-3);
      }
      .feature__title {
        margin: 0 0 var(--mk-space-2);
        font-size: var(--mk-font-size-md);
        font-weight: var(--mk-font-weight-semibold);
      }
      .feature__body {
        margin: 0;
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-sm);
        line-height: 1.65;
      }

      /* Samples ---------------------------------------------------------- */
      .samples {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--mk-space-12);
      }
      .sample .section__title {
        margin-bottom: var(--mk-space-3);
      }
      .sample .section__lead {
        font-size: var(--mk-font-size-md);
        margin-bottom: var(--mk-space-5);
      }
      .code {
        margin: 0 0 var(--mk-space-5);
        padding: var(--mk-space-5);
        border-radius: var(--mk-radius-lg);
        border: 1px solid var(--mk-border);
        background: var(--mk-surface-2);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: 1.6;
        overflow-x: auto;
      }
      .code code {
        background: none;
        padding: 0;
        font-size: inherit;
      }

      /* Migration -------------------------------------------------------- */
      .migrate__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
      }
      .migrate__note {
        margin-top: var(--mk-space-4);
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-sm);
      }
      .migrate__note a {
        display: block;
        margin-top: var(--mk-space-2);
        color: var(--mk-primary);
      }
      .migrate__note code {
        font-family: var(--mk-font-mono);
        color: var(--mk-text);
      }
      .migrate {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--mk-space-12);
        align-items: center;
      }
      .migrate .section__title {
        margin-bottom: var(--mk-space-3);
      }
      .migrate .section__lead {
        margin-bottom: var(--mk-space-5);
      }
      .mapwrap {
        overflow-x: auto;
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-bg);
      }
      .map {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mk-font-size-sm);
      }
      .map th,
      .map td {
        text-align: left;
        padding: var(--mk-space-2) var(--mk-space-4);
        border-bottom: 1px solid var(--mk-border-subtle);
      }
      .map th {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mk-text-subtle);
        font-weight: var(--mk-font-weight-semibold);
      }
      .map tr:last-child td {
        border-bottom: 0;
      }
      .map__note {
        margin-left: var(--mk-space-2);
        color: var(--mk-text-subtle);
        font-size: var(--mk-font-size-xs);
      }

      /* Pricing ---------------------------------------------------------- */
      .tiers {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: var(--mk-space-5);
        align-items: stretch;
      }
      .tier {
        display: flex;
        flex-direction: column;
        padding: var(--mk-space-6);
      }
      .tier--highlight {
        border: 1px solid var(--mk-primary);
      }
      .tier__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mk-space-2);
      }
      .tier__name {
        margin: 0;
        font-size: var(--mk-font-size-lg);
        font-weight: var(--mk-font-weight-semibold);
      }
      .tier__price {
        margin: var(--mk-space-4) 0 var(--mk-space-2);
        font-size: var(--mk-font-size-3xl);
        font-weight: var(--mk-font-weight-bold);
        letter-spacing: var(--mk-letter-spacing-tight);
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .tier__per {
        margin-left: 0.3em;
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-regular, 400);
        color: var(--mk-text-muted);
        letter-spacing: normal;
      }
      .tier__blurb {
        margin: 0 0 var(--mk-space-4);
        color: var(--mk-text-muted);
        font-size: var(--mk-font-size-sm);
      }
      .tier__features {
        list-style: none;
        margin: 0 0 var(--mk-space-6);
        padding: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
      }
      .tier__features li::before {
        content: '✓';
        color: var(--mk-success);
        margin-right: 0.5em;
        font-weight: var(--mk-font-weight-bold);
      }

      /* Out-of-flow hosts for the AZ contact forms (fixed modals escape). */
      .az-hosts {
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
      }

      /* Creator ---------------------------------------------------------- */
      .creator {
        display: grid;
        grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
        overflow: hidden;
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
        box-shadow: var(--mk-shadow-sm, none);
      }
      .creator__photo {
        position: relative;
        min-height: 100%;
        background: var(--mk-surface-2);
      }
      .creator__photo img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .creator__body {
        padding: var(--mk-space-10) var(--mk-space-10);
      }
      .creator__body .section__title {
        margin-bottom: var(--mk-space-4);
      }
      .creator__text {
        margin: 0 0 var(--mk-space-4);
        color: var(--mk-text-muted);
        line-height: 1.65;
      }
      .creator__points {
        list-style: none;
        margin: var(--mk-space-5) 0 var(--mk-space-6);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
        line-height: 1.55;
      }
      .creator__points li::before {
        content: '✓';
        color: var(--mk-success);
        font-weight: var(--mk-font-weight-bold);
        margin-right: 0.5em;
      }
      .creator__footer {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--mk-space-4);
        padding-top: var(--mk-space-5);
        border-top: 1px solid var(--mk-border-subtle);
      }
      .creator__sign {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }
      .creator__sign span {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }

      /* FAQ -------------------------------------------------------------- */
      .faqwrap .section__head {
        margin-bottom: var(--mk-space-6);
      }
      .faq {
        max-width: 72ch;
      }
      .faq__item {
        border-top: 1px solid var(--mk-border);
        padding: var(--mk-space-4) 0;
      }
      .faq__item:last-child {
        border-bottom: 1px solid var(--mk-border);
      }
      .faq__q {
        cursor: pointer;
        font-weight: var(--mk-font-weight-semibold);
        list-style: none;
        display: flex;
        justify-content: space-between;
        gap: var(--mk-space-4);
      }
      .faq__q::-webkit-details-marker {
        display: none;
      }
      .faq__q::after {
        content: '+';
        font-family: var(--mk-font-mono);
        color: var(--mk-text-subtle);
        font-weight: var(--mk-font-weight-regular, 400);
      }
      .faq__item[open] .faq__q::after {
        content: '−';
      }
      .faq__q:focus-visible {
        outline: 2px solid var(--mk-focus-ring, var(--mk-primary));
        outline-offset: 4px;
        border-radius: var(--mk-radius-sm);
      }
      .faq__a {
        margin: var(--mk-space-3) 0 0;
        color: var(--mk-text-muted);
        line-height: 1.7;
      }

      /* Final + footer --------------------------------------------------- */
      .final {
        text-align: center;
      }
      .final__title {
        font-size: clamp(1.5rem, 3vw, 2.25rem);
        letter-spacing: var(--mk-letter-spacing-tight);
        font-weight: var(--mk-font-weight-bold);
        text-wrap: balance;
        margin: 0 0 var(--mk-space-6);
      }
      .footer {
        border-top: 1px solid var(--mk-border-subtle);
        background: var(--mk-surface);
      }
      .footer__row {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: var(--mk-space-4);
        padding-block: var(--mk-space-6);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .footer__links {
        display: flex;
        gap: var(--mk-space-4);
      }
      .footer__links a {
        color: inherit;
      }

      /* Responsive ------------------------------------------------------- */
      @media (max-width: 960px) {
        .hero__grid,
        .samples,
        .migrate {
          grid-template-columns: minmax(0, 1fr);
          gap: var(--mk-space-10);
        }
        .hero__grid {
          padding-block: var(--mk-space-10);
        }
        .section,
        .wall {
          padding-block: var(--mk-space-12);
        }
        .index__row {
          grid-template-columns: 3rem minmax(0, 1fr);
        }
        .creator {
          grid-template-columns: minmax(0, 1fr);
        }
        .creator__photo {
          aspect-ratio: 16 / 10;
          min-height: 0;
        }
        .creator__photo img {
          position: absolute;
          inset: 0;
        }
        .creator__body {
          padding: var(--mk-space-6) var(--mk-space-5);
        }
        .index__blurb {
          grid-column: 2;
        }
        .wall__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 560px) {
        .wall__grid {
          grid-template-columns: minmax(0, 1fr);
        }
        .tile--wide {
          grid-column: span 1;
        }
      }
      @media (max-width: 560px) {
        .demo__head {
          flex-direction: column;
        }
        .demo__kpis {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--mk-space-2);
        }
        .demo__kpis > :last-child {
          grid-column: span 2;
        }
        .demo__charts {
          grid-template-columns: 1fr;
          justify-items: center;
        }
        .install {
          display: flex;
        }
        .install__cmd {
          flex: 1;
        }
      }
    `,
  ],
})
export class HomePage {
  protected openStarter(): void {
    openInStackBlitz(starterApp());
  }

  protected readonly theme = inject(MkThemeService);
  private readonly toast = inject(MkToastService);

  private readonly document = inject(DOCUMENT);
  protected readonly site = SITE;
  private readonly waitlistForm = viewChild<ElementRef<HTMLElement>>('waitlistForm');
  private readonly teamForm = viewChild<ElementRef<HTMLElement>>('teamForm');

  protected readonly uiVersion = uiVersion;
  protected readonly total = 190;
  protected readonly copied = signal(false);

  /* Brand-swap: rewrites the primary token family on the host ------------ */
  protected readonly presets: BrandPreset[] = [
    { name: 'Indigo', color: '#4f46e5' },
    { name: 'Emerald', color: '#059669' },
    { name: 'Rose', color: '#e11d48' },
    { name: 'Amber', color: '#d97706' },
    { name: 'Slate', color: '#334155' },
  ];
  protected readonly brand = signal<BrandPreset>(this.presets[0]);
  /** Derived so the swap holds in both light and dark themes. */
  protected readonly derived = computed(() => {
    const c = this.brand().color;
    return {
      hover: `color-mix(in srgb, ${c} 88%, var(--mk-text))`,
      active: `color-mix(in srgb, ${c} 78%, var(--mk-text))`,
      subtle: `color-mix(in srgb, ${c} 14%, var(--mk-surface))`,
      subtleHover: `color-mix(in srgb, ${c} 22%, var(--mk-surface))`,
      subtleText: `color-mix(in srgb, ${c} 70%, var(--mk-text))`,
    };
  });

  protected setDark(dark: boolean): void {
    this.theme.setTheme(dark ? 'dark' : 'light');
  }

  /**
   * Open the AZ Widgets contact form for a tier. The widget renders its own
   * trigger inside an open shadow root; we click it so our mk-kit button is
   * the visible control. If the widget is not loaded (blocked, offline,
   * module disabled) fall back to a pre-filled email.
   */
  /** Payment Link for a tier, once configured in site.config.ts. */
  protected buyLink(t: Tier): string | null {
    return (t.buy && this.site.stripe[t.buy]) || null;
  }

  protected openForm(which: 'waitlist' | 'team'): void {
    const host = (which === 'waitlist' ? this.waitlistForm() : this.teamForm())?.nativeElement;
    const trigger = host?.shadowRoot?.querySelector<HTMLButtonElement>('.trigger');
    if (trigger) {
      trigger.click();
      return;
    }
    const subject = which === 'waitlist' ? 'mk-kit Pro waitlist' : 'mk-kit Team licence';
    this.document.defaultView?.location.assign(
      `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}`,
    );
  }

  protected async copyInstall(): Promise<void> {
    try {
      await navigator.clipboard.writeText('ng add @mk-kit/ui');
      this.copied.set(true);
      this.toast.success('Copied to clipboard');
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.toast.info('Copy failed — select the command and copy it manually.');
    }
  }

  /* Wall state --------------------------------------------------------- */
  protected readonly rating = signal(4);
  protected readonly slider = signal(64);
  protected readonly range = signal<unknown>('week');
  protected readonly page = signal(3);
  protected readonly date = signal<Date | null>(new Date(2026, 8, 14));
  protected readonly spark = [12, 18, 14, 22, 19, 27, 24, 31, 28, 36];

  /* Demo data ---------------------------------------------------------- */
  protected readonly months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  protected readonly revenue: MkChartSeries[] = [
    { name: 'Revenue', data: [31.2, 34.8, 33.1, 39.6, 44.0, 48.2] },
  ];
  protected readonly plans: MkChartSlice[] = [
    { name: 'Pro', value: 64 },
    { name: 'Team', value: 24 },
    { name: 'Free', value: 12 },
  ];
  protected readonly columns: MkTableColumn<Order>[] = [
    { key: 'id', header: 'Order', width: '80px' },
    { key: 'customer', header: 'Customer' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      format: (v) => '$' + Number(v).toLocaleString(),
    },
    { key: 'status', header: 'Status', format: (v) => String(v).toUpperCase() },
  ];
  protected readonly orders: Order[] = [
    { id: '#1042', customer: 'Ada Lovelace', amount: 1290, status: 'paid' },
    { id: '#1041', customer: 'Grace Hopper', amount: 480, status: 'paid' },
    { id: '#1040', customer: 'Linus Torvalds', amount: 149, status: 'pending' },
    { id: '#1039', customer: 'Margaret Hamilton', amount: 960, status: 'refunded' },
  ];

  /* Copy --------------------------------------------------------------- */
  protected readonly groups: Group[] = [
    { title: 'Forms & inputs', count: 54, blurb: 'Dynamic form (JSON schema → form), text, number, phone, IBAN, tax id, OTP, date, time & date-time pickers, selects, multi-select, listbox, cascader, floating labels, sliders, file upload, colour, rating, signature, keypad, split button.' },
    { title: 'Data display', count: 27, blurb: 'Cards, lists, stat cards, badges & overlay badges, tags, chips, avatars, timeline, description lists, tree, org chart, empty states, QR, diff, JSON viewer.' },
    { title: 'Editors & interactions', count: 31, blurb: 'Chat with streaming replies and a prompt box, block editor, rich text, markdown, log viewer, drag & drop, sortable list, mentions, hotkeys, masks, permissions, formatting pipes.' },
    { title: 'Feedback & overlays', count: 21, blurb: 'Dialogs (draggable & resizable), sheets, drawers, toasts, snackbars, banners, tooltips, popovers, hovercards, tours, block UI, progress, skeletons.' },
    { title: 'Navigation & layout', count: 21, blurb: 'App shell, stack / flex / grid layout primitives with breakpoints, nav lists, tabs, stepper, breadcrumbs, pagination, menus with nested submenus, context menu, command palette, splitter.' },
    { title: 'Charts', count: 12, blurb: 'Line, bar, donut, gauge, scatter, radar, funnel, treemap, heatmaps, sparklines — SVG, themed, accessible.' },
    { title: 'Tables & grids', count: 7, blurb: 'Sortable, selectable, expandable, groupable, tree-row, resizable, editable data table with CSV export, print styles, a server-side data source and a query builder.' },
    { title: 'Media', count: 6, blurb: 'Images, galleries, lightbox, carousel, cropper, media manager.' },
  ];

  protected readonly features: Feature[] = [
    { tag: 'input() · model() · output()', title: 'Signals all the way down', body: 'Every input is a signal, every component is OnPush and standalone. Works zoneless. No RxJS required in your templates.' },
    { tag: '--mk-*', title: 'CSS variables, not SCSS forks', body: 'Theme at build time, at runtime, or per subtree by setting tokens. Light and dark are first-class; density has three steps.' },
    { tag: 'WCAG 2.1 AA', title: 'Accessible by construction', body: 'Roving tabindex, focus traps, live regions, contrast-checked tokens, an Escape that closes only the top overlay. Axe runs in the test suite.' },
    { tag: 'provideMkI18n()', title: 'Every string is translatable', body: 'One provider swaps every label the library renders — scoped per subtree for mixed locales. RTL flips arrows and layout.' },
    { tag: 'pointer: coarse', title: 'Touch is not an afterthought', body: 'Long-press drag, 16px inputs on touch, safe-area insets, bottom sheets, a touch density that grows every hit target.' },
    { tag: '@mk-kit/ui/<entry>', title: 'Tree-shakeable entry points', body: 'Import only the groups you use. SSR-safe, sideEffects: false, and ng add wires the stylesheet for you.' },
  ];

  protected readonly mappings: Mapping[] = [
    { from: 'p-table', to: 'mk-table', note: '+ MkTableDataSource' },
    { from: 'p-select / p-dropdown', to: 'mk-select' },
    { from: 'p-multiSelect', to: 'mk-multi-select' },
    { from: 'p-datePicker / p-calendar', to: 'mk-date-picker' },
    { from: 'p-dialog / DialogService', to: 'mk-dialog / MkDialogService' },
    { from: 'p-toast / MessageService', to: 'MkToastService' },
    { from: 'p-menu / p-contextMenu', to: 'mk-menu / mkContextMenuTriggerFor' },
    { from: 'p-chart [PRO]', to: 'mk-line-chart, mk-bar-chart, …' },
    { from: 'p-editor [PRO]', to: 'mk-rich-text / mk-block-editor' },
    { from: 'Scheduler [PRO]', to: 'mk-event-calendar' },
    { from: 'Task Board [PRO]', to: 'mk-kanban' },
  ];

  protected readonly tableSnippet = `<mk-table
  [columns]="columns"
  [data]="rows"
  selectable
  expandable
  stickyHeader
  [stackAt]="640"
  (sortChange)="sort($event)"
/>`;

  protected readonly themeSnippet = `:root {
  --mk-primary: #0f766e;
  --mk-primary-contrast: #ffffff;
  --mk-radius-md: 4px;
  --mk-font-sans: 'Inter', system-ui, sans-serif;
}

[data-mk-theme='dark'] {
  --mk-primary: #2dd4bf;
  --mk-primary-contrast: #042f2e;
}`;

  /**
   * Pricing tiers — the open-core model from the go-to-market plan. Set to
   * `[]` to hide the section until the offer is live.
   */
  protected readonly tiers: Tier[] = [
    {
      name: 'Open source',
      price: '$0',
      per: 'forever',
      blurb: 'The whole library. MIT licensed, public npm, no thresholds.',
      features: [
        'All 165+ components, directives & services',
        'Light & dark themes, theme builder',
        'ng add schematic, docs, changelog',
        'Community support on GitHub',
      ],
      cta: 'Get started',
      link: '/getting-started',
    },
    {
      name: 'Pro',
      price: '$149',
      per: '/ developer / year',
      blurb: 'The vendor-class widgets, finished — so the first week is the last week.',
      features: [
        'Everything in Open source',
        'Dashboard grid, resource scheduler, Gantt',
        'Export pack (XLSX + PDF), form builder, pivot grid',
        'Admin Starter when it ships — included',
        'A year of updates; perpetual use of every release you received',
        'Priority issues, 2-business-day response',
      ],
      cta: 'Join the waitlist',
      form: 'waitlist',
      buy: 'developer',
      highlight: true,
    },
    {
      name: 'Team',
      price: '$499',
      per: '/ 5 developers / year',
      blurb: 'One licence for the whole squad, invoiced to your company.',
      features: [
        'Everything in Pro for 5 seats',
        'Private support channel',
        'Invoice & purchase-order billing on request',
        'Early access to new premium widgets',
      ],
      cta: 'Talk to us',
      form: 'team',
      buy: 'team',
    },
  ];

  protected readonly faqs: Faq[] = [
    { q: 'Is it really free?', a: 'Yes. The library is MIT licensed — use it in commercial products, fork it, ship it. There is no revenue or head-count threshold. Pro and Team only add pre-built screens, premium widgets and support on top.' },
    { q: 'Which Angular versions are supported?', a: 'mk-kit targets the current Angular major (22). Each new Angular major gets a matching mk-kit release within weeks; the previous major keeps receiving fixes for six months.' },
    { q: 'How does it compare to Angular Material or PrimeNG?', a: 'Material is a design language with a smaller admin surface. PrimeNG is a huge general-purpose suite that is now commercial for most companies. mk-kit is narrower on purpose: built for admin panels and internal tools, themed with plain CSS variables, and written for signals and standalone components from day one.' },
    { q: 'Does it work with SSR and zoneless?', a: 'Yes. Every component is guarded against non-browser platforms (there is an SSR smoke suite), and nothing depends on Zone.js.' },
    { q: 'Can I use my own icons, fonts and design tokens?', a: '426 stroke icons ship built in, and <mk-icon> also renders any projected SVG, so bring your own set if you prefer. Fonts, radii, spacing, shadows and colours are all --mk-* custom properties you can override globally or per subtree — the swatches at the top of this page do exactly that.' },
  ];
}
