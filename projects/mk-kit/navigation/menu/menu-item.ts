import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  type OnDestroy,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { MkMenu } from './menu';

/** Hover dwell before a submenu opens, so sweeping past an item does not flash it. */
const SUBMENU_HOVER_DELAY = 150;

/**
 * An item within an `<mk-menu>`. Renders as an ARIA `menuitem` with an optional
 * icon slot (`[mkMenuItemIcon]`), disabled and danger states, and either emits
 * `action` or navigates when `href` is set. Activating closes the menu.
 *
 * With `[mkSubmenuFor]` pointing at a nested `<mk-menu>` the item becomes a
 * submenu trigger instead: it shows a chevron, exposes `aria-haspopup` /
 * `aria-expanded`, opens the submenu beside itself on hover, ArrowRight,
 * Enter, Space or click, and never emits `action`.
 *
 * ```html
 * <mk-menu-item (action)="rename()">
 *   <svg mkMenuItemIcon>…</svg> Rename
 * </mk-menu-item>
 * <mk-menu-item danger (action)="remove()">Delete</mk-menu-item>
 * <mk-menu-item href="/help">Help</mk-menu-item>
 * <mk-menu-item [mkSubmenuFor]="more">More</mk-menu-item>
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
    '[attr.aria-haspopup]': "submenu() ? 'menu' : null",
    '[attr.aria-expanded]': 'submenu() ? submenu()!.opened() : null',
    '[attr.aria-controls]': 'submenu()?.panelId ?? null',
    '[class.mk-menu-item--danger]': 'danger()',
    '[class.mk-menu-item--disabled]': 'disabled()',
    '[class.mk-menu-item--submenu]': '!!submenu()',
    '[class.mk-menu-item--expanded]': 'submenu()?.opened() ?? false',
    '(click)': 'activate($event)',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class MkMenuItem implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly menu = inject(MkMenu, { optional: true });

  /** Prevent selection and focus. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Destructive styling (e.g. Delete). */
  readonly danger = input(false, { transform: booleanAttribute });
  /** When set, activating the item navigates here. */
  readonly href = input<string>();
  /** A nested `mk-menu` this item opens as a submenu. */
  readonly submenu = input<MkMenu | undefined>(undefined, { alias: 'mkSubmenuFor' });

  /** Emitted when the item is activated (not for disabled or submenu items). */
  readonly action = output<void>();

  private hoverTimer?: ReturnType<typeof setTimeout>;

  activate(event?: Event): void {
    if (this.disabled()) {
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }
    if (this.submenu()) {
      // A pointer click keeps focus where it is; keyboard activation (Enter /
      // Space arrive here through the panel handler without an event) moves
      // focus into the submenu.
      this.openSubmenu(!event);
      return;
    }
    this.action.emit();
    const href = this.href();
    this.menu?.closeAll(true);
    if (href) {
      this.document.defaultView?.location.assign(href);
    }
  }

  /** Open the submenu beside this item; `focus` moves focus to its first item. */
  openSubmenu(focus: boolean): void {
    const sub = this.submenu();
    if (!sub || this.disabled()) return;
    this.cancelHover();
    if (sub.opened()) {
      if (focus) sub.focusFirstItem();
      return;
    }
    sub.open(
      this.el.nativeElement,
      focus ? 'first' : false,
      this.menu?.submenuPlacement() ?? 'right-start',
    );
  }

  protected onMouseEnter(): void {
    if (this.disabled()) return;
    this.menu?.itemHovered(this);
    if (this.submenu() && !this.submenu()!.opened()) {
      this.cancelHover();
      this.hoverTimer = setTimeout(() => this.openSubmenu(false), SUBMENU_HOVER_DELAY);
    }
  }

  protected onMouseLeave(): void {
    this.cancelHover();
  }

  private cancelHover(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = undefined;
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

  ngOnDestroy(): void {
    this.cancelHover();
  }
}
