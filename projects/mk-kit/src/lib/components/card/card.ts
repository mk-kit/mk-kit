import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Surface treatment for a {@link MkCard}. */
export type MkCardVariant = 'elevated' | 'outlined' | 'filled';
/** Internal padding scale for a {@link MkCard}. */
export type MkCardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Card — a themed surface container that groups related content. Compose it
 * with the projected `mk-card-header`, `mk-card-title` and `mk-card-footer`
 * parts, or drop plain content straight into the body.
 *
 * ```html
 * <mk-card variant="elevated">
 *   <mk-card-header>
 *     <mk-card-title>Monthly revenue</mk-card-title>
 *   </mk-card-header>
 *   Body content goes here.
 *   <mk-card-footer>
 *     <button mkButton variant="ghost">Details</button>
 *   </mk-card-footer>
 * </mk-card>
 * ```
 */
@Component({
  selector: 'mk-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-card',
    '[class.mk-card--elevated]': "variant() === 'elevated'",
    '[class.mk-card--outlined]': "variant() === 'outlined'",
    '[class.mk-card--filled]': "variant() === 'filled'",
    '[attr.data-padding]': 'padding()',
  },
})
export class MkCard {
  /** Surface treatment: raised shadow, hairline border, or tinted fill. */
  readonly variant = input<MkCardVariant>('elevated');
  /** Internal spacing applied to the body, header and footer. */
  readonly padding = input<MkCardPadding>('md');
}
