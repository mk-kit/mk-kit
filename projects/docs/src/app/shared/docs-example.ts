import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { openInStackBlitz, snippetToApp } from './stackblitz';

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
          <div class="docs-example__actions">
            @if (stackblitz()) {
              <button type="button" class="docs-example__copy" aria-label="Open this example in StackBlitz" title="Open in StackBlitz" (click)="openStackBlitz()">
                <svg viewBox="0 0 28 28" width="12" height="12" aria-hidden="true" focusable="false"><path d="M12.7 16.2H5.4L18 2l-2.7 9.8h7.3L10 26l2.7-9.8z" fill="currentColor"/></svg>
                StackBlitz
              </button>
            }
            <button
              type="button"
              class="docs-example__copy"
              [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
              (click)="copy()"
            >
              {{ copied() ? 'Copied ✓' : 'Copy' }}
            </button>
          </div>
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
      .docs-example__actions {
        position: absolute;
        top: var(--mk-space-2);
        right: var(--mk-space-2);
        display: flex;
        gap: var(--mk-space-1);
      }
      .docs-example__copy {
        display: inline-flex;
        align-items: center;
        gap: var(--mk-space-1);
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
  /** Offer "Open in StackBlitz" (on by default; off for snippets that are not runnable). */
  readonly stackblitz = input(true, { transform: booleanAttribute });
  /** Title of the generated project; defaults to the page title. */
  readonly exampleTitle = input('');

  private readonly pageTitle = inject(Title);
  protected readonly copied = signal(false);

  protected openStackBlitz(): void {
    const title = this.exampleTitle() || this.pageTitle.getTitle().replace(/\s+—\s+mk-kit$/, '') || 'mk-kit example';
    openInStackBlitz(snippetToApp(title, this.code()));
  }

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
