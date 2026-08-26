import { Directive, computed, inject, input, numberAttribute } from '@angular/core';
import { MkBreakpointService, type MkResponsive } from '@mk-kit/ui/core';
import { mkAlignToCss, mkNumeric, type MkAlign } from './space';

/**
 * Per-child flex options inside `mk-flex` / `mk-stack` (or any flex parent).
 *
 * ```html
 * <mk-flex gap="3">
 *   <mk-input mkFlexItem grow />      <!-- takes the remaining width -->
 *   <button mkButton>Search</button>
 * </mk-flex>
 * ```
 */
@Directive({
  selector: '[mkFlexItem]',
  host: {
    '[style.flex-grow]': 'growCss()',
    '[style.flex-shrink]': 'shrinkCss()',
    '[style.flex-basis]': 'basisCss()',
    '[style.align-self]': 'alignSelfCss()',
    '[style.order]': 'orderCss()',
  },
})
export class MkFlexItem {
  private readonly bp = inject(MkBreakpointService);

  /** `flex-grow`; a bare `grow` attribute means `1`. */
  readonly grow = input<number | null, unknown>(null, {
    transform: (v) => (v === '' || v === true ? 1 : v == null || v === false ? null : numberAttribute(v)),
  });
  /** `flex-shrink`; a bare `shrink` attribute means `1`, `[shrink]="0"` pins the size. */
  readonly shrink = input<number | null, unknown>(null, {
    transform: (v) => (v === '' || v === true ? 1 : v == null || v === false ? null : numberAttribute(v)),
  });
  /** `flex-basis` — any CSS length or `auto`; may be responsive. */
  readonly basis = input<MkResponsive<string> | null>(null);
  /** Override the parent's `align` for this child. */
  readonly alignSelf = input<MkResponsive<MkAlign> | null>(null);
  /** Visual order; may be responsive (e.g. move a sidebar first on phones). */
  readonly order = input<MkResponsive<number | string> | null>(null);

  protected readonly growCss = computed(() => this.grow());
  protected readonly shrinkCss = computed(() => this.shrink());
  protected readonly basisCss = computed(() => this.bp.resolve(this.basis() ?? undefined) ?? null);
  protected readonly alignSelfCss = computed(() => mkAlignToCss(this.bp.resolve(this.alignSelf() ?? undefined)));
  protected readonly orderCss = computed(() => mkNumeric(this.bp.resolve(this.order() ?? undefined)) ?? null);
}
