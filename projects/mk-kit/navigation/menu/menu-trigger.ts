import { Directive, ElementRef, inject, input } from '@angular/core';
import { MkMenu } from './menu';

/**
 * Turns its host button into a trigger for an `<mk-menu>`. Wires
 * `aria-haspopup="menu"` / `aria-expanded` / `aria-controls`, toggles on click,
 * opens on ArrowDown / Enter / Space (focusing the first item) and on ArrowUp
 * (focusing the last item, per the APG menu-button pattern), and closes on
 * Escape. When the menu is already open — e.g. after a mouse click, which
 * deliberately leaves focus on the trigger — ArrowDown moves focus to the
 * first item and ArrowUp to the last, so the keyboard is never dead.
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
    const menu = this.menu();
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (menu.opened()) {
          // Already open (mouse open keeps focus on the trigger) — enter the
          // menu at the top instead of swallowing the key.
          menu.focusFirstItem();
        } else {
          menu.open(this.host.nativeElement, 'first');
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (menu.opened()) {
          menu.focusLastItem();
        } else {
          menu.open(this.host.nativeElement, 'last');
        }
        break;
      case 'Escape':
        if (menu.opened()) {
          event.preventDefault();
          menu.close(true);
        }
        break;
    }
  }
}
