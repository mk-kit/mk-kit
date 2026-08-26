import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import type { MkTone, MkVariant } from '@mk-kit/ui/core';
import type { MkBlock } from './block-model';

type Align = 'left' | 'center' | 'right';

const TONES: MkTone[] = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'];

/**
 * Button/CTA block — a themed call-to-action link with configurable label,
 * href, tone, variant and alignment. Styling mirrors the mk-kit button tokens.
 */
@Component({
  selector: 'mk-button-block',
  templateUrl: './button-block.html',
  styleUrl: './button-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkButtonBlock {
  protected readonly i18n = inject(MK_I18N);

  readonly block = input.required<MkBlock>();
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly blockChange = output<MkBlock>();

  protected readonly tones = TONES;
  protected readonly aligns: Align[] = ['left', 'center', 'right'];
  protected readonly variants: MkVariant[] = ['solid', 'soft', 'outline'];

  protected data(key: string): any {
    return this.block().data[key];
  }

  /** Localised captions for the tone / variant / alignment option buttons. */
  protected toneLabel(tone: MkTone): string {
    const s = this.i18n.blockEditor;
    const map: Record<MkTone, string> = {
      primary: s.tonePrimary,
      neutral: s.toneNeutral,
      success: s.toneSuccess,
      warning: s.toneWarning,
      danger: s.toneDanger,
      info: s.toneInfo,
    };
    return map[tone];
  }
  protected variantLabel(variant: MkVariant): string {
    const s = this.i18n.blockEditor;
    const map: Partial<Record<MkVariant, string>> = {
      solid: s.variantSolid,
      soft: s.variantSoft,
      outline: s.variantOutline,
    };
    return map[variant] ?? variant;
  }
  protected alignLabel(align: Align): string {
    const s = this.i18n.blockEditor;
    return { left: s.alignLeft, center: s.alignCenter, right: s.alignRight }[align];
  }

  protected onLabel(event: Event): void {
    this.patch({ label: (event.target as HTMLInputElement).value });
  }
  protected onHref(event: Event): void {
    this.patch({ href: (event.target as HTMLInputElement).value.trim() });
  }
  protected setTone(tone: MkTone): void {
    this.patch({ tone });
  }
  protected setVariant(variant: MkVariant): void {
    this.patch({ variant });
  }
  protected setAlign(align: Align): void {
    this.patch({ align });
  }

  private patch(data: Record<string, any>): void {
    const b = this.block();
    this.blockChange.emit({ ...b, data: { ...b.data, ...data } });
  }
}
