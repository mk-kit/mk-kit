import { Directive, ElementRef, inject, input } from '@angular/core';
import { MkPopover } from './popover';

/**
 * Turns its host element into a click trigger for an `<mk-popover>`. Wires
 * `aria-haspopup="dialog"` / `aria-expanded` / `aria-controls`, toggles on click
 * and closes on Escape.
 *
 * ```html
 * <button mkButton [mkPopoverTriggerFor]="info">Details</button>
 * <mk-popover #info>…</mk-popover>
 * ```
 */
@Directive({
  selector: '[mkPopoverTriggerFor]',
  exportAs: 'mkPopoverTrigger',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'popover().opened()',
    '[attr.aria-controls]': 'popover().panelId',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkPopoverTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The popover instance to control. */
  readonly popover = input.required<MkPopover>({ alias: 'mkPopoverTriggerFor' });

  protected onClick(event: Event): void {
    event.preventDefault();
    this.popover().toggle(this.host.nativeElement);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.popover().opened()) {
      event.preventDefault();
      this.popover().close(true);
    }
  }
}
