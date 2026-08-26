import { Directive, computed, inject, input } from '@angular/core';
import { MkBreakpointService, type MkResponsive } from '@mk-kit/ui/core';
import { mkNumeric } from './space';

/**
 * Per-cell placement inside `mk-grid`: span several tracks, or pin a start
 * line. All inputs accept responsive maps, so a hero card can span the full
 * row on phones and two of four columns on desktop.
 *
 * ```html
 * <mk-grid [columns]="{ xs: 1, lg: 4 }" gap="4">
 *   <mk-card mkGridItem [colSpan]="{ xs: 1, lg: 2 }">Revenue</mk-card>
 *   …
 * </mk-grid>
 * ```
 */
@Directive({
  selector: '[mkGridItem]',
  host: {
    '[style.grid-column]': 'columnCss()',
    '[style.grid-row]': 'rowCss()',
    '[style.align-self]': 'alignSelfCss()',
    '[style.justify-self]': 'justifySelfCss()',
  },
})
export class MkGridItem {
  private readonly bp = inject(MkBreakpointService);

  /** Number of columns to span (`'all'` = the full row). */
  readonly colSpan = input<MkResponsive<number | 'all' | string> | null>(null);
  /** Number of rows to span. */
  readonly rowSpan = input<MkResponsive<number | string> | null>(null);
  /** Column line to start at (1-based). */
  readonly colStart = input<MkResponsive<number | string> | null>(null);
  /** Row line to start at (1-based). */
  readonly rowStart = input<MkResponsive<number | string> | null>(null);
  /** `align-self` for this cell. */
  readonly alignSelf = input<MkResponsive<'start' | 'center' | 'end' | 'stretch'> | null>(null);
  /** `justify-self` for this cell. */
  readonly justifySelf = input<MkResponsive<'start' | 'center' | 'end' | 'stretch'> | null>(null);

  protected readonly columnCss = computed(() => {
    const span = this.bp.resolve(this.colSpan() ?? undefined);
    if (span === 'all') return '1 / -1';
    return MkGridItem.line(this.bp.resolve(this.colStart() ?? undefined), span);
  });
  protected readonly rowCss = computed(() =>
    MkGridItem.line(this.bp.resolve(this.rowStart() ?? undefined), this.bp.resolve(this.rowSpan() ?? undefined)),
  );
  protected readonly alignSelfCss = computed(() => this.bp.resolve(this.alignSelf() ?? undefined) ?? null);
  protected readonly justifySelfCss = computed(() => this.bp.resolve(this.justifySelf() ?? undefined) ?? null);

  private static line(
    startIn: number | string | undefined,
    spanIn: number | string | undefined,
  ): string | null {
    const start = mkNumeric(startIn);
    const span = mkNumeric(spanIn);
    if (start == null && span == null) return null;
    const s = start != null ? String(start) : 'auto';
    return typeof span === 'number' && span > 1 ? `${s} / span ${span}` : start != null ? s : null;
  }
}
