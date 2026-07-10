import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import type { MkBlock } from './block-model';
import { MkRichText, type MkRichTextSplit } from './rich-text';

/** Quote block — a blockquote with rich text and an optional citation line. */
@Component({
  selector: 'mk-quote-block',
  imports: [MkRichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <blockquote class="mk-quote-block__quote">
      <mk-rich-text
        [html]="block().data['html'] ?? ''"
        [placeholder]="i18n.blockEditor.blockQuote"
        [disabled]="readonly()"
        [ariaLabel]="i18n.blockEditor.quoteText"
        (contentChange)="onContent($event)"
        (splitAt)="splitAt.emit($event)"
        (removeEmpty)="removeEmpty.emit()"
        (arrowOut)="arrowOut.emit($event)"
      />
    </blockquote>
    @if (!readonly() || block().data['citation']) {
      <input
        class="mk-quote-block__cite"
        type="text"
        [value]="block().data['citation'] ?? ''"
        [disabled]="readonly()"
        [placeholder]="i18n.blockEditor.addCitation"
        [attr.aria-label]="i18n.blockEditor.citation"
        (input)="onCite($event)"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mk-quote-block__quote {
        margin: 0;
        padding-inline-start: var(--mk-space-4);
        border-inline-start: 4px solid var(--mk-primary);
        font-size: var(--mk-font-size-lg);
        font-style: italic;
        color: var(--mk-text);
      }
      .mk-quote-block__cite {
        margin-top: var(--mk-space-2);
        margin-inline-start: var(--mk-space-4);
        width: calc(100% - var(--mk-space-4));
        border: none;
        background: transparent;
        color: var(--mk-text-muted);
        font: inherit;
        font-size: var(--mk-font-size-sm);
      }
      .mk-quote-block__cite:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
        border-radius: var(--mk-radius-xs);
      }
    `,
  ],
})
export class MkQuoteBlock {
  protected readonly i18n = inject(MK_I18N);

  readonly block = input.required<MkBlock>();
  readonly readonly = input(false, { transform: booleanAttribute });

  readonly blockChange = output<MkBlock>();
  readonly splitAt = output<MkRichTextSplit>();
  readonly removeEmpty = output<void>();
  readonly arrowOut = output<'up' | 'down'>();

  protected onContent(html: string): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, html } });
  }

  protected onCite(event: Event): void {
    const b = this.block();
    const citation = (event.target as HTMLInputElement).value;
    this.blockChange.emit({ ...b, data: { ...b.data, citation } });
  }
}
