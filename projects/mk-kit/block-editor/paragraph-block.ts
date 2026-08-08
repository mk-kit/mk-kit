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
import { MkRichTextEngine, type MkRichTextSplit } from '@mkornas/ui/rich-text';

/**
 * Paragraph block — rich text stored as sanitised HTML in `block.data.html`,
 * with the floating inline toolbar provided by {@link MkRichTextEngine}.
 */
@Component({
  selector: 'mk-paragraph-block',
  imports: [MkRichTextEngine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mk-rich-text-engine
      [html]="block().data['html'] ?? ''"
      [placeholder]="placeholder()"
      [disabled]="readonly()"
      [ariaLabel]="i18n.blockEditor.blockParagraph"
      (contentChange)="onContent($event)"
      (splitAt)="splitAt.emit($event)"
      (removeEmpty)="removeEmpty.emit()"
      (arrowOut)="arrowOut.emit($event)"
    />
  `,
})
export class MkParagraphBlock {
  protected readonly i18n = inject(MK_I18N);

  readonly block = input.required<MkBlock>();
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly placeholder = input(this.i18n.blockEditor.emptyBlockPlaceholder);

  readonly blockChange = output<MkBlock>();
  readonly splitAt = output<MkRichTextSplit>();
  readonly removeEmpty = output<void>();
  readonly arrowOut = output<'up' | 'down'>();

  protected onContent(html: string): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, html } });
  }
}
