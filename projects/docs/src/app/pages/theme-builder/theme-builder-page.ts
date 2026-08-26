import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  MkAlert,
  MkBadge,
  MkButton,
  MkButtonToggle,
  MkButtonToggleGroup,
  MkCard,
  MkCardHeader,
  MkCardTitle,
  MkCheckbox,
  MkChip,
  MkColorPicker,
  MkCopyToClipboard,
  MkFormField,
  MkInput,
  MkProgressBar,
  MkSelect,
  MkSwitch,
  MkTab,
  MkTable,
  MkTabs,
  type MkSelectOption,
  type MkTableColumn,
} from '@mk-kit/ui';

type TokenMap = Record<string, string>;

interface ColorControl {
  /** The `--mk-*` token this control drives. */
  token: string;
  label: string;
}

interface RangeControl {
  token: string;
  label: string;
  min: number;
  max: number;
  /** Unit the token is declared in. Sliders always operate in px. */
  unit: 'px' | 'rem';
}

/* ---------------------------------------------------------------------------
 * Defaults — hardcoded copies of what projects/mk-kit/src/styles/mk-kit.scss
 * actually declares, so the exported diff is accurate. Keep in sync.
 * ------------------------------------------------------------------------- */

/** Brand & tone colors — shared between light and dark (the library declares
 *  dark variants for all of these, so edits are exported into both blocks). */
const SHARED_DEFAULTS: TokenMap = {
  '--mk-primary': '#4f46e5',
  '--mk-primary-hover': '#4338ca',
  '--mk-primary-active': '#3730a3',
  '--mk-primary-contrast': '#ffffff',
  '--mk-primary-subtle': '#eef2ff',
  '--mk-success': '#15803d',
  '--mk-warning': '#b45309',
  '--mk-danger': '#dc2626',
  '--mk-info': '#0369a1',
  '--mk-focus-ring': 'rgba(79, 70, 229, 0.5)',
};

/** Surfaces & text — edited per mode. Light values from `:root`. */
const LIGHT_MODE_DEFAULTS: TokenMap = {
  '--mk-bg': '#f5f6f8',
  '--mk-surface': '#ffffff',
  '--mk-surface-2': '#f1f3f5',
  '--mk-surface-3': '#e8ebee',
  '--mk-border': '#e3e6eb',
  '--mk-text': '#1a1d23',
  '--mk-text-muted': '#56606e',
  '--mk-text-subtle': '#8b95a3',
};

/** Dark values from the `$mk-dark` map / `[data-mk-theme='dark']`. */
const DARK_MODE_DEFAULTS: TokenMap = {
  '--mk-bg': '#0d1117',
  '--mk-surface': '#161b22',
  '--mk-surface-2': '#1e252e',
  '--mk-surface-3': '#2a323c',
  '--mk-border': '#2a323c',
  '--mk-text': '#e6edf3',
  '--mk-text-muted': '#9aa5b1',
  '--mk-text-subtle': '#6e7a8a',
};

/** Geometry & type — theme-independent (`:root` only, no dark override). */
const GEOMETRY_DEFAULTS: TokenMap = {
  '--mk-radius-sm': '5px',
  '--mk-radius-md': '8px',
  '--mk-radius-lg': '12px',
  '--mk-radius-pill': '999px',
  '--mk-font-sans':
    "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'",
  '--mk-font-size-sm': '0.8125rem',
  '--mk-font-size-md': '0.875rem',
  '--mk-font-size-lg': '1rem',
  '--mk-control-height-sm': '30px',
  '--mk-control-height-md': '38px',
  '--mk-control-height-lg': '46px',
  '--mk-focus-ring-width': '2px',
  '--mk-focus-ring-offset': '2px',
  '--mk-space-2': '0.5rem',
  '--mk-space-3': '0.75rem',
  '--mk-space-4': '1rem',
};

/**
 * The rest of the light palette (not editable here). Applied inline to the
 * light preview panel so it stays light even when the docs site itself is in
 * dark mode — the library only declares light values on `:root`, which the
 * site's dark override would otherwise shadow.
 */
const LIGHT_EXTRAS: TokenMap = {
  'color-scheme': 'light',
  '--mk-surface-inverse': '#1a1d23',
  '--mk-overlay-scrim': 'rgba(17, 20, 26, 0.45)',
  '--mk-text-inverse': '#ffffff',
  '--mk-text-disabled': '#adb5c0',
  '--mk-border-strong': '#cbd1d9',
  '--mk-border-subtle': '#eef0f3',
  '--mk-hover-overlay': 'rgba(17, 20, 26, 0.04)',
  '--mk-active-overlay': 'rgba(17, 20, 26, 0.08)',
  '--mk-selected-bg': '#eef2ff',
  '--mk-selected-text': '#3730a3',
  '--mk-primary-subtle-hover': '#e0e7ff',
  '--mk-primary-subtle-text': '#3730a3',
  '--mk-success-hover': '#166534',
  '--mk-success-contrast': '#ffffff',
  '--mk-success-subtle': '#e7f6ec',
  '--mk-success-subtle-text': '#14622f',
  '--mk-warning-hover': '#92400e',
  '--mk-warning-contrast': '#ffffff',
  '--mk-warning-subtle': '#fdf1e3',
  '--mk-warning-subtle-text': '#92400e',
  '--mk-danger-hover': '#b91c1c',
  '--mk-danger-contrast': '#ffffff',
  '--mk-danger-subtle': '#fdeaea',
  '--mk-danger-subtle-text': '#b3201a',
  '--mk-info-hover': '#075985',
  '--mk-info-contrast': '#ffffff',
  '--mk-info-subtle': '#e5f3fb',
  '--mk-info-subtle-text': '#075985',
  '--mk-neutral-subtle': '#eff1f4',
  '--mk-neutral-subtle-hover': '#e5e8ec',
  '--mk-neutral-subtle-text': '#3a424e',
  '--mk-shadow-xs': '0 1px 2px rgba(17, 20, 26, 0.06)',
  '--mk-shadow-sm':
    '0 1px 3px rgba(17, 20, 26, 0.08), 0 1px 2px rgba(17, 20, 26, 0.04)',
  '--mk-shadow-md':
    '0 4px 12px rgba(17, 20, 26, 0.1), 0 2px 4px rgba(17, 20, 26, 0.05)',
  '--mk-shadow-lg':
    '0 12px 28px rgba(17, 20, 26, 0.14), 0 4px 8px rgba(17, 20, 26, 0.06)',
  '--mk-shadow-xl':
    '0 24px 48px rgba(17, 20, 26, 0.2), 0 8px 16px rgba(17, 20, 26, 0.08)',
};

/** Tokens changed from their defaults, preserving declaration order. */
function diffTokens(current: TokenMap, defaults: TokenMap): [string, string][] {
  return Object.keys(defaults)
    .filter((k) => current[k] !== defaults[k])
    .map((k) => [k, current[k]] as [string, string]);
}

function toCssBlock(selector: string, entries: [string, string][]): string {
  const lines = entries.map(([k, v]) => `  ${k}: ${v};`).join('\n');
  return `${selector} {\n${lines}\n}`;
}

/**
 * Representative component gallery rendered once per preview panel. Owns its
 * own interactive state so the light and dark instances behave independently.
 */
@Component({
  selector: 'docs-tb-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MkAlert,
    MkBadge,
    MkButton,
    MkCard,
    MkCardHeader,
    MkCardTitle,
    MkCheckbox,
    MkChip,
    MkFormField,
    MkInput,
    MkProgressBar,
    MkSelect,
    MkSwitch,
    MkTab,
    MkTable,
    MkTabs,
  ],
  template: `
    <mk-card variant="elevated">
      <mk-card-header>
        <mk-card-title>Team billing</mk-card-title>
        <mk-badge tone="success" variant="soft">Active</mk-badge>
      </mk-card-header>

      <div class="g-row">
        <button mkButton tone="primary">Save</button>
        <button mkButton tone="neutral" variant="soft">Cancel</button>
        <button mkButton tone="success">Approve</button>
        <button mkButton tone="warning" variant="soft">Hold</button>
        <button mkButton tone="danger" variant="outline">Delete</button>
        <button mkButton tone="info" variant="ghost">Details</button>
      </div>

      <mk-tabs variant="line" class="g-tabs">
        <mk-tab label="Profile">
          <div class="g-fields">
            <mk-form-field label="Workspace name" hint="Shown in the header.">
              <input mkInput placeholder="Acme Inc." />
            </mk-form-field>
            <mk-select
              placeholder="Choose a plan"
              [options]="planOptions"
              [(value)]="plan"
            />
            <div class="g-row">
              <mk-checkbox [(checked)]="receipts">Email receipts</mk-checkbox>
              <mk-switch [(checked)]="notify">Notifications</mk-switch>
            </div>
          </div>
        </mk-tab>
        <mk-tab label="Usage">
          <div class="g-fields">
            <mk-progress-bar
              [value]="72"
              tone="primary"
              [showValue]="true"
              label="Storage"
            />
            <div class="g-row">
              <mk-chip
                tone="primary"
                selectable
                [selected]="chipOn()"
                (selectedChange)="chipOn.set($event)"
              >
                Filters
              </mk-chip>
              <mk-chip tone="neutral">Last 30 days</mk-chip>
              <mk-badge tone="warning" variant="soft">Beta</mk-badge>
            </div>
          </div>
        </mk-tab>
      </mk-tabs>

      <mk-alert tone="info" title="Heads up">
        Every color, radius and size here comes from your tokens.
      </mk-alert>

      <mk-table [columns]="columns" [data]="rows" zebra />
    </mk-card>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: var(--mk-space-5);
        background: var(--mk-bg);
        color: var(--mk-text);
        font-family: var(--mk-font-sans);
        font-size: var(--mk-font-size-md);
        line-height: var(--mk-line-height-normal);
      }
      .g-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-2);
        margin: var(--mk-space-3) 0;
      }
      .g-tabs {
        display: block;
        margin: var(--mk-space-3) 0;
      }
      .g-fields {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-3);
        margin-top: var(--mk-space-3);
      }
      mk-alert {
        display: block;
        margin: var(--mk-space-3) 0;
      }
    `,
  ],
})
export class ThemeBuilderGallery {
  protected readonly plan = signal<unknown>(null);
  protected readonly receipts = signal(true);
  protected readonly notify = signal(true);
  protected readonly chipOn = signal(true);

  protected readonly planOptions: readonly MkSelectOption[] = [
    { label: 'Starter', value: 'starter' },
    { label: 'Pro', value: 'pro' },
    { label: 'Enterprise', value: 'enterprise' },
  ];

  protected readonly columns: MkTableColumn[] = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
    { key: 'amount', header: 'Amount' },
  ];
  protected readonly rows = [
    { name: 'Starter', status: 'Active', amount: '$29' },
    { name: 'Pro', status: 'Trialing', amount: '$79' },
    { name: 'Enterprise', status: 'Paused', amount: '$290' },
  ];
}

/**
 * Theme builder — a visual token generator. Grouped controls drive the ~30
 * highest-impact `--mk-*` tokens, a scoped light + dark preview shows real
 * components with the overrides applied, and the diff against the library
 * defaults is exported as a ready-to-drop-in `tokens.css`.
 */
@Component({
  selector: 'docs-theme-builder-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MkButton,
    MkButtonToggle,
    MkButtonToggleGroup,
    MkColorPicker,
    MkCopyToClipboard,
    MkInput,
    ThemeBuilderGallery,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Theme builder</h1>
      <p class="docs-lead">
        Everything visual in mk-kit is driven by
        <code class="docs-inline">--mk-*</code> CSS custom properties — override
        a token and every component follows, no recompilation. Compose your
        theme below and leave with a drop-in
        <code class="docs-inline">tokens.css</code> containing only the values
        you changed.
      </p>

      <div class="tb-layout">
        <div class="tb-controls">
          <h2>Brand &amp; tones</h2>
          <p class="tb-hint">
            Shared between light and dark — exported into both the
            <code class="docs-inline">:root</code> and
            <code class="docs-inline">[data-mk-theme='dark']</code> blocks.
          </p>
          <div class="tb-grid">
            @for (c of brandControls; track c.token) {
              <div class="tb-control">
                <span class="tb-control__label">{{ c.label }}</span>
                <mk-color-picker
                  size="sm"
                  [value]="shared()[c.token]"
                  (valueChange)="setShared(c.token, $event)"
                  [ariaLabel]="c.label"
                />
                <code class="tb-control__token">{{ c.token }}</code>
              </div>
            }
          </div>

          <h2>Surfaces &amp; text</h2>
          <p class="tb-hint">
            Edited independently per mode — pick which mode the controls below
            apply to.
          </p>
          <mk-button-toggle-group
            [(value)]="editModeValue"
            aria-label="Which mode the surface controls edit"
          >
            <mk-button-toggle value="light">Light</mk-button-toggle>
            <mk-button-toggle value="dark">Dark</mk-button-toggle>
          </mk-button-toggle-group>
          <div class="tb-grid">
            @for (c of modeControls; track c.token) {
              <div class="tb-control">
                <span class="tb-control__label">
                  {{ c.label }} ({{ isDarkEdit() ? 'dark' : 'light' }})
                </span>
                <mk-color-picker
                  size="sm"
                  [value]="activeMode()[c.token]"
                  (valueChange)="setMode(c.token, $event)"
                  [ariaLabel]="c.label"
                />
                <code class="tb-control__token">{{ c.token }}</code>
              </div>
            }
          </div>

          <h2>Shape &amp; type</h2>
          <div class="tb-control tb-control--wide">
            <span class="tb-control__label">Font family</span>
            <input
              mkInput
              [value]="geometry()['--mk-font-sans']"
              (input)="setFontFamily($event)"
              aria-label="Font family"
            />
            <code class="tb-control__token">--mk-font-sans</code>
          </div>
          <div class="tb-grid">
            @for (c of shapeRanges; track c.token) {
              <div class="tb-control">
                <span class="tb-control__label">
                  {{ c.label }} — {{ geometry()[c.token] }}
                </span>
                <input
                  type="range"
                  [min]="c.min"
                  [max]="c.max"
                  [value]="rangeValue(c)"
                  (input)="setRange(c, $event)"
                  [attr.aria-label]="c.label"
                />
                <code class="tb-control__token">{{ c.token }}</code>
              </div>
            }
          </div>

          <h2>Focus &amp; spacing</h2>
          <div class="tb-grid">
            <div class="tb-control">
              <span class="tb-control__label">Focus ring color</span>
              <mk-color-picker
                size="sm"
                [value]="shared()['--mk-focus-ring']"
                (valueChange)="setShared('--mk-focus-ring', $event)"
                ariaLabel="Focus ring color"
              />
              <code class="tb-control__token">--mk-focus-ring</code>
            </div>
            @for (c of focusSpacingRanges; track c.token) {
              <div class="tb-control">
                <span class="tb-control__label">
                  {{ c.label }} — {{ geometry()[c.token] }}
                </span>
                <input
                  type="range"
                  [min]="c.min"
                  [max]="c.max"
                  [value]="rangeValue(c)"
                  (input)="setRange(c, $event)"
                  [attr.aria-label]="c.label"
                />
                <code class="tb-control__token">{{ c.token }}</code>
              </div>
            }
          </div>
        </div>

        <aside class="tb-rail">
          <h2>Live preview</h2>
          <p class="tb-hint">
            Tokens are applied to these panels only — exactly how a scoped
            theme works in your own app. The dark panel is a
            <code class="docs-inline">data-mk-theme="dark"</code> subtree with
            your edits layered on top.
          </p>
          <div class="tb-panels">
            <section>
              <h3 class="tb-panel-title">Light</h3>
              <div class="tb-panel" data-mk-theme="light" [style]="lightStyles()">
                <docs-tb-gallery />
              </div>
            </section>
            <section>
              <h3 class="tb-panel-title">Dark</h3>
              <div class="tb-panel" data-mk-theme="dark" [style]="darkStyles()">
                <docs-tb-gallery />
              </div>
            </section>
          </div>
        </aside>
      </div>

      <h2>Generated CSS</h2>
      <p>
        Only tokens you changed are included — shared and light values go in the
        <code class="docs-inline">:root</code> block, dark values (plus shared
        tones, which the dark theme re-declares) in
        <code class="docs-inline">[data-mk-theme='dark']</code>. Load it after
        the mk-kit stylesheet.
      </p>
      <div class="tb-actions">
        <button
          mkButton
          size="sm"
          [mkCopyToClipboard]="cssDisplay()"
          #copy="mkCopyToClipboard"
        >
          {{ copy.justCopied() ? 'Copied ✓' : 'Copy CSS' }}
        </button>
        <button mkButton size="sm" variant="outline" (click)="download()">
          Download tokens.css
        </button>
        <button
          mkButton
          size="sm"
          variant="ghost"
          tone="neutral"
          (click)="reset()"
        >
          Reset all
        </button>
        <span class="tb-count">
          {{ changedCount() }} token{{ changedCount() === 1 ? '' : 's' }} changed
        </span>
      </div>
      <pre class="tb-code"><code>{{ cssDisplay() }}</code></pre>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tb-layout {
        display: grid;
        grid-template-columns: minmax(0, 23rem) minmax(0, 1fr);
        gap: var(--mk-space-8);
        align-items: start;
      }
      @media (max-width: 64rem) {
        .tb-layout {
          grid-template-columns: 1fr;
        }
        .tb-rail {
          position: static;
          max-height: none;
          overflow: visible;
        }
      }
      .tb-rail {
        position: sticky;
        top: 84px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-right: var(--mk-space-1);
      }
      .tb-rail h2 {
        margin-top: var(--mk-space-2);
      }
      .tb-hint {
        margin: var(--mk-space-1) 0 var(--mk-space-3);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .tb-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
        gap: var(--mk-space-4) var(--mk-space-4);
        margin: var(--mk-space-3) 0 var(--mk-space-5);
      }
      mk-button-toggle-group {
        margin-bottom: var(--mk-space-2);
      }
      .tb-control {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-1);
        min-width: 0;
      }
      .tb-control--wide {
        margin: var(--mk-space-3) 0;
      }
      .tb-control__label {
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-medium);
        color: var(--mk-text);
      }
      .tb-control__token {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-subtle);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tb-control input[type='range'] {
        width: 100%;
        margin: var(--mk-space-2) 0;
        accent-color: var(--mk-primary);
      }
      .tb-panels {
        display: flex;
        flex-direction: column;
        gap: var(--mk-space-4);
      }
      .tb-panel-title {
        margin: 0 0 var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--mk-text-muted);
      }
      .tb-panel {
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        overflow: hidden;
      }
      .tb-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-2);
        margin: var(--mk-space-3) 0;
      }
      .tb-count {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .tb-code {
        margin: 0 0 var(--mk-space-6);
        padding: var(--mk-space-4) var(--mk-space-5);
        overflow-x: auto;
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
      }
    `,
  ],
})
export class ThemeBuilderPage {
  private readonly document = inject(DOCUMENT);

  /* --- Editable state ----------------------------------------------------- */
  protected readonly shared = signal<TokenMap>({ ...SHARED_DEFAULTS });
  protected readonly lightMode = signal<TokenMap>({ ...LIGHT_MODE_DEFAULTS });
  protected readonly darkMode = signal<TokenMap>({ ...DARK_MODE_DEFAULTS });
  protected readonly geometry = signal<TokenMap>({ ...GEOMETRY_DEFAULTS });

  /** Which mode the surface/text controls edit. */
  protected readonly editModeValue = signal<unknown>('light');
  protected readonly isDarkEdit = computed(
    () => this.editModeValue() === 'dark',
  );
  protected readonly activeMode = computed(() =>
    this.isDarkEdit() ? this.darkMode() : this.lightMode(),
  );

  /* --- Control definitions ------------------------------------------------- */
  protected readonly brandControls: ColorControl[] = [
    { token: '--mk-primary', label: 'Primary' },
    { token: '--mk-primary-hover', label: 'Primary hover' },
    { token: '--mk-primary-active', label: 'Primary active' },
    { token: '--mk-primary-contrast', label: 'Primary contrast' },
    { token: '--mk-primary-subtle', label: 'Primary subtle' },
    { token: '--mk-success', label: 'Success' },
    { token: '--mk-warning', label: 'Warning' },
    { token: '--mk-danger', label: 'Danger' },
    { token: '--mk-info', label: 'Info' },
  ];

  protected readonly modeControls: ColorControl[] = [
    { token: '--mk-bg', label: 'Background' },
    { token: '--mk-surface', label: 'Surface' },
    { token: '--mk-surface-2', label: 'Surface 2' },
    { token: '--mk-surface-3', label: 'Surface 3' },
    { token: '--mk-border', label: 'Border' },
    { token: '--mk-text', label: 'Text' },
    { token: '--mk-text-muted', label: 'Text muted' },
    { token: '--mk-text-subtle', label: 'Text subtle' },
  ];

  protected readonly shapeRanges: RangeControl[] = [
    { token: '--mk-radius-sm', label: 'Radius sm', min: 0, max: 12, unit: 'px' },
    { token: '--mk-radius-md', label: 'Radius md', min: 0, max: 24, unit: 'px' },
    { token: '--mk-radius-lg', label: 'Radius lg', min: 0, max: 32, unit: 'px' },
    {
      token: '--mk-radius-pill',
      label: 'Radius pill (full)',
      min: 0,
      max: 999,
      unit: 'px',
    },
    {
      token: '--mk-font-size-sm',
      label: 'Font size sm',
      min: 11,
      max: 16,
      unit: 'rem',
    },
    {
      token: '--mk-font-size-md',
      label: 'Font size md',
      min: 12,
      max: 18,
      unit: 'rem',
    },
    {
      token: '--mk-font-size-lg',
      label: 'Font size lg',
      min: 14,
      max: 22,
      unit: 'rem',
    },
    {
      token: '--mk-control-height-sm',
      label: 'Control height sm',
      min: 24,
      max: 36,
      unit: 'px',
    },
    {
      token: '--mk-control-height-md',
      label: 'Control height md',
      min: 30,
      max: 48,
      unit: 'px',
    },
    {
      token: '--mk-control-height-lg',
      label: 'Control height lg',
      min: 36,
      max: 56,
      unit: 'px',
    },
  ];

  protected readonly focusSpacingRanges: RangeControl[] = [
    {
      token: '--mk-focus-ring-width',
      label: 'Focus ring width',
      min: 1,
      max: 5,
      unit: 'px',
    },
    {
      token: '--mk-focus-ring-offset',
      label: 'Focus ring offset',
      min: 0,
      max: 6,
      unit: 'px',
    },
    { token: '--mk-space-2', label: 'Space 2', min: 4, max: 14, unit: 'rem' },
    { token: '--mk-space-3', label: 'Space 3', min: 8, max: 20, unit: 'rem' },
    { token: '--mk-space-4', label: 'Space 4', min: 10, max: 28, unit: 'rem' },
  ];

  /* --- Updates -------------------------------------------------------------- */
  protected setShared(token: string, value: string): void {
    this.shared.update((m) => ({ ...m, [token]: value }));
  }

  protected setMode(token: string, value: string): void {
    const target = this.isDarkEdit() ? this.darkMode : this.lightMode;
    target.update((m) => ({ ...m, [token]: value }));
  }

  protected setFontFamily(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.geometry.update((m) => ({ ...m, '--mk-font-sans': value }));
  }

  /** Slider position (always px) for a geometry token declared in px or rem. */
  protected rangeValue(c: RangeControl): number {
    const raw = this.geometry()[c.token];
    const n = parseFloat(raw);
    return raw.endsWith('rem') ? Math.round(n * 16) : n;
  }

  protected setRange(c: RangeControl, event: Event): void {
    const px = +(event.target as HTMLInputElement).value;
    const value = c.unit === 'rem' ? `${px / 16}rem` : `${px}px`;
    this.geometry.update((m) => ({ ...m, [c.token]: value }));
  }

  protected reset(): void {
    this.shared.set({ ...SHARED_DEFAULTS });
    this.lightMode.set({ ...LIGHT_MODE_DEFAULTS });
    this.darkMode.set({ ...DARK_MODE_DEFAULTS });
    this.geometry.set({ ...GEOMETRY_DEFAULTS });
  }

  /* --- Derived state ---------------------------------------------------------- */
  private readonly sharedDiff = computed(() =>
    diffTokens(this.shared(), SHARED_DEFAULTS),
  );
  private readonly lightDiff = computed(() =>
    diffTokens(this.lightMode(), LIGHT_MODE_DEFAULTS),
  );
  private readonly darkDiff = computed(() =>
    diffTokens(this.darkMode(), DARK_MODE_DEFAULTS),
  );
  private readonly geometryDiff = computed(() =>
    diffTokens(this.geometry(), GEOMETRY_DEFAULTS),
  );

  protected readonly changedCount = computed(
    () =>
      this.sharedDiff().length +
      this.lightDiff().length +
      this.darkDiff().length +
      this.geometryDiff().length,
  );

  /** Inline custom-property record for the light preview panel. */
  protected readonly lightStyles = computed<Record<string, string>>(() => ({
    ...LIGHT_EXTRAS,
    ...this.shared(),
    ...this.lightMode(),
    ...this.geometry(),
  }));

  /**
   * Inline record for the dark panel. `data-mk-theme="dark"` supplies the full
   * dark defaults via the library stylesheet, so only user edits are layered:
   * shared brand edits (which would otherwise be shadowed by the dark theme's
   * own declarations), the dark surface/text values and geometry.
   */
  protected readonly darkStyles = computed<Record<string, string>>(() => ({
    ...Object.fromEntries(this.sharedDiff()),
    ...this.darkMode(),
    ...this.geometry(),
  }));

  /** The exported stylesheet — only tokens changed from the library defaults. */
  protected readonly cssOutput = computed(() => {
    const rootEntries = [
      ...this.sharedDiff(),
      ...this.lightDiff(),
      ...this.geometryDiff(),
    ];
    // The dark theme re-declares every shared brand/tone token, so shared
    // edits must be repeated there or dark mode would revert to the defaults.
    const darkEntries = [...this.sharedDiff(), ...this.darkDiff()];

    const blocks: string[] = [];
    if (rootEntries.length) blocks.push(toCssBlock(':root', rootEntries));
    if (darkEntries.length) {
      blocks.push(toCssBlock("[data-mk-theme='dark']", darkEntries));
    }
    return blocks.join('\n\n');
  });

  protected readonly cssDisplay = computed(
    () =>
      this.cssOutput() ||
      '/* No overrides yet — change a token to generate CSS. */',
  );

  protected download(): void {
    const blob = new Blob([this.cssDisplay() + '\n'], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = this.document.createElement('a');
    a.href = url;
    a.download = 'tokens.css';
    a.click();
    URL.revokeObjectURL(url);
  }
}
