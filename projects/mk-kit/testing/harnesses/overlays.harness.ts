import { MkHarness, MkTestElement, pickBy } from '../harness';

/**
 * A dialog opened by `MkDialogService` (`open()`, `confirm()`, `alert()`,
 * `prompt()`). Dialogs live in `document.body`, so look them up through
 * `loader.document()`.
 */
export class MkDialogHarness extends MkHarness {
  static override readonly hostSelector = '.mk-overlay-panel[role="dialog"], .mk-overlay-panel[role="alertdialog"]';

  title(): string {
    return this.q('.mk-dialog__title')?.text() ?? this.host.attr('aria-label') ?? '';
  }

  bodyText(): string {
    return this.q('.mk-dialog__body')?.text() ?? this.host.text();
  }

  /** Texts of every button in the dialog (header close excluded). */
  buttons(): string[] {
    return this.buttonElements().map((b) => b.text());
  }

  /** Click a button by index, exact text or RegExp. */
  async clickButton(which: number | string | RegExp): Promise<void> {
    await pickBy(this.buttonElements(), which, (b) => b.text(), 'dialog button').click();
  }

  /** The header × button. */
  async close(): Promise<void> {
    const btn = this.q('.mk-dialog__close');
    if (!btn) throw new Error('Dialog has no close button (hideClose).');
    await btn.click();
  }

  async pressEscape(): Promise<void> {
    await this.host.sendKeys('Escape');
  }

  /** The prompt dialog's text field, if any. */
  input(): MkTestElement | null {
    return this.q('.mk-dialog__body input, .mk-dialog__body textarea');
  }

  private buttonElements(): MkTestElement[] {
    return this.qAll('button').filter(
      (b) => !b.hasClass('mk-dialog__close') && !b.hasClass('mk-dialog__grip') && !b.hasClass('mk-dialog__resizer'),
    );
  }
}

/** One toast shown by `MkToastService` (lives in `document.body` — use `loader.document()`). */
export class MkToastHarness extends MkHarness {
  static override readonly hostSelector = 'mk-toast';

  title(): string | null {
    return this.q('.mk-toast__title')?.text() ?? null;
  }

  message(): string {
    return this.q('.mk-toast__message')?.text() ?? '';
  }

  tone(): string | null {
    return this.host.attr('data-tone');
  }

  actionLabel(): string | null {
    return this.q('.mk-toast__actions button')?.text() ?? null;
  }

  async clickAction(): Promise<void> {
    const btn = this.q('.mk-toast__actions button');
    if (!btn) throw new Error('Toast has no action.');
    await btn.click();
  }

  async dismiss(): Promise<void> {
    const btn = this.q('.mk-toast__close');
    if (!btn) throw new Error('Toast is not dismissible.');
    await btn.click();
  }
}
