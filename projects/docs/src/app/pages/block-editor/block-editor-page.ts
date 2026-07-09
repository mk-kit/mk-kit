import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkBlockEditor,
  MkBlockRenderer,
  MkTabs,
  MkTab,
  mkBlocksToHtml,
  type MkBlockDocument,
} from '@mkornas/ui';

@Component({
  selector: 'docs-block-editor-page',
  imports: [FormsModule, MkBlockEditor, MkBlockRenderer, MkTabs, MkTab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container be-wide">
      <h1>Content editor</h1>
      <p class="docs-lead">
        A configurable, Gutenberg-style block editor for authoring blog posts and
        content pages — rich text, images with upload, grid/flex layout columns,
        embeds, and fully custom blocks provided via config. It emits a clean,
        JSON-serialisable document and ships a matching read-only renderer.
      </p>

      <h2>Live editor</h2>
      <p>
        Edit below. <strong>Select text</strong> for the inline formatting toolbar,
        press <kbd>Enter</kbd> to split a block, or use the
        <strong>＋ Add block</strong> inserter to drop in headings, images, columns,
        embeds and more. Everything you type flows straight into the output below.
      </p>

      <div class="be-editor">
        <mk-block-editor [(value)]="doc" placeholder="Write something…" ariaLabel="Post content" />
      </div>

      <h2>Live output</h2>
      <p>The same document, rendered for publication and serialized to HTML.</p>
      <mk-tabs variant="line">
        <mk-tab label="Rendered">
          <div class="be-output">
            <mk-block-renderer [value]="doc()" />
          </div>
        </mk-tab>
        <mk-tab label="HTML source">
          <pre class="be-code"><code>{{ html() }}</code></pre>
        </mk-tab>
        <mk-tab label="Document (JSON)">
          <pre class="be-code"><code>{{ json() }}</code></pre>
        </mk-tab>
      </mk-tabs>

      <h2>Wiring it up</h2>
      <p>
        The editor implements <code class="docs-inline">ControlValueAccessor</code>
        and exposes a two-way <code class="docs-inline">value</code> model, so it works
        with signals, <code class="docs-inline">[(ngModel)]</code> and reactive forms.
      </p>
      <pre class="be-code"><code>{{ wireCode }}</code></pre>

      <h2>Layout: columns, ratios &amp; alignment</h2>
      <p>
        The <strong>Columns</strong> block is a responsive grid/flex container. Add it
        from the inserter, choose 2–4 columns and a ratio preset (50/50, 66/33,
        33/33/33…), set the gap, and align content — then drop any blocks inside each
        column. It stacks to a single column on narrow screens and serialises to a
        portable grid wrapper.
      </p>

      <h2>Configurable blocks</h2>
      <p>
        The palette is data-driven. Extend or replace it with an array of
        <code class="docs-inline">MkBlockDefinition</code>s via the
        <code class="docs-inline">[blocks]</code> input (per editor) or the
        <code class="docs-inline">MK_BLOCK_DEFINITIONS</code> token (app-wide). This is
        the WordPress/Gutenberg <code class="docs-inline">registerBlockType</code>
        equivalent.
      </p>
      <pre class="be-code"><code>{{ blockCode }}</code></pre>

      <h2>Image upload</h2>
      <p>
        Provide an <code class="docs-inline">uploadHandler</code> (or the
        <code class="docs-inline">MK_BLOCK_UPLOAD_HANDLER</code> token) to send dropped
        or selected images to your storage and get back a URL. Without one, images
        fall back to an inline <code class="docs-inline">data:</code> URL.
      </p>
      <pre class="be-code"><code>{{ uploadCode }}</code></pre>

      <h2>Embeds</h2>
      <p>
        Paste a URL into an <strong>Embed</strong> block to get a sandboxed iframe.
        YouTube and Vimeo work out of the box; add providers with
        <code class="docs-inline">[embedProviders]</code>. Non-matching URLs render a
        safe link card. The only value ever trusted for an iframe
        <code class="docs-inline">src</code> is a provider-transformed URL — pasted
        strings are never injected raw.
      </p>
      <pre class="be-code"><code>{{ embedCode }}</code></pre>

      <h2>Rendering saved content</h2>
      <p>
        Display a stored document with
        <code class="docs-inline">&lt;mk-block-renderer&gt;</code> (themed, interactive
        embeds) or serialize to a portable HTML string for SSG/SSR, emails and feeds.
        Rich text is sanitised on both serialize and render.
      </p>
      <pre class="be-code"><code>{{ renderCode }}</code></pre>

      <h2>HTML value mode (richtext fields)</h2>
      <p>
        Set <code class="docs-inline">valueFormat="html"</code> and the editor
        reads/writes an <strong>HTML string</strong> instead of an
        <code class="docs-inline">MkBlockDocument</code> — so it can back a
        string-typed <code class="docs-inline">richtext</code> field
        (<code class="docs-inline">[(ngModel)]="html"</code>). It seeds from stored
        HTML via <code class="docs-inline">mkHtmlToBlocks</code> and serialises
        back with <code class="docs-inline">mkBlocksToHtml</code> on every change.
      </p>
      <div class="be-editor be-wide">
        <mk-block-editor
          valueFormat="html"
          [ngModel]="richHtml()"
          (ngModelChange)="richHtml.set($event)"
          ariaLabel="Richtext content"
          placeholder="Edit — the value below is an HTML string…"
        />
      </div>
      <p>Bound HTML string (what the CMS stores):</p>
      <pre class="be-output"><code>{{ richHtml() || '(empty)' }}</code></pre>

      <h2>API</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Member</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>value</code></td><td><code>model&lt;MkBlockDocument&gt;</code></td><td>Two-way document binding (also a CVA).</td></tr>
          <tr><td><code>blocks</code></td><td><code>MkBlockDefinition[] | null</code></td><td>Custom/extended block palette (merged over defaults).</td></tr>
          <tr><td><code>uploadHandler</code></td><td><code>(f: File) =&gt; Promise&lt;string&gt;</code></td><td>Image upload; falls back to a data URL.</td></tr>
          <tr><td><code>embedProviders</code></td><td><code>MkEmbedProvider[] | null</code></td><td>Extra allow-listed embed providers.</td></tr>
          <tr><td><code>placeholder</code> / <code>readonly</code> / <code>disabled</code> / <code>ariaLabel</code></td><td>—</td><td>Prompt text, read-only view, form disable, a11y label.</td></tr>
          <tr><td><code>valueFormat</code></td><td><code>'document' | 'html'</code></td><td><code>'document'</code> — set <code>'html'</code> to read/write an HTML string (richtext fields).</td></tr>
          <tr><td><code>change</code> / <code>htmlChange</code></td><td><code>output&lt;MkBlockDocument&gt;</code> / <code>output&lt;string&gt;</code></td><td>Fire the document / serialized HTML on every edit.</td></tr>
          <tr><td><code>mkBlocksToHtml(doc)</code> / <code>mkHtmlToBlocks(html)</code></td><td><code>string</code> / <code>MkBlockDocument</code></td><td>Serialize to HTML / parse HTML back into a document (round-trip).</td></tr>
          <tr><td><code>&lt;mk-block-renderer [value]&gt;</code></td><td>—</td><td>Read-only, themed display of a saved document.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .be-wide {
        max-width: 1080px;
      }
      .be-editor {
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
        padding: var(--mk-space-4);
        margin: var(--mk-space-3) 0 var(--mk-space-6);
      }
      .be-output {
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
        padding: var(--mk-space-5);
        margin-top: var(--mk-space-3);
        min-height: 120px;
      }
      .be-code {
        margin: var(--mk-space-3) 0 var(--mk-space-6);
        padding: var(--mk-space-4) var(--mk-space-5);
        background: var(--mk-code-bg);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: var(--mk-line-height-normal);
        color: var(--mk-text);
        overflow-x: auto;
        max-height: 360px;
      }
    `,
  ],
})
export class BlockEditorPage {
  /** Seeded from stored HTML; stays an HTML string as the CMS would persist. */
  protected readonly richHtml = signal(
    '<h3>Release notes</h3><p>The <strong>HTML value mode</strong> lets the editor back a <code>richtext</code> field.</p><ul><li>Seeds from HTML</li><li>Emits HTML</li></ul>',
  );

  protected readonly doc = signal<MkBlockDocument>({
    version: 1,
    blocks: [
      { id: 'b1', type: 'heading', data: { html: 'Shipping mk-kit 1.0', level: 2 } },
      {
        id: 'b2',
        type: 'paragraph',
        data: {
          html:
            'This whole post was written in the <strong>mk-kit</strong> block editor. ' +
            'Select any text to format it, or add a new block with the <em>＋</em> button.',
        },
      },
      {
        id: 'b3',
        type: 'list',
        data: {
          ordered: false,
          items: [
            'Rich text with an inline toolbar',
            'Images with a pluggable upload handler',
            'Responsive column layouts',
            'Sandboxed embeds',
          ],
        },
      },
      {
        id: 'b4',
        type: 'quote',
        data: { html: 'Themable, accessible, and yours to extend.', citation: 'The mk-kit team' },
      },
    ],
  });

  protected readonly html = computed(() => mkBlocksToHtml(this.doc()));
  protected readonly json = computed(() => JSON.stringify(this.doc(), null, 2));

  protected readonly wireCode = `import { Component, signal } from '@angular/core';
import { MkBlockEditor, mkEmptyDocument, type MkBlockDocument } from '@mkornas/ui';

@Component({
  imports: [MkBlockEditor],
  template: \`<mk-block-editor [(value)]="doc" placeholder="Write…" />\`,
})
export class PostEditor {
  readonly doc = signal<MkBlockDocument>(mkEmptyDocument());
}`;

  protected readonly blockCode = `import { type MkBlockDefinition, MK_DEFAULT_BLOCKS, mkBlockId } from '@mkornas/ui';

const callout: MkBlockDefinition = {
  type: 'callout',
  label: 'Callout',
  icon: '💡',
  group: 'Text',
  keywords: ['note', 'tip'],
  create: () => ({ id: mkBlockId('callout'), type: 'callout', data: { html: '' } }),
};

// <mk-block-editor [(value)]="doc" [blocks]="[...MK_DEFAULT_BLOCKS, callout]" />`;

  protected readonly uploadCode = `async function upload(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body });
  return (await res.json()).url;
}

// <mk-block-editor [(value)]="doc" [uploadHandler]="upload" />
// or app-wide: { provide: MK_BLOCK_UPLOAD_HANDLER, useValue: upload }`;

  protected readonly embedCode = `import { type MkEmbedProvider } from '@mkornas/ui';

const codepen: MkEmbedProvider = {
  name: 'CodePen',
  test: /codepen\\.io\\/([\\w-]+)\\/pen\\/([\\w-]+)/i,
  aspectRatio: 16 / 9,
  toEmbedUrl: (url) => {
    const m = url.match(/codepen\\.io\\/([\\w-]+)\\/pen\\/([\\w-]+)/i);
    return m ? \`https://codepen.io/\${m[1]}/embed/\${m[2]}\` : null;
  },
};

// <mk-block-editor [(value)]="doc" [embedProviders]="[codepen]" />`;

  protected readonly renderCode = `import { MkBlockRenderer, mkBlocksToHtml } from '@mkornas/ui';

// In a component: <mk-block-renderer [value]="doc()" />

// Or as a portable HTML string (SSG/SSR/emails):
const html = mkBlocksToHtml(doc);`;
}
