import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';

/** Split direction for {@link MkSplitter}. */
export type MkSplitterOrientation = 'horizontal' | 'vertical';

/**
 * Splitter — two resizable panes with a draggable, keyboard-operable separator
 * (ARIA `separator` with `aria-valuenow`). `horizontal` places the panes
 * side-by-side (a vertical handle); `vertical` stacks them (a horizontal
 * handle). The start pane's size is a two-way `size` model (percent).
 *
 * Project the panes with `mkSplitterStart` / `mkSplitterEnd`:
 * ```html
 * <mk-splitter [(size)]="split" [min]="20">
 *   <nav mkSplitterStart>…</nav>
 *   <main mkSplitterEnd>…</main>
 * </mk-splitter>
 * ```
 * Drag the handle, or focus it and use Arrow keys (Home/End jump to min/max).
 */
@Component({
  selector: 'mk-splitter',
  templateUrl: './splitter.html',
  styleUrl: './splitter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-splitter',
    '[class.mk-splitter--vertical]': "orientation() === 'vertical'",
    '[class.mk-splitter--disabled]': 'disabled()',
  },
})
export class MkSplitter {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** `horizontal` = side-by-side; `vertical` = stacked. */
  readonly orientation = input<MkSplitterOrientation>('horizontal');
  /** Two-way size of the start pane, in percent (0–100). */
  readonly size = model(50);
  /** Minimum start-pane size (percent). */
  readonly min = input(10, { transform: numberAttribute });
  /** Maximum start-pane size (percent). */
  readonly max = input(90, { transform: numberAttribute });
  /** Keyboard resize increment (percent). */
  readonly step = input(5, { transform: numberAttribute });
  /** Disable resizing. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible label for the separator. */
  readonly ariaLabel = input('Resize panes');

  private dragging = false;

  /** Clamped size actually applied (defends against out-of-range inputs). */
  protected readonly clampedSize = computed(() =>
    Math.min(this.max(), Math.max(this.min(), this.size())),
  );

  protected onPointerdown(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    event.preventDefault();
    this.dragging = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onPointermove(event: PointerEvent): void {
    if (!this.dragging) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const pct =
      this.orientation() === 'vertical'
        ? ((event.clientY - rect.top) / rect.height) * 100
        : ((event.clientX - rect.left) / rect.width) * 100;
    this.setSize(pct);
  }

  protected onPointerup(event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const vertical = this.orientation() === 'vertical';
    const dec = vertical ? 'ArrowUp' : 'ArrowLeft';
    const inc = vertical ? 'ArrowDown' : 'ArrowRight';
    switch (event.key) {
      case dec:
        event.preventDefault();
        this.setSize(this.clampedSize() - this.step());
        break;
      case inc:
        event.preventDefault();
        this.setSize(this.clampedSize() + this.step());
        break;
      case 'Home':
        event.preventDefault();
        this.setSize(this.min());
        break;
      case 'End':
        event.preventDefault();
        this.setSize(this.max());
        break;
    }
  }

  private setSize(pct: number): void {
    const next = Math.round(Math.min(this.max(), Math.max(this.min(), pct)));
    if (next !== this.size()) this.size.set(next);
  }
}
