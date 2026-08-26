import { Directive, booleanAttribute, computed, inject, input, type InputSignal } from '@angular/core';
import { MkBreakpointService, type MkResponsive } from '@mk-kit/ui/core';
import {
  mkAlignToCss,
  mkJustifyToCss,
  mkSpaceToCss,
  type MkAlign,
  type MkJustify,
  type MkResponsiveSpace,
} from './space';

/** Flex direction keywords. */
export type MkFlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

/**
 * Shared inputs and host style bindings of `mk-stack` and `mk-flex`.
 * Responsive inputs re-resolve when the viewport crosses a breakpoint.
 */
@Directive({
  host: {
    '[style.display]': 'inline() ? "inline-flex" : "flex"',
    '[style.flex-direction]': 'directionCss()',
    '[style.gap]': 'gapCss()',
    '[style.align-items]': 'alignCss()',
    '[style.justify-content]': 'justifyCss()',
    '[style.flex-wrap]': 'wrapCss()',
  },
})
export abstract class MkFlexBase {
  protected readonly bp = inject(MkBreakpointService);

  /** Space between children — a `--mk-space-*` step, a CSS length, or a per-breakpoint map. */
  abstract readonly gap: InputSignal<MkResponsiveSpace>;
  /** Main-axis direction; may be responsive, e.g. `{ xs: 'column', md: 'row' }`. */
  abstract readonly direction: InputSignal<MkResponsive<MkFlexDirection>>;

  /** Cross-axis alignment of children. */
  readonly align = input<MkResponsive<MkAlign> | null>(null);
  /** Main-axis distribution of children. */
  readonly justify = input<MkResponsive<MkJustify> | null>(null);
  /** Let children wrap onto new lines. */
  readonly wrap = input(false, { transform: booleanAttribute });
  /** Render as `inline-flex` (sits in a line of text) instead of a block. */
  readonly inline = input(false, { transform: booleanAttribute });

  protected readonly directionCss = computed(() => this.bp.resolve(this.direction()) ?? null);
  protected readonly gapCss = computed(() => mkSpaceToCss(this.bp.resolve(this.gap())));
  protected readonly alignCss = computed(() => mkAlignToCss(this.bp.resolve(this.align() ?? undefined)));
  protected readonly justifyCss = computed(() => mkJustifyToCss(this.bp.resolve(this.justify() ?? undefined)));
  protected readonly wrapCss = computed(() => (this.wrap() ? 'wrap' : null));
}
