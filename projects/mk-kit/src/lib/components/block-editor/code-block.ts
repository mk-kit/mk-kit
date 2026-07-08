import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MkBlock } from './block-model';

/**
 * Code block — a plain, monospace, preformatted text area. Content is stored as
 * raw text (never executed, never interpreted as HTML) in `block.data.code`.
 */
@Component({
  selector: 'mk-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!readonly()) {
      <input
        class="mk-code-block__lang"
        type="text"
        [value]="block().data['language'] ?? ''"
        placeholder="language (optional)"
        aria-label="Code language"
        (input)="onLang($event)"
      />
    }
    <textarea
      class="mk-code-block__area"
      data-mk-focus
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      [value]="block().data['code'] ?? ''"
      [readOnly]="readonly()"
      [rows]="rows()"
      placeholder="Enter code…"
      aria-label="Code"
      (input)="onCode($event)"
    ></textarea>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mk-code-block__lang {
        display: block;
        margin-bottom: var(--mk-space-1);
        padding: var(--mk-space-1) var(--mk-space-2);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-sm);
        background: var(--mk-surface);
        color: var(--mk-text-muted);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-xs);
      }
      .mk-code-block__area {
        display: block;
        width: 100%;
        min-height: 4em;
        padding: var(--mk-space-3);
        border: var(--mk-border-width) solid var(--mk-border);
        border-radius: var(--mk-radius-md);
        background: var(--mk-code-bg);
        color: var(--mk-text);
        font-family: var(--mk-font-mono);
        font-size: var(--mk-font-size-sm);
        line-height: var(--mk-line-height-normal);
        resize: vertical;
        tab-size: 2;
      }
      .mk-code-block__area:focus-visible,
      .mk-code-block__lang:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
    `,
  ],
})
export class MkCodeBlock {
  readonly block = input.required<MkBlock>();
  readonly readonly = input(false);
  readonly blockChange = output<MkBlock>();

  protected rows(): number {
    const lines = String(this.block().data['code'] ?? '').split('\n').length;
    return Math.max(3, Math.min(30, lines + 1));
  }

  protected onCode(event: Event): void {
    const b = this.block();
    const code = (event.target as HTMLTextAreaElement).value;
    this.blockChange.emit({ ...b, data: { ...b.data, code } });
  }

  protected onLang(event: Event): void {
    const b = this.block();
    const language = (event.target as HTMLInputElement).value;
    this.blockChange.emit({ ...b, data: { ...b.data, language } });
  }
}
