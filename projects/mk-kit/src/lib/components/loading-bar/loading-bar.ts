import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
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
    [style.width.%]="progress()"
    [style.background]="color()"
  ></div>`,
  styleUrl: './loading-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-loading-bar',
    role: 'progressbar',
    'aria-hidden': 'true',
    '[class.mk-loading-bar--active]': 'active()',
    '[style.height.px]': 'height()',
  },
})
export class MkLoadingBar {
  private readonly service = inject(MkLoadingBarService);

  /** Bar colour. */
  readonly color = input('var(--mk-primary)');
  /** Bar thickness in px. */
  readonly height = input(3, { transform: numberAttribute });

  protected readonly progress = this.service.progress;
  protected readonly active = computed(() => this.service.active());
}
