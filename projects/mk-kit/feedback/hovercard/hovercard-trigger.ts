import { Directive, ElementRef, inject, input } from '@angular/core';
import { MkHovercard } from './hovercard';

/**
 * Turns its host element into a hover/focus trigger for an `<mk-hovercard>`.
 * On `mouseenter`/`focus` it opens the card (after the card's `openDelay`),
 * anchored to the host; on `mouseleave`/`blur` it schedules a close (after the
 * card's `closeDelay`). Moving the pointer — or keyboard focus — from the host
 * onto the card cancels that close, so the card stays open and its content is
 * reachable with Tab. Escape closes it.
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
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkHovercardTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The hovercard instance to control. */
  readonly hovercard = input.required<MkHovercard>({ alias: 'mkHovercardFor' });

  protected onEnter(): void {
    this.hovercard().scheduleOpen(this.host.nativeElement);
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
