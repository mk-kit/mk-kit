import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MkButton, MkIcon, MkIconRegistry } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the `<mk-icon>` component and
 * `MkIconRegistry` of `@mkornas/ui`.
 */
@Component({
  selector: 'docs-icon-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkIcon, MkButton],
  template: `
    <div class="docs-page docs-container">
      <h1>Icon</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-icon&gt;</code> renders a registered SVG
        by <code class="docs-inline">name</code> or your own projected
        <code class="docs-inline">&lt;svg&gt;</code>. Glyphs inherit the current
        text colour (<code class="docs-inline">currentColor</code>) and scale to
        the <code class="docs-inline">size</code> box, so they drop cleanly into
        buttons, inputs and menus. A default Feather-style set ships built in;
        extend it via <code class="docs-inline">MkIconRegistry</code>.
      </p>

      <!-- ============================================================ -->
      <h2>Built-in set</h2>
      <p>
        {{ names.length }} icons are registered out of the box. Reference any by
        name.
      </p>
      <docs-example [code]="basicCode" column>
        <div class="icon-grid">
          @for (n of names; track n) {
            <div class="icon-cell">
              <mk-icon [name]="n" size="lg" />
              <span class="icon-cell__name">{{ n }}</span>
            </div>
          }
        </div>
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
        SVG markup (from a sprite, a design export, anything you control). Names
        are then available to every <code class="docs-inline">&lt;mk-icon&gt;</code>.
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
        installs ~185 Material Symbols aliases onto the built-in set
        (<code class="docs-inline">delete → trash</code>,
        <code class="docs-inline">expand_more → chevron-down</code>,
        <code class="docs-inline">visibility → eye</code>,
        <code class="docs-inline">qr_code_scanner → qr-code</code>, …), so
        existing icon names keep working:
        <code class="docs-inline">&lt;mk-icon name="delete" /&gt;</code>.
        A real icon registered under an alias name always wins over the
        alias. See the <a href="/migration">Material migration guide</a>.
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

      <h3><code class="docs-inline">MkIconRegistry</code></h3>
      <table class="docs-props">
        <thead>
          <tr><th>Method</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>register(name, svg)</code></td><td>Register (or overwrite) a single named icon from raw SVG markup. Returns the registry for chaining.</td></tr>
          <tr><td><code>registerIcons(icons)</code></td><td>Register many icons at once from a <code>{{ '{' }} name: svg {{ '}' }}</code> map.</td></tr>
          <tr><td><code>get(name)</code></td><td>Sanitized SVG for a name, or <code>null</code> when it is not registered.</td></tr>
          <tr><td><code>has(name)</code></td><td>Whether an icon with this name is registered.</td></tr>
          <tr><td><code>names()</code></td><td>All registered icon names (useful for a picker / catalogue).</td></tr>
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
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
        gap: var(--mk-space-2);
        width: 100%;
      }
      .icon-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--mk-space-2);
        padding: var(--mk-space-3) var(--mk-space-2);
        border: var(--mk-border-width) solid var(--mk-border-subtle);
        border-radius: var(--mk-radius-md);
        color: var(--mk-text);
      }
      .icon-cell__name {
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-subtle);
        font-family: var(--mk-font-mono);
      }
    `,
  ],
})
export class IconPage {
  private readonly registry = inject(MkIconRegistry);
  protected readonly names = this.registry.names();

  constructor() {
    // Demonstrate a custom registration (a tiny "mk" mark).
    this.registry.register(
      'mk-logo',
      '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4l8 9 8-9v16"/></svg>',
    );
  }

  protected readonly basicCode = `<mk-icon name="search" />
<mk-icon name="trash" size="lg" />`;

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

// then anywhere:
<mk-icon name="mk-logo" [size]="48" />`;
}
