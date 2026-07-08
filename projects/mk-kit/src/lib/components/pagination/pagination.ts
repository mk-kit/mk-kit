import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';

/** A rendered pagination cell: a real page number or a gap marker. */
export type MkPageItem = number | 'ellipsis';

/**
 * Page navigation with previous/next controls and numbered pages that collapse
 * to ellipses for large ranges. Provide either `total` (+ `pageSize`) or a
 * direct `pageCount`. `page` is 1-based and two-way bindable.
 *
 * ```html
 * <mk-pagination
 *   [total]="240"
 *   [pageSize]="20"
 *   [(page)]="page"
 *   (pageChange)="load($event)"
 * />
 * ```
 */
@Component({
  selector: 'mk-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-pagination',
  },
})
export class MkPagination {
  /** Total number of items (used with `pageSize` when `pageCount` is unset). */
  readonly total = input(0, { transform: numberAttribute });
  /** Items per page. */
  readonly pageSize = input(10, { transform: numberAttribute });
  /** Explicit page count; overrides `total`/`pageSize` when > 0. */
  readonly pageCount = input(0, { transform: numberAttribute });
  /** Current 1-based page (two-way). */
  readonly page = model(1);
  /** Number of page buttons to keep on each side of the current page. */
  readonly siblingCount = input(1, { transform: numberAttribute });
  /** Number of page buttons pinned at each end. */
  readonly boundaryCount = input(1, { transform: numberAttribute });
  /** Accessible label for the navigation landmark. */
  readonly label = input('Pagination');

  /**
   * `pageChange` is emitted automatically by the two-way `page` model whenever
   * the page changes — bind it via `(pageChange)` or `[(page)]`.
   */

  /** Resolved total number of pages (at least 1). */
  protected readonly pages = computed(() => {
    const explicit = this.pageCount();
    if (explicit > 0) return explicit;
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.total() / size));
  });

  protected readonly current = computed(() =>
    Math.min(Math.max(1, this.page()), this.pages()),
  );

  protected readonly hasPrev = computed(() => this.current() > 1);
  protected readonly hasNext = computed(() => this.current() < this.pages());

  /** The sequence of page cells with ellipsis gaps. */
  protected readonly items = computed<MkPageItem[]>(() => {
    const total = this.pages();
    const boundary = Math.max(0, this.boundaryCount());
    const sibling = Math.max(0, this.siblingCount());
    const current = this.current();

    // Total slots: boundaries + siblings + current + 2 ellipses + first/last.
    const totalSlots = boundary * 2 + sibling * 2 + 3 + 2;
    if (total <= totalSlots) {
      return this.range(1, total);
    }

    const startPages = this.range(1, boundary);
    const endPages = this.range(total - boundary + 1, total);

    const siblingsStart = Math.max(
      Math.min(current - sibling, total - boundary - sibling * 2 - 1),
      boundary + 2,
    );
    const siblingsEnd = Math.min(
      Math.max(current + sibling, boundary + sibling * 2 + 2),
      endPages.length > 0 ? endPages[0] - 2 : total - 1,
    );

    const result: MkPageItem[] = [...startPages];

    if (siblingsStart > boundary + 2) {
      result.push('ellipsis');
    } else if (boundary + 1 < total - boundary) {
      result.push(boundary + 1);
    }

    result.push(...this.range(siblingsStart, siblingsEnd));

    if (siblingsEnd < total - boundary - 1) {
      result.push('ellipsis');
    } else if (total - boundary > boundary) {
      result.push(total - boundary);
    }

    result.push(...endPages);
    return result;
  });

  protected goTo(page: number): void {
    const target = Math.min(Math.max(1, page), this.pages());
    if (target === this.current()) return;
    this.page.set(target);
  }

  protected prev(): void {
    if (this.hasPrev()) this.goTo(this.current() - 1);
  }

  protected next(): void {
    if (this.hasNext()) this.goTo(this.current() + 1);
  }

  private range(start: number, end: number): number[] {
    const length = end - start + 1;
    return length > 0 ? Array.from({ length }, (_, i) => start + i) : [];
  }
}
