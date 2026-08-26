import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MkBadge,
  MkButton,
  MkCard,
  MkDonutChart,
  MkLineChart,
  MkStatCard,
  MkSwitch,
  MkTable,
  MkTag,
  MkThemeService,
  MkToastService,
  type MkChartSeries,
  type MkChartSlice,
  type MkTableColumn,
} from '@mkornas/ui';
import { version as uiVersion } from '../../../../../mk-kit/package.json';

interface Feature {
  icon: string;
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
  link: string;
  highlight?: boolean;
}
interface Faq {
  q: string;
  a: string;
}

/**
 * Public landing page. Rendered full-bleed (the docs sidebar is hidden on this
 * route — see `App.isHome`). Every visual in the hero is a real library
 * component, so the page is also the most honest demo we have.
 */
@Component({
  selector: 'docs-home-page',
  imports: [
    RouterLink,
    MkBadge,
    MkButton,
    MkCard,
    MkDonutChart,
    MkLineChart,
    MkStatCard,
    MkSwitch,
    MkTable,
    MkTag,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <!-- ───────────────────────── Hero ───────────────────────── -->
      <section class="home__hero home-wrap">
        <div class="hero__copy">
          <mk-badge tone="primary" variant="soft">
            v{{ uiVersion }} · Angular 22 · signals · WCAG 2.1 AA
          </mk-badge>
          <h1 class="hero__title">
            Ship the admin.<br />
            <span class="hero__accent">Skip the component library.</span>
          </h1>
          <p class="hero__lead">
            <strong>mk-kit</strong> is {{ total }}+ standalone Angular components for
            dashboards, back-offices and internal tools — data tables, charts,
            pickers, editors, kanban, overlays — themed entirely through CSS
            variables, dark mode included, accessible by default.
          </p>
          <div class="hero__cta">
            <a mkButton tone="primary" size="lg" routerLink="/getting-started">
              Get started
            </a>
            <a mkButton variant="outline" tone="neutral" size="lg" routerLink="/examples/dashboard">
              See the live dashboard
            </a>
          </div>
          <div class="hero__install">
            <code class="hero__cmd" aria-label="Install command">
              <span class="hero__prompt" aria-hidden="true">$</span> ng add &#64;mkornas/ui
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
        <div class="hero__demo" [style.--mk-primary]="brand().color"
             [style.--mk-primary-hover]="derived().hover"
             [style.--mk-primary-active]="derived().active"
             [style.--mk-primary-subtle]="derived().subtle"
             [style.--mk-primary-subtle-hover]="derived().subtleHover"
             [style.--mk-primary-subtle-text]="derived().subtleText"
             [style.--mk-chart-1]="brand().color">
          <mk-card variant="elevated" class="demo">
            <div class="demo__head">
              <div>
                <p class="demo__title">Revenue</p>
                <p class="demo__sub">Last 6 months · live data</p>
              </div>
              <div class="demo__controls">
                <span class="demo__brandlabel">Brand</span>
                <div class="demo__swatches" role="radiogroup" aria-label="Brand colour">
                  @for (p of presets; track p.name) {
                    <button
                      type="button"
                      class="demo__swatch"
                      role="radio"
                      [attr.aria-checked]="brand().name === p.name"
                      [attr.aria-label]="p.name"
                      [class.demo__swatch--active]="brand().name === p.name"
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

            <mk-table [columns]="columns" [data]="orders" density="compact" />
          </mk-card>
        </div>
      </section>

      <!-- ───────────────────────── Proof strip ───────────────────────── -->
      <section class="home__proof" aria-label="At a glance">
        <div class="home-wrap proof">
          @for (s of stats; track s.label) {
            <div class="proof__item">
              <strong class="proof__value">{{ s.value }}</strong>
              <span class="proof__label">{{ s.label }}</span>
            </div>
          }
        </div>
      </section>

      <!-- ───────────────────────── Groups ───────────────────────── -->
      <section class="home-wrap home__section">
        <header class="section__head">
          <h2 class="section__title">Everything an admin panel needs. Nothing it doesn't.</h2>
          <p class="section__lead">
            Organised into eight groups, imported à la carte from tree-shakeable entry
            points. No NgModules, no runtime dependencies beyond Angular itself.
          </p>
        </header>
        <div class="groups">
          @for (g of groups; track g.title) {
            <a class="group" routerLink="/components-index">
              <span class="group__count">{{ g.count }}</span>
              <span class="group__title">{{ g.title }}</span>
              <span class="group__blurb">{{ g.blurb }}</span>
            </a>
          }
        </div>
        <p class="section__foot">
          <a mkButton variant="outline" tone="neutral" routerLink="/components-index">
            Browse all {{ total }} components →
          </a>
        </p>
      </section>

      <!-- ───────────────────────── Features ───────────────────────── -->
      <section class="home__band">
        <div class="home-wrap home__section">
          <header class="section__head">
            <h2 class="section__title">Built the way Angular is built now.</h2>
            <p class="section__lead">
              Standalone components, <code>input()</code> / <code>model()</code> /
              <code>output()</code>, OnPush everywhere, zoneless-ready. Written for
              Angular 22 — not migrated to it.
            </p>
          </header>
          <div class="features">
            @for (f of features; track f.title) {
              <mk-card variant="outlined" class="feature">
                <div class="feature__icon" aria-hidden="true">{{ f.icon }}</div>
                <h3 class="feature__title">{{ f.title }}</h3>
                <p class="feature__body">{{ f.body }}</p>
              </mk-card>
            }
          </div>
        </div>
      </section>

      <!-- ───────────────────────── Code ───────────────────────── -->
      <section class="home-wrap home__section home__code">
        <div class="code__copy">
          <h2 class="section__title">A data table in nine lines.</h2>
          <p class="section__lead">
            Columns are plain objects, rows are your data, sorting / selection /
            expansion / grouping / sticky headers / mobile stacking are flags.
            Server-side data? Plug in <code>MkTableDataSource</code>.
          </p>
          <ul class="code__points">
            <li>Typed columns with <code>format</code> and <code>align</code></li>
            <li>Keyboard-operable sort headers, announced to screen readers</li>
            <li>Stacks into cards below <code>stackAt</code> pixels</li>
          </ul>
          <a mkButton variant="soft" tone="primary" routerLink="/components/table">
            Table &amp; data grid docs →
          </a>
        </div>
        <pre class="code__block" tabindex="0"><code>{{ tableSnippet }}</code></pre>
      </section>

      <!-- ───────────────────────── Theming ───────────────────────── -->
      <section class="home__band">
        <div class="home-wrap home__section home__theming">
          <div class="theming__copy">
            <h2 class="section__title">Your brand in one file.</h2>
            <p class="section__lead">
              Every colour, radius, shadow, font and spacing step is a
              <code>--mk-*</code> custom property. Override a handful, get a
              consistent light and dark theme across all {{ total }} components —
              at runtime, per subtree, no rebuild.
            </p>
            <a mkButton variant="outline" tone="neutral" routerLink="/theme-builder">
              Open the theme builder →
            </a>
          </div>
          <pre class="code__block" tabindex="0"><code>{{ themeSnippet }}</code></pre>
        </div>
      </section>

      <!-- ───────────────────────── Pricing ───────────────────────── -->
      @if (tiers.length) {
        <section class="home-wrap home__section" id="pricing">
          <header class="section__head">
            <h2 class="section__title">Free core. Pay for the shortcuts.</h2>
            <p class="section__lead">
              The library is MIT-licensed and always will be. Pro adds finished
              screens, premium widgets and a human on the other end of your issues.
            </p>
          </header>
          <div class="tiers">
            @for (t of tiers; track t.name) {
              <mk-card [variant]="t.highlight ? 'elevated' : 'outlined'" class="tier"
                       [class.tier--highlight]="t.highlight">
                <div class="tier__head">
                  <h3 class="tier__name">{{ t.name }}</h3>
                  @if (t.highlight) {
                    <mk-tag tone="primary">Most popular</mk-tag>
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
                <a mkButton [tone]="t.highlight ? 'primary' : 'neutral'"
                   [variant]="t.highlight ? 'solid' : 'outline'" fullWidth
                   [routerLink]="t.link">
                  {{ t.cta }}
                </a>
              </mk-card>
            }
          </div>
        </section>
      }

      <!-- ───────────────────────── FAQ ───────────────────────── -->
      <section class="home__band">
        <div class="home-wrap home__section home__faq">
          <h2 class="section__title">Questions, answered.</h2>
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

      <!-- ───────────────────────── Footer CTA ───────────────────────── -->
      <section class="home-wrap home__section home__final">
        <h2 class="final__title">Your next admin panel is one <code>ng add</code> away.</h2>
        <div class="hero__cta hero__cta--center">
          <a mkButton tone="primary" size="lg" routerLink="/getting-started">Get started</a>
          <a mkButton variant="ghost" tone="neutral" size="lg"
             href="https://github.com/mkornas/mk-kit" target="_blank" rel="noopener">
            GitHub ↗
          </a>
        </div>
      </section>

      <footer class="home__footer">
        <div class="home-wrap footer">
          <span>© 2026 Mateusz Kornaś · MIT License</span>
          <nav class="footer__links" aria-label="Footer">
            <a routerLink="/introduction">Docs</a>
            <a routerLink="/components-index">Components</a>
            <a routerLink="/changelog">Changelog</a>
            <a href="https://github.com/mkornas/mk-kit" target="_blank" rel="noopener">GitHub</a>
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
        --home-max: 1140px;
        color: var(--mk-text);
      }
      .home-wrap {
        width: 100%;
        max-width: var(--home-max);
        margin: 0 auto;
        padding-inline: var(--mk-space-6);
      }
      .home__section {
        padding-block: var(--mk-space-16);
      }
      .home__band {
        background: var(--mk-surface);
        border-block: 1px solid var(--mk-border-subtle);
      }
      code {
        font-family: var(--mk-font-mono);
        font-size: 0.92em;
        background: var(--mk-surface-2);
        border-radius: var(--mk-radius-sm);
        padding: 0 0.3em;
      }

      /* Hero ------------------------------------------------------------- */
      .home__hero {
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
        gap: var(--mk-space-12);
        align-items: center;
        padding-block: var(--mk-space-16) var(--mk-space-14);
      }
      .hero__title {
        font-size: clamp(2.25rem, 4.6vw, 3.5rem);
        line-height: 1.05;
        letter-spacing: var(--mk-letter-spacing-tight);
        font-weight: var(--mk-font-weight-bold);
        margin: var(--mk-space-5) 0 var(--mk-space-5);
      }
      .hero__accent {
        color: var(--mk-primary);
      }
      .hero__lead {
        font-size: var(--mk-font-size-lg);
        line-height: var(--mk-line-height-relaxed, 1.6);
        color: var(--mk-text-muted);
        margin: 0 0 var(--mk-space-6);
        max-width: 52ch;
      }
      .hero__cta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-3);
      }
      .hero__cta--center {
        justify-content: center;
      }
      .hero__install {
        display: inline-flex;
        align-items: center;
        gap: var(--mk-space-2);
        margin-top: var(--mk-space-6);
        padding: var(--mk-space-1) var(--mk-space-1) var(--mk-space-1) var(--mk-space-4);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
      }
      .hero__cmd {
        background: none;
        padding: 0;
        font-size: var(--mk-font-size-sm);
      }
      .hero__prompt {
        color: var(--mk-text-subtle);
        margin-right: 0.4em;
      }

      /* Demo card */
      .hero__demo {
        min-width: 0;
      }
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
      .demo__brandlabel {
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
      }
      .demo__swatches {
        display: flex;
        gap: var(--mk-space-1);
      }
      .demo__swatch {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2px solid transparent;
        outline-offset: 2px;
        cursor: pointer;
        box-shadow: inset 0 0 0 2px var(--mk-surface);
        padding: 0;
      }
      .demo__swatch--active {
        border-color: var(--mk-text);
      }
      .demo__swatch:focus-visible {
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

      /* Proof strip ------------------------------------------------------ */
      .home__proof {
        border-block: 1px solid var(--mk-border-subtle);
        background: var(--mk-surface);
      }
      .proof {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--mk-space-6);
        padding-block: var(--mk-space-8);
      }
      .proof__item {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-1);
      }
      .proof__value {
        font-size: var(--mk-font-size-2xl);
        font-weight: var(--mk-font-weight-bold);
        letter-spacing: var(--mk-letter-spacing-tight);
      }
      .proof__label {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }

      /* Sections --------------------------------------------------------- */
      .section__head {
        max-width: 64ch;
        margin-bottom: var(--mk-space-10);
      }
      .section__title {
        font-size: clamp(1.6rem, 3vw, 2.25rem);
        line-height: 1.15;
        letter-spacing: var(--mk-letter-spacing-tight);
        font-weight: var(--mk-font-weight-bold);
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

      /* Groups */
      .groups {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: var(--mk-space-4);
      }
      .group {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-1);
        padding: var(--mk-space-5);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
        text-decoration: none;
        color: inherit;
        transition:
          border-color var(--mk-duration-fast) var(--mk-ease-standard),
          transform var(--mk-duration-fast) var(--mk-ease-standard);
      }
      .group:hover {
        border-color: var(--mk-primary);
        transform: translateY(-2px);
      }
      .group:focus-visible {
        outline: 2px solid var(--mk-focus-ring, var(--mk-primary));
        outline-offset: 2px;
      }
      .group__count {
        font-size: var(--mk-font-size-2xl);
        font-weight: var(--mk-font-weight-bold);
        color: var(--mk-primary);
        line-height: 1;
      }
      .group__title {
        font-weight: var(--mk-font-weight-semibold);
        margin-top: var(--mk-space-2);
      }
      .group__blurb {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }

      /* Features */
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: var(--mk-space-4);
      }
      .feature {
        display: block;
        padding: var(--mk-space-6);
      }
      .feature__icon {
        font-size: 1.5rem;
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
        line-height: 1.6;
      }

      /* Code / theming split */
      .home__code,
      .home__theming {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: var(--mk-space-12);
        align-items: center;
      }
      .home__code .section__head,
      .home__theming .section__head {
        margin-bottom: var(--mk-space-6);
      }
      .code__copy .section__title,
      .theming__copy .section__title {
        margin-bottom: var(--mk-space-4);
      }
      .code__copy .section__lead,
      .theming__copy .section__lead {
        margin-bottom: var(--mk-space-5);
      }
      .code__points {
        margin: 0 0 var(--mk-space-6);
        padding-left: 1.2em;
        color: var(--mk-text-muted);
        line-height: 1.8;
      }
      .code__block {
        margin: 0;
        padding: var(--mk-space-5);
        border-radius: var(--mk-radius-lg);
        border: 1px solid var(--mk-border);
        background: var(--mk-surface-2);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: 1.6;
        overflow-x: auto;
      }
      .code__block code {
        background: none;
        padding: 0;
        font-size: inherit;
      }

      /* Pricing */
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

      /* FAQ */
      .home__faq .section__title {
        margin-bottom: var(--mk-space-8);
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

      /* Final CTA + footer */
      .home__final {
        text-align: center;
      }
      .final__title {
        font-size: clamp(1.5rem, 3vw, 2.25rem);
        letter-spacing: var(--mk-letter-spacing-tight);
        font-weight: var(--mk-font-weight-bold);
        margin: 0 0 var(--mk-space-6);
      }
      .home__footer {
        border-top: 1px solid var(--mk-border-subtle);
        background: var(--mk-surface);
      }
      .footer {
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
        .home__hero,
        .home__code,
        .home__theming {
          grid-template-columns: 1fr;
          gap: var(--mk-space-10);
        }
        .home__hero {
          padding-block: var(--mk-space-10);
        }
        .home__section {
          padding-block: var(--mk-space-12);
        }
      }
      @media (max-width: 560px) {
        .demo__head {
          flex-direction: column;
        }
        .demo__kpis {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--mk-space-2);
        }
        .demo__charts {
          grid-template-columns: 1fr;
          justify-items: center;
        }
        .hero__install {
          display: flex;
        }
        .hero__cmd {
          flex: 1;
        }
      }
    `,
  ],
})
export class HomePage {
  protected readonly theme = inject(MkThemeService);
  private readonly toast = inject(MkToastService);

  protected readonly uiVersion = uiVersion;
  protected readonly total = 165;
  protected readonly copied = signal(false);

  /* Brand-swap demo ---------------------------------------------------- */
  protected readonly presets: BrandPreset[] = [
    { name: 'Indigo', color: '#4f46e5' },
    { name: 'Emerald', color: '#059669' },
    { name: 'Rose', color: '#e11d48' },
    { name: 'Amber', color: '#d97706' },
    { name: 'Slate', color: '#334155' },
  ];
  protected readonly brand = signal<BrandPreset>(this.presets[0]);
  /** The rest of the primary family, derived so the swap works in both themes. */
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

  protected async copyInstall(): Promise<void> {
    try {
      await navigator.clipboard.writeText('ng add @mkornas/ui');
      this.copied.set(true);
      this.toast.success('Copied to clipboard');
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.toast.info('Copy failed — select the command and copy it manually.');
    }
  }

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
  protected readonly stats = [
    { value: '165+', label: 'components, directives & services' },
    { value: '1,700+', label: 'unit tests, plus visual regression' },
    { value: '0', label: 'runtime dependencies beyond Angular' },
    { value: 'AA', label: 'WCAG 2.1 target, axe-checked' },
    { value: '2', label: 'themes out of the box, infinite via tokens' },
  ];

  protected readonly groups: Group[] = [
    { title: 'Forms & inputs', count: 49, blurb: 'Text, number, phone, IBAN, OTP, date & time, selects, multi-select, sliders, file upload, colour, rating, signature.' },
    { title: 'Data display', count: 25, blurb: 'Cards, lists, stat cards, badges, tags, chips, avatars, timeline, description lists, empty states.' },
    { title: 'Editors & interactions', count: 22, blurb: 'Block editor, rich text, code editor, markdown, kanban, drag & drop, repeater, mentions, hotkeys.' },
    { title: 'Feedback & overlays', count: 20, blurb: 'Dialogs, sheets, drawers, toasts, snackbars, banners, tooltips, popovers, progress, skeletons.' },
    { title: 'Navigation & layout', count: 18, blurb: 'App shell, nav lists, tabs, stepper, breadcrumbs, pagination, menus, command palette, tree.' },
    { title: 'Charts', count: 12, blurb: 'Line, bar, donut, gauge, scatter, radar, funnel, treemap, heatmaps, sparklines — SVG, themed, accessible.' },
    { title: 'Tables & grids', count: 6, blurb: 'Sortable, selectable, expandable, groupable, resizable data table with a server-side data source.' },
    { title: 'Media', count: 6, blurb: 'Images, galleries, carousel, cropper, QR codes, media manager.' },
  ];

  protected readonly features: Feature[] = [
    { icon: '⚡', title: 'Signals all the way down', body: 'Every input is a signal, every component is OnPush and standalone. Works zoneless. No RxJS required in your templates.' },
    { icon: '🎨', title: 'CSS variables, not SCSS forks', body: 'Theme at build time, runtime, or per subtree by setting --mk-* tokens. Light and dark are first-class, density has three steps.' },
    { icon: '♿', title: 'Accessible by construction', body: 'Roving tabindex, focus traps, live regions, contrast-checked tokens, Escape that closes only the top overlay. WCAG 2.1 AA is the target, not the marketing.' },
    { icon: '🌍', title: 'Every string is translatable', body: 'One provideMkI18n() call swaps every label the library renders — scoped per subtree if you need mixed locales. RTL flips arrows and layout.' },
    { icon: '📱', title: 'Touch is not an afterthought', body: 'Long-press drag, 16px inputs on coarse pointers, safe-area insets, bottom sheets, a touch density that grows every hit target.' },
    { icon: '📦', title: 'Tree-shakeable entry points', body: 'Import from @mkornas/ui/table or @mkornas/ui/charts and ship only what you use. SSR-safe, sideEffects: false, ng add wires everything.' },
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
   * Pricing tiers. Recommended open-core model from the go-to-market plan —
   * set to `[]` to hide the section entirely until the offer is live.
   */
  protected readonly tiers: Tier[] = [
    {
      name: 'Open source',
      price: '$0',
      per: 'forever',
      blurb: 'The whole library. MIT licensed, public npm, no strings.',
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
      per: '/ developer, one-time',
      blurb: 'Finished screens and premium widgets so the first week is the last week.',
      features: [
        'Everything in Open source',
        'Admin starter: auth, dashboard, CRUD, settings, billing screens',
        'Premium widgets: scheduler, advanced grid features, block editor kit',
        'Figma design kit matching every token',
        '12 months of updates, lifetime use',
        'Priority issues, 2-business-day response',
      ],
      cta: 'Join the waitlist',
      link: '/introduction',
      highlight: true,
    },
    {
      name: 'Team',
      price: '$499',
      per: '/ up to 10 developers',
      blurb: 'One licence for the whole squad, invoiced to your company.',
      features: [
        'Everything in Pro for up to 10 seats',
        'Private support channel',
        'Invoice & purchase-order billing',
        'Early access to new premium widgets',
      ],
      cta: 'Talk to us',
      link: '/introduction',
    },
  ];

  protected readonly faqs: Faq[] = [
    { q: 'Is it really free?', a: 'Yes. The library is MIT licensed — use it in commercial products, fork it, ship it. Pro and Team only add pre-built screens, premium widgets and support on top.' },
    { q: 'Which Angular versions are supported?', a: 'mk-kit targets the current Angular major (22). Each Angular major gets a matching mk-kit major within weeks of release; the previous major keeps receiving fixes for six months.' },
    { q: 'How does it compare to Angular Material or PrimeNG?', a: 'Material is a design language; PrimeNG is a huge general-purpose suite. mk-kit is narrower on purpose: it is built for admin panels and internal tools, is themed with plain CSS variables instead of SCSS theming APIs, and was written for signals and standalone components from day one.' },
    { q: 'Does it work with SSR and zoneless?', a: 'Yes. Every component is guarded against non-browser platforms (there is an SSR smoke suite), and nothing depends on Zone.js.' },
    { q: 'Can I use my own icons, fonts and design tokens?', a: 'Icons are projected content, so use any icon set. Fonts, radii, spacing, shadows and colours are all --mk-* custom properties you can override globally or per subtree.' },
  ];
}
