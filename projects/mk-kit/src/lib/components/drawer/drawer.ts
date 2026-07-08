import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFocusTrap } from '../../core/a11y/focus-trap';

/** Edge the drawer slides in from. */
export type MkDrawerSide = 'start' | 'end' | 'top' | 'bottom';

/**
 * Drawer — a declarative slide-out panel anchored to a viewport edge, driven by
 * a two-way `open`. Ideal for admin/CMS side panels: filters, entity details,
 * settings, quick-create forms. Traps focus while open, closes on backdrop
 * click or Escape, restores focus on close, and locks body scroll when modal.
 *
 * Slots: `[mkDrawerHeader]` (extra header content), default content (body),
 * `[mkDrawerFooter]` (sticky footer).
 *
 * ```html
 * <button mkButton (click)="filters.set(true)">Filters</button>
 * <mk-drawer [(open)]="filters" side="end" heading="Filters">
 *   …filter form…
 *   <div mkDrawerFooter>
 *     <button mkButton variant="ghost" (click)="filters.set(false)">Close</button>
 *     <button mkButton (click)="apply()">Apply</button>
 *   </div>
 * </mk-drawer>
 * ```
 */
@Component({
  selector: 'mk-drawer',
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-drawer',
    '[class.mk-drawer--open]': 'open()',
    '[attr.data-side]': 'side()',
    '[attr.inert]': "open() ? null : ''",
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class MkDrawer {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly panelRef = viewChild.required<ElementRef<HTMLElement>>('panel');

  /** Whether the drawer is open (two-way). */
  readonly open = model(false);
  /** Viewport edge to anchor to. */
  readonly side = input<MkDrawerSide>('end');
  /** Panel width (start/end) or height (top/bottom) — any CSS length. */
  readonly size = input<string>('20rem');
  /** Render a dimmed backdrop and lock body scroll (modal). */
  readonly hasBackdrop = input(true, { transform: booleanAttribute });
  /** Close when the backdrop is clicked. */
  readonly closeOnBackdrop = input(true, { transform: booleanAttribute });
  /** Close on the Escape key. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  /** Trap Tab focus inside the panel while open. */
  readonly trapFocus = input(true, { transform: booleanAttribute });
  /** Optional heading rendered in the header. */
  readonly heading = input<string>('');
  /** Hide the header close button. */
  readonly hideClose = input(false, { transform: booleanAttribute });
  /** Accessible name when no `heading` is provided. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });

  readonly titleId = mkUniqueId('mk-drawer-title');

  private focusTrap?: MkFocusTrap;
  private previouslyFocused: HTMLElement | null = null;
  private scrollLocked = false;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!this.isBrowser) return;
      // Defer so the panel has rendered/settled before focus moves into it.
      queueMicrotask(() => this.sync(isOpen));
    });
  }

  private sync(isOpen: boolean): void {
    const panel = this.panelRef().nativeElement;
    if (isOpen) {
      this.previouslyFocused = this.document.activeElement as HTMLElement | null;
      if (this.trapFocus()) {
        this.focusTrap = new MkFocusTrap(panel);
        this.focusTrap.activate();
      }
      if (this.hasBackdrop() && !this.scrollLocked) {
        this.document.body.style.setProperty('overflow', 'hidden');
        this.scrollLocked = true;
      }
    } else {
      this.focusTrap?.release();
      this.focusTrap = undefined;
      if (this.scrollLocked) {
        this.document.body.style.removeProperty('overflow');
        this.scrollLocked = false;
      }
      this.previouslyFocused?.focus?.();
    }
  }

  /** Close the drawer. */
  close(): void {
    this.open.set(false);
  }

  protected onBackdrop(): void {
    if (this.closeOnBackdrop()) this.close();
  }

  protected onEscape(event: Event): void {
    if (this.open() && this.closeOnEscape()) {
      event.stopPropagation();
      this.close();
    }
  }
}
