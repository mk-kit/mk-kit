import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MkAlert, MkInput, MkMarkdown, MkSpinner } from '@mk-kit/ui';

/* ------------------------------------------------------------------------ */
/* Shape of projects/docs/public/api.json (see scripts/gen-api.mjs)          */
/* ------------------------------------------------------------------------ */

export type ApiKind =
  | 'component'
  | 'directive'
  | 'pipe'
  | 'service'
  | 'class'
  | 'function'
  | 'token'
  | 'const'
  | 'interface'
  | 'type'
  | 'enum';

export interface ApiInput {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  model?: boolean;
  transform?: string;
  description: string;
  deprecated?: string | boolean;
}

export interface ApiOutput {
  name: string;
  type: string;
  description: string;
  model?: boolean;
}

export interface ApiMethod {
  name: string;
  signature: string;
  description: string;
  deprecated?: string | boolean;
}

export interface ApiProperty {
  name: string;
  type: string;
  description: string;
  readonly?: boolean;
  optional?: boolean;
}

export interface ApiEnumMember {
  name: string;
  value?: string;
  description: string;
}

export interface ApiExport {
  kind: ApiKind;
  name: string;
  description: string;
  file: string;
  docs?: string;
  deprecated?: string | boolean;
  example?: string;
  /* component / directive */
  selector?: string;
  selectors?: string[];
  exportAs?: string;
  formControl?: boolean;
  inputs?: ApiInput[];
  outputs?: ApiOutput[];
  methods?: ApiMethod[];
  properties?: ApiProperty[];
  /* pipe */
  pipeName?: string;
  signature?: string;
  /* service */
  providedIn?: string;
  /* interface / enum */
  members?: ApiProperty[] | ApiEnumMember[];
  extends?: string[];
  typeParams?: string;
  /* type */
  definition?: string;
  /* function */
  signatures?: string[];
  /* token / const */
  type?: string;
}

export interface ApiEntry {
  name: string;
  import: string;
  exports: ApiExport[];
}

export interface ApiDoc {
  package: string;
  version: string;
  site: string;
  entries: ApiEntry[];
}

interface SearchHit {
  entry: string;
  item: ApiExport;
}

const KIND_ORDER: ReadonlyArray<ApiKind> = [
  'component',
  'directive',
  'pipe',
  'service',
  'class',
  'function',
  'token',
  'const',
  'interface',
  'type',
  'enum',
];

const KIND_LABEL: Record<ApiKind, string> = {
  component: 'Components',
  directive: 'Directives',
  pipe: 'Pipes',
  service: 'Services',
  class: 'Classes',
  function: 'Functions',
  token: 'Injection tokens',
  const: 'Constants',
  interface: 'Interfaces',
  type: 'Type aliases',
  enum: 'Enums',
};

/**
 * Generated API reference — every public export of `@mk-kit/ui`, one entry
 * point at a time, read from `api.json` (built by `scripts/gen-api.mjs` from
 * the library sources, so it can never drift from the code).
 *
 * URL state: `?entry=<name>` selects the entry point and the fragment names
 * the export to open and scroll to, so `/api?entry=forms#MkSelect` is a
 * stable deep link.
 */
@Component({
  selector: 'docs-api-page',
  imports: [MkAlert, MkInput, MkMarkdown, MkSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-page docs-container api">
      <h1>API reference</h1>
      <p class="docs-lead">
        Every public export of <strong>&#64;mk-kit/ui</strong>
        @if (doc(); as d) {
          <span class="api-ver">v{{ d.version }}</span>
        }
        — inputs, outputs, methods and types, generated straight from the
        library sources. Machine-readable copies for tools and LLMs:
        <a href="/api.json" target="_blank" rel="noopener">api.json</a>,
        <a href="/llms.txt" target="_blank" rel="noopener">llms.txt</a>,
        <a href="/llms-full.txt" target="_blank" rel="noopener">llms-full.txt</a>
        — or give your coding assistant the MCP server:
        <code class="docs-inline">npx -y &#64;mk-kit/mcp</code>.
      </p>

      @switch (state()) {
        @case ('loading') {
          <div class="api-loading" role="status">
            <mk-spinner />
            <span>Loading API…</span>
          </div>
        }
        @case ('error') {
          <mk-alert tone="warning" title="Couldn't load the API reference">
            <code class="docs-inline">api.json</code> isn't reachable right now.
            The same data is on
            <a
              href="https://github.com/mk-kit/mk-kit/blob/main/projects/docs/public/llms-full.txt"
              target="_blank"
              rel="noopener noreferrer"
              >GitHub</a
            >.
          </mk-alert>
        }
        @case ('ready') {
          <div class="api-search">
            <input
              mkInput
              type="search"
              placeholder="Search exports — e.g. mk-select, exportCsv, MkTone…"
              aria-label="Search the API"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
            <span class="api-search__count" role="status">
              @if (query().trim()) {
                {{ hits().length }} match{{ hits().length === 1 ? '' : 'es' }}
              } @else {
                {{ total() }} exports · {{ doc()!.entries.length }} entry points
              }
            </span>
          </div>

          @if (query().trim()) {
            <ul class="api-hits">
              @for (hit of hits(); track hit.entry + hit.item.name) {
                <li>
                  <a
                    class="api-hit"
                    [href]="'/api?entry=' + hit.entry + '#' + hit.item.name"
                    (click)="open($event, hit.entry, hit.item.name)"
                  >
                    <span class="api-kind api-kind--{{ hit.item.kind }}">{{
                      hit.item.kind
                    }}</span>
                    <span class="api-hit__name">{{ hit.item.name }}</span>
                    @if (hit.item.selector) {
                      <code class="api-hit__sel">{{ hit.item.selector }}</code>
                    }
                    <span class="api-hit__entry">&#64;mk-kit/ui/{{ hit.entry }}</span>
                  </a>
                </li>
              } @empty {
                <li class="api-empty">
                  Nothing matches “{{ query() }}”. Names, selectors and
                  descriptions are searched.
                </li>
              }
            </ul>
          } @else {
            <nav class="api-entries" aria-label="Entry points">
              @for (e of doc()!.entries; track e.name) {
                <a
                  class="api-entry"
                  [class.api-entry--active]="e.name === entry()"
                  [attr.aria-current]="e.name === entry() ? 'page' : null"
                  [href]="'/api?entry=' + e.name"
                  (click)="open($event, e.name)"
                >
                  {{ e.name }}
                  <span class="api-entry__n">{{ e.exports.length }}</span>
                </a>
              }
            </nav>

            @if (current(); as e) {
              <header class="api-entry-head">
                <h2 id="entry-{{ e.name }}">&#64;mk-kit/ui/{{ e.name }}</h2>
                <pre class="api-import"><code>import &#123; … &#125; from '{{ e.import }}';</code></pre>
              </header>

              @for (group of groups(); track group.kind) {
                <section class="api-group">
                  <h3>{{ group.label }} <span class="api-group__n">{{ group.items.length }}</span></h3>
                  @for (x of group.items; track x.name) {
                    <details
                      class="api-item"
                      [id]="x.name"
                      [open]="x.name === openName()"
                      (toggle)="onToggle($event, x.name)"
                    >
                      <summary class="api-item__sum">
                        <span class="api-item__name">{{ x.name }}</span>
                        @if (x.selector) {
                          <code class="api-item__sel">{{ x.selector }}</code>
                        }
                        @if (x.pipeName) {
                          <code class="api-item__sel">| {{ x.pipeName }}</code>
                        }
                        @if (x.deprecated) {
                          <span class="api-flag api-flag--dep">deprecated</span>
                        }
                        @if (x.formControl) {
                          <span class="api-flag">form control</span>
                        }
                        <span class="api-item__brief">{{ brief(x) }}</span>
                      </summary>

                      <div class="api-item__body">
                        <div class="api-meta">
                          <code class="api-meta__import"
                            >import &#123; {{ x.name }} &#125; from '{{ e.import }}';</code
                          >
                          @if (x.exportAs) {
                            <span>exportAs <code>{{ x.exportAs }}</code></span>
                          }
                          @if (x.providedIn) {
                            <span>providedIn <code>{{ x.providedIn }}</code></span>
                          }
                          @if (x.docs) {
                            <a [href]="x.docs">Guide &amp; examples →</a>
                          }
                          <a
                            [href]="'https://github.com/mk-kit/mk-kit/blob/main/' + x.file"
                            target="_blank"
                            rel="noopener noreferrer"
                            >Source</a
                          >
                        </div>

                        @if (x.deprecated) {
                          <mk-alert tone="warning" title="Deprecated">
                            {{ x.deprecated === true ? 'This export will be removed in a future release.' : x.deprecated }}
                          </mk-alert>
                        }

                        @if (x.description) {
                          <mk-markdown class="api-desc" [source]="x.description" linkTarget="_blank" />
                        }
                        @if (x.example) {
                          <mk-markdown class="api-desc" [source]="x.example" />
                        }

                        @if (x.inputs?.length) {
                          <h4>Inputs</h4>
                          <div class="api-scroll">
                            <table class="api-table">
                              <thead>
                                <tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr>
                              </thead>
                              <tbody>
                                @for (i of x.inputs; track i.name) {
                                  <tr>
                                    <td>
                                      <code>{{ i.name }}</code>
                                      @if (i.required) { <span class="api-flag api-flag--req">required</span> }
                                      @if (i.model) { <span class="api-flag">two-way</span> }
                                    </td>
                                    <td><code class="api-type">{{ i.type }}</code></td>
                                    <td>@if (i.default !== undefined) { <code>{{ i.default }}</code> }</td>
                                    <td><mk-markdown [source]="i.description" /></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }

                        @if (x.outputs?.length) {
                          <h4>Outputs</h4>
                          <div class="api-scroll">
                            <table class="api-table">
                              <thead><tr><th>Name</th><th>Emits</th><th>Description</th></tr></thead>
                              <tbody>
                                @for (o of x.outputs; track o.name) {
                                  <tr>
                                    <td><code>{{ o.name }}</code></td>
                                    <td><code class="api-type">{{ o.type }}</code></td>
                                    <td><mk-markdown [source]="o.description" /></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }

                        @if (x.methods?.length) {
                          <h4>Methods</h4>
                          <div class="api-scroll">
                            <table class="api-table">
                              <thead><tr><th>Signature</th><th>Description</th></tr></thead>
                              <tbody>
                                @for (m of x.methods; track m.name + m.signature) {
                                  <tr>
                                    <td><code class="api-type">{{ m.name }}{{ m.signature }}</code></td>
                                    <td><mk-markdown [source]="m.description" /></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }

                        @if (x.properties?.length) {
                          <h4>Properties</h4>
                          <div class="api-scroll">
                            <table class="api-table">
                              <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
                              <tbody>
                                @for (p of x.properties; track p.name) {
                                  <tr>
                                    <td><code>{{ p.name }}</code></td>
                                    <td><code class="api-type">{{ p.type }}</code></td>
                                    <td><mk-markdown [source]="p.description" /></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }

                        @if (x.kind === 'interface' && x.members?.length) {
                          <h4>
                            Members
                            @if (x.extends?.length) {
                              <span class="api-group__n">extends {{ x.extends!.join(', ') }}</span>
                            }
                          </h4>
                          <div class="api-scroll">
                            <table class="api-table">
                              <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
                              <tbody>
                                @for (p of asProps(x.members); track p.name) {
                                  <tr>
                                    <td><code>{{ p.name }}{{ p.optional ? '?' : '' }}</code></td>
                                    <td><code class="api-type">{{ p.type }}</code></td>
                                    <td><mk-markdown [source]="p.description" /></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }

                        @if (x.kind === 'enum' && x.members?.length) {
                          <div class="api-scroll">
                            <table class="api-table">
                              <thead><tr><th>Member</th><th>Value</th><th>Description</th></tr></thead>
                              <tbody>
                                @for (p of asEnum(x.members); track p.name) {
                                  <tr>
                                    <td><code>{{ p.name }}</code></td>
                                    <td>@if (p.value) { <code>{{ p.value }}</code> }</td>
                                    <td><mk-markdown [source]="p.description" /></td>
                                  </tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        }

                        @if (x.kind === 'type') {
                          <pre class="api-code"><code>type {{ x.name }}{{ x.typeParams ?? '' }} = {{ x.definition }};</code></pre>
                        }
                        @if (x.kind === 'function') {
                          <pre class="api-code"><code>@for (s of x.signatures; track $index) {function {{ x.name }}{{ s }}
}</code></pre>
                        }
                        @if (x.kind === 'pipe' && x.signature) {
                          <pre class="api-code"><code>transform{{ x.signature }}</code></pre>
                        }
                        @if (x.kind === 'token' || x.kind === 'const') {
                          <pre class="api-code"><code>const {{ x.name }}: {{ x.type }};</code></pre>
                        }
                      </div>
                    </details>
                  }
                </section>
              }
            }
          }
        }
      }
    </div>
  `,
  styles: [
    `
      .api-ver {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .api-loading {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        color: var(--mk-text-muted);
        padding: var(--mk-space-8) 0;
      }
      .api-search {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        margin: var(--mk-space-4) 0 var(--mk-space-4);
      }
      .api-search input {
        flex: 1;
        max-width: 32rem;
      }
      .api-search__count {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        white-space: nowrap;
      }

      /* entry-point switcher */
      .api-entries {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-2);
        margin-bottom: var(--mk-space-6);
      }
      .api-entry {
        display: inline-flex;
        align-items: center;
        gap: var(--mk-space-2);
        padding: var(--mk-space-1) var(--mk-space-3);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-full);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text) !important;
        background: var(--mk-surface);
        text-decoration: none !important;
      }
      .api-entry:hover {
        border-color: var(--mk-primary);
      }
      .api-entry--active {
        background: var(--mk-primary);
        border-color: var(--mk-primary);
        color: var(--mk-primary-contrast) !important;
      }
      .api-entry__n {
        font-size: var(--mk-font-size-xs);
        opacity: 0.7;
      }

      .api-entry-head h2 {
        margin-top: var(--mk-space-4);
        font-family: var(--mk-font-mono);
      }
      .api-import,
      .api-code {
        margin: 0 0 var(--mk-space-4);
        padding: var(--mk-space-3) var(--mk-space-4);
        background: var(--mk-code-bg);
        border-radius: var(--mk-radius-md);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: var(--mk-line-height-normal);
        overflow-x: auto;
        white-space: pre;
      }
      .api-group h3 {
        display: flex;
        align-items: baseline;
        gap: var(--mk-space-2);
        margin-top: var(--mk-space-8);
      }
      .api-group__n {
        font-size: var(--mk-font-size-sm);
        font-weight: var(--mk-font-weight-normal);
        color: var(--mk-text-muted);
      }

      /* one export */
      .api-item {
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-lg);
        background: var(--mk-surface);
        margin-bottom: var(--mk-space-2);
        scroll-margin-top: calc(var(--mk-header-height) + var(--mk-space-4));
      }
      .api-item[open] {
        border-color: var(--mk-primary);
      }
      .api-item__sum {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-2);
        padding: var(--mk-space-3) var(--mk-space-4);
        cursor: pointer;
        list-style: none;
      }
      .api-item__sum::-webkit-details-marker {
        display: none;
      }
      .api-item__sum::before {
        content: '';
        width: 0.45em;
        height: 0.45em;
        border-right: 2px solid var(--mk-text-muted);
        border-bottom: 2px solid var(--mk-text-muted);
        transform: rotate(-45deg);
        transition: transform 120ms ease;
        flex: none;
      }
      .api-item[open] > .api-item__sum::before {
        transform: rotate(45deg);
      }
      .api-item__sum:focus-visible {
        outline: 2px solid var(--mk-primary);
        outline-offset: -2px;
        border-radius: var(--mk-radius-lg);
      }
      .api-item__name {
        font-family: var(--mk-font-mono);
        font-weight: var(--mk-font-weight-semibold);
        color: var(--mk-primary);
      }
      .api-item__sel,
      .api-hit__sel {
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
        background: var(--mk-code-bg);
        padding: 0.1em 0.4em;
        border-radius: var(--mk-radius-sm);
      }
      .api-item__brief {
        flex-basis: 100%;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        line-height: var(--mk-line-height-normal);
      }
      @media (min-width: 720px) {
        .api-item__brief {
          flex-basis: auto;
          flex: 1;
          min-width: 12rem;
          margin-left: var(--mk-space-2);
        }
      }
      .api-item__body {
        padding: 0 var(--mk-space-4) var(--mk-space-4);
        border-top: 1px solid var(--mk-border);
      }
      .api-item__body h4 {
        margin: var(--mk-space-5) 0 var(--mk-space-2);
        font-size: var(--mk-font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--mk-text-muted);
      }
      .api-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-3) var(--mk-space-4);
        padding: var(--mk-space-3) 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .api-meta code,
      .api-table code {
        font-family: var(--mk-font-mono);
        font-size: 0.9em;
      }
      .api-meta__import {
        flex-basis: 100%;
        color: var(--mk-text);
        overflow-wrap: anywhere;
      }
      .api-desc {
        display: block;
        font-size: var(--mk-font-size-sm);
      }
      .api-flag {
        font-size: var(--mk-font-size-xs);
        padding: 0 0.4em;
        border-radius: var(--mk-radius-sm);
        background: var(--mk-code-bg);
        color: var(--mk-text-muted);
        white-space: nowrap;
      }
      .api-flag--req {
        color: var(--mk-danger);
      }
      .api-flag--dep {
        color: var(--mk-warning);
      }

      /* tables */
      .api-scroll {
        overflow-x: auto;
      }
      .api-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--mk-font-size-sm);
      }
      .api-table th,
      .api-table td {
        text-align: left;
        vertical-align: top;
        padding: var(--mk-space-2) var(--mk-space-3);
        border-bottom: 1px solid var(--mk-border);
      }
      .api-table th {
        font-weight: var(--mk-font-weight-semibold);
        color: var(--mk-text-muted);
        white-space: nowrap;
      }
      .api-table td:first-child {
        white-space: nowrap;
      }
      .api-table td:first-child code {
        color: var(--mk-text);
        font-weight: var(--mk-font-weight-medium);
      }
      .api-type {
        color: var(--mk-text-muted);
        white-space: pre-wrap;
        overflow-wrap: break-word;
      }
      .api-table td:has(> .api-type) {
        min-width: 10rem;
      }
      .api-table mk-markdown {
        display: block;
        min-width: 14rem;
      }
      /* mk-markdown is unencapsulated, so reach its paragraphs from here:
         table cells and descriptions read as plain text, not prose blocks. */
      :host ::ng-deep .api-table .mk-markdown p {
        margin: 0;
        line-height: var(--mk-line-height-normal);
      }
      :host ::ng-deep .api-table .mk-markdown p + p {
        margin-top: var(--mk-space-2);
      }

      /* search results */
      .api-hits {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--mk-space-2);
      }
      .api-hit {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mk-space-2);
        padding: var(--mk-space-2) var(--mk-space-3);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
        color: inherit !important;
        text-decoration: none !important;
      }
      .api-hit:hover {
        border-color: var(--mk-primary);
      }
      .api-hit__name {
        font-family: var(--mk-font-mono);
        font-weight: var(--mk-font-weight-semibold);
        color: var(--mk-primary);
      }
      .api-hit__entry {
        margin-left: auto;
        font-size: var(--mk-font-size-xs);
        color: var(--mk-text-muted);
        font-family: var(--mk-font-mono);
      }
      .api-kind {
        font-size: var(--mk-font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0 0.4em;
        border-radius: var(--mk-radius-sm);
        background: var(--mk-code-bg);
        color: var(--mk-text-muted);
        min-width: 5.5em;
        text-align: center;
      }
      .api-kind--component,
      .api-kind--directive {
        color: var(--mk-primary);
      }
      .api-empty {
        color: var(--mk-text-muted);
      }
      @media (prefers-reduced-motion: reduce) {
        .api-item__sum::before {
          transition: none;
        }
      }
    `,
  ],
})
export class ApiPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly doc = signal<ApiDoc | null>(null);
  protected readonly query = signal('');
  /** Selected entry point name (`?entry=`). */
  protected readonly entry = signal('core');
  /** Export currently opened via the URL fragment. */
  protected readonly openName = signal<string | null>(null);

  protected readonly total = computed(
    () => this.doc()?.entries.reduce((n, e) => n + e.exports.length, 0) ?? 0,
  );

  protected readonly current = computed(() => {
    const d = this.doc();
    if (!d) return null;
    return d.entries.find((e) => e.name === this.entry()) ?? d.entries[0];
  });

  protected readonly groups = computed(() => {
    const e = this.current();
    if (!e) return [];
    return KIND_ORDER.map((kind) => ({
      kind,
      label: KIND_LABEL[kind],
      items: e.exports.filter((x) => x.kind === kind),
    })).filter((g) => g.items.length);
  });

  protected readonly hits = computed<SearchHit[]>(() => {
    const d = this.doc();
    const q = this.query().trim().toLowerCase();
    if (!d || !q) return [];
    const scored: Array<SearchHit & { score: number }> = [];
    for (const e of d.entries) {
      for (const item of e.exports) {
        const name = item.name.toLowerCase();
        const sels = (item.selectors ?? []).map((s) => s.toLowerCase());
        let score = 0;
        if (name === q || sels.includes(q)) score = 4;
        else if (name.startsWith(q) || sels.some((s) => s.startsWith(q))) score = 3;
        else if (name.includes(q) || sels.some((s) => s.includes(q))) score = 2;
        else if (item.description.toLowerCase().includes(q)) score = 1;
        if (score) scored.push({ entry: e.name, item, score });
      }
    }
    scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
    return scored.slice(0, 60);
  });

  constructor() {
    // Keep the selection in sync with the URL (back/forward, deep links).
    this.route.queryParamMap.subscribe((p) => {
      const e = p.get('entry');
      if (e) this.entry.set(e);
    });
    this.route.fragment.subscribe((f) => this.openName.set(f || null));

    // Scroll the deep-linked export into view once it is rendered.
    effect(() => {
      const name = this.openName();
      const ready = this.state() === 'ready';
      const entry = this.entry();
      if (!name || !ready || !entry) return;
      untracked(() =>
        setTimeout(() => document.getElementById(name)?.scrollIntoView({ block: 'start' })),
      );
    });

    afterNextRender(() => {
      fetch('/api.json')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: ApiDoc) => {
          this.doc.set(d);
          if (!d.entries.some((e) => e.name === this.entry())) this.entry.set(d.entries[0].name);
          this.state.set('ready');
        })
        .catch(() => this.state.set('error'));
    });
  }

  /** Same-page navigation for entry chips and search hits (plain hrefs stay crawlable). */
  protected open(event: Event, entry: string, name?: string): void {
    event.preventDefault();
    this.query.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { entry },
      fragment: name,
      replaceUrl: !name,
    });
  }

  protected onToggle(event: Event, name: string): void {
    const el = event.target as HTMLDetailsElement;
    if (el.open && this.openName() !== name) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { entry: this.entry() },
        fragment: name,
        replaceUrl: true,
      });
    } else if (!el.open && this.openName() === name) {
      this.openName.set(null);
    }
  }

  protected brief(x: ApiExport): string {
    const first =
      x.description
        .split(/\n\s*\n/)[0]
        ?.replace(/\s+/g, ' ')
        .replace(/`/g, '') ?? '';
    return first.length > 160 ? first.slice(0, 157) + '…' : first;
  }

  protected asProps(m: ApiExport['members']): ApiProperty[] {
    return (m ?? []) as ApiProperty[];
  }

  protected asEnum(m: ApiExport['members']): ApiEnumMember[] {
    return (m ?? []) as ApiEnumMember[];
  }
}
