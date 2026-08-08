import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  contentChildren,
  effect,
  input,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { MkTab } from './tab';

/** Visual style for the tablist. */
export type MkTabsVariant = 'line' | 'pill';

/**
 * Accessible tabs implementing the ARIA tabs pattern: a `role="tablist"` with
 * roving tabindex, Arrow/Home/End keyboard navigation and an animated active
 * indicator. Selection is two-way bindable via `selectedIndex`.
 *
 * ```html
 * <mk-tabs [(selectedIndex)]="tab" variant="line">
 *   <mk-tab label="Profile">…</mk-tab>
 *   <mk-tab label="Billing">…</mk-tab>
 * </mk-tabs>
 * ```
 */
@Component({
  selector: 'mk-tabs',
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-tabs',
    '[class.mk-tabs--line]': "variant() === 'line'",
    '[class.mk-tabs--pill]': "variant() === 'pill'",
  },
})
export class MkTabs {
  /** Projected tabs, kept live via a signal content query. */
  readonly tabs = contentChildren(MkTab);
  /** Rendered tab buttons, used to move focus and measure the indicator. */
  protected readonly tabButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');

  /** Zero-based index of the active tab (two-way). */
  readonly selectedIndex = model(0);
  /** `line` shows an underline indicator; `pill` uses filled pills. */
  readonly variant = input<MkTabsVariant>('line');

  /** Sliding indicator geometry (line variant). */
  protected readonly indicatorLeft = signal(0);
  protected readonly indicatorWidth = signal(0);

  constructor() {
    // Keep each tab's `active` state and the clamped selected index in sync.
    effect(() => {
      const tabs = this.tabs();
      let index = this.selectedIndex();
      if (tabs.length > 0 && index > tabs.length - 1) {
        index = tabs.length - 1;
      }
      if (index < 0) index = 0;
      tabs.forEach((tab, i) => tab.active.set(i === index));
      queueMicrotask(() => this.measureIndicator(index));
    });
  }

  protected select(index: number): void {
    const tab = this.tabs()[index];
    if (!tab || tab.disabled()) return;
    this.selectedIndex.set(index);
    // The tablist scrolls horizontally on narrow screens — keep the newly
    // active tab visible. 'nearest' so activating a tab never jumps the page
    // vertically. Optional-chained: jsdom has no scrollIntoView.
    this.tabButtons()[index]?.nativeElement.scrollIntoView?.({
      block: 'nearest',
      inline: 'nearest',
    });
  }

  protected focusTab(index: number): void {
    this.tabButtons()[index]?.nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.tabs().length;
    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = this.nextEnabled(index, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = this.nextEnabled(index, -1);
        break;
      case 'Home':
        next = this.nextEnabled(-1, 1);
        break;
      case 'End':
        next = this.nextEnabled(count, -1);
        break;
      default:
        return;
    }
    if (next >= 0) {
      event.preventDefault();
      this.select(next);
      this.focusTab(next);
    }
  }

  /** Next non-disabled tab index starting from `from`, wrapping around. */
  private nextEnabled(from: number, step: number): number {
    const tabs = this.tabs();
    const count = tabs.length;
    if (count === 0) return -1;
    for (let i = 1; i <= count; i++) {
      const idx = (((from + step * i) % count) + count) % count;
      if (!tabs[idx].disabled()) return idx;
    }
    return -1;
  }

  private measureIndicator(index: number): void {
    const btn = this.tabButtons()[index]?.nativeElement;
    if (!btn) return;
    this.indicatorLeft.set(btn.offsetLeft);
    this.indicatorWidth.set(btn.offsetWidth);
  }
}
