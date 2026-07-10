import {
  AfterViewInit,
  DOCUMENT,
  Directive,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MkPlacement } from '../types';

/** Options controlling {@link mkComputeAnchoredPosition}. */
export interface MkAnchoredPositionOptions {
  placement: MkPlacement;
  gap: number;
  flip: boolean;
  clamp: boolean;
}

interface MkRectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface MkSize {
  width: number;
  height: number;
}

/** Resolved coordinates (viewport-relative, for `position: fixed`). */
export interface MkAnchoredPosition {
  top: number;
  left: number;
  /** The placement actually used after any flip. */
  placement: MkPlacement;
}

function sideOf(placement: MkPlacement): 'top' | 'bottom' | 'left' | 'right' {
  if (placement.startsWith('top')) return 'top';
  if (placement.startsWith('bottom')) return 'bottom';
  return placement as 'left' | 'right';
}

function alignOf(placement: MkPlacement): 'start' | 'center' | 'end' {
  if (placement.endsWith('-start')) return 'start';
  if (placement.endsWith('-end')) return 'end';
  return 'center';
}

/**
 * Pure viewport-positioning maths shared by every anchored overlay
 * ({@link MkAnchoredPanel} and the tooltip). Given the anchor rect, the panel
 * size and the viewport size, returns the top/left for a `position: fixed`
 * panel — flipping to the opposite side when it would overflow and clamping
 * back inside the viewport.
 */
export function mkComputeAnchoredPosition(
  anchor: MkRectLike,
  panel: MkSize,
  viewport: MkSize,
  opts: MkAnchoredPositionOptions,
): MkAnchoredPosition {
  const { gap, flip, clamp } = opts;
  let side = sideOf(opts.placement);
  const align = alignOf(opts.placement);
  const { width: w, height: h } = panel;
  const { width: vw, height: vh } = viewport;

  // Vertical flip for top/bottom placements.
  if (flip && (side === 'top' || side === 'bottom')) {
    const fitsBelow = anchor.bottom + gap + h <= vh;
    const fitsAbove = anchor.top - gap - h >= 0;
    if (side === 'bottom' && !fitsBelow && fitsAbove) side = 'top';
    else if (side === 'top' && !fitsAbove && fitsBelow) side = 'bottom';
  }
  // Horizontal flip for left/right placements.
  if (flip && (side === 'left' || side === 'right')) {
    const fitsRight = anchor.right + gap + w <= vw;
    const fitsLeft = anchor.left - gap - w >= 0;
    if (side === 'right' && !fitsRight && fitsLeft) side = 'left';
    else if (side === 'left' && !fitsLeft && fitsRight) side = 'right';
  }

  let top = 0;
  let left = 0;

  if (side === 'bottom') top = anchor.bottom + gap;
  else if (side === 'top') top = anchor.top - h - gap;
  else if (side === 'right') left = anchor.right + gap;
  else left = anchor.left - w - gap;

  if (side === 'top' || side === 'bottom') {
    // Cross axis is horizontal.
    if (align === 'start') left = anchor.left;
    else if (align === 'end') left = anchor.right - w;
    else left = anchor.left + anchor.width / 2 - w / 2;
  } else {
    // Left/right: centre on the cross (vertical) axis.
    top = anchor.top + anchor.height / 2 - h / 2;
  }

  if (clamp) {
    left = Math.max(gap, Math.min(left, vw - w - gap));
    top = Math.max(gap, Math.min(top, vh - h - gap));
  }

  return { top: Math.round(top), left: Math.round(left), placement: `${side}${align === 'center' ? '' : `-${align}`}` as MkPlacement };
}

/**
 * Anchored-overlay directive. Apply it to a floating panel element (a dropdown
 * list, calendar, menu, …) that is rendered inside its component's own template
 * — typically inside an `@if (open()) { … }` block. On init the directive
 * **teleports the panel to `document.body` and into the browser top layer** via
 * the native Popover API (`popover="manual"` + `showPopover()`), then positions
 * it against the anchor with `position: fixed`. Because the element stays part
 * of the component's Angular view, all bindings, `@for` content, events and
 * projected content keep working after the move.
 *
 * The top layer is immune to ancestor `overflow`, `transform` and `z-index`
 * stacking contexts, so the panel can never be clipped by a container or hidden
 * behind sibling content. Where the Popover API is unavailable the panel still
 * renders in a `document.body` portal with a `z-index` fallback.
 *
 * ```html
 * <ul #panel mkAnchoredPanel [mkAnchoredPanelFor]="trigger" [matchWidth]="true"
 *     (dismiss)="close()"> … </ul>
 * ```
 */
@Directive({
  selector: '[mkAnchoredPanel]',
  exportAs: 'mkAnchoredPanel',
})
export class MkAnchoredPanel implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The trigger element to position against. */
  readonly anchor = input<HTMLElement | ElementRef<HTMLElement> | undefined>(
    undefined,
    { alias: 'mkAnchoredPanelFor' },
  );
  /** Viewport-point anchor (e.g. a right-click position) — takes precedence. */
  readonly anchorRect = input<{ x: number; y: number } | undefined>(undefined);
  /** Preferred placement relative to the anchor. */
  readonly placement = input<MkPlacement>('bottom-start');
  /** Distance in px between the anchor and the panel. */
  readonly gap = input(4);
  /** Set the panel's `min-width` to the anchor's width (dropdowns). */
  readonly matchWidth = input(false);
  /** Flip to the opposite side when the preferred side would overflow. */
  readonly flip = input(true);
  /** Clamp the panel inside the viewport. */
  readonly clamp = input(true);

  /** Emitted on an outside pointerdown or when the window loses focus. */
  readonly dismiss = output<void>();

  private popover = false;

  private repositionRaf: number | null = null;
  /** rAF-coalesced repositioning — at most one layout pass per frame. */
  private readonly onReposition = () => {
    if (this.repositionRaf != null) return;
    this.repositionRaf =
      this.document.defaultView?.requestAnimationFrame(() => {
        this.repositionRaf = null;
        this.position();
      }) ?? null;
  };
  private readonly onDocPointerdown = (e: Event) => {
    const target = e.target as Node;
    if (this.host.nativeElement.contains(target)) return;
    const anchorEl = this.resolveAnchorEl();
    if (anchorEl?.contains(target)) return;
    this.dismiss.emit();
  };
  private readonly onWindowBlur = () => this.dismiss.emit();

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;

    el.style.position = 'fixed';
    el.style.margin = '0';
    el.style.inset = 'auto';
    // setProperty (not .style.zIndex) so the CSS var() value is accepted. Only
    // matters in the no-Popover fallback; the top layer ignores z-index.
    el.style.setProperty('z-index', 'var(--mk-z-menu)');

    this.document.body.appendChild(el);

    // Promote into the top layer when the Popover API is available.
    const withPopover = el as HTMLElement & {
      showPopover?: () => void;
      hidePopover?: () => void;
    };
    if (typeof withPopover.showPopover === 'function') {
      el.setAttribute('popover', 'manual');
      try {
        withPopover.showPopover();
        this.popover = true;
      } catch {
        // Already open or unsupported context — fall back to the body portal.
        this.popover = false;
      }
    }

    this.position();

    const view = this.document.defaultView;
    view?.addEventListener('scroll', this.onReposition, true);
    view?.addEventListener('resize', this.onReposition);
    view?.addEventListener('blur', this.onWindowBlur);
    this.document.addEventListener('pointerdown', this.onDocPointerdown, true);

    // Re-measure once layout has settled (fonts, async content).
    view?.requestAnimationFrame(() => this.position());
  }

  /** Recompute and apply the panel position. Safe to call at any time. */
  position(): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;
    const view = this.document.defaultView;
    if (!view) return;

    const anchor = this.resolveAnchorRect();
    if (!anchor) return;

    if (this.matchWidth() && anchor.width > 0) {
      el.style.minWidth = `${Math.round(anchor.width)}px`;
    }

    const rect = el.getBoundingClientRect();
    const pos = mkComputeAnchoredPosition(
      anchor,
      { width: rect.width, height: rect.height },
      {
        width: this.document.documentElement.clientWidth,
        height: this.document.documentElement.clientHeight,
      },
      {
        placement: this.placement(),
        gap: this.gap(),
        flip: this.flip(),
        clamp: this.clamp(),
      },
    );
    el.style.top = `${pos.top}px`;
    el.style.left = `${pos.left}px`;
    el.setAttribute('data-placement', pos.placement);
  }

  private resolveAnchorEl(): HTMLElement | null {
    const a = this.anchor();
    if (!a) return null;
    return a instanceof ElementRef ? a.nativeElement : a;
  }

  private resolveAnchorRect(): MkRectLike | null {
    const point = this.anchorRect();
    if (point) {
      return {
        top: point.y,
        left: point.x,
        right: point.x,
        bottom: point.y,
        width: 0,
        height: 0,
      };
    }
    return this.resolveAnchorEl()?.getBoundingClientRect() ?? null;
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    const el = this.host.nativeElement;
    const view = this.document.defaultView;
    if (this.repositionRaf != null) {
      view?.cancelAnimationFrame(this.repositionRaf);
      this.repositionRaf = null;
    }
    view?.removeEventListener('scroll', this.onReposition, true);
    view?.removeEventListener('resize', this.onReposition);
    view?.removeEventListener('blur', this.onWindowBlur);
    this.document.removeEventListener('pointerdown', this.onDocPointerdown, true);

    const withPopover = el as HTMLElement & { hidePopover?: () => void };
    if (this.popover && typeof withPopover.hidePopover === 'function') {
      try {
        withPopover.hidePopover();
      } catch {
        // Ignore — the element may already be disconnected.
      }
      el.removeAttribute('popover');
    }

    // Remove the teleported node ourselves. It was moved out of the component's
    // view into `document.body`, so Angular's view teardown removes it by
    // reference (`node.remove()`); re-inserting it anywhere would orphan a
    // detached copy, leaking one panel per open/close cycle. A plain remove is
    // idempotent whichever teardown step runs first.
    el.remove();
  }
}
