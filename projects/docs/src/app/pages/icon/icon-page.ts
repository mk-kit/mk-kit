import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  MK_DEFAULT_ICONS,
  MK_EXTENDED_ICON_GROUPS,
  MkButton,
  MkIcon,
  MkIconRegistry,
  MkInput,
  MkToastService,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

type IconSet = 'all' | 'default' | 'extended';

/**
 * Documentation + live demo page for the `<mk-icon>` component and
 * `MkIconRegistry` of `@mk-kit/ui`.
 */
@Component({
  selector: 'docs-icon-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkIcon, MkButton, MkInput],
  template: `
    <div class="docs-page docs-container">
      <h1>Icon</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-icon&gt;</code> renders a registered SVG
        by <code class="docs-inline">name</code> or your own projected
        <code class="docs-inline">&lt;svg&gt;</code>. Glyphs inherit the current
        text colour (<code class="docs-inline">currentColor</code>) and scale to
        the <code class="docs-inline">size</code> box, so they drop cleanly into
        buttons, inputs and menus. Two sets ship in the package: a
        {{ defaultCount }}-icon <strong>default set</strong> that is always
        registered, and a {{ extendedCount }}-icon <strong>extended set</strong>
        derived from <a href="https://lucide.dev" target="_blank" rel="noopener">Lucide</a>
        (ISC) that you opt into — whole, by themed subset, or lazily — so an app
        only pays for the glyphs it uses. Extend or override any of them via
        <code class="docs-inline">MkIconRegistry</code>.
      </p>

      <!-- ============================================================ -->
      <h2>Default vs extended</h2>
      <p>
        Importing anything from <code class="docs-inline">&#64;mk-kit/ui/icon</code>
        used to cost ≈17 KiB (brotli) because both sets were registered eagerly.
        Now the whole <code class="docs-inline">icon</code> entry is ≈6.7 KiB —
        <code class="docs-inline">MkIcon</code> with the default set is ≈5.3 KiB —
        and the extended set is a separate, tree-shakeable entry point,
        <code class="docs-inline">&#64;mk-kit/ui/icon/extended</code>. Every
        map in it sits behind a pure-call annotation, so the bundler keeps only
        the maps you actually pass to a provider. Numbers come from the
        <a href="/cost">bundle cost</a> page.
      </p>
      <table class="docs-props">
        <thead>
          <tr><th>Option</th><th>How</th><th>Cost (brotli)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Default set</strong> ({{ defaultCount }})</td>
            <td>Automatic — hand-made core plus the few Lucide glyphs mk-kit's own components render.</td>
            <td>≈4.5 KiB, inside the ≈6.7 KiB <code>icon</code> entry</td>
          </tr>
          <tr>
            <td><strong>Extended set</strong> ({{ extendedCount }})</td>
            <td><code>provideMkExtendedIcons()</code></td>
            <td>+≈13 KiB</td>
          </tr>
          <tr>
            <td><strong>Themed subset</strong></td>
            <td><code>provideMkIcons(MK_EXTENDED_ICONS_FILES)</code> — one const per group, {{ groupNames.length }} groups</td>
            <td>+0.5–2.9 KiB each</td>
          </tr>
          <tr>
            <td><strong>Lazy</strong></td>
            <td><code>provideMkIcons(() => import('&#64;mk-kit/ui/icon/extended').then(m => m.MK_EXTENDED_ICONS))</code></td>
            <td>0 up front; ≈13 KiB in its own chunk, off the critical path</td>
          </tr>
          <tr>
            <td><strong>Your own SVGs</strong></td>
            <td><code>provideMkIcons({{ '{' }} logo: '&lt;svg…&gt;' {{ '}' }})</code> or <code>MkIconRegistry.register()</code></td>
            <td>just the markup</td>
          </tr>
        </tbody>
      </table>
      <pre class="docs-example__code"><code>{{ provideCode }}</code></pre>
      <p>
        Picking single names out of the full map
        (<code class="docs-inline">{{ '{' }} receipt: MK_EXTENDED_ICONS['receipt'] {{ '}' }}</code>)
        works but still bundles the whole map — use a subset or copy the SVG when
        size matters. A lazy loader never blocks bootstrap: icons already on
        screen fill in when the chunk lands, and server-side rendering waits for
        it. In dev mode an unknown name warns <em>once</em> in the console with
        a hint about <code class="docs-inline">provideMkExtendedIcons()</code>;
        production builds stay silent and render the projected fallback (or
        nothing).
      </p>
      <p>
        Via <code class="docs-inline">ng add &#64;mk-kit/ui --extended-icons</code>
        the schematic inserts <code class="docs-inline">provideMkExtendedIcons()</code>
        for you; the default is off. The
        <a href="/migration">PrimeNG migration</a> report mentions it too, since
        most <code class="docs-inline">pi pi-*</code> names live in the extended set.
      </p>

      <!-- ============================================================ -->
      <h2>Catalogue</h2>
      <p>
        Everything registered in this app — the docs opt into the whole extended
        set. Search by name; click an icon to copy its
        <code class="docs-inline">&lt;mk-icon&gt;</code> tag. The badge names the
        set (and, for extended icons, the themed subset const:
        <code class="docs-inline">MK_EXTENDED_ICONS_&lt;GROUP&gt;</code>).
      </p>
      <div class="icon-search">
        <input
          mkInput
          type="search"
          placeholder="Search icons… (e.g. chart, file, arrow)"
          aria-label="Search icons"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        <span class="icon-search__count" aria-live="polite">
          {{ filtered().length }} of {{ names.length }}
        </span>
      </div>
      <div class="icon-filters" role="group" aria-label="Icon set">
        @for (s of sets; track s.id) {
          <button
            mkButton
            size="sm"
            [variant]="set() === s.id ? 'solid' : 'outline'"
            [attr.aria-pressed]="set() === s.id"
            (click)="set.set(s.id)"
          >
            {{ s.label }}
          </button>
        }
      </div>
      <div class="icon-grid" role="list">
        @for (n of filtered(); track n) {
          <button
            type="button"
            class="icon-cell"
            role="listitem"
            [attr.aria-label]="'Copy ' + n + ' (' + setOf(n) + ')'"
            (click)="copy(n)"
          >
            <mk-icon [name]="n" size="lg" />
            <span class="icon-cell__name">{{ n }}</span>
            <span class="icon-cell__set" [class.icon-cell__set--default]="setOf(n) === 'default'">
              {{ setOf(n) }}
            </span>
          </button>
        } @empty {
          <p class="icon-grid__empty">No icon matches “{{ query() }}”.</p>
        }
      </div>
      <docs-example [code]="basicCode">
        <mk-icon name="search" size="lg" />
        <mk-icon name="layout-dashboard" size="lg" />
        <mk-icon name="file-spreadsheet" size="lg" />
        <mk-icon name="circle-help" size="lg" />
        <mk-icon name="receipt" size="lg" />
      </docs-example>

      <!-- ============================================================ -->
      <h2>Sizes &amp; colour</h2>
      <p>
        <code class="docs-inline">size</code> takes
        <code class="docs-inline">sm</code> / <code class="docs-inline">md</code>
        / <code class="docs-inline">lg</code> or a pixel number. Colour follows
        the surrounding text — set <code class="docs-inline">color</code> on any
        ancestor.
      </p>
      <docs-example [code]="sizeCode">
        <div style="display: flex; align-items: center; gap: var(--mk-space-4);">
          <mk-icon name="star" size="sm" />
          <mk-icon name="star" size="md" />
          <mk-icon name="star" size="lg" />
          <mk-icon name="star" [size]="40" />
          <mk-icon name="heart" size="lg" style="color: var(--mk-danger);" />
          <mk-icon name="success" size="lg" style="color: var(--mk-success);" />
          <mk-icon name="warning" size="lg" style="color: var(--mk-warning);" />
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>In buttons</h2>
      <p>Icons compose with buttons; pair with a label or use icon-only.</p>
      <docs-example [code]="buttonCode">
        <div style="display: flex; gap: var(--mk-space-3); flex-wrap: wrap; align-items: center;">
          <button mkButton>
            <mk-icon name="plus" /> New item
          </button>
          <button mkButton variant="outline" tone="danger">
            <mk-icon name="trash" /> Delete
          </button>
          <button mkButton variant="ghost" iconOnly aria-label="Settings">
            <mk-icon name="settings" />
          </button>
          <button mkButton variant="soft" tone="success">
            <mk-icon name="download" /> Export
          </button>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Registering your own</h2>
      <p>
        Inject <code class="docs-inline">MkIconRegistry</code> and register raw
        SVG markup (from a sprite, a design export, anything you control), or
        pass a map to <code class="docs-inline">provideMkIcons()</code> at
        bootstrap. Names are then available to every
        <code class="docs-inline">&lt;mk-icon&gt;</code> — including ones already
        on screen, which fill in as soon as the registration lands.
      </p>
      <docs-example [code]="registerCode">
        <mk-icon name="mk-logo" [size]="48" style="color: var(--mk-primary);" />
      </docs-example>
      <p>
        Accessibility: icons are <code class="docs-inline">aria-hidden</code> by
        default. Pass <code class="docs-inline">label</code> to expose a
        meaningful icon as <code class="docs-inline">role="img"</code>.
      </p>

      <!-- ============================================================ -->
      <h2>Material name aliases</h2>
      <p>
        Migrating from <code class="docs-inline">&lt;mat-icon&gt;</code>
        ligatures? <code class="docs-inline">provideMkMaterialIcons()</code>
        installs ~185 Material Symbols aliases onto the default set
        (<code class="docs-inline">delete → trash</code>,
        <code class="docs-inline">expand_more → chevron-down</code>,
        <code class="docs-inline">visibility → eye</code>,
        <code class="docs-inline">qr_code_scanner → qr-code</code>, …), so
        existing icon names keep working:
        <code class="docs-inline">&lt;mk-icon name="delete" /&gt;</code>.
        Every alias targets a default icon, so they work without the extended
        set. A real icon registered under an alias name always wins over the
        alias; an alias whose target is missing renders nothing and warns once
        in dev mode. See the <a href="/migration">Material migration guide</a>.
      </p>

      <!-- ============================================================ -->
      <h2>API</h2>

      <h3><code class="docs-inline">&lt;mk-icon&gt;</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>name</code></td><td><code>string</code></td><td><code>''</code></td><td>Name of a registered icon; when empty, projected <code>&lt;svg&gt;</code> content renders instead.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg' | number</code></td><td><code>'md'</code></td><td>Icon box size; a number is treated as pixels.</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible name. When set the icon becomes <code>role="img"</code>; otherwise it is <code>aria-hidden</code>.</td></tr>
        </tbody>
      </table>

      <h3>Providers</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Function</th><th>Entry point</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>provideMkIcons(map | loader)</code></td><td><code>&#64;mk-kit/ui/icon</code></td><td>Registers a <code>{{ '{' }} name: svg {{ '}' }}</code> map at bootstrap — a themed subset, your own SVGs, or a <code>() => Promise&lt;map&gt;</code> loader (dynamic import) that fills in without blocking bootstrap. Call it as often as you like.</td></tr>
          <tr><td><code>provideMkExtendedIcons()</code></td><td><code>&#64;mk-kit/ui/icon/extended</code></td><td>Registers the whole extended set (<code>MK_EXTENDED_ICONS</code>).</td></tr>
          <tr><td><code>provideMkMaterialIcons()</code></td><td><code>&#64;mk-kit/ui/icon</code></td><td>Installs the Material Symbols name aliases.</td></tr>
          <tr><td><code>MK_DEFAULT_ICONS</code>, <code>MK_EXTENDED_ICONS</code>, <code>MK_EXTENDED_ICONS_&lt;GROUP&gt;</code>, <code>MK_EXTENDED_ICON_GROUPS</code></td><td></td><td>The maps themselves — groups: {{ groupNames.join(', ') }}.</td></tr>
        </tbody>
      </table>

      <h3><code class="docs-inline">MkIconRegistry</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>register(name, svg)</code></td><td>Register (or overwrite) a single named icon from raw SVG markup. Returns the registry for chaining.</td></tr>
          <tr><td><code>registerIcons(icons)</code></td><td>Register many icons at once from a <code>{{ '{' }} name: svg {{ '}' }}</code> map — a whole set, a subset or a hand-picked few.</td></tr>
          <tr><td><code>registerAliases(aliases)</code></td><td>Alternative names that resolve to existing icons.</td></tr>
          <tr><td><code>load(loader)</code></td><td>Await an icon map (typically a dynamic import) and register it; SSR waits for it, the missing-icon warning stays quiet meanwhile.</td></tr>
          <tr><td><code>get(name)</code></td><td>Sanitized SVG for a name, or <code>null</code> when it is not registered.</td></tr>
          <tr><td><code>has(name)</code></td><td>Whether an icon with this name is registered.</td></tr>
          <tr><td><code>names()</code></td><td>All registered icon names (useful for a picker / catalogue).</td></tr>
          <tr><td><code>changes</code></td><td>Signal that bumps on every registration — <code>&lt;mk-icon&gt;</code> reads it to pick up late icons.</td></tr>
          <tr><td><code>pending</code></td><td>Signal: whether a <code>load()</code> is still in flight.</td></tr>
        </tbody>
      </table>
      <p>
        SVG markup passed to the registry is trusted verbatim — only register
        icons from sources you control, never user input.
      </p>
    </div>
  `,
  styles: [
    `
      .icon-search {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        margin-bottom: var(--mk-space-3);
      }
      .icon-search input {
        flex: 1 1 auto;
      }
      .icon-search__count {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        white-space: nowrap;
      }
      .icon-filters {
        display: flex;
        gap: var(--mk-space-2);
        margin-bottom: var(--mk-space-4);
      }
      button.icon-cell {
        font: inherit;
        color: inherit;
        background: var(--mk-surface);
        border: 1px solid var(--mk-border);
        cursor: pointer;
      }
      button.icon-cell:hover {
        border-color: var(--mk-primary);
      }
      button.icon-cell:focus-visible {
        outline: 2px solid var(--mk-focus-ring, var(--mk-primary));
        outline-offset: 2px;
      }
      .icon-grid__empty {
        grid-column: 1 / -1;
        color: var(--mk-text-muted);
      }

      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
        gap: var(--mk-space-2);
        width: 100%;
      }
      .icon-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mk-space-1);
        padding: var(--mk-space-3) var(--mk-space-2);
        border: var(--mk-border-width) solid var(--mk-border-subtle);
        border-radius: var(--mk-radius-md);
        color: var(--mk-text);
      }
      .icon-cell__name {
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-subtle);
        font-family: var(--mk-font-mono);
        word-break: break-all;
      }
      .icon-cell__set {
        font-size: 0.625rem;
        line-height: 1.4;
        padding: 0 var(--mk-space-2);
        border-radius: var(--mk-radius-pill);
        background: var(--mk-info-subtle);
        color: var(--mk-info-subtle-text);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .icon-cell__set--default {
        background: var(--mk-neutral-subtle);
        color: var(--mk-neutral-subtle-text);
      }
    `,
  ],
})
export class IconPage {
  private readonly toast = inject(MkToastService);
  private readonly registry = inject(MkIconRegistry);

  protected readonly sets: ReadonlyArray<{ id: IconSet; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'default', label: 'Default' },
    { id: 'extended', label: 'Extended' },
  ];
  protected readonly query = signal('');
  protected readonly set = signal<IconSet>('all');

  /** name → 'default' | extended group name */
  private readonly membership = new Map<string, string>();
  protected readonly groupNames = Object.keys(MK_EXTENDED_ICON_GROUPS);
  protected readonly defaultCount = Object.keys(MK_DEFAULT_ICONS).length;
  protected readonly extendedCount: number;
  protected readonly names: string[];

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const set = this.set();
    return this.names.filter((n) => {
      if (q && !n.includes(q)) return false;
      if (set === 'all') return true;
      const member = this.membership.get(n) ?? 'custom';
      return set === 'default' ? member === 'default' : member !== 'default' && member !== 'custom';
    });
  });

  constructor() {
    for (const n of Object.keys(MK_DEFAULT_ICONS)) this.membership.set(n, 'default');
    let extended = 0;
    for (const [group, icons] of Object.entries(MK_EXTENDED_ICON_GROUPS)) {
      for (const n of Object.keys(icons)) {
        this.membership.set(n, group);
        extended++;
      }
    }
    this.extendedCount = extended;
    // Demonstrate a custom registration (a tiny "mk" mark).
    this.registry.register(
      'mk-logo',
      '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4l8 9 8-9v16"/></svg>',
    );
    this.names = this.registry.names();
  }

  protected setOf(name: string): string {
    return this.membership.get(name) ?? 'custom';
  }

  protected async copy(name: string): Promise<void> {
    const tag = `<mk-icon name="${name}" />`;
    try {
      await navigator.clipboard.writeText(tag);
      this.toast.success(`Copied ${tag}`);
    } catch {
      this.toast.info(tag);
    }
  }

  protected readonly provideCode = `import { provideMkIcons } from '@mk-kit/ui/icon';
import {
  provideMkExtendedIcons,
  MK_EXTENDED_ICONS_FILES,
  MK_EXTENDED_ICONS_DATA,
} from '@mk-kit/ui/icon/extended';

bootstrapApplication(App, {
  providers: [
    // a) everything, eagerly (+≈13 KiB)
    provideMkExtendedIcons(),

    // b) only the themed subsets you use (+0.5–2.9 KiB each)
    provideMkIcons(MK_EXTENDED_ICONS_FILES),
    provideMkIcons(MK_EXTENDED_ICONS_DATA),

    // c) everything, lazily in its own chunk — icons fill in when it lands
    provideMkIcons(() =>
      import('@mk-kit/ui/icon/extended').then((m) => m.MK_EXTENDED_ICONS),
    ),

    // d) your own SVGs
    provideMkIcons({ logo: '<svg viewBox="0 0 24 24">…</svg>' }),
  ],
});`;

  protected readonly basicCode = `<mk-icon name="search" size="lg" />
<mk-icon name="layout-dashboard" size="lg" />
<mk-icon name="file-spreadsheet" size="lg" />
<mk-icon name="circle-help" size="lg" />
<mk-icon name="receipt" size="lg" />`;

  protected readonly sizeCode = `<mk-icon name="star" size="sm" />
<mk-icon name="star" size="lg" />
<mk-icon name="star" [size]="40" />
<mk-icon name="heart" style="color: var(--mk-danger)" />`;

  protected readonly buttonCode = `<button mkButton><mk-icon name="plus" /> New item</button>
<button mkButton variant="ghost" iconOnly aria-label="Settings">
  <mk-icon name="settings" />
</button>`;

  protected readonly registerCode = `const registry = inject(MkIconRegistry);
registry.register('mk-logo',
  '<svg viewBox="0 0 24 24" …><path d="M4 20V4l8 9 8-9v16"/></svg>');

// or at bootstrap:
provideMkIcons({ 'mk-logo': '<svg viewBox="0 0 24 24" …>…</svg>' })

// then anywhere:
<mk-icon name="mk-logo" [size]="48" />`;
}
