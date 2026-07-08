import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { MkMenu } from './menu';

/**
 * An item within an `<mk-menu>`. Renders as an ARIA `menuitem` with an optional
 * icon slot (`[mkMenuItemIcon]`), disabled and danger states, and either emits
 * `action` or navigates when `href` is set. Activating closes the menu.
 *
 * ```html
 * <mk-menu-item (action)="rename()">
 *   <svg mkMenuItemIcon>…</svg> Rename
 * </mk-menu-item>
 * <mk-menu-item danger (action)="remove()">Delete</mk-menu-item>
 * <mk-menu-item href="/help">Help</mk-menu-item>
 * ```
 */
@Component({
  selector: 'mk-menu-item',
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-menu-item',
    role: 'menuitem',
    tabindex: '-1',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.mk-menu-item--danger]': 'danger()',
    '[class.mk-menu-item--disabled]': 'disabled()',
    '(click)': 'activate($event)',
  },
})
export class MkMenuItem {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly menu = inject(MkMenu, { optional: true });

  /** Prevent selection and focus. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Destructive styling (e.g. Delete). */
  readonly danger = input(false, { transform: booleanAttribute });
  /** When set, activating the item navigates here. */
  readonly href = input<string>();

  /** Emitted when the item is activated (not for disabled items). */
  readonly action = output<void>();

  activate(event?: Event): void {
    if (this.disabled()) {
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }
    this.action.emit();
    const href = this.href();
    this.menu?.close(true);
    if (href) {
      this.document.defaultView?.location.assign(href);
    }
  }

  /** Move DOM focus to this item (roving focus). */
  focusEl(): void {
    this.el.nativeElement.focus();
  }

  /** Whether `node` lives inside this item. */
  contains(node: Node | null): boolean {
    return !!node && this.el.nativeElement.contains(node);
  }

  /** Lowercased text content, used for typeahead matching. */
  text(): string {
    return (this.el.nativeElement.textContent ?? '').trim().toLowerCase();
  }
}
