import { Directive, ElementRef, inject, input } from '@angular/core';
import { MkMenu } from '@mkornas/ui/navigation';

/**
 * Turns its host element into a right-click trigger for an `<mk-menu>`, reusing
 * the same {@link MkMenu} instance as `mkMenuTriggerFor`. On `contextmenu` it
 * prevents the native menu and opens the menu at the pointer coordinates via
 * {@link MkMenu.openAt}, restoring focus to the host on close.
 *
 * For keyboard users (WCAG) the dedicated <kbd>ContextMenu</kbd> key and
 * <kbd>Shift</kbd>+<kbd>F10</kbd> open the menu anchored to the host element;
 * <kbd>Escape</kbd> closes it. The host advertises `aria-haspopup="menu"`.
 * The menu closes on selection, Escape or an outside click (handled by
 * {@link MkMenu}).
 *
 * ```html
 * <tr [mkContextMenuTriggerFor]="rowMenu" tabindex="0">…</tr>
 * <mk-menu #rowMenu>
 *   <mk-menu-item (action)="edit()">Edit</mk-menu-item>
 *   <mk-menu-item danger (action)="del()">Delete</mk-menu-item>
 * </mk-menu>
 * ```
 */
@Directive({
  selector: '[mkContextMenuTriggerFor]',
  exportAs: 'mkContextMenuTrigger',
  host: {
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'menu().opened()',
    '[attr.aria-controls]': 'menu().panelId',
    '(contextmenu)': 'onContextMenu($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkContextMenuTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The menu instance to open on right-click / context-menu key. */
  readonly menu = input.required<MkMenu>({ alias: 'mkContextMenuTriggerFor' });

  protected onContextMenu(event: Event): void {
    const e = event as MouseEvent;
    e.preventDefault();
    this.menu().openAt(e.clientX, e.clientY, this.host.nativeElement);
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    // ContextMenu key or Shift+F10 — open anchored to the host element.
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      this.menu().open(this.host.nativeElement, true);
    } else if (e.key === 'Escape' && this.menu().opened()) {
      e.preventDefault();
      this.menu().close(true);
    }
  }
}
