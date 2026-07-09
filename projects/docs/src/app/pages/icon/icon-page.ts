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
