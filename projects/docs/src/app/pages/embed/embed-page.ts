import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MkButton } from '@mk-kit/ui/button';
import { MkToastService } from '@mk-kit/ui/feedback';
import { type MkEmbedApp, mkEmbed } from '@mk-kit/ui/embed';

/** The widget the live demo embeds — an ordinary mk-kit-based component. */
@Component({
  selector: 'docs-embed-widget',
  imports: [MkButton],
  styles: `
    .widget {
      display: grid;
      gap: var(--mk-space-3);
      justify-items: start;
      padding: var(--mk-space-4);
      border: 1px dashed var(--mk-border);
      border-radius: var(--mk-radius-md);
    }
  `,
  template: `
    <div class="widget">
      <p>Rendered behind shadow DOM by a second, embedded Angular app.</p>
      <button mkButton (click)="toast()">Toast from the widget</button>
    </div>
  `,
})
export class DocsEmbedWidget {
  private readonly toasts = inject(MkToastService);
  protected toast(): void {
    this.toasts.success('Sent from inside the embedded element — check where the container mounted.');
  }
}

/**
 * One embed app for the whole docs session: custom elements cannot be
 * redefined, so revisiting the route must reuse the first application.
 */
let demoApp: MkEmbedApp | null = null;
function ensureDemo(): void {
  if (typeof customElements === 'undefined') return;
  demoApp ??= mkEmbed().element('docs-embed-widget-element', DocsEmbedWidget);
}

/** Guide + live demo for `@mk-kit/ui/embed`. */
@Component({
  selector: 'docs-embed-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MkButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: `
    .embed-code {
      background: var(--mk-surface-2);
      border: 1px solid var(--mk-border);
      border-radius: var(--mk-radius-md);
      padding: var(--mk-space-4);
      overflow-x: auto;
      font-size: 0.875rem;
    }
    .embed-demo {
      display: grid;
      gap: var(--mk-space-4);
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      margin-block: var(--mk-space-4);
    }
    .embed-demo__pane {
      display: grid;
      gap: var(--mk-space-3);
      align-content: start;
      justify-items: start;
      padding: var(--mk-space-4);
      border: 1px solid var(--mk-border);
      border-radius: var(--mk-radius-md);
    }
    .embed-demo__pane h3 {
      margin: 0;
    }
    /* The "hostile host page stylesheet". It hits the light-DOM button on the
       left; the same rule cannot reach into the widget's shadow root. */
    .embed-demo__pane--attacked button {
      background: #dc2626 !important;
      color: #fff !important;
      border-radius: 0 !important;
      font-family: 'Comic Sans MS', cursive !important;
    }
  `,
  template: `
    <div class="docs-page docs-container">
      <h1>Embedding as custom elements</h1>
      <p class="docs-lead">
        <code class="docs-inline">&#64;mk-kit/ui/embed</code> turns any
        mk-kit-based component into a standalone custom element: the widget
        renders behind shadow DOM where the host page's stylesheet cannot
        reach it, while <code class="docs-inline">--mk-*</code> custom
        properties still inherit through the boundary — so the page themes
        the widget without being able to break it. One lazily created
        zoneless application is shared by every element you define, and
        overlays (dialogs, selects, toasts) mount in a themed shadow host of
        their own instead of the bare page.
      </p>

      <pre class="embed-code"><code>import {{ '{' }} mkEmbed, mkShadowCss {{ '}' }} from '&#64;mk-kit/ui/embed';
import themeCss from '&#64;mk-kit/ui/styles.css' with {{ '{' }} type: 'text' {{ '}' }};

mkEmbed({{ '{' }} styles: mkShadowCss(themeCss) {{ '}' }})
  .element('acme-reviews', ReviewsWidget)
  .element('acme-signup', SignupWidget);</code></pre>

      <pre class="embed-code"><code>&lt;acme-reviews product-id="42" style="--mk-primary: #7c3aed"&gt;&lt;/acme-reviews&gt;</code></pre>

      <h2>Live: the same page CSS, two buttons</h2>
      <p>
        This page carries a deliberately hostile rule —
        <code class="docs-inline">button {{ '{' }} background: #dc2626 !important … {{ '}' }}</code>
        — scoped to both panes below. It wrecks the ordinary button; the
        embedded element next to it renders the exact same component behind
        shadow DOM and stays intact. Its toast opens from the embedded
        application's own overlay host
        (<code class="docs-inline">&lt;mk-embed-overlays&gt;</code> on
        <code class="docs-inline">document.body</code>), not from the page.
      </p>
      <div class="embed-demo">
        <div class="embed-demo__pane embed-demo__pane--attacked">
          <h3>Light DOM</h3>
          <p>The page stylesheet applies.</p>
          <button mkButton>A page-level button</button>
        </div>
        <div class="embed-demo__pane embed-demo__pane--attacked">
          <h3>Embedded element</h3>
          <docs-embed-widget-element></docs-embed-widget-element>
        </div>
      </div>

      <h2>What the wrapper does</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Concern</th><th>Behaviour</th></tr>
        </thead>
        <tbody>
          <tr><td>Bootstrap</td><td>element() only defines the tag; the shared zoneless application is created when the first element connects.</td></tr>
          <tr><td>Inputs</td><td>Dash-cased attributes (strings run through the input's transform — booleanAttribute / numberAttribute coerce as usual) and camel-cased element properties (any value). Names colliding with native element properties (title, hidden, dir…) stay attribute-only.</td></tr>
          <tr><td>Outputs</td><td>Bubbling, composed CustomEvents named after the output; the emitted value is event.detail.</td></tr>
          <tr><td>Component styles</td><td>Angular routes each component's own stylesheet into the shadow root it renders in — nothing is injected into the host page's head.</td></tr>
          <tr><td>Theme</td><td>The styles option is adopted into every shadow root (constructable stylesheets, shared across instances). Run mk-kit's theme through mkShadowCss() so :root token blocks target :host; data-mk-theme="dark" on the element switches it to the dark palette.</td></tr>
          <tr><td>Overlays</td><td>MK_OVERLAY_ROOT (new in <a routerLink="/core-services">core</a>) points dialogs, anchored panels, toasts and tours at a page-level shadow host carrying the same styles. Set overlays: false to keep document.body.</td></tr>
          <tr><td>Lifecycle</td><td>mkReady resolves once rendered; mkComponent exposes the instance; disconnecting destroys the component (a same-task DOM move does not); destroy() tears down the application and the overlay host.</td></tr>
        </tbody>
      </table>

      <h2>Getting the theme CSS as text</h2>
      <p>
        The theme ships as a plain file
        (<code class="docs-inline">&#64;mk-kit/ui/styles.css</code>); how it
        becomes a string is the bundler's job: import attributes
        (<code class="docs-inline">with {{ '{' }} type: 'text' {{ '}' }}</code>) in esbuild
        / Bun, <code class="docs-inline">?raw</code> in Vite,
        <code class="docs-inline">asset/source</code> in webpack — or
        <code class="docs-inline">fetch()</code> it at runtime and pass the
        result to <code class="docs-inline">mkEmbed</code> before defining
        elements. Trim it to the tokens you use if the full sheet is more
        than a small widget wants to carry.
      </p>

      <h2>Where this fits</h2>
      <p>
        Embedding is for surfaces you drop into pages you do not control — a
        reviews widget on a client's WordPress site, a signup card in a CMS,
        a booking panel behind a CSP. Inside your own Angular app, import the
        components <a routerLink="/getting-started">directly</a> instead. The
        entry costs ~14 KiB raw before compression (see
        <a routerLink="/cost">bundle cost</a>) plus whatever your widget
        imports.
      </p>
    </div>
  `,
})
export class EmbedPage {
  constructor() {
    ensureDemo();
  }
}
