import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  signal,
} from '@angular/core';

/**
 * Documentation example wrapper: a live preview area (projected content) above
 * a syntax-neutral code block with a copy button. Used across every demo page.
 *
 * ```html
 * <docs-example [code]="snippet">
 *   <button mkButton>Live component here</button>
 * </docs-example>
 * ```
 */
@Component({
  selector: 'docs-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-example">
      <div
        class="docs-example__preview"
        [class.docs-example__preview--column]="column()"
      >
        <ng-content />
      </div>
      @if (code()) {
        <div class="docs-example__codewrap">
          <button
            type="button"
            class="docs-example__copy"
            [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
            (click)="copy()"
          >
            {{ copied() ? 'Copied ✓' : 'Copy' }}
          </button>
          <pre class="docs-example__code"><code>{{ code() }}</code></pre>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .docs-example__codewrap {
        position: relative;
      }
      .docs-example__copy {
        position: absolute;
        top: var(--mk-space-2);
        right: var(--mk-space-2);
        padding: var(--mk-space-1) var(--mk-space-3);
        font-size: var(--mk-font-size-xs);
        font-family: var(--mk-font-sans);
        color: var(--mk-text-muted);
        background: var(--mk-surface);
        border: 1px solid var(--mk-border);
        border-radius: var(--mk-radius-sm);
        cursor: pointer;
        transition: color var(--mk-duration-fast) var(--mk-ease-standard);
      }
      .docs-example__copy:hover {
        color: var(--mk-text);
      }
      .docs-example__copy:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
    `,
  ],
})
export class DocsExample {
  /** Whether the preview stacks its children vertically. */
  readonly column = input(false, { transform: booleanAttribute });
  /** The code snippet shown below the preview. */
  readonly code = input('');

  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }
}
