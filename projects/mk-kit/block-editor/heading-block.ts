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
import { MkRichText, type MkRichTextSplit } from './rich-text';

const LEVELS = [1, 2, 3, 4] as const;

/**
 * Heading block — the same rich text as a paragraph but rendered at a
 * configurable level (H1–H4), chosen from an inline settings row.
 */
@Component({
  selector: 'mk-heading-block',
  imports: [MkRichText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!readonly()) {
      <div class="mk-heading-block__levels" role="group" [attr.aria-label]="i18n.blockEditor.headingLevelGroup">
        @for (lvl of levels; track lvl) {
          <button
            type="button"
            class="mk-heading-block__level"
            [class.mk-heading-block__level--active]="level() === lvl"
            [attr.aria-pressed]="level() === lvl"
            (click)="setLevel(lvl)"
          >
            H{{ lvl }}
          </button>
        }
      </div>
    }
    <mk-rich-text
      class="mk-heading-block__text"
      [class]="'mk-heading-block__text--h' + level()"
      [html]="block().data['html'] ?? ''"
      [placeholder]="i18n.blockEditor.headingPlaceholder(level())"
      [disabled]="readonly()"
      [multiline]="false"
      [ariaLabel]="i18n.blockEditor.headingLevel(level())"
      (contentChange)="onContent($event)"
      (splitAt)="splitAt.emit($event)"
      (removeEmpty)="removeEmpty.emit()"
      (arrowOut)="arrowOut.emit($event)"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mk-heading-block__levels {
        display: inline-flex;
        gap: 2px;
        margin-bottom: var(--mk-space-1);
        padding: 2px;
        border-radius: var(--mk-radius-sm);
        background: var(--mk-surface-2);
      }
      .mk-heading-block__level {
        min-width: 30px;
        height: 24px;
        border: none;
        border-radius: var(--mk-radius-xs);
        background: transparent;
        color: var(--mk-text-muted);
        font: inherit;
        font-size: var(--mk-font-size-xs);
        font-weight: var(--mk-font-weight-semibold);
        cursor: pointer;
      }
      .mk-heading-block__level:hover {
        background: var(--mk-hover-overlay);
      }
      .mk-heading-block__level--active {
        background: var(--mk-primary);
        color: var(--mk-primary-contrast);
      }
      .mk-heading-block__level:focus-visible {
        outline: var(--mk-focus-ring-width) solid var(--mk-focus-ring);
        outline-offset: var(--mk-focus-ring-offset);
      }
      .mk-heading-block__text--h1 {
        font-size: var(--mk-font-size-3xl);
        font-weight: var(--mk-font-weight-bold);
      }
      .mk-heading-block__text--h2 {
        font-size: var(--mk-font-size-2xl);
        font-weight: var(--mk-font-weight-bold);
      }
      .mk-heading-block__text--h3 {
        font-size: var(--mk-font-size-xl);
        font-weight: var(--mk-font-weight-semibold);
      }
      .mk-heading-block__text--h4 {
        font-size: var(--mk-font-size-lg);
        font-weight: var(--mk-font-weight-semibold);
      }
    `,
  ],
})
export class MkHeadingBlock {
  protected readonly i18n = inject(MK_I18N);

  readonly block = input.required<MkBlock>();
  readonly readonly = input(false, { transform: booleanAttribute });

  readonly blockChange = output<MkBlock>();
  readonly splitAt = output<MkRichTextSplit>();
  readonly removeEmpty = output<void>();
  readonly arrowOut = output<'up' | 'down'>();

  protected readonly levels = LEVELS;
  protected readonly level = computed(() => {
    const l = this.block().data['level'];
    return LEVELS.includes(l) ? l : 2;
  });

  protected setLevel(level: number): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, level } });
  }

  protected onContent(html: string): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, html } });
  }
}
