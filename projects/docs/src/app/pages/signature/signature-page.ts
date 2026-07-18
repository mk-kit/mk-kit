import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MkFormField, MkSignaturePad } from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the Signature pad of `@mkornas/ui`.
 */
@Component({
  selector: 'docs-signature-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkFormField, MkSignaturePad],
  template: `
    <div class="docs-page docs-container">
      <h1>Signature pad</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-signature-pad&gt;</code> captures a
        hand-drawn signature with pointer, touch or pen: smoothed strokes,
        crisp on hi-DPI screens, redrawn losslessly when the pad resizes. The
        form value is a PNG data-URL (<code class="docs-inline">null</code>
        while empty), ready for an <code class="docs-inline">&lt;img&gt;</code>
        or an upload. Implements
        <code class="docs-inline">ControlValueAccessor</code>, so
        <code class="docs-inline">[(ngModel)]</code>, reactive forms and
        <code class="docs-inline">[(value)]</code> all work.
      </p>

      <h2>Draw a signature</h2>
      <p>
        Draw below — the captured PNG renders live next to the pad. The Clear
        control (also <code class="docs-inline">clear()</code> on the
        component) resets the pad and the form value. Drawing is inherently
        pointer-based: pair the pad with an alternative flow (e.g. a
        typed-name confirmation) where a keyboard equivalent is required.
      </p>

      <docs-example [code]="signatureCode" [column]="true">
        <mk-form-field
          label="Signature"
          hint="Sign with your mouse, finger or pen"
          style="max-width: 30rem; width: 100%;"
        >
          <mk-signature-pad [(value)]="signature" />
        </mk-form-field>
        @if (signature()) {
          <div class="sig-preview">
            <span class="sig-preview__label">Captured PNG:</span>
            <img [src]="signature()" alt="Captured signature preview" />
          </div>
        } @else {
          <p class="echo">No signature yet.</p>
        }
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string | null&gt;</td><td>null</td><td>Two-way PNG data-URL of the drawing; null while empty.</td></tr>
          <tr><td>strokeWidth</td><td>number</td><td>2</td><td>Stroke width in CSS pixels.</td></tr>
          <tr><td>height</td><td>number</td><td>160</td><td>Pad height in CSS pixels (width follows the container).</td></tr>
          <tr><td>invalid / disabled</td><td>boolean</td><td>false</td><td>Standard control state inputs.</td></tr>
          <tr><td>(cleared)</td><td>void</td><td>—</td><td>Emits when the pad is cleared.</td></tr>
          <tr><td>isEmpty() / clear()</td><td>—</td><td>—</td><td>State signal + imperative reset (exportAs "mkSignaturePad").</td></tr>
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
        margin: 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .sig-preview {
        display: flex;
        align-items: center;
        gap: var(--mk-space-3);
      }
      .sig-preview__label {
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
      .sig-preview img {
        max-width: 14rem;
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-surface);
      }
    `,
  ],
})
export class SignaturePage {
  protected readonly signature = signal<string | null>(null);

  protected readonly signatureCode = `<mk-form-field label="Signature">
  <mk-signature-pad [(value)]="signature" />
</mk-form-field>

<img [src]="signature" alt="Captured signature" />`;
}
