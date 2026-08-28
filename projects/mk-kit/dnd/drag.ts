/* eslint-disable @typescript-eslint/no-explicit-any -- cross-list references
   use `any` for the item type to avoid generic-variance friction. */
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { MK_I18N, MkLiveAnnouncer } from '@mk-kit/ui/core';
import { MkDragDropRegistry } from './drag-drop-registry';
import { MkDragHandle } from './drag-handle';
import { MkDropList } from './drop-list';
import type { MkDropEvent } from './drag-drop.types';

/** Pixels the pointer must travel before a press turns into a drag. */
const DRAG_THRESHOLD = 5;
/**
 * Pixels a *touch* pointer may wander during the long-press delay before the
 * press is treated as a scroll and the pending drag is abandoned.
 */
const TOUCH_SLOP = 10;
/** Settle animation duration for the pointer preview (ms). */
const SETTLE_MS = 180;

/**
 * Makes an item inside a `[mkDropList]` draggable — by pointer (mouse / touch /
 * pen) **and** by keyboard (WCAG 2.1.1). Every move is announced via
 * {@link MkLiveAnnouncer}. Which element carries the keyboard interaction
 * depends on the handle:
 *
 * - **No handle, or a decorative one** (`<span mkDragHandle aria-hidden>`):
 *   the item itself is focusable and exposes `aria-roledescription="Draggable
 *   item"` with `role="button"` — or `role="option"` when it is an `<li>` of a
 *   `<ul mkDropList>`, which then becomes a labelled `listbox` (an `<li>` may
 *   not take the `button` role).
 * - **A focusable handle** (`<button mkDragHandle aria-label="…">`, or any
 *   handle with `tabindex`): the handle is the keyboard target and receives
 *   the `aria-roledescription` / `aria-pressed` / `aria-grabbed` state; the
 *   item stays a plain container with no role and no `tabindex`, so it can hold
 *   inputs, links and buttons of its own (no nested interactive controls) and
 *   `<li>` items keep their list semantics.
 *
 * Keyboard: focus the item (or its handle) and press **Space/Enter** to pick
 * it up, **Arrow** keys to move it (crossing into connected lists at the ends /
 * across the perpendicular axis), **Space/Enter** to drop, **Escape** to cancel.
 *
 * Touch: a swipe scrolls the page as usual — the drag only arms after a
 * long-press ({@link mkDragTouchDelay}, default 300 ms). While armed the item
 * gets the `mk-drag--armed` class so consumers can style the lift moment.
 * Mouse and pen drags start immediately, as before.
 *
 * Performance: pointer moves are rAF-coalesced (one hit-test + one set of
 * style/DOM writes per frame) against list/item rects snapshotted when the
 * drag lifts, so a move never forces layout. The pending frame is flushed
 * synchronously on release so drops land exactly where the pointer ended.
 *
 * ```html
 * <div mkDrag [mkDragData]="row" [mkDragDisabled]="row.locked">
 *   <span mkDragHandle aria-hidden="true">⠿</span> {{ row.title }}
 * </div>
 * ```
 *
 * @typeParam T item data type.
 */
@Component({
  selector: '[mkDrag]',
  exportAs: 'mkDrag',
  templateUrl: './drag.html',
  styleUrl: './drag.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-drag',
    draggable: 'false',
    // Widget semantics live on the item only while no focusable handle takes
    // them over (see `keyboardHandle`); otherwise the item is a plain container.
    '[attr.role]': 'itemRole()',
    '[attr.aria-roledescription]': "itemRole() ? 'Draggable item' : null",
    '[attr.tabindex]': 'itemRole() ? (disabled() ? -1 : 0) : null',
    '[attr.aria-disabled]': 'itemRole() ? disabled() || null : null',
    '[attr.aria-pressed]': "itemRole() === 'button' ? lifted() || null : null",
    '[attr.aria-selected]': "itemRole() === 'option' ? lifted() : null",
    '[attr.aria-grabbed]': 'itemRole() ? dragging() || lifted() : null',
    '[class.mk-drag--disabled]': 'disabled()',
    '[class.mk-drag--dragging]': 'dragging()',
    '[class.mk-drag--lifted]': 'lifted()',
    '[class.mk-drag--armed]': 'armed()',
    '[class.mk-drag--has-handle]': 'ownHandles().length > 0',
    '[class.mk-drag--horizontal]': 'inHorizontalList()',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class MkDrag<T = unknown> {
  private readonly doc = inject(DOCUMENT);
  private readonly registry = inject(MkDragDropRegistry);
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly i18n = inject(MK_I18N);
  private readonly home = inject(MkDropList, { optional: true }) as
    | MkDropList<any>
    | null;

  /** The item's host element. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Arbitrary payload associated with this item. */
  readonly mkDragData = input<T>();

  /** Disable dragging this specific item. */
  readonly mkDragDisabled = input(false, { transform: booleanAttribute });

  /**
   * Long-press delay (ms) before a *touch* pointer arms the drag. Until it
   * elapses a swipe scrolls natively; moving more than {@link TOUCH_SLOP}
   * pixels abandons the pending drag. `0` arms immediately (legacy behavior).
   * Mouse and pen are never delayed.
   */
  readonly mkDragTouchDelay = input(300, { transform: numberAttribute });

  /** Every handle in the projected subtree, including those of nested drags. */
  private readonly handles = contentChildren(MkDragHandle, { descendants: true });

  /**
   * Handles that belong to *this* drag — i.e. whose nearest `[mkDrag]` ancestor
   * is this item, not a nested one. A nested `[mkDropList]`/`[mkDrag]` (a
   * product list inside a draggable category, say) would otherwise have its
   * handles captured by the outer item via `descendants: true`, so pressing an
   * inner handle would start the outer drag and inner dnd would never work.
   */
  protected readonly ownHandles = computed(() =>
    this.handles().filter((h) => h.element.closest('[mkDrag]') === this.element),
  );

  /**
   * The handle that carries the keyboard drag — the first of this item's
   * handles that is focusable on its own (a `<button mkDragHandle>`, say).
   * `null` when the item itself is the keyboard target.
   */
  readonly keyboardHandle = computed<MkDragHandle | null>(
    () => this.ownHandles().find((h) => h.isFocusable()) ?? null,
  );

  /**
   * The role the item itself exposes: `null` when a focusable handle carries
   * the interaction; `option` inside a list that resolved to a `listbox`
   * (`<ul mkDropList>` / `<li mkDrag>`); `button` otherwise.
   */
  protected readonly itemRole = computed<'button' | 'option' | null>(() => {
    if (this.keyboardHandle()) return null;
    return this.home?.role() === 'listbox' ? 'option' : 'button';
  });

  /** The element keyboard events act on: the focusable handle, else the item. */
  private keyboardTarget(): HTMLElement {
    return this.keyboardHandle()?.element ?? this.element;
  }

  /** True while a pointer drag is in progress. */
  protected readonly dragging = signal(false);
  /** True while the item is "picked up" for keyboard movement. */
  protected readonly lifted = signal(false);
  /** True from the moment a touch long-press arms the drag until release. */
  protected readonly armed = signal(false);

  /** Whether the home list lays items out horizontally (scopes touch-action). */
  protected readonly inHorizontalList = computed(
    () => this.home?.mkDropListOrientation() === 'horizontal',
  );

  /** Effective disabled state (item- or list-level). */
  readonly disabled = computed(
    () => this.mkDragDisabled() || (this.home?.mkDropListDisabled() ?? false),
  );

  // --- shared drag session state (only one item is ever active at a time) ---
  private targetList: MkDropList<any> | null = null;
  private targetIndex = 0;
  private homeIndex = 0;
  private placeholder: HTMLElement | null = null;

  // --- pointer session state ---
  private pointerId: number | null = null;
  private started = false;
  private startX = 0;
  private startY = 0;
  private offsetX = 0;
  private offsetY = 0;
  private originLeft = 0;
  private originTop = 0;
  private preview: HTMLElement | null = null;

  constructor() {
    // Mirror the button state onto a focusable handle. Host bindings cannot
    // reach a projected element, so the attributes are written directly; the
    // effect re-runs whenever the handle or the lift/drag state changes.
    effect(() => {
      const handle = this.keyboardHandle();
      if (!handle) return;
      const el = handle.element;
      if (el.tagName !== 'BUTTON') el.setAttribute('role', 'button');
      el.setAttribute('aria-roledescription', 'Draggable item');
      el.setAttribute('aria-grabbed', String(this.dragging() || this.lifted()));
      this.toggleAttr(el, 'aria-pressed', this.lifted() ? 'true' : null);
      this.toggleAttr(el, 'aria-disabled', this.disabled() ? 'true' : null);
    });
  }

  private toggleAttr(el: HTMLElement, name: string, value: string | null): void {
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, value);
  }
  private readonly moveHandler = (e: PointerEvent) => this.onPointerMove(e);
  private readonly upHandler = (e: PointerEvent) => this.onPointerUp(e);
  private readonly cancelHandler = () => this.finishPointer(true);

  // --- touch long-press state ---
  /** Gate for the move handler: mouse/pen arm on pointerdown, touch on timer. */
  private pointerArmed = false;
  private touchTimer: number | null = null;
  /** Inline `touch-action` to restore after a drag locked it (null = not locked). */
  private savedTouchAction: string | null = null;
  /**
   * `touch-action: pan-y` (see drag.scss) keeps native scrolling alive while
   * the long-press is pending, but that also means the browser may still start
   * a scroll once we *are* dragging — so the armed drag must eat `touchmove`.
   * Registered with `passive: false` for `preventDefault` to register.
   */
  private readonly touchMoveHandler = (e: TouchEvent) => {
    if (this.pointerArmed && e.cancelable) e.preventDefault();
  };
  /** Android fires `contextmenu` on long-press — keep it off the gesture. */
  private readonly contextMenuHandler = (e: Event) => e.preventDefault();

  // --- frame-coalesced move state (perf) ------------------------------
  //
  // Every `pointermove` used to force layout O(lists + items) times via
  // getBoundingClientRect. Instead, moves now only record the latest
  // coordinates and schedule ONE rAF (same pattern as the table's column
  // resize); the frame resolves list/index from rects snapshotted at lift
  // and does all style/DOM writes in one pass. The pending frame is flushed
  // synchronously on pointerup so drops land exactly where the pointer ended.

  /** Pending rAF id for the coalesced move pass, if any. */
  private moveRaf: number | null = null;
  private pendingX = 0;
  private pendingY = 0;
  private hasPendingMove = false;
  /** Connected lists resolved once at lift (stable for the drag's duration). */
  private cachedGroup: MkDropList<any>[] = [];
  /** List bounds snapshotted at lift / after invalidation. */
  private readonly listRects = new Map<MkDropList<any>, DOMRect>();
  /** Item bounds per list, aligned with `itemElementsExcept(this)`. */
  private readonly itemRects = new Map<MkDropList<any>, DOMRect[]>();
  /** Lists whose snapshots a placeholder move invalidated (re-measured next frame). */
  private readonly dirtyLists = new Set<MkDropList<any>>();
  /** Any scroll moves everything — re-snapshot every list on the next frame. */
  private scrollDirty = false;
  private readonly scrollHandler = () => {
    this.scrollDirty = true;
  };
  /** Last placeholder sync target — makes `syncPlaceholder` idempotent. */
  private lastSyncList: MkDropList<any> | null = null;
  private lastSyncIndex = -1;

  // ===================================================================
  // Pointer dragging
  // ===================================================================

  protected onPointerDown(event: Event): void {
    const e = event as PointerEvent;
    if (this.disabled() || !this.home || this.lifted()) return;
    if (e.button !== undefined && e.button !== 0) return;
    // Nested drags: a press inside a nested `[mkDrag]` belongs to that item.
    // Without this the event bubbles to the outer item, which would start a
    // second drag and steal the pointer capture from the inner one.
    if (!this.isOwnTarget(e.target)) return;
    if (this.ownHandles().length && !this.isHandleTarget(e.target)) return;

    this.pointerId = e.pointerId;
    this.started = false;
    this.startX = e.clientX;
    this.startY = e.clientY;

    const el = this.element;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already lifted (fast tap) — nothing left to capture.
    }
    el.addEventListener('pointermove', this.moveHandler);
    el.addEventListener('pointerup', this.upHandler);
    el.addEventListener('pointercancel', this.cancelHandler);

    if (e.pointerType === 'touch') {
      el.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
      el.addEventListener('contextmenu', this.contextMenuHandler);
      const delay = this.mkDragTouchDelay();
      if (delay > 0) {
        // Long-press lift: do NOT preventDefault and do NOT arm yet — until
        // the timer fires this press may just be the start of a scroll.
        this.touchTimer =
          this.doc.defaultView?.setTimeout(() => this.armTouch(), delay) ?? null;
      } else {
        // Legacy immediate mode.
        this.pointerArmed = true;
        this.lockTouchAction();
      }
    } else {
      // Mouse / pen: armed immediately, the 5px threshold does the rest.
      this.pointerArmed = true;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.pointerId === null || e.pointerId !== this.pointerId) return;
    if (!this.pointerArmed) {
      // Long-press still pending: real movement means the user is scrolling —
      // abandon the pending drag and leave the gesture to the browser.
      if (Math.hypot(e.clientX - this.startX, e.clientY - this.startY) > TOUCH_SLOP) {
        this.finishPointer(true);
      }
      return;
    }
    if (!this.started) {
      if (Math.hypot(e.clientX - this.startX, e.clientY - this.startY) < DRAG_THRESHOLD) {
        return;
      }
      this.beginPointer();
    }
    e.preventDefault();
    // Only record the coordinates here — the heavy work (hit-testing,
    // placeholder sync, preview transform) is coalesced to one rAF.
    this.pendingX = e.clientX;
    this.pendingY = e.clientY;
    this.hasPendingMove = true;
    this.scheduleMoveFrame();
  }

  /** The long-press delay elapsed with the finger still down — lift. */
  private armTouch(): void {
    this.touchTimer = null;
    this.pointerArmed = true;
    this.armed.set(true);
    // `pan-y` would still let the browser start a vertical scroll mid-drag;
    // lock the element down for the rest of the gesture.
    this.lockTouchAction();
  }

  private lockTouchAction(): void {
    this.savedTouchAction = this.element.style.touchAction;
    this.element.style.touchAction = 'none';
  }

  private unlockTouchAction(): void {
    if (this.savedTouchAction === null) return;
    this.element.style.touchAction = this.savedTouchAction;
    this.savedTouchAction = null;
  }

  /** Undo everything the touch path set up (timer, listeners, lock, class). */
  private clearTouchState(): void {
    const el = this.element;
    el.removeEventListener('touchmove', this.touchMoveHandler);
    el.removeEventListener('contextmenu', this.contextMenuHandler);
    if (this.touchTimer !== null) {
      this.doc.defaultView?.clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }
    this.pointerArmed = false;
    this.armed.set(false);
    this.unlockTouchAction();
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.pointerId === null || e.pointerId !== this.pointerId) return;
    this.finishPointer(!this.started);
  }

  private beginPointer(): void {
    if (!this.home) return;
    this.started = true;
    this.dragging.set(true);
    this.homeIndex = this.home.indexOf(this);
    this.targetList = this.home;
    this.targetIndex = this.homeIndex;

    const rect = this.element.getBoundingClientRect();
    this.originLeft = rect.left;
    this.originTop = rect.top;
    this.offsetX = this.startX - rect.left;
    this.offsetY = this.startY - rect.top;

    this.createPlaceholder(rect);
    this.element.parentNode?.insertBefore(this.placeholder as Node, this.element);
    this.element.style.display = 'none';
    this.createPreview(rect);
    this.home.setReceiving(true);
    // The manual insert above already placed the placeholder at homeIndex.
    this.lastSyncList = this.home;
    this.lastSyncIndex = this.homeIndex;
    // One-time layout snapshot at lift; every move hits the cache instead of
    // forcing layout. Scrolling anywhere invalidates the whole snapshot.
    this.snapshotRects();
    this.doc.addEventListener('scroll', this.scrollHandler, {
      capture: true,
      passive: true,
    });
  }

  /** Coalesce move handling to at most one layout pass per animation frame. */
  private scheduleMoveFrame(): void {
    if (this.moveRaf !== null) return;
    const raf = this.doc.defaultView?.requestAnimationFrame(() => {
      this.moveRaf = null;
      this.applyPendingMove();
    });
    if (raf === undefined) this.applyPendingMove(); // no window — degrade to sync
    else this.moveRaf = raf;
  }

  /**
   * Cancel the scheduled frame; when `apply` is set, process the pending
   * coordinates synchronously (flush-on-end, like the table column resize) so
   * a drop lands exactly where the pointer stopped.
   */
  private flushMoveFrame(apply: boolean): void {
    if (this.moveRaf !== null) {
      this.doc.defaultView?.cancelAnimationFrame(this.moveRaf);
      this.moveRaf = null;
    }
    if (apply) this.applyPendingMove();
    this.hasPendingMove = false;
  }

  /**
   * The per-frame move pass. Ordered reads → writes: refresh invalidated
   * snapshots first, resolve the hovered list/index from the cache, then do
   * all style/DOM writes — no read ever follows a write within the frame.
   */
  private applyPendingMove(): void {
    if (!this.started || !this.hasPendingMove) return;
    this.hasPendingMove = false;
    // Reads: re-measure only what was invalidated since the last frame.
    if (this.scrollDirty) {
      this.scrollDirty = false;
      this.dirtyLists.clear();
      this.snapshotRects();
    } else if (this.dirtyLists.size) {
      for (const list of this.dirtyLists) this.measureList(list);
      this.dirtyLists.clear();
    }
    const x = this.pendingX;
    const y = this.pendingY;
    const list = this.listUnderPoint(x, y) ?? this.targetList;
    const index = list ? this.indexInList(list, x, y) : this.targetIndex;
    // Writes: follow the cursor, then settle the placeholder.
    if (this.preview) {
      const dx = x - this.offsetX - this.originLeft;
      const dy = y - this.offsetY - this.originTop;
      this.preview.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
    if (!list) return;
    if (list !== this.targetList) {
      this.targetList?.setReceiving(false);
      this.targetList = list;
      list.setReceiving(true);
    }
    this.targetIndex = index;
    this.syncPlaceholder();
  }

  private finishPointer(cancel: boolean): void {
    if (this.pointerId !== null) {
      try {
        this.element.releasePointerCapture(this.pointerId);
      } catch {
        /* capture may already be gone */
      }
    }
    const el = this.element;
    el.removeEventListener('pointermove', this.moveHandler);
    el.removeEventListener('pointerup', this.upHandler);
    el.removeEventListener('pointercancel', this.cancelHandler);
    this.pointerId = null;
    this.clearTouchState();

    if (!this.started) return; // was a click, never a drag

    // Flush the last coalesced move (unless cancelling) so the drop target
    // reflects exactly where the pointer ended, not the last painted frame.
    this.flushMoveFrame(!cancel);

    const settle = () => this.commitPointer(cancel);
    if (cancel || this.prefersReducedMotion() || !this.preview) {
      settle();
      return;
    }
    // Animate the preview onto the placeholder, then commit.
    const dest = this.placeholder?.getBoundingClientRect();
    const preview = this.preview;
    if (dest) {
      const dx = dest.left - this.originLeft;
      const dy = dest.top - this.originTop;
      preview.style.transition = `transform ${SETTLE_MS}ms var(--mk-ease-emphasized)`;
      preview.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      let done = false;
      const end = () => {
        if (done) return;
        done = true;
        settle();
      };
      preview.addEventListener('transitionend', end, { once: true });
      this.doc.defaultView?.setTimeout(end, SETTLE_MS + 40);
    } else {
      settle();
    }
  }

  private commitPointer(cancel: boolean): void {
    if (this.destroyed) return;
    const container = this.targetList;
    const previousContainer = this.home;
    const currentIndex = this.targetIndex;
    const previousIndex = this.homeIndex;

    this.cleanupDom();
    this.dragging.set(false);

    if (cancel || !container || !previousContainer) {
      this.announceCancelled('polite');
      return;
    }

    this.emit(previousContainer, container, previousIndex, currentIndex, true);
    this.announceDropped(currentIndex, 'polite');
  }

  // ===================================================================
  // Keyboard dragging (WCAG 2.1.1)
  // ===================================================================

  protected onKeyDown(event: Event): void {
    const e = event as KeyboardEvent;
    const key = e.key;
    // Keys act on the focused item (or its focusable handle) only — a nested
    // item's keydown bubbles up through outer items, which must not pick
    // themselves up, and keys typed into a row's inputs are not drag keys.
    if (e.target !== this.keyboardTarget()) return;

    if (!this.lifted()) {
      if ((key === ' ' || key === 'Enter') && !this.disabled() && this.home && !this.dragging()) {
        e.preventDefault();
        this.pickUp();
      }
      return;
    }

    // Picked up: capture the movement / drop / cancel keys.
    const horizontal = this.targetList?.mkDropListOrientation() === 'horizontal';
    switch (key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        this.dropKeyboard();
        break;
      case 'Escape':
        e.preventDefault();
        this.cancelKeyboard();
        break;
      case 'ArrowUp':
        e.preventDefault();
        horizontal ? this.stepList(-1) : this.stepPrimary(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        horizontal ? this.stepList(1) : this.stepPrimary(1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        horizontal ? this.stepPrimary(-1) : this.stepList(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        horizontal ? this.stepPrimary(1) : this.stepList(1);
        break;
      default:
        break;
    }
  }

  protected onFocusOut(event: Event): void {
    // Losing focus mid-lift cancels the keyboard drag to avoid a stuck state.
    // `focusout` bubbles, so only the keyboard target's own blur counts — a
    // nested control losing focus must not cancel the outer item's lift.
    if (event.target !== this.keyboardTarget()) return;
    if (this.lifted()) this.cancelKeyboard();
  }

  private pickUp(): void {
    if (!this.home) return;
    this.lifted.set(true);
    this.homeIndex = this.home.indexOf(this);
    this.targetList = this.home;
    this.targetIndex = this.homeIndex;

    const rect = this.element.getBoundingClientRect();
    this.createPlaceholder(rect);
    this.home.setReceiving(true);
    // Fresh placeholder — force the first sync through the idempotence guard.
    this.lastSyncList = null;
    this.lastSyncIndex = -1;
    this.syncPlaceholder();

    this.announcePickedUp(this.homeIndex, this.home.size());
  }

  private stepPrimary(step: 1 | -1): void {
    const list = this.targetList;
    if (!list) return;
    const max = this.maxIndex(list);
    let idx = this.targetIndex + step;
    if (idx < 0) {
      const prev = this.adjacentList(list, -1);
      if (prev) return this.moveToList(prev, this.maxIndex(prev), true);
      idx = 0;
    } else if (idx > max) {
      const next = this.adjacentList(list, 1);
      if (next) return this.moveToList(next, 0, true);
      idx = max;
    }
    if (idx === this.targetIndex) return;
    this.targetIndex = idx;
    this.syncPlaceholder();
    this.announceMove(false);
  }

  private stepList(step: 1 | -1): void {
    const list = this.targetList;
    if (!list) return;
    const adj = this.adjacentList(list, step);
    if (!adj) return;
    this.moveToList(adj, Math.min(this.targetIndex, this.maxIndex(adj)), true);
  }

  private moveToList(list: MkDropList<any>, index: number, crossed: boolean): void {
    this.targetList?.setReceiving(false);
    this.targetList = list;
    this.targetIndex = index;
    list.setReceiving(true);
    this.syncPlaceholder();
    this.announceMove(crossed);
  }

  private dropKeyboard(): void {
    const container = this.targetList;
    const previousContainer = this.home;
    const currentIndex = this.targetIndex;
    const previousIndex = this.homeIndex;

    this.cleanupDom();
    this.lifted.set(false);

    if (!container || !previousContainer) return;
    this.emit(previousContainer, container, previousIndex, currentIndex, false);
    this.announceDropped(currentIndex, 'assertive');
  }

  private cancelKeyboard(): void {
    this.cleanupDom();
    this.lifted.set(false);
    this.announceCancelled('assertive');
  }

  // ===================================================================
  // Screen-reader announcements
  //
  // All user-facing strings come from MK_I18N so consumers can localize them.
  // ===================================================================

  /** "Picked up…" instructions when a keyboard drag starts. */
  private announcePickedUp(index: number, total: number): void {
    this.announcer.announce(this.i18n.dndPickedUp(index + 1, total), 'assertive');
  }

  /** Position update after each keyboard step (names the list when crossing). */
  private announceMove(crossed: boolean): void {
    const list = this.targetList;
    if (!list) return;
    const total = list === this.home ? list.size() : list.size() + 1;
    this.announcer.announce(
      crossed
        ? this.i18n.dndMovedToList(list.label(), this.targetIndex + 1, total)
        : this.i18n.dndMoved(this.targetIndex + 1, total),
      'assertive',
    );
  }

  /** Confirmation after a successful drop (pointer: polite; keyboard: assertive). */
  private announceDropped(index: number, politeness: 'polite' | 'assertive'): void {
    this.announcer.announce(this.i18n.dndDropped(index + 1), politeness);
  }

  /** The drag was cancelled and the item snapped back. */
  private announceCancelled(politeness: 'polite' | 'assertive'): void {
    this.announcer.announce(this.i18n.dndCancelled, politeness);
  }

  // ===================================================================
  // Shared helpers
  // ===================================================================

  /** Highest valid target index for `list` given the item is being removed. */
  private maxIndex(list: MkDropList<any>): number {
    return list === this.home ? Math.max(0, list.size() - 1) : list.size();
  }

  private adjacentList(list: MkDropList<any>, step: 1 | -1): MkDropList<any> | null {
    const group = this.registry.connectedGroup(list);
    const i = group.indexOf(list);
    const target = group[i + step];
    return target ?? null;
  }

  /** Snapshot every connected list's bounds + item bounds (at lift / scroll). */
  private snapshotRects(): void {
    this.cachedGroup = this.home ? this.registry.connectedGroup(this.home) : [];
    this.listRects.clear();
    this.itemRects.clear();
    for (const list of this.cachedGroup) this.measureList(list);
  }

  /** (Re)measure one list's bounds and item bounds into the cache. */
  private measureList(list: MkDropList<any>): void {
    this.listRects.set(list, list.element.getBoundingClientRect());
    this.itemRects.set(
      list,
      list.itemElementsExcept(this).map((el) => el.getBoundingClientRect()),
    );
  }

  /**
   * Which connected list (if any) the pointer is currently over. Pointer path
   * only — reads the rects snapshotted at lift, not live layout.
   */
  private listUnderPoint(x: number, y: number): MkDropList<any> | null {
    // Every candidate whose bounds contain the point. Lists nested inside the
    // dragged item itself are never targets (an item cannot be dropped into
    // its own descendants).
    const hits: MkDropList<any>[] = [];
    for (const list of this.cachedGroup) {
      if (list.element !== this.element && this.element.contains(list.element)) continue;
      const r = this.listRects.get(list) ?? list.element.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) hits.push(list);
    }
    if (hits.length <= 1) return hits[0] ?? null;
    // Nested lists: the innermost hit wins — the one that contains no other hit.
    return (
      hits.find((list) => !hits.some((other) => other !== list && list.element.contains(other.element))) ??
      hits[0]
    );
  }

  /**
   * Insertion index for the pointer position within `list`. Pointer path only
   * — reads the cached item rects (live measurement is the fallback for a
   * list that somehow joined the group mid-drag).
   */
  private indexInList(list: MkDropList<any>, x: number, y: number): number {
    const rects =
      this.itemRects.get(list) ??
      list.itemElementsExcept(this).map((el) => el.getBoundingClientRect());
    const horizontal = list.mkDropListOrientation() === 'horizontal';
    const pos = horizontal ? x : y;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
      if (pos < mid) return i;
    }
    return rects.length;
  }

  private syncPlaceholder(): void {
    const list = this.targetList;
    const ph = this.placeholder;
    if (!list || !ph) return;
    // Idempotent: same list and index → the placeholder is already in place.
    if (list === this.lastSyncList && this.targetIndex === this.lastSyncIndex) {
      return;
    }
    const prevList = this.lastSyncList;
    this.lastSyncList = list;
    this.lastSyncIndex = this.targetIndex;
    const items = list.itemElementsExcept(this);
    ph.remove();
    if (this.targetIndex >= items.length) {
      if (items.length) items[items.length - 1].after(ph);
      else list.element.appendChild(ph);
    } else {
      items[this.targetIndex].before(ph);
    }
    // Moving the placeholder shifted the affected lists' layout — re-measure
    // just those lists on the next frame (no-op for the cache-less keyboard path).
    this.dirtyLists.add(list);
    if (prevList && prevList !== list) this.dirtyLists.add(prevList);
  }

  private createPlaceholder(rect: DOMRect): void {
    const ph = this.doc.createElement('div');
    ph.className = 'mk-drop-placeholder';
    ph.setAttribute('aria-hidden', 'true');
    const s = ph.style;
    s.boxSizing = 'border-box';
    s.width = `${rect.width}px`;
    s.height = `${rect.height}px`;
    s.border = 'var(--mk-border-width-strong) dashed var(--mk-primary)';
    s.borderRadius = 'var(--mk-radius-md)';
    s.background = 'color-mix(in srgb, var(--mk-primary) 8%, transparent)';
    this.placeholder = ph;
  }

  private createPreview(rect: DOMRect): void {
    const clone = this.element.cloneNode(true) as HTMLElement;
    clone.classList.add('mk-drag-preview');
    clone.removeAttribute('tabindex');
    clone.setAttribute('aria-hidden', 'true');
    const s = clone.style;
    s.display = '';
    s.position = 'fixed';
    s.margin = '0';
    s.left = `${rect.left}px`;
    s.top = `${rect.top}px`;
    s.width = `${rect.width}px`;
    s.height = `${rect.height}px`;
    s.pointerEvents = 'none';
    s.zIndex = 'var(--mk-z-tooltip)';
    s.boxShadow = 'var(--mk-shadow-lg)';
    s.borderRadius = 'var(--mk-radius-md)';
    s.transform = 'translate3d(0, 0, 0)';
    this.doc.body.appendChild(clone);
    this.preview = clone;
  }

  /** Remove the body-level preview + placeholder if destroyed mid-drag. */
  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.pointerId !== null) {
      try {
        this.element.releasePointerCapture(this.pointerId);
      } catch {
        /* capture may already be gone */
      }
      this.pointerId = null;
    }
    this.clearTouchState();
    this.cleanupDom();
  }

  private destroyed = false;

  private cleanupDom(): void {
    this.flushMoveFrame(false); // drop any scheduled frame, never apply it
    this.doc.removeEventListener('scroll', this.scrollHandler, { capture: true });
    this.placeholder?.remove();
    this.placeholder = null;
    this.preview?.remove();
    this.preview = null;
    this.element.style.display = '';
    this.home?.setReceiving(false);
    this.targetList?.setReceiving(false);
    this.cachedGroup = [];
    this.listRects.clear();
    this.itemRects.clear();
    this.dirtyLists.clear();
    this.scrollDirty = false;
    this.lastSyncList = null;
    this.lastSyncIndex = -1;
  }

  private emit(
    previousContainer: MkDropList<any>,
    container: MkDropList<any>,
    previousIndex: number,
    currentIndex: number,
    isPointerEvent: boolean,
  ): void {
    const event: MkDropEvent<any> = {
      previousIndex,
      currentIndex,
      item: this as MkDrag<any>,
      previousContainer,
      container,
      isPointerEvent,
    };
    container.emitDrop(event);
  }

  private isHandleTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Node)) return false;
    return this.ownHandles().some((h) => h.element.contains(target));
  }

  /** Whether `target` belongs to this item rather than to a nested `[mkDrag]`. */
  private isOwnTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return target === this.element;
    return target.closest('[mkDrag]') === this.element;
  }

  private prefersReducedMotion(): boolean {
    return (
      this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')
        .matches ?? false
    );
  }
}
