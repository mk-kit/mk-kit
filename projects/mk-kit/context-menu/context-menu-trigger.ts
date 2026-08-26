import { Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';
import { MkMenu } from '@mk-kit/ui/navigation';

/** Hold time before a touch press opens the context menu. */
const LONG_PRESS_MS = 500;
/** Movement allowed before a touch press is treated as a scroll/drag instead. */
const LONG_PRESS_SLOP_PX = 10;

/**
 * Turns its host element into a right-click trigger for an `<mk-menu>`, reusing
 * the same {@link MkMenu} instance as `mkMenuTriggerFor`. On `contextmenu` it
 * prevents the native menu and opens the menu at the pointer coordinates via
 * {@link MkMenu.openAt}, restoring focus to the host on close.
 *
 * On touch devices a long-press (~500ms hold with a touch pointer) opens the
 * menu at the touch point — iOS Safari never fires `contextmenu`, so this is
 * the only way to reach a context menu on iPhones. Moving the finger beyond a
 * small slop, or lifting it early, cancels the press. On platforms that do
 * synthesize a `contextmenu` after a long-press (Android), that follow-up
 * event is suppressed so the menu doesn't open twice. While the directive is
 * attached it disables the iOS press callout and text selection on the host
 * (inline host styles — the directive has no stylesheet).
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
    // Long-press affordance: keep iOS's press callout and text selection from
    // hijacking the hold. Inline styles because a directive has no stylesheet.
    '[style.-webkit-touch-callout]': "'none'",
    '[style.-webkit-user-select]': "'none'",
    '[style.user-select]': "'none'",
    '(contextmenu)': 'onContextMenu($event)',
    '(keydown)': 'onKeydown($event)',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'cancelLongPress()',
    '(pointercancel)': 'cancelLongPress()',
  },
})
export class MkContextMenuTrigger implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The menu instance to open on right-click / context-menu key. */
  readonly menu = input.required<MkMenu>({ alias: 'mkContextMenuTriggerFor' });

  private longPressTimer?: ReturnType<typeof setTimeout>;
  private pressX = 0;
  private pressY = 0;
  /**
   * Set when a long-press just opened the menu; consumed by the `contextmenu`
   * handler so the synthetic event Android fires after a long-press doesn't
   * open the menu a second time.
   */
  private longPressFired = false;

  protected onContextMenu(event: Event): void {
    const e = event as MouseEvent;
    e.preventDefault();
    if (this.longPressFired) {
      // The long-press already opened the menu at these coordinates.
      this.longPressFired = false;
      return;
    }
    this.menu().openAt(e.clientX, e.clientY, this.host.nativeElement);
  }

  protected onPointerDown(event: Event): void {
    const e = event as PointerEvent;
    // Any new press invalidates a stale long-press flag (e.g. an iOS
    // long-press that never produced a contextmenu event).
    this.longPressFired = false;
    this.cancelLongPress();
    if (e.pointerType !== 'touch') return;
    this.pressX = e.clientX;
    this.pressY = e.clientY;
    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = undefined;
      this.longPressFired = true;
      this.menu().openAt(this.pressX, this.pressY, this.host.nativeElement);
    }, LONG_PRESS_MS);
  }

  protected onPointerMove(event: Event): void {
    if (this.longPressTimer === undefined) return;
    const e = event as PointerEvent;
    const dx = e.clientX - this.pressX;
    const dy = e.clientY - this.pressY;
    // Moved too far — this is a scroll or drag, not a press.
    if (Math.hypot(dx, dy) > LONG_PRESS_SLOP_PX) this.cancelLongPress();
  }

  protected cancelLongPress(): void {
    if (this.longPressTimer !== undefined) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }
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

  ngOnDestroy(): void {
    this.cancelLongPress();
  }
}
