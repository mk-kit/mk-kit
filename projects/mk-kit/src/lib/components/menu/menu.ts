import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  contentChildren,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkAnchoredPanel } from '../../core/overlay/anchored-overlay';
import { MkMenuItem } from './menu-item';

/**
 * Dropdown menu implementing the ARIA menu pattern (roving focus, Arrow / Home
 * / End / typeahead, Enter/Space to activate). Attach it to a trigger with the
 * `mkMenuTriggerFor` directive; the trigger controls opening and positioning.
 *
 * The panel is rendered in the browser top layer via {@link MkAnchoredPanel}, so
 * it is never clipped by an ancestor's `overflow`/`transform` and always flips
 * back on-screen near a viewport edge.
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
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-menu',
  },
})
export class MkMenu {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly items = contentChildren(MkMenuItem);

  /** Stable id for `aria-controls` on the trigger. */
  readonly panelId = mkUniqueId('mk-menu');

  private readonly _open = signal(false);
  /** Whether the menu is currently open. */
  readonly opened = this._open.asReadonly();

  /** Accessible label for the menu (defaults via the trigger if unset). */
  readonly ariaLabel = signal<string | undefined>(undefined);

  /** Element to anchor the panel to (element-anchored open). */
  protected readonly anchorEl = signal<HTMLElement | undefined>(undefined);
  /** Viewport point to anchor to (`openAt` / context menu). */
  protected readonly anchorPoint = signal<{ x: number; y: number } | undefined>(
    undefined,
  );

  private triggerEl: HTMLElement | null = null;
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  /** Open the menu anchored to `trigger`. */
  open(trigger: HTMLElement, focusFirst = true): void {
    if (!this.isBrowser || this._open()) return;
    this.triggerEl = trigger;
    this.anchorEl.set(trigger);
    this.anchorPoint.set(undefined);
    this._open.set(true);
    if (focusFirst) this.focusAfterOpen();
  }

  /**
   * Open the menu at viewport coordinates — e.g. a right-click point from a
   * `contextmenu` event. Positioning (and flip/shift back on-screen) is handled
   * by {@link MkAnchoredPanel} via the point anchor. Focus moves to the first
   * item; `restoreFocusEl` (when provided) regains focus on close.
   */
  openAt(x: number, y: number, restoreFocusEl?: HTMLElement): void {
    if (!this.isBrowser || this._open()) return;
    this.triggerEl = restoreFocusEl ?? null;
    this.anchorEl.set(undefined);
    this.anchorPoint.set({ x, y });
    this._open.set(true);
    this.focusAfterOpen();
  }

  /** Close the menu; optionally restore focus to the trigger. */
  close(restoreFocus = true): void {
    if (!this._open()) return;
    this._open.set(false);
    this.anchorEl.set(undefined);
    this.anchorPoint.set(undefined);
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

  /** Focus the first item once the panel is in the top layer and painted. */
  private focusAfterOpen(): void {
    afterNextRender(
      { write: () => this.focusFirst() },
      { injector: this.injector },
    );
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
}
