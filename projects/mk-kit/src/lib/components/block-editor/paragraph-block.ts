import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MkBlock } from './block-model';
import { MkRichText, type MkRichTextSplit } from './rich-text';

/**
 * Paragraph block — rich text stored as sanitised HTML in `block.data.html`,
 * with the floating inline toolbar provided by {@link MkRichText}.
 */
@Component({
  selector: 'mk-paragraph-block',
  imports: [MkRichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mk-rich-text
      [html]="block().data['html'] ?? ''"
      [placeholder]="placeholder()"
      [disabled]="readonly()"
      ariaLabel="Paragraph"
      (contentChange)="onContent($event)"
      (splitAt)="splitAt.emit($event)"
      (removeEmpty)="removeEmpty.emit()"
      (arrowOut)="arrowOut.emit($event)"
    />
  `,
})
export class MkParagraphBlock {
  readonly block = input.required<MkBlock>();
  readonly readonly = input(false);
  readonly placeholder = input('Type / to choose a block, or start writing…');

  readonly blockChange = output<MkBlock>();
  readonly splitAt = output<MkRichTextSplit>();
  readonly removeEmpty = output<void>();
  readonly arrowOut = output<'up' | 'down'>();

  protected onContent(html: string): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, html } });
  }
}
