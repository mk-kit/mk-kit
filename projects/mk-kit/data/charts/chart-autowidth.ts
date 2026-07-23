import {
  DestroyRef,
  ElementRef,
  Signal,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

/**
 * Track the host element's width so a chart's viewBox can match the box it is
 * actually rendered into.
 *
 * Why this exists: the charts draw into a `viewBox` and the stylesheet sets
 * `width: 100%; height: auto`, so the rendered height was
 * `containerWidth × (viewBoxHeight / viewBoxWidth)` — unbounded. A full-width
 * chart on a wide monitor grew to over 2000px tall. Capping the height instead
 * is not a fix: `preserveAspectRatio="xMidYMid meet"` then letterboxes the plot
 * into a narrow band with empty margins either side.
 *
 * Measuring the host and re-deriving the viewBox width keeps `height` meaning
 * exactly what it says (pixels) while the drawing fills the available width.
 *
 * SSR-safe: with no `ResizeObserver` (or before first render) the caller's
 * declared `width` is used unchanged, so server output is deterministic.
 *
 * Must be called from an injection context (field initialiser).
 */
export function mkChartAutoWidth(fallback: Signal<number>): Signal<number> {
  const host = inject(ElementRef<HTMLElement>);
  const destroyRef = inject(DestroyRef);
  const measured = signal<number | null>(null);

  afterNextRender(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const el = host.nativeElement;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      // Ignore a collapsed/hidden host — keeping the previous width avoids a
      // degenerate viewBox while the chart is inside a closed tab or panel.
      if (w > 0) measured.set(w);
    });
    ro.observe(el);
    destroyRef.onDestroy(() => ro.disconnect());
  });

  return computed(() => measured() ?? fallback());
}
