import {
  DOCUMENT,
  Directive,
  PLATFORM_ID,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Copies text to the clipboard when the host is clicked. Emits `(copied)` on
 * success and `(copyFailed)` on error, and exposes a transient `copied` signal
 * (via `exportAs`) so a template can show a "Copied!" state without extra code.
 *
 * ```html
 * <button mkButton [mkCopyToClipboard]="token" #c="mkCopyToClipboard">
 *   {{ c.justCopied() ? 'Copied!' : 'Copy' }}
 * </button>
 * ```
 */
@Directive({
  selector: '[mkCopyToClipboard]',
  exportAs: 'mkCopyToClipboard',
  host: {
    '(click)': 'copy()',
  },
})
export class MkCopyToClipboard {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The text to copy. */
  readonly text = input.required<string>({ alias: 'mkCopyToClipboard' });
  /** How long (ms) the `copied` signal stays true after a successful copy. */
  readonly feedbackDuration = input(1500, {
    alias: 'mkCopyFeedbackDuration',
    transform: numberAttribute,
  });

  /** Emits the copied text on success. */
  readonly copied = output<string>({ alias: 'copiedText' });
  /** Emits the error on failure. */
  readonly copyFailed = output<unknown>();

  private readonly _copied = signal(false);
  /** True for `feedbackDuration` ms after a successful copy. */
  readonly justCopied = this._copied.asReadonly();

  private resetTimer?: ReturnType<typeof setTimeout>;

  /** Copy the text now. Bound to the host click, but callable directly too. */
  async copy(): Promise<void> {
    if (!this.isBrowser) return;
    const value = this.text();
    try {
      await this.write(value);
      this.copied.emit(value);
      this.flagCopied();
    } catch (err) {
      this.copyFailed.emit(err);
    }
  }

  private async write(value: string): Promise<void> {
    const clipboard = this.document.defaultView?.navigator?.clipboard;
    if (clipboard?.writeText) {
      await clipboard.writeText(value);
      return;
    }
    // Fallback for non-secure contexts: a hidden textarea + execCommand.
    const ta = this.document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
    this.document.body.appendChild(ta);
    ta.select();
    const ok =
      typeof this.document.execCommand === 'function' &&
      this.document.execCommand('copy');
    ta.remove();
    if (!ok) throw new Error('Clipboard copy failed');
  }

  private flagCopied(): void {
    this._copied.set(true);
    if (this.resetTimer) clearTimeout(this.resetTimer);
    // Reset after the feedback window (guarded so tests without a view work).
    this.resetTimer = setTimeout(
      () => this._copied.set(false),
      this.feedbackDuration(),
    );
  }

  ngOnDestroy(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }
}
