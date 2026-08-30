/**
 * Viewport-anchored positioning maths — the pure core of every mk-kit
 * anchored overlay (dropdowns, menus, tooltips, popovers). Framework-free:
 * rects and sizes in, `position: fixed` coordinates out.
 */

/** Common placement values for anchored overlays (menus, tooltips, popovers). */
export type MkPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/** Options controlling {@link mkComputeAnchoredPosition}. */
export interface MkAnchoredPositionOptions {
  placement: MkPlacement;
  gap: number;
  flip: boolean;
  clamp: boolean;
  /** Resolve `-start`/`-end` alignment against a right-to-left anchor. */
  rtl?: boolean;
}

interface MkRectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface MkDimensions {
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

/**
 * Never shrink a panel below this via the viewport size cap — a sub-120px
 * dropdown is unusable; at that point overflowing beats collapsing.
 */
const MIN_SIZE_CAP = 120;

function sideOf(placement: MkPlacement): 'top' | 'bottom' | 'left' | 'right' {
  if (placement.startsWith('top')) return 'top';
  if (placement.startsWith('bottom')) return 'bottom';
  return placement.startsWith('left') ? 'left' : 'right';
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
  panel: MkDimensions,
  viewport: MkDimensions,
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
    // Cross axis is horizontal; in RTL, inline-start is the anchor's right edge.
    const startLeft = opts.rtl ? anchor.right - w : anchor.left;
    const endLeft = opts.rtl ? anchor.left : anchor.right - w;
    if (align === 'start') left = startLeft;
    else if (align === 'end') left = endLeft;
    else left = anchor.left + anchor.width / 2 - w / 2;
  } else {
    // Left/right: the cross axis is vertical. `-start` tops the panel with the
    // anchor (a submenu beside its item), `-end` bottoms it, else centre.
    if (align === 'start') top = anchor.top;
    else if (align === 'end') top = anchor.bottom - h;
    else top = anchor.top + anchor.height / 2 - h / 2;
  }

  if (clamp) {
    left = Math.max(gap, Math.min(left, vw - w - gap));
    top = Math.max(gap, Math.min(top, vh - h - gap));
  }

  return { top: Math.round(top), left: Math.round(left), placement: `${side}${align === 'center' ? '' : `-${align}`}` as MkPlacement };
}
