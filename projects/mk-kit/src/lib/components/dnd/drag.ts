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
  inject,
  input,
  signal,
} from '@angular/core';
import { MkLiveAnnouncer } from '../../core/a11y/live-announcer.service';
import { MkDragDropRegistry } from './drag-drop-registry';
import { MkDragHandle } from './drag-handle';
import { MkDropList } from './drop-list';
import type { MkDropEvent } from './drag-drop.types';

/** Pixels the pointer must travel before a press turns into a drag. */
const DRAG_THRESHOLD = 5;
/** Settle animation duration for the pointer preview (ms). */
const SETTLE_MS = 180;

/**
 * Makes an item inside a `[mkDropList]` draggable — by pointer (mouse / touch /
 * pen) **and** by keyboard (WCAG 2.1.1). The item is focusable, exposes
 * `role="button"` + `aria-roledescription="Draggable item"`, and every move is
 * announced via {@link MkLiveAnnouncer}.
 *
 * Keyboard: focus an item and press **Space/Enter** to pick it up, **Arrow**
 * keys to move it (crossing into connected lists at the ends / across the
 * perpendicular axis), **Space/Enter** to drop, **Escape** to cancel.
 *
 * ```html
 * <li mkDrag [mkDragData]="row" [mkDragDisabled]="row.locked">
 *   <span mkDragHandle aria-hidden="true">⠿</span> {{ row.title }}
 * </li>
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
    role: 'button',
    'aria-roledescription': 'Draggable item',
    draggable: 'false',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-pressed]': 'lifted() || null',
    '[attr.aria-grabbed]': 'dragging() || lifted()',
    '[class.mk-drag--disabled]': 'disabled()',
    '[class.mk-drag--dragging]': 'dragging()',
    '[class.mk-drag--lifted]': 'lifted()',
    '[class.mk-drag--has-handle]': 'handles().length > 0',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeyDown($event)',
    '(blur)': 'onBlur()',
  },
})
export class MkDrag<T = unknown> {
  private readonly doc = inject(DOCUMENT);
  private readonly registry = inject(MkDragDropRegistry);
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly home = inject(MkDropList, { optional: true }) as
    | MkDropList<any>
    | null;

  /** The item's host element. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Arbitrary payload associated with this item. */
  readonly mkDragData = input<T>();

  /** Disable dragging this specific item. */
  readonly mkDragDisabled = input(false, { transform: booleanAttribute });

  /** Handles inside this item; if any exist, drags must start on one. */
  protected readonly handles = contentChildren(MkDragHandle, { descendants: true });

  /** True while a pointer drag is in progress. */
  protected readonly dragging = signal(false);
  /** True while the item is "picked up" for keyboard movement. */
  protected readonly lifted = signal(false);

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
  private readonly moveHandler = (e: PointerEvent) => this.onPointerMove(e);
  private readonly upHandler = (e: PointerEvent) => this.onPointerUp(e);
  private readonly cancelHandler = () => this.finishPointer(true);

  // ===================================================================
  // Pointer dragging
  // ===================================================================

  protected onPointerDown(event: Event): void {
    const e = event as PointerEvent;
    if (this.disabled() || !this.home || this.lifted()) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (this.handles().length && !this.isHandleTarget(e.target)) return;

    this.pointerId = e.pointerId;
    this.started = false;
    this.startX = e.clientX;
    this.startY = e.clientY;

    const el = this.element;
    el.setPointerCapture(e.pointerId);
    el.addEventListener('pointermove', this.moveHandler);
    el.addEventListener('pointerup', this.upHandler);
    el.addEventListener('pointercancel', this.cancelHandler);
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.pointerId === null || e.pointerId !== this.pointerId) return;
    if (!this.started) {
      if (Math.hypot(e.clientX - this.startX, e.clientY - this.startY) < DRAG_THRESHOLD) {
        return;
      }
      this.beginPointer();
    }
    e.preventDefault();
    this.updatePointer(e.clientX, e.clientY);
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
  }

  private updatePointer(clientX: number, clientY: number): void {
    // Follow the cursor.
    if (this.preview) {
      const dx = clientX - this.offsetX - this.originLeft;
      const dy = clientY - this.offsetY - this.originTop;
      this.preview.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
    // Resolve which connected list the pointer is over.
    const list = this.listUnderPoint(clientX, clientY) ?? this.targetList;
    if (!list) return;
    if (list !== this.targetList) {
      this.targetList?.setReceiving(false);
      this.targetList = list;
      list.setReceiving(true);
    }
    this.targetIndex = this.indexInList(list, clientX, clientY);
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

    if (!this.started) return; // was a click, never a drag

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
    const container = this.targetList;
    const previousContainer = this.home;
    const currentIndex = this.targetIndex;
    const previousIndex = this.homeIndex;

    this.cleanupDom();
    this.dragging.set(false);

    if (cancel || !container || !previousContainer) {
      this.announcer.announce('Movement cancelled. Item returned to its starting position.');
      return;
    }

    this.emit(previousContainer, container, previousIndex, currentIndex, true);
    this.announcer.announce(`Dropped at position ${currentIndex + 1}.`);
  }

  // ===================================================================
  // Keyboard dragging (WCAG 2.1.1)
  // ===================================================================

  protected onKeyDown(event: Event): void {
    const e = event as KeyboardEvent;
    const key = e.key;

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

  protected onBlur(): void {
    // Losing focus mid-lift cancels the keyboard drag to avoid a stuck state.
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
    this.syncPlaceholder();

    const total = this.home.size();
    this.announcer.announce(
      `Picked up. Item ${this.homeIndex + 1} of ${total}. ` +
        `Use the arrow keys to move, space or enter to drop, escape to cancel.`,
      'assertive',
    );
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
    this.announcer.announce(`Dropped at position ${currentIndex + 1}.`, 'assertive');
  }

  private cancelKeyboard(): void {
    this.cleanupDom();
    this.lifted.set(false);
    this.announcer.announce(
      'Movement cancelled. Item returned to its starting position.',
      'assertive',
    );
  }

  private announceMove(crossed: boolean): void {
    const list = this.targetList;
    if (!list) return;
    const total = list === this.home ? list.size() : list.size() + 1;
    const pos = `position ${this.targetIndex + 1} of ${total}`;
    this.announcer.announce(
      crossed ? `Moved to list ${list.id()}, ${pos}.` : `Moved to ${pos}.`,
      'assertive',
    );
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

  /** Which connected list (if any) the pointer is currently over. */
  private listUnderPoint(x: number, y: number): MkDropList<any> | null {
    if (!this.home) return null;
    const group = this.registry.connectedGroup(this.home);
    // Prefer a deeper/closer match by checking the current target first.
    for (const list of group) {
      const r = list.element.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return list;
    }
    return null;
  }

  /** Insertion index for the pointer position within `list`. */
  private indexInList(list: MkDropList<any>, x: number, y: number): number {
    const items = list.itemElementsExcept(this);
    const horizontal = list.mkDropListOrientation() === 'horizontal';
    const pos = horizontal ? x : y;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
      if (pos < mid) return i;
    }
    return items.length;
  }

  private syncPlaceholder(): void {
    const list = this.targetList;
    const ph = this.placeholder;
    if (!list || !ph) return;
    const items = list.itemElementsExcept(this);
    ph.remove();
    if (this.targetIndex >= items.length) {
      if (items.length) items[items.length - 1].after(ph);
      else list.element.appendChild(ph);
    } else {
      items[this.targetIndex].before(ph);
    }
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

  private cleanupDom(): void {
    this.placeholder?.remove();
    this.placeholder = null;
    this.preview?.remove();
    this.preview = null;
    this.element.style.display = '';
    this.home?.setReceiving(false);
    this.targetList?.setReceiving(false);
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
    return this.handles().some((h) => h.element.contains(target));
  }

  private prefersReducedMotion(): boolean {
    return (
      this.doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)')
        .matches ?? false
    );
  }
}
