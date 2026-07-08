import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

/** Placeholder geometry for a {@link MkSkeleton}. */
export type MkSkeletonShape = 'text' | 'rect' | 'circle';

/**
 * Skeleton — a shimmering placeholder shown while content loads. It is
 * `aria-hidden`; mark the surrounding region `aria-busy="true"` so assistive
 * tech knows content is pending. The shimmer stops under
 * `prefers-reduced-motion`.
 *
 * ```html
 * <mk-skeleton shape="circle" [width]="40" [height]="40" />
 * <mk-skeleton shape="text" [lines]="3" />
 * <mk-skeleton shape="rect" width="100%" [height]="180" />
 * ```
 */
@Component({
  selector: 'mk-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-skeleton',
    'aria-hidden': 'true',
    '[class.mk-skeleton--text]': "shape() === 'text'",
    '[class.mk-skeleton--rect]': "shape() === 'rect'",
    '[class.mk-skeleton--circle]': "shape() === 'circle'",
    '[style.width]': 'styleWidth()',
    '[style.height]': 'styleHeight()',
  },
})
export class MkSkeleton {
  /** Placeholder geometry. */
  readonly shape = input<MkSkeletonShape>('text');
  /** Width — a number (px) or any CSS length/percentage string. */
  readonly width = input<string | number>();
  /** Height — a number (px) or any CSS length/percentage string. */
  readonly height = input<string | number>();
  /** Number of lines to render for `shape="text"`. */
  readonly lines = input(1, { transform: numberAttribute });

  private toCss(v: string | number | undefined): string | null {
    if (v === undefined || v === null || v === '') return null;
    return typeof v === 'number' ? `${v}px` : v;
  }

  protected readonly styleWidth = computed(() => {
    if (this.shape() === 'circle') {
      return this.toCss(this.width() ?? this.height()) ?? '2.5rem';
    }
    return this.toCss(this.width()) ?? '100%';
  });

  protected readonly styleHeight = computed(() => {
    if (this.shape() === 'circle') {
      return this.toCss(this.height() ?? this.width()) ?? '2.5rem';
    }
    if (this.shape() === 'text') return null; // lines define the height
    return this.toCss(this.height()) ?? '1rem';
  });

  /** Line index array for the text variant (at least one line). */
  protected readonly lineArray = computed(() =>
    Array.from({ length: Math.max(1, this.lines()) }),
  );

  /** Last line of a multi-line block is shortened for a natural look. */
  protected lineWidth(index: number): string {
    const count = this.lineArray().length;
    return count > 1 && index === count - 1 ? '60%' : '100%';
  }
}
