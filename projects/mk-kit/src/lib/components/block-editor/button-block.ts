import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MkTone, MkVariant } from '../../core/types';
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
  readonly block = input.required<MkBlock>();
  readonly readonly = input(false);
  readonly blockChange = output<MkBlock>();

  protected readonly tones = TONES;
  protected readonly aligns: Align[] = ['left', 'center', 'right'];
  protected readonly variants: MkVariant[] = ['solid', 'soft', 'outline'];

  protected data(key: string): any {
    return this.block().data[key];
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
