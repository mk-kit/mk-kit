import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkAutofocus,
  MkButton,
  MkClickOutside,
  MkCopyToClipboard,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the utility directives of `@mkornas/ui`:
 * `mkClickOutside` and `mkCopyToClipboard`.
 */
@Component({
  selector: 'docs-utilities-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton, MkClickOutside, MkCopyToClipboard, MkAutofocus],
  template: `
    <div class="docs-page docs-container">
      <h1>Utilities</h1>
      <p class="docs-lead">
        Small standalone directives that compose with any element — the building
        blocks the components themselves use.
      </p>

      <!-- clickOutside -->
      <h2>Click outside</h2>
      <p>
        <code class="docs-inline">(mkClickOutside)</code> emits when a pointer
        press lands outside the host — the primitive for dismissing custom
        panels. Open the box below, then click anywhere outside it.
      </p>
      <docs-example [code]="clickOutsideCode" [column]="true">
        <button mkButton variant="outline" (click)="boxOpen.set(true)">
          Open box
        </button>
        @if (boxOpen()) {
          <div
            class="docs-outside-box"
            (mkClickOutside)="boxOpen.set(false)"
            style="margin-top: var(--mk-space-2); padding: var(--mk-space-4);
                   border: var(--mk-border-width) solid var(--mk-border);
                   border-radius: var(--mk-radius-md); background: var(--mk-surface);"
          >
            I close when you click outside me.
          </div>
        }
        <p class="echo">Box is {{ boxOpen() ? 'open' : 'closed' }}.</p>
      </docs-example>

      <!-- copyToClipboard -->
      <h2>Copy to clipboard</h2>
      <p>
        <code class="docs-inline">[mkCopyToClipboard]</code> copies its value on
        click, emits <code class="docs-inline">(copiedText)</code>, and exposes a
        transient <code class="docs-inline">justCopied()</code> signal (via
        <code class="docs-inline">exportAs</code>) for instant "Copied!" feedback.
      </p>
      <docs-example [code]="copyCode" [column]="true">
        <button
          mkButton
          variant="outline"
          [mkCopyToClipboard]="token"
          #copier="mkCopyToClipboard"
          (copiedText)="lastCopied.set($event)"
        >
          {{ copier.justCopied() ? '✓ Copied!' : 'Copy token' }}
        </button>
        <p class="echo">
          <code class="docs-inline">{{ token }}</code>
          @if (lastCopied()) {
            — last copied at click
          }
        </p>
      </docs-example>

      <!-- autofocus -->
      <h2>Autofocus</h2>
      <p>
        <code class="docs-inline">mkAutofocus</code> focuses the host once it
        renders (with an optional delay) — ideal for dialogs and newly-revealed
        forms. Toggle the field below; it grabs focus when it appears.
      </p>
      <docs-example [code]="autofocusCode" [column]="true">
        <button mkButton variant="outline" (click)="showField.set(!showField())">
          {{ showField() ? 'Hide' : 'Show' }} field
        </button>
        @if (showField()) {
          <input
            mkAutofocus
            placeholder="I'm focused automatically"
            style="margin-top: var(--mk-space-2); width: 100%; max-width: 20rem; height: var(--mk-control-height-md); padding: 0 var(--mk-space-3); border: var(--mk-border-width) solid var(--mk-border); border-radius: var(--mk-radius-md); background: var(--mk-surface); color: var(--mk-text);"
          />
        }
      </docs-example>
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
      }
    `,
  ],
})
export class UtilitiesPage {
  protected readonly boxOpen = signal(false);
  protected readonly token = 'sk_live_9f2b7c1a4e8d';
  protected readonly lastCopied = signal('');
  protected readonly showField = signal(false);
  protected readonly autofocusCode = `<input mkAutofocus placeholder="…" />`;

  protected readonly clickOutsideCode = `<div (mkClickOutside)="open.set(false)">
  I close when you click outside me.
</div>`;

  protected readonly copyCode = `<button mkButton [mkCopyToClipboard]="token"
  #c="mkCopyToClipboard" (copiedText)="onCopied($event)">
  {{ c.justCopied() ? '✓ Copied!' : 'Copy token' }}
</button>`;
}
