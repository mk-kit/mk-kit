import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import type { MkBlock } from './block-model';
import { MkRichTextEngine, type MkRichTextSplit } from '@mkornas/ui/rich-text';

/** List block — a bulleted or numbered list of rich-text items. */
@Component({
  selector: 'mk-list-block',
  imports: [MkRichTextEngine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!readonly()) {
      <div class="mk-list-block__opts" role="group" [attr.aria-label]="i18n.blockEditor.listStyle">
        <button
          type="button"
          class="mk-list-block__opt"
          [class.mk-list-block__opt--active]="!ordered()"
          [attr.aria-pressed]="!ordered()"
          (click)="setOrdered(false)"
        >
          • {{ i18n.blockEditor.bulleted }}
        </button>
        <button
          type="button"
          class="mk-list-block__opt"
          [class.mk-list-block__opt--active]="ordered()"
          [attr.aria-pressed]="ordered()"
          (click)="setOrdered(true)"
        >
          1. {{ i18n.blockEditor.numbered }}
        </button>
      </div>
    }
    @if (ordered()) {
      <ol class="mk-list-block__list">
        @for (item of items(); track $index) {
          <li class="mk-list-block__item">
            <mk-rich-text-engine
              [html]="item"
              [placeholder]="i18n.blockEditor.listItem"
              [disabled]="readonly()"
              [multiline]="false"
              [ariaLabel]="i18n.blockEditor.listItem"
              (contentChange)="onItem($index, $event)"
              (splitAt)="onSplit($index, $event)"
              (removeEmpty)="onRemove($index)"
            />
          </li>
        }
      </ol>
    } @else {
      <ul class="mk-list-block__list">
        @for (item of items(); track $index) {
          <li class="mk-list-block__item">
            <mk-rich-text-engine
              [html]="item"
              [placeholder]="i18n.blockEditor.listItem"
              [disabled]="readonly()"
              [multiline]="false"
              [ariaLabel]="i18n.blockEditor.listItem"
              (contentChange)="onItem($index, $event)"
              (splitAt)="onSplit($index, $event)"
              (removeEmpty)="onRemove($index)"
            />
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mk-list-block__opts {
        display: inline-flex;
        gap: 2px;
        margin-bottom: var(--mk-space-2);
        padding: 2px;
        border-radius: var(--mk-radius-sm);
        background: var(--mk-surface-2);
      }
      .mk-list-block__opt {
        height: 24px;
        padding: 0 var(--mk-space-2);
        border: none;
        border-radius: var(--mk-radius-xs);
        background: transparent;
        color: var(--mk-text-muted);
        font: inherit;
        font-size: var(--mk-font-size-xs);
        font-weight: var(--mk-font-weight-medium);
        cursor: pointer;
      }
      .mk-list-block__opt:hover {
        background: var(--mk-hover-overlay);
      }
      .mk-list-block__opt--active {
        background: var(--mk-primary);
        color: var(--mk-primary-contrast);
      }
      .mk-list-block__opt:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
      .mk-list-block__list {
        margin: 0;
        padding-inline-start: var(--mk-space-6);
        color: var(--mk-text);
      }
      .mk-list-block__item {
        margin: var(--mk-space-1) 0;
      }
    `,
  ],
})
export class MkListBlock {
  protected readonly i18n = inject(MK_I18N);

  readonly block = input.required<MkBlock>();
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly blockChange = output<MkBlock>();

  protected readonly ordered = computed(() => !!this.block().data['ordered']);
  protected readonly items = computed<string[]>(() => {
    const items = this.block().data['items'];
    return Array.isArray(items) && items.length ? items : [''];
  });

  protected setOrdered(ordered: boolean): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, ordered } });
  }

  protected onItem(index: number, html: string): void {
    const items = [...this.items()];
    items[index] = html;
    this.emitItems(items);
  }

  protected onSplit(index: number, split: MkRichTextSplit): void {
    const items = [...this.items()];
    items[index] = split.before;
    items.splice(index + 1, 0, split.after);
    this.emitItems(items);
  }

  protected onRemove(index: number): void {
    const items = [...this.items()];
    if (items.length <= 1) return;
    items.splice(index, 1);
    this.emitItems(items);
  }

  private emitItems(items: string[]): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, items } });
  }
}
