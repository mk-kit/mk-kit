import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  type OnDestroy,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '@mk-kit/ui/core';
import { MK_I18N, mkUniqueId } from '@mk-kit/ui/core';
import { MkFormField } from '../form-field/form-field';

/** One drawn stroke: pointer positions in CSS pixels. */
type Stroke = { x: number; y: number }[];

/**
 * SignaturePad — a canvas the user draws a signature on (pointer, touch or
 * pen). Strokes are captured as smoothed polylines, rendered crisp on hi-DPI
 * screens and re-drawn losslessly when the pad resizes. The form value is a
 * PNG data-URL of the drawing (`null` while empty), so it drops straight into
 * an `<img>`, a form post or an upload.
 *
 * A Clear control resets the pad (also available as `clear()`); `isEmpty()`
 * reports whether anything is drawn. Programmatic values (`writeValue`,
 * `[value]`) are painted onto the canvas as an image.
 *
 * Drawing is inherently pointer-based; pair the pad with an alternative flow
 * (e.g. a typed-name checkbox) where WCAG requires a keyboard equivalent.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so
 * `[(ngModel)]`, reactive forms and `[(value)]` all work.
 *
 * ```html
 * <mk-signature-pad [(ngModel)]="signature" />
 * <img [src]="signature" alt="Captured signature" />
 * ```
 */
@Component({
  selector: 'mk-signature-pad',
  templateUrl: './signature-pad.html',
  styleUrl: './signature-pad.scss',
  exportAs: 'mkSignaturePad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-signature-pad',
    '[class.mk-signature-pad--invalid]': 'isInvalid()',
    '[class.mk-signature-pad--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkSignaturePad),
      multi: true,
    },
  ],
})
export class MkSignaturePad implements ControlValueAccessor, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly field = inject(MkFormField, { optional: true });
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  /** Stroke width in CSS pixels. */
  readonly strokeWidth = input(2, { transform: numberAttribute });
  /** Pad height in CSS pixels (width follows the container). */
  readonly height = input(160, { transform: numberAttribute });
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Two-way PNG data-URL of the signature (`null` while empty). */
  readonly value = model<string | null>(null);
  /** Emits when the pad is cleared (via the button or `clear()`). */
  readonly cleared = output<void>();

  private readonly strokes: Stroke[] = [];
  private current: Stroke | null = null;
  /**
   * Per-gesture cache: canvas rect, devicePixelRatio and stroke color are
   * read once at pointerdown so pointermove does no layout/style reads.
   * Refreshed on a mid-stroke resize, dropped at pointerup/cancel.
   */
  private gesture: { rect: DOMRect; dpr: number; color: string } | null = null;
  /**
   * Highest smoothing segment of `current` already painted incrementally.
   * Segment `i` (1-based) is `quadraticCurveTo(p[i], mid(p[i], p[i+1]))` —
   * exactly the curve `redraw()` produces, so the final full redraw matches.
   */
  private lastSeg = 0;
  /** Pending animation-frame handle for the incremental draw. */
  private rafId: number | null = null;
  private readonly empty = signal(true);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private resizeObserver?: ResizeObserver;
  /** Set while `value` holds an external image we can't re-derive strokes from. */
  private externalImage: string | null = null;

  readonly padId = this.field?.controlId ?? mkUniqueId('mk-signature');

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  /** Whether nothing is drawn yet. */
  readonly isEmpty = this.empty.asReadonly();

  constructor() {
    afterNextRender(() => {
      this.resizeCanvas();
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
        this.resizeObserver.observe(this.canvasRef().nativeElement);
      }
      // A value assigned before render (writeValue / [value]) paints now.
      if (this.value()) this.paintExternal(this.value()!);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.cancelFlush();
  }

  // --- Drawing --------------------------------------------------------------

  protected onPointerDown(event: PointerEvent): void {
    if (this.isDisabled()) return;
    const canvas = this.canvasRef().nativeElement;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already lifted (fast tap) — nothing left to capture.
    }
    this.cacheGesture();
    this.lastSeg = 0;
    this.current = [this.toLocal(event)];
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.current) return;
    // Coalesced events keep full input fidelity while we draw once per frame.
    const coalesced = event.getCoalescedEvents?.();
    const events = coalesced?.length ? coalesced : [event];
    for (const e of events) this.current.push(this.toLocal(e));
    this.scheduleFlush();
  }

  protected onPointerUp(): void {
    // All points are already accumulated in `current`; the final redraw()
    // below supersedes any pending incremental frame.
    this.cancelFlush();
    this.gesture = null;
    if (!this.current) return;
    // A tap leaves a dot; keep it.
    this.strokes.push(this.current);
    this.current = null;
    this.lastSeg = 0;
    this.externalImage = null;
    this.empty.set(false);
    this.redraw();
    this.emitValue();
    this.onTouched();
  }

  /** Clear the drawing (and the form value). */
  clear(): void {
    this.cancelFlush();
    this.gesture = null;
    this.lastSeg = 0;
    this.strokes.length = 0;
    this.current = null;
    this.externalImage = null;
    this.empty.set(true);
    this.redraw();
    this.value.set(null);
    this.onChange(null);
    this.cleared.emit();
  }

  protected onClearClick(): void {
    if (this.isDisabled()) return;
    this.clear();
    this.onTouched();
  }

  // --- Canvas plumbing ------------------------------------------------------

  private toLocal(event: {
    clientX: number;
    clientY: number;
  }): { x: number; y: number } {
    const rect =
      this.gesture?.rect ??
      this.canvasRef().nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /** Snapshot the per-gesture environment (rect, dpr, stroke color). */
  private cacheGesture(): void {
    const canvas = this.canvasRef().nativeElement;
    this.gesture = {
      rect: canvas.getBoundingClientRect(),
      dpr: window.devicePixelRatio || 1,
      color: getComputedStyle(canvas).color,
    };
  }

  private scheduleFlush(): void {
    if (this.rafId != null) return;
    if (typeof requestAnimationFrame !== 'function') {
      this.drawPending();
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.drawPending();
    });
  }

  private cancelFlush(): void {
    if (this.rafId == null) return;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }

  /**
   * Paint only the not-yet-drawn part of the in-flight stroke. Produces the
   * same midpoint-smoothed curve as `redraw()` minus the trailing straight
   * cap to the last point, which the final redraw on pointerup adds.
   */
  private drawPending(): void {
    if (!this.isBrowser || !this.current) return;
    const g = this.gesture;
    if (!g) return;
    const ctx = this.context();
    if (!ctx) return;
    const pts = this.current;
    const n = pts.length;
    if (n < 2) return;

    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.lineWidth = this.strokeWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = g.color;

    if (n === 2) {
      // Two points: only the straight segment exists yet (as in redraw()).
      if (this.lastSeg === 0) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
      }
      return;
    }

    const first = this.lastSeg + 1;
    if (first > n - 2) return;
    ctx.beginPath();
    if (first === 1) {
      ctx.moveTo(pts[0].x, pts[0].y);
    } else {
      // Resume where the previous segment ended: the midpoint.
      ctx.moveTo(
        (pts[first - 1].x + pts[first].x) / 2,
        (pts[first - 1].y + pts[first].y) / 2,
      );
    }
    for (let i = first; i <= n - 2; i++) {
      ctx.quadraticCurveTo(
        pts[i].x,
        pts[i].y,
        (pts[i].x + pts[i + 1].x) / 2,
        (pts[i].y + pts[i + 1].y) / 2,
      );
    }
    ctx.stroke();
    this.lastSeg = n - 2;
  }

  /** Match the bitmap to the CSS size × devicePixelRatio, then re-render. */
  private resizeCanvas(): void {
    if (!this.isBrowser) return;
    const canvas = this.canvasRef().nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // Geometry changed: refresh the cache mid-stroke, drop it otherwise.
    if (this.current) this.cacheGesture();
    else this.gesture = null;
    if (this.externalImage) this.paintExternal(this.externalImage);
    else this.redraw();
  }

  private context(): CanvasRenderingContext2D | null {
    return this.canvasRef().nativeElement.getContext('2d');
  }

  private redraw(): void {
    if (!this.isBrowser) return;
    const canvas = this.canvasRef().nativeElement;
    const ctx = this.context();
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.lineWidth = this.strokeWidth();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(canvas).color;
    ctx.fillStyle = ctx.strokeStyle;

    for (const stroke of [...this.strokes, ...(this.current ? [this.current] : [])]) {
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x, stroke[0].y, this.strokeWidth() / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      // Quadratic smoothing through midpoints.
      for (let i = 1; i < stroke.length - 1; i++) {
        const midX = (stroke[i].x + stroke[i + 1].x) / 2;
        const midY = (stroke[i].y + stroke[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY);
      }
      const last = stroke[stroke.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
    // The in-flight stroke (if any) is now fully painted — the incremental
    // path must not repaint it.
    if (this.current) this.lastSeg = Math.max(0, this.current.length - 2);
  }

  private emitValue(): void {
    let dataUrl: string | null = null;
    try {
      dataUrl = this.canvasRef().nativeElement.toDataURL('image/png') || null;
    } catch {
      // Environments without canvas rasterisation (e.g. jsdom).
    }
    this.value.set(dataUrl);
    this.onChange(dataUrl);
  }

  /** Paint an externally-provided data-URL/image URL onto the pad. */
  private paintExternal(src: string): void {
    if (!this.isBrowser) return;
    this.externalImage = src;
    this.strokes.length = 0;
    const img = new Image();
    img.onload = () => {
      const canvas = this.canvasRef().nativeElement;
      const ctx = this.context();
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
      this.empty.set(false);
    };
    img.src = src;
  }

  /**
   * Marks the control touched once focus leaves it entirely, so a form that
   * gates its errors on `touched` behaves the same here as on a native input.
   */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set(value || null);
    if (value) {
      // Canvas may not exist yet (before first render) — afterNextRender in
      // the constructor paints the pending value in that case.
      if (this.isBrowser && this.canvasRef !== undefined) {
        try {
          this.paintExternal(value);
        } catch {
          this.externalImage = value;
        }
      }
    } else {
      this.strokes.length = 0;
      this.externalImage = null;
      this.empty.set(true);
      if (this.isBrowser) {
        try {
          this.redraw();
        } catch {
          /* not rendered yet */
        }
      }
    }
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
