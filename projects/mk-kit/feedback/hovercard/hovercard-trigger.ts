import { Directive, ElementRef, inject, input } from '@angular/core';
import { MkHovercard } from './hovercard';

/**
 * A touch tap fires emulated `mouseenter` + `focus` right after `pointerdown`;
 * for this long after a touch toggle those synthetic enters are ignored, so a
 * tap that just CLOSED the card is not undone by its own compatibility events.
 */
const TOUCH_ENTER_SUPPRESS_MS = 500;

/**
 * Turns its host element into a hover/focus trigger for an `<mk-hovercard>`.
 * On `mouseenter`/`focus` it opens the card (after the card's `openDelay`),
 * anchored to the host; on `mouseleave`/`blur` it schedules a close (after the
 * card's `closeDelay`). Moving the pointer — or keyboard focus — from the host
 * onto the card cancels that close, so the card stays open and its content is
 * reachable with Tab. Escape closes it.
 *
 * On touch there is no hover, so a tap toggles instead: tap opens the card
 * immediately, tapping the trigger again closes it, and a tap anywhere else
 * closes it through the panel's outside-pointerdown dismissal.
 *
 * ```html
 * <a href="/u/ada" [mkHovercardFor]="ada">@ada</a>
 * <mk-hovercard #ada>…</mk-hovercard>
 * ```
 */
@Directive({
  selector: '[mkHovercardFor]',
  exportAs: 'mkHovercardTrigger',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'hovercard().opened()',
    '[attr.aria-controls]': 'hovercard().panelId',
    '(mouseenter)': 'onEnter()',
    '(focus)': 'onEnter()',
    '(mouseleave)': 'onLeave()',
    '(blur)': 'onLeave()',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkHovercardTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Timestamp of the last touch toggle — guards `onEnter` (see above). */
  private lastTouchToggle = Number.NEGATIVE_INFINITY;

  /** The hovercard instance to control. */
  readonly hovercard = input.required<MkHovercard>({ alias: 'mkHovercardFor' });

  protected onEnter(): void {
    if (Date.now() - this.lastTouchToggle < TOUCH_ENTER_SUPPRESS_MS) return;
    this.hovercard().scheduleOpen(this.host.nativeElement);
  }

  /**
   * Touch tap-toggle. Mouse and pen are ignored here — they keep the pure
   * hover/focus behaviour. A tap while the card is open closes it (a tap
   * OUTSIDE both trigger and panel is handled by the anchored panel's own
   * outside-pointerdown dismiss, which excludes the anchor, so the two paths
   * never double-fire).
   */
  protected onPointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    this.lastTouchToggle = Date.now();
    const card = this.hovercard();
    if (card.opened()) {
      card.close();
    } else {
      // No openDelay on touch — the tap is deliberate, not a passing pointer.
      card.open(this.host.nativeElement);
    }
  }

  protected onLeave(): void {
    this.hovercard().scheduleClose();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.hovercard().opened()) {
      event.preventDefault();
      this.hovercard().close();
    }
  }
}
