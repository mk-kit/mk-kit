import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MK_I18N } from '../../core/i18n/mk-i18n';
import {
  type MkDiffRow,
  mkComputeDiff,
  mkDiffStats,
} from './diff-util';

/** How {@link MkDiff} lays out the comparison. */
export type MkDiffMode = 'unified' | 'split';

interface SplitRow {
  left: MkDiffRow | null;
  right: MkDiffRow | null;
}

/**
 * Diff — a text comparison view for revisions (before ⇄ after). Computes an LCS
 * line diff with optional intra-line word highlighting and renders a `unified`
 * (single-column, +/-) or `split` (side-by-side) view with line numbers and an
 * add/remove summary.
 *
 * ```html
 * <mk-diff [before]="v1" [after]="v2" mode="split" />
 * ```
 */
@Component({
  selector: 'mk-diff',
  templateUrl: './diff.html',
  styleUrl: './diff.scss',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-diff',
    '[class.mk-diff--split]': "mode() === 'split'",
  },
})
export class MkDiff {
  protected readonly i18n = inject(MK_I18N);

  /** The original ("before") text. */
  readonly before = input('');
  /** The new ("after") text. */
  readonly after = input('');
  /** Layout: single-column `unified` or side-by-side `split`. */
  readonly mode = input<MkDiffMode>('unified');
  /** Highlight the specific words that changed within a line. */
  readonly wordHighlight = input(true, { transform: booleanAttribute });
  /** Show line-number gutters. */
  readonly lineNumbers = input(true, { transform: booleanAttribute });
  /** Ignore trailing whitespace when comparing lines. */
  readonly ignoreTrailingWhitespace = input(false, {
    transform: booleanAttribute,
  });
  /** Show the +added / −removed summary header. */
  readonly showStats = input(true, { transform: booleanAttribute });
  /** Column labels (split view header / a11y). */
  readonly beforeLabel = input(this.i18n.diffBefore);
  readonly afterLabel = input(this.i18n.diffAfter);

  protected readonly rows = computed(() =>
    mkComputeDiff(this.before(), this.after(), {
      wordHighlight: this.wordHighlight(),
      ignoreTrailingWhitespace: this.ignoreTrailingWhitespace(),
    }),
  );

  protected readonly stats = computed(() => mkDiffStats(this.rows()));

  /** Rows paired into two columns for the split view. */
  protected readonly splitRows = computed<SplitRow[]>(() => {
    const rows = this.rows();
    const out: SplitRow[] = [];
    let i = 0;
    while (i < rows.length) {
      if (rows[i].op === 'equal') {
        out.push({ left: rows[i], right: rows[i] });
        i++;
        continue;
      }
      let d = i;
      while (d < rows.length && rows[d].op === 'delete') d++;
      let s = d;
      while (s < rows.length && rows[s].op === 'insert') s++;
      const dels = rows.slice(i, d);
      const ins = rows.slice(d, s);
      const max = Math.max(dels.length, ins.length);
      for (let k = 0; k < max; k++) {
        out.push({ left: dels[k] ?? null, right: ins[k] ?? null });
      }
      i = s;
    }
    return out;
  });

  protected marker(op: MkDiffRow['op']): string {
    return op === 'insert' ? '+' : op === 'delete' ? '-' : ' ';
  }
}
