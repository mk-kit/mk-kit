import { Directive, ElementRef, inject, input } from '@angular/core';
import { MkMenu } from './menu';

/**
 * Turns its host button into a trigger for an `<mk-menu>`. Wires
 * `aria-haspopup="menu"` / `aria-expanded` / `aria-controls`, toggles on click,
 * opens on ArrowDown (focusing the first item) and closes on Escape.
 *
 * ```html
 * <button mkButton [mkMenuTriggerFor]="menu">Actions</button>
 * <mk-menu #menu>…</mk-menu>
 * ```
 */
@Directive({
  selector: '[mkMenuTriggerFor]',
  exportAs: 'mkMenuTrigger',
  host: {
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'menu().opened()',
    '[attr.aria-controls]': 'menu().panelId',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkMenuTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The menu instance to control. */
  readonly menu = input.required<MkMenu>({ alias: 'mkMenuTriggerFor' });

  protected onClick(event: Event): void {
    event.preventDefault();
    this.menu().toggle(this.host.nativeElement, false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.menu().open(this.host.nativeElement, true);
        break;
      case 'Escape':
        if (this.menu().opened()) {
          event.preventDefault();
          this.menu().close(true);
        }
        break;
    }
  }
}
