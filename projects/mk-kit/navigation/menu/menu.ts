import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  type OnDestroy,
  PLATFORM_ID,
  afterNextRender,
  contentChildren,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MkPlacement } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MkAnchoredPanel } from '@mk-kit/ui/core';
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
 *
 * **Submenus.** Point an item at a nested menu with `[mkSubmenuFor]`; declare
 * the nested `<mk-menu>` anywhere inside the parent menu. The submenu opens
 * beside its item on hover (after a short delay), on ArrowRight / Enter /
 * Space / click, and closes with ArrowLeft or Escape (returning focus to the
 * item) — only that level, per the APG menu pattern. Activating any leaf item
 * closes the whole chain. In RTL the submenu opens on the left and the arrow
 * keys swap.
 *
 * ```html
 * <mk-menu #menu>
 *   <mk-menu-item [mkSubmenuFor]="exportMenu">Export</mk-menu-item>
 *   <mk-menu #exportMenu>
 *     <mk-menu-item (action)="csv()">CSV</mk-menu-item>
 *     <mk-menu-item (action)="pdf()">PDF</mk-menu-item>
 *   </mk-menu>
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
export class MkMenu implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** The enclosing menu when this one is a submenu. */
  private readonly parent = inject(MkMenu, { optional: true, skipSelf: true });

  private readonly items = contentChildren(MkMenuItem);
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

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
  /** Where the panel sits relative to its anchor (submenus open sideways). */
  protected readonly placement = signal<MkPlacement>('bottom-start');

  private triggerEl: HTMLElement | null = null;
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;
  /** Submenus that are currently open under this menu. */
  private readonly openChildren = new Set<MkMenu>();

  /**
   * Whether this menu is a submenu of another `mk-menu`. Submenus open
   * sideways, close a single level on Escape, and swap ArrowLeft/ArrowRight.
   */
  get isSubmenu(): boolean {
    return this.parent !== null;
  }

  /**
   * Open the menu anchored to `trigger`. `focus` picks the item that receives
   * focus once the panel is painted: `true`/`'first'` for the first enabled
   * item, `'last'` for the last (ArrowUp on a menu button, per the APG
   * menu-button pattern), `false` to leave focus where it is (mouse open).
   * `placement` overrides the default `bottom-start` (submenus pass
   * `right-start` / `left-start`).
   */
  open(
    trigger: HTMLElement,
    focus: boolean | 'first' | 'last' = true,
    placement: MkPlacement = 'bottom-start',
  ): void {
    if (!this.isBrowser || this._open()) return;
    this.triggerEl = trigger;
    this.anchorEl.set(trigger);
    this.anchorPoint.set(undefined);
    this.placement.set(placement);
    this._open.set(true);
    this.parent?.childOpened(this);
    if (focus) this.focusAfterOpen(focus === 'last' ? 'last' : 'first');
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
    this.placement.set('bottom-start');
    this._open.set(true);
    this.focusAfterOpen('first');
  }

  /**
   * Close this menu (and any submenu open under it); optionally restore focus
   * to the trigger — for a submenu that is the item it hangs off.
   */
  close(restoreFocus = true): void {
    if (!this._open()) return;
    this.closeChildren();
    this._open.set(false);
    this.anchorEl.set(undefined);
    this.anchorPoint.set(undefined);
    const trigger = this.triggerEl;
    this.triggerEl = null;
    this.parent?.childClosed(this);
    if (restoreFocus) trigger?.focus();
  }

  /**
   * Close the whole menu chain from the root down — what activating a leaf
   * item does, wherever in the tree it sits. Focus returns to the root
   * trigger when `restoreFocus` is set.
   */
  closeAll(restoreFocus = true): void {
    this.root().close(restoreFocus);
  }

  /** Close every submenu open under this menu, except `keep`. */
  closeChildren(keep?: MkMenu): void {
    for (const child of [...this.openChildren]) {
      if (child !== keep) child.close(false);
    }
  }

  /** Toggle open/closed from a trigger. */
  toggle(trigger: HTMLElement, focusFirst = true): void {
    if (this._open()) {
      this.close(true);
    } else {
      this.open(trigger, focusFirst);
    }
  }

  /**
   * Move focus to the first enabled item. Used by the trigger when the menu is
   * already open (e.g. ArrowDown after a mouse open), so arrow keys always
   * reach the items even though focus never left the trigger.
   */
  focusFirstItem(): void {
    this.focusFirst();
  }

  /** Move focus to the last enabled item (ArrowUp from the trigger). */
  focusLastItem(): void {
    this.focusLast();
  }

  /**
   * Whether `node` lives inside this menu's panel or any submenu open under
   * it. Submenu panels are separate top-layer elements, so a plain
   * `contains` on the parent panel would treat clicks in them as outside.
   */
  containsTarget(node: Node | null): boolean {
    if (!node) return false;
    if (this.panelRef()?.nativeElement.contains(node)) return true;
    for (const child of this.openChildren) {
      if (child.containsTarget(node)) return true;
    }
    return false;
  }

  /** Bound for the anchored panel's `keepOpenWhen` (stable identity). */
  protected readonly keepOpenWhen = (target: Node): boolean =>
    [...this.openChildren].some((c) => c.containsTarget(target));

  /**
   * An item was hovered: close sibling submenus so only the hovered branch
   * stays open (the item opens its own submenu after a delay).
   */
  itemHovered(item: MkMenuItem): void {
    this.closeChildren(item.submenu());
  }

  /** @internal */
  childOpened(child: MkMenu): void {
    this.closeChildren(child);
    this.openChildren.add(child);
  }

  /** @internal */
  childClosed(child: MkMenu): void {
    this.openChildren.delete(child);
  }

  private root(): MkMenu {
    let m: MkMenu = this;
    while (m.parent) m = m.parent;
    return m;
  }

  /** Focus an item once the panel is in the top layer and painted. */
  private focusAfterOpen(which: 'first' | 'last'): void {
    afterNextRender(
      {
        write: () => {
          if (which === 'last') this.focusLast();
          else this.focusFirst();
        },
      },
      { injector: this.injector },
    );
  }

  /**
   * Whether the menu is laid out right-to-left (submenu side + arrow keys).
   * Read from the trigger's nearest `dir` attribute — the panel itself lives
   * in the top layer, outside any `dir` container — then from computed style.
   */
  private isRtl(): boolean {
    // A submenu's trigger is an item inside a teleported panel, so climb to
    // the root menu, whose trigger sits in the consumer's DOM.
    const el = this.root().triggerEl ?? this.panelRef()?.nativeElement;
    if (!el) return this.document.dir === 'rtl';
    const dir = el.closest('[dir]')?.getAttribute('dir');
    if (dir) return dir.toLowerCase() === 'rtl';
    const view = this.document.defaultView;
    return (view?.getComputedStyle(el).direction ?? 'ltr') === 'rtl';
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    const rtl = this.isRtl();
    const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';
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
      case openKey: {
        const item = this.activeItem();
        if (item?.submenu()) {
          event.preventDefault();
          item.openSubmenu(true);
        }
        break;
      }
      case closeKey:
        if (this.isSubmenu) {
          event.preventDefault();
          this.close(true);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close(true);
        break;
      case 'Tab':
        event.preventDefault();
        this.closeAll(true);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          this.onTypeahead(event.key);
        }
    }
  }

  /** Placement for a submenu hanging off `item`, honouring text direction. */
  submenuPlacement(): MkPlacement {
    return this.isRtl() ? 'left-start' : 'right-start';
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

  ngOnDestroy(): void {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    if (this._open()) this.close(false);
  }
}
