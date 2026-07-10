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
  MkCardHeader,
  MkCardTitle,
  MkColorPicker,
  MkCopyToClipboard,
  MkInput,
  MkProgressBar,
  MkSwitch,
  MkTag,
} from '@mkornas/ui';
import { FormsModule } from '@angular/forms';

interface TokenControl {
  /** The `--mk-*` token this control drives. */
  token: string;
  label: string;
}

/**
 * Theme builder — an interactive playground that maps a handful of live controls
 * onto the library's `--mk-*` custom properties, previews real components with
 * the overrides applied, and emits a copy-pasteable `:root { … }` block.
 */
@Component({
  selector: 'docs-theme-builder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MkButton,
    MkCard,
    MkCardHeader,
    MkCardTitle,
    MkBadge,
    MkTag,
    MkAlert,
    MkSwitch,
    MkProgressBar,
    MkColorPicker,
    MkInput,
    MkCopyToClipboard,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Theme builder</h1>
      <p class="docs-lead">
        Tweak the core <code class="docs-inline">--mk-*</code> tokens and watch the
        components respond live. Copy the generated
        <code class="docs-inline">:root</code> block into your global stylesheet to
        apply the theme app-wide.
      </p>

      <div class="tb-grid">
        <!-- Controls -->
        <section class="tb-controls" aria-label="Theme controls">
          <h2>Colors</h2>
          @for (c of colorControls; track c.token) {
            <label class="tb-row">
              <span class="tb-label">{{ c.label }}</span>
              <mk-color-picker [(value)]="values[c.token]" />
            </label>
          }

          <h2>Shape &amp; type</h2>
          <label class="tb-row">
            <span class="tb-label">Radius ({{ values['--mk-radius-md'] }})</span>
            <input
              type="range"
              min="0"
              max="20"
              [ngModel]="radius()"
              (ngModelChange)="setRadius($event)"
            />
          </label>
          <label class="tb-row">
            <span class="tb-label">Base font ({{ values['--mk-font-size-md'] }})</span>
            <input
              type="range"
              min="12"
              max="20"
              [ngModel]="fontSize()"
              (ngModelChange)="setFontSize($event)"
            />
          </label>
          <label class="tb-row">
            <span class="tb-label">Control height ({{ values['--mk-control-height-md'] }})</span>
            <input
              type="range"
              min="30"
              max="52"
              [ngModel]="controlHeight()"
              (ngModelChange)="setControlHeight($event)"
            />
          </label>

          <button mkButton variant="ghost" (click)="reset()">Reset to defaults</button>
        </section>

        <!-- Live preview -->
        <section class="tb-preview" [style]="overrides()" aria-label="Live preview">
          <mk-card variant="elevated">
            <mk-card-header>
              <mk-card-title>Preview</mk-card-title>
              <mk-badge tone="success">Live</mk-badge>
            </mk-card-header>
            <p>These components inherit the tokens you set on the left.</p>
            <div class="tb-preview-row">
              <button mkButton>Primary</button>
              <button mkButton variant="outline">Outline</button>
              <button mkButton variant="ghost" tone="danger">Danger</button>
            </div>
            <div class="tb-preview-row">
              <mk-tag tone="info">Design</mk-tag>
              <mk-tag tone="success" variant="solid">Stable</mk-tag>
              <mk-switch [(checked)]="switchOn" />
            </div>
            <input mkInput placeholder="A themed input" />
            <mk-progress-bar [value]="64" />
            <mk-alert tone="info" title="Heads up">
              Alerts, badges and controls all pick up your overrides.
            </mk-alert>
          </mk-card>
        </section>
      </div>

      <h2>Generated CSS</h2>
      <p>
        Paste this into your global stylesheet (after importing the mk-kit theme)
        to apply the overrides everywhere.
      </p>
      <div class="tb-output">
        <button
          mkButton
          size="sm"
          class="tb-copy"
          [mkCopyToClipboard]="cssOutput()"
          #copy="mkCopyToClipboard"
        >
          {{ copy.justCopied() ? '✓ Copied' : 'Copy CSS' }}
        </button>
        <pre class="tb-code"><code>{{ cssOutput() }}</code></pre>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tb-grid {
        display: grid;
        grid-template-columns: minmax(0, 18rem) minmax(0, 1fr);
        gap: var(--mk-space-6);
        align-items: start;
      }
      @media (max-width: 48rem) {
        .tb-grid {
          grid-template-columns: 1fr;
        }
      }
      .tb-controls {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-3);
      }
      .tb-controls h2 {
        margin: var(--mk-space-2) 0 0;
        font-size: var(--mk-font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--mk-text-muted);
      }
      .tb-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--mk-space-3);
      }
      .tb-label {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text);
      }
      .tb-row input[type='range'] {
        flex: 1 1 8rem;
        max-width: 10rem;
        accent-color: var(--mk-primary);
      }
      .tb-preview {
        display: block;
      }
      .tb-preview-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-2);
        margin: var(--mk-space-3) 0;
      }
      .tb-preview mk-progress-bar {
        display: block;
        margin: var(--mk-space-3) 0;
      }
      .tb-output {
        position: relative;
      }
      .tb-copy {
        position: absolute;
        top: var(--mk-space-2);
        right: var(--mk-space-2);
      }
      .tb-code {
        margin: 0;
        padding: var(--mk-space-4);
        overflow-x: auto;
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text);
        background: var(--mk-surface-2);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
      }
    `,
  ],
})
export class ThemeBuilderPage {
  protected readonly switchOn = signal(true);

  private readonly defaults: Record<string, string> = {
    '--mk-primary': '#4f46e5',
    '--mk-surface': '#ffffff',
    '--mk-text': '#1f2933',
    '--mk-radius-md': '8px',
    '--mk-font-size-md': '15px',
    '--mk-control-height-md': '40px',
  };

  /** Mutable token values driving the preview + output. */
  protected readonly values: Record<string, string> = { ...this.defaults };

  protected readonly colorControls: TokenControl[] = [
    { token: '--mk-primary', label: 'Primary' },
    { token: '--mk-surface', label: 'Surface' },
    { token: '--mk-text', label: 'Text' },
  ];

  // Numeric mirrors for the range inputs (strip the px unit).
  protected readonly radius = signal(8);
  protected readonly fontSize = signal(15);
  protected readonly controlHeight = signal(40);
  private readonly tick = signal(0); // bumped so computeds re-run on mutation

  protected setRadius(v: number): void {
    this.radius.set(v);
    this.values['--mk-radius-md'] = `${v}px`;
    this.values['--mk-radius-sm'] = `${Math.max(0, v - 4)}px`;
    this.values['--mk-radius-lg'] = `${v + 4}px`;
    this.tick.update((n) => n + 1);
  }
  protected setFontSize(v: number): void {
    this.fontSize.set(v);
    this.values['--mk-font-size-md'] = `${v}px`;
    this.tick.update((n) => n + 1);
  }
  protected setControlHeight(v: number): void {
    this.controlHeight.set(v);
    this.values['--mk-control-height-md'] = `${v}px`;
    this.tick.update((n) => n + 1);
  }

  /** CSS-property object applied to the preview container. */
  protected readonly overrides = computed<Record<string, string>>(() => {
    this.tick();
    // Recompute whenever a color model (two-way) or a numeric setter changes.
    return { ...this.values };
  });

  /** The copy-pasteable `:root { … }` block. */
  protected readonly cssOutput = computed(() => {
    this.tick();
    const lines = Object.entries(this.values)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    return `:root {\n${lines}\n}`;
  });

  protected reset(): void {
    for (const k of Object.keys(this.values)) delete this.values[k];
    Object.assign(this.values, this.defaults);
    this.radius.set(8);
    this.fontSize.set(15);
    this.controlHeight.set(40);
    this.tick.update((n) => n + 1);
  }
}
