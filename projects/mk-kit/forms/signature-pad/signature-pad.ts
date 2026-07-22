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
import type { MkSize } from '@mkornas/ui/core';
import { MK_I18N, mkUniqueId } from '@mkornas/ui/core';
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
  }

  // --- Drawing --------------------------------------------------------------

  protected onPointerDown(event: PointerEvent): void {
    if (this.isDisabled()) return;
    const canvas = this.canvasRef().nativeElement;
    canvas.setPointerCapture(event.pointerId);
    this.current = [this.toLocal(event)];
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.current) return;
    this.current.push(this.toLocal(event));
    this.redraw();
  }

  protected onPointerUp(): void {
    if (!this.current) return;
    // A tap leaves a dot; keep it.
    this.strokes.push(this.current);
    this.current = null;
    this.externalImage = null;
    this.empty.set(false);
    this.redraw();
    this.emitValue();
    this.onTouched();
  }

  /** Clear the drawing (and the form value). */
  clear(): void {
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

  private toLocal(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
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
    if (this.externalImage) this.paintExternal(this.externalImage);
    else this.redraw();
  }

  private context(): CanvasRenderingContext2D | null {
    return this.canvasRef().nativeElement.getContext('2d');
  }

  private redraw(): void {
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
