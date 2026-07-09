import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  inject,
} from '@angular/core';
import type { MkTone } from '../../core/types';
import { MK_I18N } from '../../core/i18n/mk-i18n';

/**
 * Banner — a persistent, full-width page/section message with a tone, optional
 * title, an actions slot and optional dismiss. Heavier than an inline
 * {@link MkAlert} toast; use it for standing notices ("Trial ends in 3 days").
 *
 * Project an icon with `[mkBannerIcon]` and buttons with `[mkBannerActions]`.
 * Danger/warning banners announce assertively (`role="alert"`).
 *
 * ```html
 * <mk-banner tone="warning" title="Storage almost full" dismissible>
 *   You've used 90% of your quota.
 *   <button mkButton size="sm" mkBannerActions>Upgrade</button>
 * </mk-banner>
 * ```
 */
@Component({
  selector: 'mk-banner',
  templateUrl: './banner.html',
  styleUrl: './banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-banner',
    '[attr.data-tone]': 'tone()',
  },
})
export class MkBanner {
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  /** Semantic color tone. */
  readonly tone = input<MkTone>('info');
  /** Optional bold title above the message. */
  readonly title = input<string>('');
  /** Show a dismiss (×) button. */
  readonly dismissible = input(false, { transform: booleanAttribute });
  /** Two-way open state; set false to hide. */
  readonly open = model(true);

  /** Emitted when the banner is dismissed. */
  readonly dismissed = output<void>();

  protected readonly role = computed(() => {
    const t = this.tone();
    return t === 'danger' || t === 'warning' ? 'alert' : 'status';
  });

  protected dismiss(): void {
    this.open.set(false);
    this.dismissed.emit();
  }
}
