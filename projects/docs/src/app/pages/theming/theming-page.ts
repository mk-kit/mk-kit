import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  MkAlert,
  MkBadge,
  MkButton,
  MkCard,
  MkProgressBar,
  MkSwitch,
  MkThemeService,
} from '@mk-kit/ui';

interface TokenRow {
  name: string;
  desc: string;
}
interface TokenGroup {
  title: string;
  tokens: TokenRow[];
}

@Component({
  selector: 'docs-theming-page',
  imports: [MkButton, MkCard, MkBadge, MkAlert, MkSwitch, MkProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container">
      <h1>Theming</h1>
      <p class="docs-lead">
        The entire look of mk-kit is driven by CSS custom properties on
        <code class="docs-inline">:root</code>. Override any
        <code class="docs-inline">--mk-*</code> token — globally or scoped to a
        subtree — and every component updates instantly. No recompilation.
      </p>

      <h2>Density</h2>
      <p>
        Setting <code class="docs-inline">data-mk-density</code> retunes control
        heights and the two spacing tokens most components use for padding —
        every control, table and picker follows automatically, because they all
        read the same tokens.
      </p>
      <ul>
        <li>
          <code class="docs-inline">compact</code> — 32px default control, for
          dense data screens.
        </li>
        <li>
          <code class="docs-inline">touch</code> — 48px default control and
          roomier spacing, for tablets and kiosks. The default 38px is
          comfortable under a cursor and too small for a finger; 48px is the
          WCAG 2.5.5 target.
        </li>
      </ul>
      <p>
        Put it on <code class="docs-inline">&lt;html&gt;</code> for a global
        mode — <code class="docs-inline">MkThemeService.setDensity('compact')</code>
        (persisted, SSR-safe), or the density button in this site's header — or
        on <strong>any element</strong> to rescale just that subtree. These are
        plain custom properties, so they inherit: a touch-sized dialog inside an
        otherwise mouse-sized admin is one attribute, not a stylesheet.
      </p>
      <pre class="tp-code"><code>&lt;div data-mk-density="touch"&gt;
  &lt;!-- every mk control in here is finger-sized --&gt;
&lt;/div&gt;</code></pre>

      <h2>High contrast</h2>
      <p>
        <code class="docs-inline">data-mk-contrast="high"</code> swaps the
        colour tokens for a high-contrast preset: pure black / white text,
        borders that read as lines rather than tints, opaque hover and pressed
        washes (no low-alpha surfaces), shadows replaced by a crisp outline,
        darker (light) or lighter (dark) tone families so tinted text clears
        7:1, and a 3px focus ring. Light and dark each keep their own set, so
        it composes with <code class="docs-inline">data-mk-theme</code>.
      </p>
      <ul>
        <li>
          <strong>Explicit</strong> —
          <code class="docs-inline">MkThemeService.setContrast('high')</code>
          writes the attribute on <code class="docs-inline">&lt;html&gt;</code>
          (persisted, SSR-safe), or put it on <strong>any element</strong> to
          raise contrast for that subtree only.
        </li>
        <li>
          <strong>Automatic</strong> — with no attribute (the
          <code class="docs-inline">system</code> preference) the stylesheet
          follows the OS <code class="docs-inline">prefers-contrast: more</code>
          setting. <code class="docs-inline">setContrast('normal')</code> opts
          out of that.
        </li>
        <li>
          <strong>Windows High Contrast</strong> —
          <code class="docs-inline">forced-colors: active</code> is handled
          separately: the tokens map to the system palette
          (<code class="docs-inline">CanvasText</code>,
          <code class="docs-inline">Highlight</code>,
          <code class="docs-inline">ButtonText</code>) and state indicators
          that are background-only re-express themselves with those colours.
        </li>
      </ul>
      <div class="tp-toggle">
        <button mkButton variant="outline" tone="neutral" (click)="theme.toggleContrast()">
          {{ theme.isHighContrast() ? 'Turn high contrast off' : 'Turn high contrast on' }}
        </button>
        <span class="tp-muted tp-toggle__state">
          preference: <code>{{ theme.contrast() }}</code> · in effect:
          <code>{{ theme.resolvedContrast() }}</code>
        </span>
      </div>
      <pre class="tp-code"><code>{{ contrastCode }}</code></pre>

      <h2 id="presets">Presets</h2>
      <p>
        A preset is a second stylesheet that re-declares the tokens as a set —
        type, radii, shadows, surfaces and every colour, in light and dark —
        behind one attribute. Import it after the base theme and put
        <code class="docs-inline">data-mk-preset</code> on
        <code class="docs-inline">&lt;html&gt;</code> for the whole app, or on
        any subtree to re-skin just that region. Each preset holds the same
        text/surface pairs to WCAG AA as the base theme (the contrast smoke
        test reads them all) and steps aside for
        <code class="docs-inline">data-mk-contrast="high"</code>.
      </p>
      <h3>momentum</h3>
      <p>
        The look of the Momentum task app: Manrope set heavy and tight,
        soft violet-grey surfaces, generous radii, feather-light card shadows
        and an indigo accent meant to be swapped at runtime. The card below is
        the base theme's playground card with only the attribute added — same
        components, different soul. It follows this site's light / dark switch.
      </p>
      <div class="tp-preview mk-app tp-preset" data-mk-preset="momentum">
        <mk-card variant="elevated">
          <div class="tp-preview__head">
            <strong>Today's momentum</strong>
            <mk-badge tone="primary" variant="soft">4 of 10</mk-badge>
          </div>
          <p class="tp-muted">Nice — you're rolling. Two left on the board.</p>
          <mk-progress-bar [value]="40" tone="primary" [showValue]="true" label="Board" />
          <div class="tp-preview__row">
            <button mkButton tone="primary">Start 15 min</button>
            <button mkButton variant="soft" tone="primary">Not now</button>
            <button mkButton variant="outline" tone="neutral">Break it down</button>
          </div>
          <div class="tp-preview__row">
            <mk-switch [checked]="true">Nudge me in focus windows</mk-switch>
          </div>
          <mk-alert tone="success" variant="soft">Inbox clear ✨</mk-alert>
        </mk-card>
      </div>
      <pre class="tp-code"><code>{{ presetCode }}</code></pre>
      <p>
        The preset sets <code class="docs-inline">--mk-font-sans</code> to
        Manrope but does not load it — add the Google Fonts link (weights
        500–800) or the stack falls back to the system sans. To swap the
        accent at runtime write <code class="docs-inline">--mk-primary</code>,
        its <code class="docs-inline">-hover</code> /
        <code class="docs-inline">-active</code> /
        <code class="docs-inline">-subtle</code> /
        <code class="docs-inline">-subtle-hover</code> /
        <code class="docs-inline">-subtle-text</code> family,
        <code class="docs-inline">--mk-focus-ring</code> and
        <code class="docs-inline">--mk-selected-bg</code> /
        <code class="docs-inline">-text</code> on the same element.
      </p>

      <h2>Live playground</h2>
      <p>
        Adjust the tokens below. They're applied as inline
        <code class="docs-inline">--mk-*</code> overrides on the preview card only —
        exactly how you'd scope a theme in your own app.
      </p>

      <div class="tp-grid">
        <mk-card variant="outlined" class="tp-controls">
          <label class="tp-field">
            <span>Primary color</span>
            <input type="color" [value]="primary()" (input)="setPrimary($event)" />
          </label>
          <label class="tp-field">
            <span>Primary hover</span>
            <input type="color" [value]="primaryHover()" (input)="setPrimaryHover($event)" />
          </label>
          <label class="tp-field">
            <span>Corner radius — {{ radius() }}px</span>
            <input type="range" min="0" max="20" [value]="radius()" (input)="setRadius($event)" />
          </label>
          <label class="tp-field">
            <span>Base font size — {{ fontSize() }}px</span>
            <input type="range" min="12" max="18" [value]="fontSize()" (input)="setFontSize($event)" />
          </label>
          <label class="tp-field">
            <span>Surface tint</span>
            <input type="color" [value]="surface()" (input)="setSurface($event)" />
          </label>
          <button mkButton size="sm" variant="ghost" tone="neutral" (click)="reset()">
            Reset
          </button>
        </mk-card>

        <div
          class="tp-preview mk-app"
          [style.--mk-primary]="primary()"
          [style.--mk-primary-hover]="primaryHover()"
          [style.--mk-primary-active]="primaryHover()"
          [style.--mk-focus-ring]="primary()"
          [style.--mk-radius-sm]="radius() + 'px'"
          [style.--mk-radius-md]="radius() + 'px'"
          [style.--mk-radius-lg]="radius() * 1.4 + 'px'"
          [style.--mk-font-size-md]="fontSize() + 'px'"
          [style.--mk-surface]="surface()"
        >
          <mk-card variant="elevated">
            <div class="tp-preview__head">
              <strong>Project status</strong>
              <mk-badge tone="primary" variant="soft">Live</mk-badge>
            </div>
            <p class="tp-muted">This card is themed only by the tokens on the left.</p>
            <mk-progress-bar [value]="66" tone="primary" [showValue]="true" label="Completion" />
            <div class="tp-preview__row">
              <button mkButton tone="primary">Primary</button>
              <button mkButton variant="soft" tone="primary">Soft</button>
              <button mkButton variant="outline" tone="primary">Outline</button>
            </div>
            <div class="tp-preview__row">
              <mk-switch [checked]="true">Notifications</mk-switch>
            </div>
            <mk-alert tone="info" variant="soft">Tokens cascade to every child.</mk-alert>
          </mk-card>
        </div>
      </div>

      <h3>Your override</h3>
      <p>Copy these CSS variables into your global stylesheet to make the theme permanent:</p>
      <pre class="tp-code"><code>{{ generatedCss() }}</code></pre>

      <h2>How theming works</h2>
      <ul>
        <li><strong>Semantic tokens.</strong> Components never reference raw colors — only semantic tokens like <code class="docs-inline">--mk-primary</code> or <code class="docs-inline">--mk-surface</code>. Change the token, change everything that uses it.</li>
        <li><strong>Scope anywhere.</strong> Set tokens on <code class="docs-inline">:root</code> for a global theme, or on any element to theme a subtree (a single dashboard panel, a “danger zone”, a tenant-specific area).</li>
        <li><strong>Dark mode is just token values.</strong> The dark theme is the same tokens with different values, applied via <code class="docs-inline">prefers-color-scheme</code> and <code class="docs-inline">[data-mk-theme]</code>.</li>
      </ul>

      <h2>Token reference</h2>
      <p>The full set of tokens you can override. Color tokens have both light and dark values built in.</p>
      @for (group of tokenGroups; track group.title) {
        <h3>{{ group.title }}</h3>
        <table class="docs-props">
          <thead>
            <tr><th>Token</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            @for (t of group.tokens; track t.name) {
              <tr>
                <td><code>{{ t.name }}</code></td>
                <td>{{ t.desc }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [
    `
      .tp-grid {
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: var(--mk-space-5);
        margin: var(--mk-space-4) 0 var(--mk-space-6);
      }
      @media (max-width: 720px) {
        .tp-grid { grid-template-columns: 1fr; }
      }
      .tp-controls {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-4);
        align-self: start;
      }
      .tp-field {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-medium);
        color: var(--mk-text);
      }
      .tp-field input[type='color'] {
        width: 100%;
        height: 34px;
        padding: 2px;
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-sm);
        background: var(--mk-surface);
        cursor: pointer;
      }
      .tp-field input[type='range'] {
        width: 100%;
        accent-color: var(--mk-primary);
      }
      .tp-preview {
        background: var(--mk-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        padding: var(--mk-space-6);
      }
      .tp-preview__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--mk-space-2);
      }
      .tp-preview__row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
        margin: var(--mk-space-4) 0;
      }
      .tp-muted {
        color: var(--mk-text-muted);
        margin: 0 0 var(--mk-space-4);
        font-size: var(--mk-font-size-sm);
      }
      .tp-toggle {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-3);
        margin: var(--mk-space-4) 0;
      }
      .tp-toggle__state {
        margin: 0;
      }
      /* The preset demo is a real subtree of the preset: its own bg, font
         and text colour come from the preset tokens, not the docs page. */
      .tp-preset {
        font-family: var(--mk-font-sans);
        color: var(--mk-text);
        margin: var(--mk-space-4) 0;
      }
      .tp-code {
        margin: var(--mk-space-3) 0 var(--mk-space-6);
        padding: var(--mk-space-4) var(--mk-space-5);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text);
        overflow-x: auto;
      }
    `,
  ],
})
export class ThemingPage {
  protected readonly theme = inject(MkThemeService);

  protected readonly contrastCode = `private readonly theme = inject(MkThemeService);

this.theme.contrast();         // 'normal' | 'high' | 'system'
this.theme.resolvedContrast(); // 'normal' | 'high' (system resolved)
this.theme.isHighContrast();   // computed boolean

this.theme.setContrast('high');
this.theme.toggleContrast();   // flip normal <-> high

/* or, per subtree, no service involved: */
<section data-mk-contrast="high">…</section>`;

  protected readonly presetCode = `/* styles.css */
@import '@mk-kit/ui/styles.css';
@import '@mk-kit/ui/presets/momentum.css';

<!-- index.html -->
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" />
<html data-mk-preset="momentum">

<!-- or just one region -->
<section data-mk-preset="momentum">…</section>`;

  protected readonly primary = signal('#4f46e5');
  protected readonly primaryHover = signal('#4338ca');
  protected readonly radius = signal(8);
  protected readonly fontSize = signal(14);
  protected readonly surface = signal('#ffffff');

  protected readonly generatedCss = computed(
    () => `:root {
  --mk-primary: ${this.primary()};
  --mk-primary-hover: ${this.primaryHover()};
  --mk-radius-md: ${this.radius()}px;
  --mk-font-size-md: ${this.fontSize()}px;
}`,
  );

  private value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
  protected setPrimary(e: Event): void { this.primary.set(this.value(e)); }
  protected setPrimaryHover(e: Event): void { this.primaryHover.set(this.value(e)); }
  protected setRadius(e: Event): void { this.radius.set(+this.value(e)); }
  protected setFontSize(e: Event): void { this.fontSize.set(+this.value(e)); }
  protected setSurface(e: Event): void { this.surface.set(this.value(e)); }

  protected reset(): void {
    this.primary.set('#4f46e5');
    this.primaryHover.set('#4338ca');
    this.radius.set(8);
    this.fontSize.set(14);
    this.surface.set('#ffffff');
  }

  protected readonly tokenGroups: TokenGroup[] = [
    {
      title: 'Surfaces & text',
      tokens: [
        { name: '--mk-bg', desc: 'App canvas background' },
        { name: '--mk-surface', desc: 'Card / panel background' },
        { name: '--mk-surface-2 / -3', desc: 'Raised & hover surfaces' },
        { name: '--mk-text', desc: 'Primary text color' },
        { name: '--mk-text-muted / -subtle', desc: 'Secondary & tertiary text' },
        { name: '--mk-text-inverse / -disabled', desc: 'Text on inverse surfaces & disabled text' },
        { name: '--mk-surface-inverse', desc: 'Inverted surface (tooltip & snackbar background)' },
        { name: '--mk-overlay-scrim', desc: 'Dimmed backdrop behind dialogs, drawers & sheets' },
        { name: '--mk-border / -strong / -subtle', desc: 'Divider & border colors' },
      ],
    },
    {
      title: 'Interaction states',
      tokens: [
        { name: '--mk-hover-overlay', desc: 'Translucent wash layered over any surface on hover' },
        { name: '--mk-active-overlay', desc: 'Stronger wash while pressed / active' },
        { name: '--mk-selected-bg / -text', desc: 'Background & text of selected options, rows and calendar days' },
      ],
    },
    {
      title: 'Semantic tones',
      tokens: [
        { name: '--mk-primary*', desc: 'Brand color family (+ hover, active, contrast, subtle, subtle-text)' },
        { name: '--mk-success*', desc: 'Positive / success family' },
        { name: '--mk-warning*', desc: 'Caution family' },
        { name: '--mk-danger*', desc: 'Destructive / error family' },
        { name: '--mk-danger-text', desc: 'Danger as TEXT on surfaces (error messages). Same as --mk-danger in light; lighter in dark, where the base danger is tuned for white button labels and falls below 4.5:1 as body text' },
        { name: '--mk-info*', desc: 'Informational family' },
        { name: '--mk-neutral-subtle*', desc: 'Neutral secondary family' },
        { name: '--mk-focus-ring', desc: 'Keyboard focus ring color' },
      ],
    },
    {
      title: 'Charts',
      tokens: [
        { name: '--mk-chart-1 … --mk-chart-8', desc: 'Validated colorblind-safe categorical palette, assigned by series index in fixed order (fold a 9th series into "Other" rather than cycling). Defined in three places — the light :root block, the OS-dark media block and [data-mk-theme="dark"] — so a re-theme must cover all three; dark uses its own validated values, not an auto-flip' },
        { name: '--mk-chart-grid / -axis', desc: 'Recessive chart chrome; alias --mk-border-subtle / --mk-text-subtle, so they re-resolve per theme' },
      ],
    },
    {
      title: 'Geometry & type',
      tokens: [
        { name: '--mk-space-0…16', desc: 'Spacing scale (4px base)' },
        { name: '--mk-radius-xs…2xl, -pill, -circle', desc: 'Corner radii' },
        { name: '--mk-control-height-sm|md|lg', desc: 'Input & button heights' },
        { name: '--mk-border-width / -strong', desc: 'Standard (1px) & emphasis (2px) border widths' },
        { name: '--mk-focus-ring-width / -offset', desc: 'Focus ring thickness & offset from the element' },
        { name: '--mk-font-sans / -mono', desc: 'Font families' },
        { name: '--mk-font-size-xs…4xl', desc: 'Type scale' },
        { name: '--mk-font-weight-*', desc: 'Font weights' },
        { name: '--mk-line-height-tight|snug|normal|relaxed', desc: 'Line heights (1.2 / 1.35 / 1.5 / 1.7)' },
        { name: '--mk-letter-spacing-tight|normal|wide', desc: 'Letter spacing' },
      ],
    },
    {
      title: 'Component surfaces',
      tokens: [
        { name: '--mk-skeleton-base / -shine', desc: 'Skeleton placeholder base & shimmer highlight' },
        { name: '--mk-scrollbar-thumb / -hover', desc: 'Themed scrollbar thumb (rest & hover)' },
        { name: '--mk-code-bg', desc: 'Background of code blocks & the code editor' },
      ],
    },
    {
      title: 'Elevation & motion',
      tokens: [
        { name: '--mk-shadow-xs…xl', desc: 'Elevation shadows (theme-aware)' },
        { name: '--mk-duration-*', desc: 'Animation durations' },
        { name: '--mk-ease-*', desc: 'Easing curves' },
        { name: '--mk-z-*', desc: 'Z-index layering scale' },
      ],
    },
    {
      title: 'Layout (admin shell)',
      tokens: [
        { name: '--mk-sidebar-width', desc: 'Expanded sidebar width' },
        { name: '--mk-sidebar-width-collapsed', desc: 'Collapsed rail width' },
        { name: '--mk-header-height', desc: 'App header height' },
      ],
    },
  ];
}
