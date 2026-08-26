import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { MkBreakpointService, type MkResponsive } from '@mk-kit/ui/core';
import {
  mkAlignToCss,
  mkNumeric,
  mkSpaceToCss,
  type MkAlign,
  type MkResponsiveSpace,
} from './space';

/** `justify-items` keywords. */
export type MkGridJustify = 'start' | 'center' | 'end' | 'stretch';

/**
 * Grid — a CSS grid with the common cases as inputs.
 *
 * - `columns` — a count (`3` → three equal tracks) or a raw
 *   `grid-template-columns` string (`'240px 1fr'`); responsive maps work for
 *   both: `[columns]="{ xs: 1, md: 2, xl: 4 }"`.
 * - `minColumnWidth` — auto-responsive without breakpoints: as many
 *   `≥ 16rem` columns as fit (`auto-fill`; add `autoFit` to stretch the last
 *   row's items instead of leaving empty tracks). Wins over `columns`.
 * - `gap`, `rowGap`, `columnGap` — `--mk-space-*` steps or CSS lengths.
 *
 * Children can span tracks with `mkGridItem`.
 *
 * ```html
 * <mk-grid [columns]="{ xs: 1, md: 2, xl: 4 }" gap="4">
 *   @for (kpi of kpis; track kpi.id) { <mk-card>…</mk-card> }
 * </mk-grid>
 *
 * <mk-grid minColumnWidth="16rem" gap="4">…cards…</mk-grid>
 * ```
 */
@Component({
  selector: 'mk-grid',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-grid',
    '[style.display]': 'inline() ? "inline-grid" : "grid"',
    '[style.grid-template-columns]': 'columnsCss()',
    '[style.grid-template-rows]': 'rowsCss()',
    '[style.row-gap]': 'rowGapCss()',
    '[style.column-gap]': 'columnGapCss()',
    '[style.align-items]': 'alignCss()',
    '[style.justify-items]': 'justifyCss()',
    '[style.grid-auto-flow]': 'flowCss()',
  },
})
export class MkGrid {
  private readonly bp = inject(MkBreakpointService);

  /** Column count or `grid-template-columns` value; responsive allowed (default `1`). */
  readonly columns = input<MkResponsive<number | string>>(1);
  /** Row count or `grid-template-rows` value; responsive allowed. */
  readonly rows = input<MkResponsive<number | string> | null>(null);
  /** Minimum column width for an auto-filling grid, e.g. `16rem`. Overrides `columns`. */
  readonly minColumnWidth = input<MkResponsive<string> | null>(null);
  /** With `minColumnWidth`: use `auto-fit` so items stretch when a row is short. */
  readonly autoFit = input(false, { transform: booleanAttribute });
  /** Gap between both rows and columns (default `4` = 16px). */
  readonly gap = input<MkResponsiveSpace>(4);
  /** Row gap override. */
  readonly rowGap = input<MkResponsiveSpace | null>(null);
  /** Column gap override. */
  readonly columnGap = input<MkResponsiveSpace | null>(null);
  /** `align-items` for every cell. */
  readonly align = input<MkResponsive<MkAlign> | null>(null);
  /** `justify-items` for every cell. */
  readonly justify = input<MkResponsive<MkGridJustify> | null>(null);
  /** `grid-auto-flow` (e.g. `dense` to backfill holes left by spanning items). */
  readonly flow = input<'row' | 'column' | 'dense' | 'row dense' | 'column dense' | null>(null);
  /** Render as `inline-grid`. */
  readonly inline = input(false, { transform: booleanAttribute });

  protected readonly columnsCss = computed(() => {
    const min = this.bp.resolve(this.minColumnWidth() ?? undefined);
    if (min) {
      const mode = this.autoFit() ? 'auto-fit' : 'auto-fill';
      return `repeat(${mode}, minmax(min(${min}, 100%), 1fr))`;
    }
    return MkGrid.tracks(this.bp.resolve(this.columns()));
  });
  protected readonly rowsCss = computed(() => MkGrid.tracks(this.bp.resolve(this.rows() ?? undefined)));
  // Longhands only: a `gap` shorthand followed by a `row-gap` override is
  // serialised inconsistently across engines.
  protected readonly rowGapCss = computed(() =>
    mkSpaceToCss(this.bp.resolve(this.rowGap() ?? undefined) ?? this.bp.resolve(this.gap())),
  );
  protected readonly columnGapCss = computed(() =>
    mkSpaceToCss(this.bp.resolve(this.columnGap() ?? undefined) ?? this.bp.resolve(this.gap())),
  );
  protected readonly alignCss = computed(() => mkAlignToCss(this.bp.resolve(this.align() ?? undefined)));
  protected readonly justifyCss = computed(() => this.bp.resolve(this.justify() ?? undefined) ?? null);
  protected readonly flowCss = computed(() => this.flow());

  /** A track list: a count becomes `repeat(n, minmax(0, 1fr))` so long content cannot blow a column out. */
  private static tracks(value: number | string | null | undefined): string | null {
    if (value == null || value === '') return null;
    const v = mkNumeric(value);
    return typeof v === 'number' ? `repeat(${v}, minmax(0, 1fr))` : v;
  }
}
