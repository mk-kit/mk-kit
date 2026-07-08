import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  PLATFORM_ID,
  computed,
  contentChildren,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkMenuItem } from './menu-item';

const GAP = 4;

/**
 * Dropdown menu implementing the ARIA menu pattern (roving focus, Arrow / Home
 * / End / typeahead, Enter/Space to activate). Attach it to a trigger with the
 * `mkMenuTriggerFor` directive; the trigger controls opening and positioning.
 *
 * ```html
 * <button mkButton [mkMenuTriggerFor]="menu">Actions</button>
 * <mk-menu #menu>
 *   <mk-menu-item (action)="edit()">Edit</mk-menu-item>
 *   <mk-menu-item danger (action)="del()">Delete</mk-menu-item>
 * </mk-menu>
 * ```
 */
@Component({
  selector: 'mk-menu',
  exportAs: 'mkMenu',
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-menu',
  },
})
export class MkMenu {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly items = contentChildren(MkMenuItem);
  protected readonly panelEl =
    viewChild<ElementRef<HTMLElement>>('panel');

  /** Stable id for `aria-controls` on the trigger. */
  readonly panelId = mkUniqueId('mk-menu');

  private readonly _open = signal(false);
  /** Whether the menu is currently open. */
  readonly opened = this._open.asReadonly();

  /** Accessible label for the menu (defaults via the trigger if unset). */
  readonly ariaLabel = signal<string | undefined>(undefined);

  protected readonly top = signal(0);
  protected readonly left = signal(0);

  private triggerEl: HTMLElement | null = null;
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  private readonly onDocMousedown = (e: MouseEvent) => {
    const target = e.target as Node;
    const panel = this.panelEl()?.nativeElement;
    if (panel?.contains(target) || this.triggerEl?.contains(target)) return;
    this.close(false);
  };
  private readonly onWinResize = () => this.close(false);

  /** Open the menu anchored to `trigger`. */
  open(trigger: HTMLElement, focusFirst = true): void {
    if (!this.isBrowser || this._open()) return;
    this.triggerEl = trigger;
    const rect = trigger.getBoundingClientRect();
    this.left.set(rect.left);
    this.top.set(rect.bottom + GAP);
    this._open.set(true);

    this.document.addEventListener('mousedown', this.onDocMousedown, true);
    this.document.defaultView?.addEventListener('resize', this.onWinResize);
    this.document.defaultView?.addEventListener('scroll', this.onWinResize, true);

    queueMicrotask(() => {
      this.reposition(rect);
      if (focusFirst) this.focusFirst();
    });
  }

  /**
   * Open the menu at viewport coordinates — e.g. a right-click point from a
   * `contextmenu` event. The panel's top-left is placed at (`x`, `y`) and then
   * flipped up / shifted left by the same edge logic as {@link reposition}
   * (a zero-size rect at the point is synthesized). Focus moves to the first
   * item; `restoreFocusEl` (when provided) regains focus on close.
   */
  openAt(x: number, y: number, restoreFocusEl?: HTMLElement): void {
    if (!this.isBrowser || this._open()) return;
    this.triggerEl = restoreFocusEl ?? null;
    this.left.set(x);
    this.top.set(y);
    this._open.set(true);

    this.document.addEventListener('mousedown', this.onDocMousedown, true);
    this.document.defaultView?.addEventListener('resize', this.onWinResize);
    this.document.defaultView?.addEventListener('scroll', this.onWinResize, true);

    queueMicrotask(() => {
      this.reposition(new DOMRect(x, y, 0, 0));
      this.focusFirst();
    });
  }

  /** Close the menu; optionally restore focus to the trigger. */
  close(restoreFocus = true): void {
    if (!this._open()) return;
    this._open.set(false);
    this.document.removeEventListener('mousedown', this.onDocMousedown, true);
    this.document.defaultView?.removeEventListener('resize', this.onWinResize);
    this.document.defaultView?.removeEventListener('scroll', this.onWinResize, true);
    const trigger = this.triggerEl;
    this.triggerEl = null;
    if (restoreFocus) trigger?.focus();
  }

  /** Toggle open/closed from a trigger. */
  toggle(trigger: HTMLElement, focusFirst = true): void {
    if (this._open()) {
      this.close(true);
    } else {
      this.open(trigger, focusFirst);
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst();
        break;
      case 'End':
        event.preventDefault();
        this.focusLast();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activeItem()?.activate();
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        event.preventDefault();
        this.close(true);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          this.onTypeahead(event.key);
        }
    }
  }

  private enabled(): MkMenuItem[] {
    return this.items().filter((i) => !i.disabled());
  }

  private activeItem(): MkMenuItem | undefined {
    const active = this.document.activeElement;
    return this.enabled().find((i) => i.contains(active));
  }

  private currentIndex(): number {
    const active = this.document.activeElement;
    return this.enabled().findIndex((i) => i.contains(active));
  }

  private move(delta: number): void {
    const items = this.enabled();
    if (items.length === 0) return;
    const current = this.currentIndex();
    const next =
      current < 0
        ? delta > 0
          ? 0
          : items.length - 1
        : (current + delta + items.length) % items.length;
    items[next].focusEl();
  }

  private focusFirst(): void {
    this.enabled()[0]?.focusEl();
  }

  private focusLast(): void {
    const items = this.enabled();
    items[items.length - 1]?.focusEl();
  }

  private onTypeahead(char: string): void {
    this.typeahead += char.toLowerCase();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), 500);

    const items = this.enabled();
    const start = Math.max(0, this.currentIndex());
    for (let i = 1; i <= items.length; i++) {
      const item = items[(start + i) % items.length];
      if (item.text().startsWith(this.typeahead)) {
        item.focusEl();
        return;
      }
    }
  }

  private reposition(triggerRect: DOMRect): void {
    const panel = this.panelEl()?.nativeElement;
    const view = this.document.defaultView;
    if (!panel || !view) return;
    const rect = panel.getBoundingClientRect();

    // Flip above the trigger when it would overflow the bottom edge.
    if (triggerRect.bottom + rect.height + GAP > view.innerHeight) {
      const above = triggerRect.top - rect.height - GAP;
      if (above > 0) this.top.set(above);
    }
    // Shift left to stay within the right edge.
    if (triggerRect.left + rect.width > view.innerWidth) {
      this.left.set(Math.max(GAP, view.innerWidth - rect.width - GAP));
    }
  }
}
