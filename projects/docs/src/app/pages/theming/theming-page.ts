import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  MkAlert,
  MkBadge,
  MkButton,
  MkCard,
  MkProgressBar,
  MkSwitch,
} from '@mkornas/ui';

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
        { name: '--mk-border / -strong / -subtle', desc: 'Divider & border colors' },
      ],
    },
    {
      title: 'Semantic tones',
      tokens: [
        { name: '--mk-primary*', desc: 'Brand color family (+ hover, active, contrast, subtle, subtle-text)' },
        { name: '--mk-success*', desc: 'Positive / success family' },
        { name: '--mk-warning*', desc: 'Caution family' },
        { name: '--mk-danger*', desc: 'Destructive / error family' },
        { name: '--mk-info*', desc: 'Informational family' },
        { name: '--mk-neutral-subtle*', desc: 'Neutral secondary family' },
        { name: '--mk-focus-ring', desc: 'Keyboard focus ring color' },
      ],
    },
    {
      title: 'Geometry & type',
      tokens: [
        { name: '--mk-space-0…16', desc: 'Spacing scale (4px base)' },
        { name: '--mk-radius-xs…2xl, -pill', desc: 'Corner radii' },
        { name: '--mk-control-height-sm|md|lg', desc: 'Input & button heights' },
        { name: '--mk-font-sans / -mono', desc: 'Font families' },
        { name: '--mk-font-size-xs…4xl', desc: 'Type scale' },
        { name: '--mk-font-weight-*', desc: 'Font weights' },
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
