import { Directive, ElementRef, inject, input } from '@angular/core';
import { MkPopconfirm } from './popconfirm';

/**
 * Turns its host element into a click trigger for an `<mk-popconfirm>`. Wires
 * `aria-haspopup="dialog"` / `aria-expanded` / `aria-controls`, toggles on click
 * and closes on Escape.
 *
 * ```html
 * <button mkButton tone="danger" [mkPopconfirmFor]="del">Delete</button>
 * <mk-popconfirm #del message="Delete this item?" (confirm)="remove()" />
 * ```
 */
@Directive({
  selector: '[mkPopconfirmFor]',
  exportAs: 'mkPopconfirmTrigger',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'popconfirm().opened()',
    '[attr.aria-controls]': 'popconfirm().panelId',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MkPopconfirmTrigger {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The popconfirm instance to control. */
  readonly popconfirm = input.required<MkPopconfirm>({
    alias: 'mkPopconfirmFor',
  });

  protected onClick(event: Event): void {
    event.preventDefault();
    this.popconfirm().toggle(this.host.nativeElement);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.popconfirm().opened()) {
      event.preventDefault();
      this.popconfirm().close();
    }
  }
}
