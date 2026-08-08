import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MkLoadingBarService } from './loading-bar.service';

/**
 * LoadingBar — a thin progress bar fixed to the top of the viewport, driven by
 * {@link MkLoadingBarService}. Place it once (e.g. in the app shell) and call
 * `start()` / `complete()` on navigation or async work.
 *
 * ```html
 * <mk-loading-bar />
 * ```
 */
@Component({
  selector: 'mk-loading-bar',
  template: `<div
    class="mk-loading-bar__fill"
    [style.transform]="fillTransform()"
    [style.background]="color()"
  ></div>`,
  styleUrl: './loading-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-loading-bar',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'active() ? progress() : null',
    '[attr.aria-hidden]': "active() ? null : 'true'",
    '[attr.aria-label]': 'i18n.loading',
    '[class.mk-loading-bar--active]': 'active()',
    '[style.height.px]': 'height()',
  },
})
export class MkLoadingBar {
  private readonly service = inject(MkLoadingBarService);
  protected readonly i18n = inject(MK_I18N);

  /** Bar colour. */
  readonly color = input('var(--mk-primary)');
  /** Bar thickness in px. */
  readonly height = input(3, { transform: numberAttribute });

  protected readonly progress = this.service.progress;
  protected readonly active = computed(() => this.service.active());

  /**
   * The fill is a full-width bar scaled from the inline start — `transform`
   * animates on the compositor, so each trickle tick avoids the layout+paint
   * cost that animating `width` incurred. Origin flips for RTL in the styles.
   */
  protected readonly fillTransform = computed(
    () => `scaleX(${this.progress() / 100})`,
  );
}
