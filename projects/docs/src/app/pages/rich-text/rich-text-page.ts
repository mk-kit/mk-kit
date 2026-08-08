import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MkFormField, MkRichText } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for `<mk-rich-text>` — the single-field
 * WYSIWYG form control of `@mkornas/ui/rich-text`.
 */
@Component({
  selector: 'docs-rich-text-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkRichText, MkFormField],
  template: `
    <div class="docs-page docs-container">
      <h1>Rich text</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-rich-text&gt;</code> is a small WYSIWYG
        form control over a sanitised HTML string — for single
        "description"-style fields where the full block editor is overkill. It
        renders a textarea-like surface; selecting text raises the floating
        inline toolbar (Bold, Italic, Underline, Strikethrough, Inline code,
        Link, Clear) and Enter inserts a line break. It implements
        <code class="docs-inline">ControlValueAccessor</code> with a two-way
        <code class="docs-inline">value</code> model, so it works with
        <code class="docs-inline">[(ngModel)]</code>, reactive forms and
        <code class="docs-inline">[(value)]</code> alike.
      </p>

      <!-- ============================================================ -->
      <h2>Basic usage</h2>
      <p>
        Bind the HTML string with <code class="docs-inline">[(value)]</code>.
        Type below and select some text to format it — the emitted markup
        appears underneath. A visually empty surface (whitespace, lone
        <code class="docs-inline">&lt;br&gt;</code>s) normalises to
        <code class="docs-inline">''</code>, so <em>required</em> validation
        behaves.
      </p>
      <docs-example [code]="heroCode" [column]="true">
        <mk-rich-text
          [(value)]="notes"
          placeholder="Write something, then select text to format it…"
          style="width: 100%; max-width: 34rem;"
        />
        <p class="echo">
          HTML value:
          <code class="docs-inline">{{ notes() || '(empty)' }}</code>
        </p>
      </docs-example>

      <!-- ============================================================ -->
      <h2>In a form field</h2>
      <p>
        Inside an <code class="docs-inline">&lt;mk-form-field&gt;</code> the
        control wires itself to the field's label, hint and error region
        (<code class="docs-inline">aria-labelledby</code> /
        <code class="docs-inline">aria-describedby</code>) and picks up the
        invalid visual while an error shows. Clear the field below to see the
        required story.
      </p>
      <docs-example [code]="formFieldCode" [column]="true">
        <mk-form-field
          label="Description"
          hint="Bold, italic, links and inline code are allowed."
          required
          [error]="descriptionError()"
          style="width: 100%; max-width: 34rem;"
        >
          <mk-rich-text
            [(value)]="description"
            placeholder="A description is required…"
            minHeight="6em"
          />
        </mk-form-field>
        <p class="echo">
          Value is {{ description() === '' ? 'empty — the field shows its error' : 'set' }}.
        </p>
      </docs-example>

      <!-- ============================================================ -->
      <h2>Disabled</h2>
      <p>
        Set <code class="docs-inline">disabled</code> (or disable the bound
        form control — <code class="docs-inline">setDisabledState</code> is
        honoured). The surface becomes inert and the toolbar never shows.
      </p>
      <docs-example [code]="disabledCode" [column]="true">
        <mk-rich-text
          [value]="frozen"
          disabled
          style="width: 100%; max-width: 34rem;"
        />
      </docs-example>

      <!-- ============================================================ -->
      <h2>Sanitisation</h2>
      <p>
        Every value — written into the control or emitted by it — passes
        through the allow-list sanitiser
        (<code class="docs-inline">sanitizeInlineHtml</code>, also exported).
        Only the inline formatting tags the toolbar produces survive;
        <code class="docs-inline">&lt;script&gt;</code> tags, event-handler
        attributes like <code class="docs-inline">onclick</code>, and
        <code class="docs-inline">javascript:</code> URLs are stripped. That
        holds for pasted markup and for programmatic writes
        (<code class="docs-inline">writeValue</code>,
        <code class="docs-inline">[(value)]</code>) too, so the string you read
        back is safe to store and render.
      </p>

      <!-- ============================================================ -->
      <h2>Relationship to the block editor</h2>
      <p>
        <code class="docs-inline">&lt;mk-rich-text&gt;</code> is the
        single-field control: one sanitised HTML string, ideal for
        descriptions, bios and comment boxes.
        <code class="docs-inline">&lt;mk-block-editor&gt;</code>
        (<code class="docs-inline">@mkornas/ui/block-editor</code>) is for
        whole documents — a structured block model with paragraphs, headings,
        quotes and lists. Both are built on the same contenteditable engine
        (<code class="docs-inline">MkRichTextEngine</code>) and the same
        sanitiser, so inline formatting behaves identically across the two.
      </p>

      <!-- ============================================================ -->
      <h2>API</h2>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>[(value)]</code></td><td><code>string</code></td><td><code>''</code></td><td>Two-way HTML string value. Always sanitised; visually empty content normalises to <code>''</code>.</td></tr>
          <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>''</code></td><td>Placeholder shown while the value is empty.</td></tr>
          <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disable the control (the CVA disabled state is honoured too).</td></tr>
          <tr><td><code>invalid</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Force the invalid visual + <code>aria-invalid</code> when used standalone (inside <code>mk-form-field</code> it follows the field's error state).</td></tr>
          <tr><td><code>minHeight</code></td><td><code>string</code></td><td><code>'4.5em'</code></td><td>Minimum height of the editable area (any CSS length).</td></tr>
          <tr><td><code>aria-label</code></td><td><code>string</code></td><td><code>''</code></td><td>Accessible label when not labelled by an <code>mk-form-field</code>.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .echo {
        margin: var(--mk-space-2) 0 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
        overflow-wrap: anywhere;
      }
    `,
  ],
})
export class RichTextPage {
  protected readonly notes = signal(
    'Ship the <strong>rich text</strong> docs — see the <em>sanitiser</em> notes.',
  );

  protected readonly description = signal('');
  protected readonly descriptionError = computed(() =>
    this.description() === '' ? 'A description is required.' : null,
  );

  protected readonly frozen =
    'This field is <strong>read-only</strong> for now — <em>ask an editor</em> to unlock it.';

  protected readonly heroCode = `<mk-rich-text [(value)]="notes"
  placeholder="Write something, then select text to format it…" />

<p>HTML value: {{ notes() }}</p>`;

  protected readonly formFieldCode = `<mk-form-field label="Description" required
  hint="Bold, italic, links and inline code are allowed."
  [error]="description() === '' ? 'A description is required.' : null">
  <mk-rich-text [(value)]="description" minHeight="6em" />
</mk-form-field>`;

  protected readonly disabledCode = `<mk-rich-text [value]="frozen" disabled />`;
}
