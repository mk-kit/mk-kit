import { DOCUMENT, DestroyRef, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Tap-to-pin controller for chart hover tooltips — the touch path for UI that
 * is otherwise hover-only. Returned by {@link mkChartTapPin}.
 */
export interface MkChartTapPin<K> {
  /** Whether the tooltip is currently pinned by a tap. */
  isPinned(): boolean;
  /**
   * Pin the tooltip on `key`. Call from `pointerdown` on a hit target with the
   * original event — only `touch` pointers pin (mouse keeps its pure
   * hover-in/hover-out behaviour). Tapping another hit target moves the pin;
   * a pointerdown outside the chart clears it.
   */
  pin(key: K, event: PointerEvent): void;
  /**
   * Transient hover update from `pointerenter`/`pointerleave`. Enters always
   * apply; a leave (`null`) is ignored while pinned, so lifting the finger —
   * or a mouse straying off the chart — cannot dismiss a pinned tooltip.
   */
  hover(key: K | null): void;
}

/**
 * Creates a tap-to-pin controller for a chart's hover state. Must be called in
 * an injection context (a field initializer). `apply` receives the hover key to
 * set, or `null` to clear.
 *
 * While pinned, a capture-phase `pointerdown` listener on the document watches
 * for taps outside the chart host and clears the pin (listener added on pin,
 * removed on clear/destroy — SSR-safe: never attached on the server).
 */
export function mkChartTapPin<K>(apply: (key: K | null) => void): MkChartTapPin<K> {
  const documentRef = inject(DOCUMENT);
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  let pinned = false;

  const detach = (): void => {
    if (!pinned) return;
    pinned = false;
    documentRef.removeEventListener('pointerdown', onDocumentPointerdown, true);
  };

  const onDocumentPointerdown = (event: Event): void => {
    // Taps inside the chart move the pin via the hit target's own handler.
    if (host.contains(event.target as Node)) return;
    detach();
    apply(null);
  };

  inject(DestroyRef).onDestroy(detach);

  return {
    isPinned: () => pinned,

    pin(key: K, event: PointerEvent): void {
      if (event.pointerType !== 'touch') return;
      apply(key);
      if (pinned || !isBrowser) return;
      pinned = true;
      documentRef.addEventListener('pointerdown', onDocumentPointerdown, true);
    },

    hover(key: K | null): void {
      if (key === null && pinned) return;
      apply(key);
    },
  };
}
