import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MkAlert,
  MkButton,
  MkCheckbox,
  MkCode,
  MkCodeEditor,
  type MkCodeValidity,
  MkDiff,
  MkInput,
  MkJsonViewer,
  MkLogViewer,
  MkMarkdown,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

const LOG_SERVICES = ['api', 'worker', 'scheduler', 'mailer'] as const;
const LOG_PATHS = ['/orders', '/users/42', '/health', '/invoices', '/search?q=mk'] as const;

/**
 * Documentation + live demo page for the code & content components of
 * `@mk-kit/ui`: authoring with `<mk-code-editor>` and rendering with
 * `<mk-markdown>`, `<mk-code>`, `<mk-diff>`, `<mk-json-viewer>` and
 * `<mk-log-viewer>`.
 */
@Component({
  selector: 'docs-markdown-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    FormsModule,
    MkAlert,
    MkButton,
    MkCheckbox,
    MkCode,
    MkCodeEditor,
    MkDiff,
    MkInput,
    MkJsonViewer,
    MkLogViewer,
    MkMarkdown,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Code &amp; content</h1>
      <p class="docs-lead">
        Everything for authoring and rendering structured text.
        <strong>Authoring:</strong>
        <code class="docs-inline">&lt;mk-code-editor&gt;</code>, a lightweight
        code field with highlighting and JSON validation.
        <strong>Rendering:</strong>
        <code class="docs-inline">&lt;mk-markdown&gt;</code> (a safe,
        zero-dependency CommonMark subset),
        <code class="docs-inline">&lt;mk-code&gt;</code> (read-only code
        blocks), <code class="docs-inline">&lt;mk-diff&gt;</code> (before/after
        text comparison),
        <code class="docs-inline">&lt;mk-json-viewer&gt;</code> (collapsible
        JSON trees) and <code class="docs-inline">&lt;mk-log-viewer&gt;</code>
        (a virtualized, ANSI-aware log pane). The pure helpers behind them —
        <code class="docs-inline">mkHighlight</code> /
        <code class="docs-inline">mkHighlightJson</code>,
        <code class="docs-inline">mkComputeDiff</code> /
        <code class="docs-inline">mkDiffStats</code> and
        <code class="docs-inline">mkBuildJsonTree</code> — are exported
        standalone.
      </p>

      <!-- ============================================================ -->
      <h2>Code editor</h2>
      <p>
        <code class="docs-inline">&lt;mk-code-editor&gt;</code> is a
        dependency-free code <em>field</em>: a real
        <code class="docs-inline">&lt;textarea&gt;</code> with a synced syntax
        highlight layer behind it, so it keeps native editing semantics and
        accessibility without a heavyweight editor. With
        <code class="docs-inline">language="json"</code> it validates on every
        change (debounced) — an inline error appears and
        <code class="docs-inline">(validate)</code> emits
        <code class="docs-inline">{{ '{' }} valid, error {{ '}' }}</code> — and
        <code class="docs-inline">format()</code> pretty-prints valid JSON with
        <code class="docs-inline">tabSize</code> indentation. Try breaking the
        JSON below, then format it.
      </p>
      <docs-example [code]="codeEditorCode" [column]="true">
        <div class="editor-demo">
          <mk-code-editor
            #editor="mkCodeEditor"
            language="json"
            [rows]="9"
            [(value)]="editorValue"
            (validate)="editorValidity.set($event)"
            ariaLabel="JSON configuration"
          />
          <div class="editor-demo__bar">
            <button mkButton size="sm" variant="outline" (click)="editor.format()">
              Format
            </button>
            <span class="editor-demo__echo">
              @if (editorValidity(); as v) {
                {{ v.valid ? 'Valid JSON' : 'Invalid: ' + v.error }}
              }
            </span>
          </div>
        </div>
      </docs-example>

      <h3>API</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>[(value)]</code></td><td><code>string</code></td><td><code>''</code></td><td>Two-way editor content (also a <code>ControlValueAccessor</code>).</td></tr>
          <tr><td><code>language</code></td><td><code>'json' | 'plaintext'</code></td><td><code>'plaintext'</code></td><td>Highlighting + validation; only <code>json</code> validates.</td></tr>
          <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>''</code></td><td>Shown when empty.</td></tr>
          <tr><td><code>rows</code></td><td><code>number</code></td><td><code>8</code></td><td>Visible rows (minimum height).</td></tr>
          <tr><td><code>lineNumbers</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the line-number gutter.</td></tr>
          <tr><td><code>tabSize</code></td><td><code>number</code></td><td><code>2</code></td><td>Spaces inserted by Tab; also <code>format()</code> indentation.</td></tr>
          <tr><td><code>wrap</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Soft-wrap long lines instead of scrolling horizontally.</td></tr>
          <tr><td><code>readOnly</code> / <code>disabled</code> / <code>invalid</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Read-only (still focusable), disabled, or forced invalid styling.</td></tr>
          <tr><td><code>size</code></td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td><td>Control size; ignored inside an <code>mk-form-field</code>.</td></tr>
          <tr><td><code>ariaLabel</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible label when used standalone (no form field).</td></tr>
          <tr><td><code>(validate)</code></td><td><code>MkCodeValidity</code></td><td>—</td><td>Emits <code>{{ '{' }} valid, error {{ '}' }}</code> whenever JSON validity changes.</td></tr>
        </tbody>
      </table>
      <p>
        Via <code class="docs-inline">exportAs="mkCodeEditor"</code> the
        component also exposes <code class="docs-inline">format()</code>
        (pretty-print valid JSON; no-op otherwise) and
        <code class="docs-inline">parsed()</code> (the parsed JSON value, or
        <code class="docs-inline">undefined</code> when empty / invalid /
        plaintext).
      </p>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td>Tab</td><td>Inserts <code>tabSize</code> spaces at the caret (undo-friendly).</td></tr>
          <tr><td>Esc, then Tab</td><td>The escape hatch: Escape arms the next Tab to move focus out instead of indenting, so the editor is never a keyboard trap.</td></tr>
        </tbody>
      </table>

      <mk-alert tone="info" variant="soft" title="Form-field integration">
        The editor implements <code class="docs-inline">ControlValueAccessor</code>
        over its string value, so it works with
        <code class="docs-inline">ngModel</code> and reactive forms. Nested in
        an <code class="docs-inline">mk-form-field</code> it inherits the
        field's size, label, description ids and error state automatically —
        the JSON parse error is merged into
        <code class="docs-inline">aria-describedby</code> either way.
      </mk-alert>

      <!-- ============================================================ -->
      <h2>Markdown</h2>
      <p>
        Bind the source text with <code class="docs-inline">[source]</code> —
        the component parses and renders on every change. Edit the sample
        below; the preview updates live.
      </p>
      <docs-example [code]="markdownCode" [column]="true">
        <div class="md-demo">
          <textarea
            mkInput
            class="md-demo__editor"
            aria-label="Markdown source"
            [ngModel]="mdSource()"
            (ngModelChange)="mdSource.set($event)"
          ></textarea>
          <div class="md-demo__preview">
            <mk-markdown [source]="mdSource()" linkTarget="_blank" />
          </div>
        </div>
      </docs-example>

      <mk-alert tone="info" variant="soft" title="Safe by construction">
        Raw HTML in the source is <strong>never</strong> passed through — it is
        always escaped and shown as text, so there is no XSS surface. Link and
        image URLs are restricted to
        <code class="docs-inline">http</code> /
        <code class="docs-inline">https</code> /
        <code class="docs-inline">mailto</code> / relative; anything else
        (<code class="docs-inline">javascript:</code>,
        <code class="docs-inline">data:</code>, …) has its
        <code class="docs-inline">href</code> dropped and renders as plain
        text. The rendered string contains only markup the renderer itself
        generates, and it still passes through Angular's
        <code class="docs-inline">DomSanitizer</code> — no
        <code class="docs-inline">bypassSecurityTrustHtml</code> anywhere.
      </mk-alert>

      <h3>Links: target and autolinking</h3>
      <p>
        <code class="docs-inline">linkTarget="_blank"</code> opens every link
        in a new tab and automatically adds
        <code class="docs-inline">rel="noopener noreferrer"</code>. Bare
        <code class="docs-inline">http(s)://…</code> URLs in the text are
        <em>not</em> linked by default — set
        <code class="docs-inline">autolink</code> to turn them into links
        (same URL safety policy applies).
      </p>

      <h3>API</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>source</code></td><td><code>string</code></td><td><code>''</code></td><td>Markdown source text.</td></tr>
          <tr><td><code>autolink</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Turn bare <code>http(s)://…</code> URLs into links.</td></tr>
          <tr><td><code>linkTarget</code></td><td><code>'' | '_blank'</code></td><td><code>''</code></td><td>Link target; <code>'_blank'</code> also adds <code>rel="noopener noreferrer"</code>.</td></tr>
        </tbody>
      </table>
      <p>
        The parser and renderer are exported standalone as
        <code class="docs-inline">mkParseMarkdown(source, options?)</code>
        (typed AST) and
        <code class="docs-inline">mkRenderMarkdown(blocks, options?)</code>.
      </p>

      <h3>Supported syntax</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Syntax</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>ATX headings <code>#</code> … <code>######</code></td><td>Optional closing hashes are stripped.</td></tr>
          <tr><td>Paragraphs</td><td>Hard line breaks via two trailing spaces.</td></tr>
          <tr><td>Emphasis</td><td>Bold <code>**x**</code>, italic <code>*x*</code> / <code>_x_</code> (word-bounded for <code>_</code>), strikethrough <code>~~x~~</code>, and <code>***x***</code> for bold-italic.</td></tr>
          <tr><td>Inline code <code>&#96;x&#96;</code></td><td>Multi-backtick fences for literal backticks.</td></tr>
          <tr><td>Links <code>[text](url)</code></td><td>http/https/mailto/relative URLs only; anything else has its href dropped and renders as plain text.</td></tr>
          <tr><td>Images <code>![alt](src)</code></td><td>Same URL policy; unsafe sources render as the alt text.</td></tr>
          <tr><td>Fenced code blocks <code>&#96;&#96;&#96;</code></td><td>Optional language — highlighted through <code>mkHighlight</code> for its known languages, plain escaped code otherwise.</td></tr>
          <tr><td>Lists</td><td>Tight unordered (<code>-</code>, <code>*</code>, <code>+</code>) and ordered (<code>1.</code>, <code>1)</code>) lists, nested by 2-space indent; a blank line ends the list (loose lists unsupported).</td></tr>
          <tr><td>Blockquotes <code>&gt;</code></td><td>Nestable; no lazy continuation.</td></tr>
          <tr><td>Horizontal rules</td><td><code>---</code>, <code>***</code>, <code>___</code>.</td></tr>
          <tr><td>Tables</td><td>GitHub pipe tables with <code>:---:</code> alignment colons and <code>\\|</code> cell escapes.</td></tr>
          <tr><td>Backslash escapes</td><td>For ASCII punctuation (<code>\\*</code>, <code>\\|</code>, …).</td></tr>
          <tr><td>Autolinks</td><td>Bare <code>http(s)://</code> URLs, only when <code>autolink</code> is on.</td></tr>
        </tbody>
      </table>
      <p>
        <strong>Not supported (by design):</strong> raw inline HTML (always
        escaped and shown as text), footnotes, setext headings
        (<code class="docs-inline">===</code> /
        <code class="docs-inline">---</code> underlines — a
        <code class="docs-inline">---</code> line is always a horizontal rule
        here), reference-style links, and loose lists.
      </p>

      <!-- ============================================================ -->
      <h2>Code block</h2>
      <p>
        <code class="docs-inline">&lt;mk-code&gt;</code> is the read-only
        counterpart of the editor: a themed code block with syntax
        highlighting, an optional filename header, line numbers and a copy
        button (it reuses the same tokenizer and the copy directive).
      </p>
      <docs-example [code]="codeBlockCode" [column]="true">
        <mk-code
          language="json"
          filename="config.json"
          [lineNumbers]="true"
          [code]="sampleJson"
        />
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>code</code></td><td><code>string</code></td><td><code>''</code></td><td>The source to display.</td></tr>
          <tr><td><code>language</code></td><td><code>'json' | 'plaintext'</code></td><td><code>'plaintext'</code></td><td>Language for highlighting.</td></tr>
          <tr><td><code>filename</code></td><td><code>string</code></td><td><code>''</code></td><td>Optional filename shown in a header bar.</td></tr>
          <tr><td><code>lineNumbers</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Show a line-number gutter.</td></tr>
          <tr><td><code>copyable</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the copy button.</td></tr>
          <tr><td><code>wrap</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Soft-wrap long lines instead of scrolling horizontally.</td></tr>
        </tbody>
      </table>
      <p>
        The highlighter itself is exported from core as
        <code class="docs-inline">mkHighlight(code, language)</code> (plus the
        JSON-specific <code class="docs-inline">mkHighlightJson</code>) —
        useful for rendering highlighted snippets outside these components.
      </p>

      <!-- ============================================================ -->
      <h2>Diff</h2>
      <p>
        <code class="docs-inline">&lt;mk-diff&gt;</code> compares two versions
        of text (a revision "before → after") with an LCS line diff and
        intra-line word highlighting. Render
        <code class="docs-inline">unified</code> (single column, +/−) or
        <code class="docs-inline">split</code> (side-by-side).
      </p>
      <docs-example [code]="diffCode" [column]="true">
        <div style="display: flex; flex-direction: column; gap: var(--mk-space-4); width: 100%;">
          <mk-diff [before]="diffBefore" [after]="diffAfter" />
          <mk-diff [before]="diffBefore" [after]="diffAfter" mode="split" beforeLabel="v3" afterLabel="v4" />
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>before</code> / <code>after</code></td><td><code>string</code></td><td><code>''</code></td><td>The original and the new text.</td></tr>
          <tr><td><code>mode</code></td><td><code>'unified' | 'split'</code></td><td><code>'unified'</code></td><td>Single-column (+/−) or side-by-side layout.</td></tr>
          <tr><td><code>wordHighlight</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Highlight the specific words that changed within a line.</td></tr>
          <tr><td><code>lineNumbers</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show line-number gutters.</td></tr>
          <tr><td><code>ignoreTrailingWhitespace</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Ignore trailing whitespace when comparing lines.</td></tr>
          <tr><td><code>showStats</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the +added / −removed summary header.</td></tr>
          <tr><td><code>beforeLabel</code> / <code>afterLabel</code></td><td><code>string</code></td><td>i18n</td><td>Column labels (split-view header / a11y).</td></tr>
        </tbody>
      </table>
      <p>
        The diff engine is pure and exported standalone:
        <code class="docs-inline">mkComputeDiff(before, after, options?)</code>
        returns typed <code class="docs-inline">MkDiffRow[]</code> and
        <code class="docs-inline">mkDiffStats(rows)</code> counts additions and
        removals — handy for badges ("+12 −3") without rendering the view.
      </p>

      <!-- ============================================================ -->
      <h2>JSON viewer</h2>
      <p>
        <code class="docs-inline">&lt;mk-json-viewer&gt;</code> renders JSON-ish
        data as a read-only collapsible tree: objects and arrays fold behind
        disclosure buttons with a
        <code class="docs-inline">{{ '{' }}…{{ '}' }} n items</code> preview,
        primitives are colour-coded by type and circular references render as
        <code class="docs-inline">[Circular]</code>. The complement of the code
        editor: that edits JSON <em>text</em>, this explores JSON
        <em>data</em>.
      </p>
      <docs-example [code]="jsonViewerCode" [column]="true">
        <mk-json-viewer [data]="jsonSample" [expandDepth]="2" />
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>unknown</code></td><td>required</td><td>Any JSON-serialisable value to display.</td></tr>
          <tr><td><code>expandDepth</code></td><td><code>number</code></td><td><code>1</code></td><td>How many levels start expanded (root = level 1).</td></tr>
          <tr><td><code>aria-label</code></td><td><code>string</code></td><td>i18n</td><td>Accessible label of the tree region.</td></tr>
        </tbody>
      </table>
      <p>
        <code class="docs-inline">expandAll()</code> /
        <code class="docs-inline">collapseAll()</code> are callable via
        <code class="docs-inline">exportAs="mkJsonViewer"</code>, and the tree
        builder is exported standalone as
        <code class="docs-inline">mkBuildJsonTree(value)</code> (circular
        references marked, not recursed).
      </p>

      <!-- ============================================================ -->
      <h2>Log viewer</h2>
      <p>
        <code class="docs-inline">&lt;mk-log-viewer&gt;</code> renders only the
        visible window of the line array (the same virtualization technique as
        <code class="docs-inline">mk-virtual-scroll</code>), follows new output
        at the bottom until you scroll away — scroll back to the tail and it
        re-sticks — and highlights case-insensitive plain-string matches of
        <code class="docs-inline">[query]</code>. Start the stream, scroll up
        to detach follow mode, then try the search box.
      </p>
      <docs-example [code]="logCode" [column]="true">
        <div class="log-controls">
          <button mkButton size="sm" (click)="toggleStream()">
            {{ streaming() ? 'Stop streaming' : 'Start streaming' }}
          </button>
          <input
            mkInput
            size="sm"
            placeholder="Search, e.g. error…"
            aria-label="Search the log"
            [ngModel]="logQuery()"
            (ngModelChange)="logQuery.set($event)"
            style="max-width: 13rem;"
          />
          <mk-checkbox [(checked)]="logWrap">Wrap</mk-checkbox>
          <span class="log-controls__echo">
            @if (logQuery()) {
              {{ matchCount() }} match{{ matchCount() === 1 ? '' : 'es' }} ·
            }
            follow {{ logFollow() ? 'on' : 'off' }}
          </span>
        </div>
        <mk-log-viewer
          [lines]="logLines()"
          [(follow)]="logFollow"
          [(wrap)]="logWrap"
          [query]="logQuery()"
          [maxLines]="500"
          (matches)="matchCount.set($event)"
          style="width: 100%; height: 18rem;"
        />
      </docs-example>

      <h3>Ring buffer &amp; ANSI colours</h3>
      <p>
        The component keeps at most <code class="docs-inline">maxLines</code>
        lines (default 10&nbsp;000) — beyond that the <em>oldest</em> lines are
        dropped, so an endless stream never grows the DOM or the memory
        footprint (the demo above caps at 500). ANSI SGR escape sequences
        (reset, bold, italic, underline, the 8 standard + 8 bright foreground
        and background colours) are parsed into spans styled with
        <code class="docs-inline">mk-ansi--*</code> classes whose colours come
        from the active theme, not raw terminal palettes — so logs stay
        readable in light and dark mode alike. Extended 256-colour / truecolour
        introducers are consumed but render uncoloured, and every other escape
        (cursor movement, OSC titles, …) is stripped rather than rendered as
        garbage. Wrap mode soft-wraps long lines but disables virtualization —
        keep <code class="docs-inline">maxLines</code> modest when wrapping is
        expected.
      </p>

      <h3>API</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>lines</code></td><td><code>readonly string[]</code></td><td><code>[]</code></td><td>The log lines; may contain ANSI SGR escape sequences.</td></tr>
          <tr><td><code>[(follow)]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Stick to the bottom as new lines arrive; detaches when the user scrolls up, re-sticks at the tail.</td></tr>
          <tr><td><code>[(wrap)]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Soft-wrap long lines (also a toolbar toggle). Disables virtualization.</td></tr>
          <tr><td><code>ansi</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Parse ANSI SGR colour codes; <code>false</code> renders lines verbatim.</td></tr>
          <tr><td><code>query</code></td><td><code>string</code></td><td><code>''</code></td><td>Case-insensitive plain-string search (no regex); matches are highlighted.</td></tr>
          <tr><td><code>maxLines</code></td><td><code>number</code></td><td><code>10000</code></td><td>Ring buffer size — the oldest lines are dropped beyond this.</td></tr>
          <tr><td><code>itemHeight</code></td><td><code>number</code></td><td><code>20</code></td><td>Fixed row height in px; drives virtualization and sets the line-height.</td></tr>
          <tr><td><code>hideToolbar</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Hide the built-in toolbar row (wrap toggle + copy-all; projected content docks into it).</td></tr>
          <tr><td><code>aria-label</code></td><td><code>string</code></td><td>i18n</td><td>Accessible label of the log region.</td></tr>
          <tr><td><code>(matches)</code></td><td><code>number</code></td><td>—</td><td>Emits the total number of <code>query</code> matches whenever it changes.</td></tr>
        </tbody>
      </table>
      <p>
        The toolbar's <em>Copy all</em> copies the whole buffer with escape
        sequences stripped. The standalone ANSI helpers are exported too:
        <code class="docs-inline">mkParseAnsi(line)</code> and
        <code class="docs-inline">mkStripAnsi(line)</code>.
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .md-demo {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
        gap: var(--mk-space-4);
        width: 100%;
        align-items: stretch;
      }
      .md-demo__editor {
        min-height: 22rem;
        resize: vertical;
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
      }
      .md-demo__preview {
        min-width: 0;
        padding: var(--mk-space-3) var(--mk-space-4);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        overflow-x: auto;
      }
      .editor-demo {
        display: grid;
        gap: var(--mk-space-3);
        width: 100%;
      }
      .editor-demo__bar {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        flex-wrap: wrap;
      }
      .editor-demo__echo {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .log-controls {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
        flex-wrap: wrap;
        width: 100%;
      }
      .log-controls__echo {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class MarkdownPage {
  private readonly destroyRef = inject(DestroyRef);

  // --- Code editor ----------------------------------------------------------

  protected readonly editorValue = signal(
    '{\n  "site": "mk-kit docs",\n  "theme": "dark",\n  "retries": 3,\n  "features": ["search", "export"]\n}',
  );
  protected readonly editorValidity = signal<MkCodeValidity | null>(null);

  protected readonly codeEditorCode = `<mk-code-editor #editor="mkCodeEditor" language="json"
  [(value)]="config" [rows]="9" (validate)="validity.set($event)" />
<button mkButton (click)="editor.format()">Format</button>`;

  // --- Code block -----------------------------------------------------------

  protected readonly sampleJson =
    '{\n  "theme": "dark",\n  "retries": 3,\n  "features": ["search", "export"]\n}';
  protected readonly codeBlockCode = `<mk-code language="json" filename="config.json"
  lineNumbers [code]="json" />`;

  // --- Diff -----------------------------------------------------------------

  protected readonly diffBefore = `title: Getting started
theme: light
retries: 3
Draft the quick brown fox.`;
  protected readonly diffAfter = `title: Getting started
theme: dark
retries: 5
Draft the slow brown fox.
published: true`;
  protected readonly diffCode = `<mk-diff [before]="v1" [after]="v2" />
<mk-diff [before]="v1" [after]="v2" mode="split" />`;

  // --- JSON viewer ----------------------------------------------------------

  protected readonly jsonSample = {
    id: 'ord_1042',
    total: 249.99,
    paid: true,
    customer: { name: 'Ada Lovelace', vip: null },
    items: [
      { sku: 'KB-01', qty: 1 },
      { sku: 'MS-77', qty: 2 },
    ],
  };
  protected readonly jsonViewerCode = `<mk-json-viewer [data]="order" [expandDepth]="2" />`;

  // --- Markdown -------------------------------------------------------------

  protected readonly mdSource = signal(
    [
      '# Release 0.32.0',
      '',
      'The `data` entry point gains two **output** components — *markdown* and a',
      '~~terminal~~ log viewer. Raw HTML like <em>this</em> is escaped, and',
      '[unsafe links](javascript:alert(1)) lose their href.',
      '',
      '## Highlights',
      '- Zero-dependency CommonMark subset',
      '- Safe by construction',
      '  - Nested lists via 2-space indent',
      '- [Repository](https://github.com/mk-kit/mk-kit#readme)',
      '',
      '| Component | Entry point | Since |',
      '| --- | :---: | ---: |',
      '| mk-markdown | data | 0.32.0 |',
      '| mk-log-viewer | data | 0.32.0 |',
      '',
      '```json',
      '{ "version": "0.32.0", "breaking": false }',
      '```',
    ].join('\n'),
  );

  // --- Log viewer -----------------------------------------------------------

  protected readonly logLines = signal<readonly string[]>([]);
  protected readonly streaming = signal(false);
  protected readonly logFollow = signal(true);
  protected readonly logWrap = signal(false);
  protected readonly logQuery = signal('');
  protected readonly matchCount = signal(0);

  /** Deterministic line counter — drives timestamps, levels and payloads. */
  private tick = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Seed a first screenful so the pane isn't empty before streaming starts.
    this.appendLines(40);
    this.destroyRef.onDestroy(() => this.stopStream());
  }

  protected toggleStream(): void {
    if (this.streaming()) {
      this.stopStream();
      return;
    }
    this.streaming.set(true);
    // 3 lines per second, fully deterministic content (counter + modulo).
    this.intervalId = setInterval(() => this.appendLines(3), 1000);
  }

  private stopStream(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.streaming.set(false);
  }

  private appendLines(count: number): void {
    const batch: string[] = [];
    for (let i = 0; i < count; i++) batch.push(this.makeLine());
    this.logLines.update((lines) => [...lines, ...batch]);
  }

  /** One fake log line; every value derives from the tick counter. */
  private makeLine(): string {
    const n = this.tick++;
    const t = `12:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    const stamp = `\u001b[90m${t}\u001b[0m`;
    const svc = LOG_SERVICES[n % LOG_SERVICES.length];
    const path = LOG_PATHS[n % LOG_PATHS.length];
    if (n % 13 === 9) {
      return `${stamp} \u001b[1;31mERROR\u001b[0m ${svc} — upstream timeout on ${path} after 3000ms`;
    }
    if (n % 7 === 3) {
      return `${stamp} \u001b[33mWARN\u001b[0m  ${svc} — slow query (${180 + (n % 5) * 40}ms) on ${path}`;
    }
    return `${stamp} \u001b[32mINFO\u001b[0m  ${svc} — GET \u001b[36m${path}\u001b[0m 200 ${8 + (n % 6) * 3}ms`;
  }

  // --- Code snippets ---------------------------------------------------------

  protected readonly markdownCode = `source = signal('# Hello **markdown**');

<mk-markdown [source]="source()" linkTarget="_blank" />

<!-- Bare URLs become links only with autolink: -->
<mk-markdown [source]="notes()" autolink />`;

  protected readonly logCode = `lines = signal<string[]>([]);
follow = signal(true);
query = signal('');
count = signal(0);

// Lines may contain ANSI SGR colours:
this.lines.update((l) => [...l, '\\x1b[32mINFO\\x1b[0m  api — GET /orders 200 12ms']);

<mk-log-viewer
  [lines]="lines()"
  [(follow)]="follow"
  [query]="query()"
  [maxLines]="500"
  (matches)="count.set($event)"
  style="height: 18rem;"
/>`;
}
