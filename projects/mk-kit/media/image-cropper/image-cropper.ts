import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MK_I18N } from '@mkornas/ui/core';

// --- Pure crop geometry -----------------------------------------------------
// jsdom has no canvas and never loads images, so everything numeric lives in
// these exported functions where it can be unit-tested directly.

/**
 * Base cover scale for an image in a viewport — the smallest scale at which
 * `imgW × imgH` fully covers `vpW × vpH` (object-fit: cover). Returns `1`
 * for degenerate (non-positive) dimensions.
 */
export function mkCoverScale(
  imgW: number,
  imgH: number,
  vpW: number,
  vpH: number,
): number {
  if (imgW <= 0 || imgH <= 0 || vpW <= 0 || vpH <= 0) return 1;
  return Math.max(vpW / imgW, vpH / imgH);
}

/**
 * Clamp a pan offset (CSS px, measured from the viewport centre to the image
 * centre) so the image scaled by `scale` still covers the viewport — no empty
 * edges. When the scaled image is not larger than the viewport on an axis the
 * offset collapses to `0` (centred).
 */
export function mkClampPan(
  x: number,
  y: number,
  imgW: number,
  imgH: number,
  vpW: number,
  vpH: number,
  scale: number,
): { x: number; y: number } {
  const maxX = Math.max(0, (imgW * scale - vpW) / 2);
  const maxY = Math.max(0, (imgH * scale - vpH) / 2);
  // `+ 0` normalises the -0 produced when an axis has no slack.
  return {
    x: Math.min(maxX, Math.max(-maxX, x)) + 0,
    y: Math.min(maxY, Math.max(-maxY, y)) + 0,
  };
}

/**
 * Source rect (in natural image pixels) of the crop region visible through
 * the viewport. `scale` maps natural pixels to CSS pixels (cover scale ×
 * zoom); `panX`/`panY` are the CSS-px offsets of the image centre from the
 * viewport centre. The rect is clamped inside the image bounds.
 */
export function mkCropRect(
  imgNaturalW: number,
  imgNaturalH: number,
  vpW: number,
  vpH: number,
  scale: number,
  panX: number,
  panY: number,
): { sx: number; sy: number; sw: number; sh: number } {
  if (imgNaturalW <= 0 || imgNaturalH <= 0 || vpW <= 0 || vpH <= 0 || scale <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(0, imgNaturalW), sh: Math.max(0, imgNaturalH) };
  }
  const sw = Math.min(vpW / scale, imgNaturalW);
  const sh = Math.min(vpH / scale, imgNaturalH);
  // The image point rendered at the viewport centre.
  const cx = imgNaturalW / 2 - panX / scale;
  const cy = imgNaturalH / 2 - panY / scale;
  const sx = Math.min(Math.max(cx - sw / 2, 0), imgNaturalW - sw);
  const sy = Math.min(Math.max(cy - sh / 2, 0), imgNaturalH - sh);
  return { sx, sy, sw, sh };
}

/** Zoom step used by the −/+ buttons. */
const BUTTON_ZOOM_STEP = 0.25;
/** Zoom step used by the `+`/`-` keys. */
const KEY_ZOOM_STEP = 0.1;

type CropStatus = 'loading' | 'loaded' | 'error';

/**
 * ImageCropper — pan-and-zoom crop control for avatars, covers and media uploads.
 * The image covers a fixed-aspect viewport (object-fit-cover style); the user
 * drags to pan, scrolls / pinch-zooms via the slider or `+`/`−` controls, and
 * `crop()` renders the visible region to a data-URL on an offscreen canvas.
 *
 * Pan is always clamped so the image keeps covering the viewport, a
 * rule-of-thirds grid appears while dragging, and `round` overlays a circular
 * scrim for avatar crops (the exported bitmap stays rectangular). The crop
 * area is keyboard operable: Arrow keys pan by 10px (1px with Shift), `+`/`-`
 * zoom.
 *
 * ```html
 * <mk-image-cropper #cropper src="/assets/photo.jpg" [aspect]="1" round />
 * <button mkButton (click)="avatar = cropper.crop({ size: 512 })">Save</button>
 * ```
 */
@Component({
  selector: 'mk-image-cropper',
  templateUrl: './image-cropper.html',
  styleUrl: './image-cropper.scss',
  exportAs: 'mkImageCropper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-image-cropper',
    '[class.mk-image-cropper--disabled]': 'disabled()',
    '[class.mk-image-cropper--round]': 'round()',
  },
})
export class MkImageCropper implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  private readonly viewportRef =
    viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly imageRef = viewChild<ElementRef<HTMLImageElement>>('image');

  /** Image URL or data-URL to crop. */
  readonly src = input.required<string>();
  /**
   * Aspect ratio (width / height) of the crop viewport, e.g. `1` for a
   * square or `16 / 9`. `null` makes the viewport fill its container.
   */
  readonly aspect = input<number | null>(1);
  /**
   * Circular mask overlay for avatar crops. Purely visual — the exported
   * bitmap from `crop()` stays rectangular.
   */
  readonly round = input(false, { transform: booleanAttribute });
  /** Lowest allowed zoom factor. */
  readonly minZoom = input(1, { transform: numberAttribute });
  /** Highest allowed zoom factor. */
  readonly maxZoom = input(4, { transform: numberAttribute });
  /** Disable panning and zooming. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * `crossorigin` for the internal `<img>`. Set to `'anonymous'` when
   * cropping CORS-enabled remote images — without it the canvas is tainted
   * and `crop()` returns `null`. Same-origin and data-URL sources don't
   * need it.
   */
  readonly crossOrigin = input<'anonymous' | 'use-credentials' | null>(null);
  /** Accessible name for the crop area (defaults to the i18n `zoom` label). */
  readonly ariaLabel = input<string | null>(null);

  /** Emits on any pan or zoom change. */
  readonly changed = output<void>();
  /** Emits when the image fails to load. */
  readonly imageError = output<void>();

  /** Two-way zoom factor, clamped to `[minZoom, maxZoom]`. */
  readonly zoom = model(1);

  private readonly natW = signal(0);
  private readonly natH = signal(0);
  private readonly vpW = signal(0);
  private readonly vpH = signal(0);
  private readonly panX = signal(0);
  private readonly panY = signal(0);
  protected readonly status = signal<CropStatus>('loading');
  protected readonly dragging = signal(false);

  private dragStart: { x: number; y: number; panX: number; panY: number } | null =
    null;
  private resizeObserver?: ResizeObserver;

  private readonly coverScale = computed(() =>
    mkCoverScale(this.natW(), this.natH(), this.vpW(), this.vpH()),
  );
  private readonly totalScale = computed(() => this.coverScale() * this.zoom());

  /** CSS transform applied to the image element. */
  protected readonly imageTransform = computed(
    () =>
      `translate(calc(-50% + ${this.panX()}px), calc(-50% + ${this.panY()}px)) ` +
      `scale(${this.totalScale()})`,
  );

  constructor() {
    // Restart from scratch whenever the source changes.
    effect(() => {
      this.src();
      untracked(() => {
        this.status.set('loading');
        this.natW.set(0);
        this.natH.set(0);
        this.reset();
      });
    });
    // Keep an externally-written zoom model inside [minZoom, maxZoom].
    effect(() => {
      const clamped = this.clampZoom(this.zoom());
      if (clamped !== this.zoom()) this.zoom.set(clamped);
    });
    // Re-clamp pan when zoom, image or viewport geometry changes.
    effect(() => {
      const scale = this.totalScale();
      const [imgW, imgH, vpW, vpH] = [this.natW(), this.natH(), this.vpW(), this.vpH()];
      untracked(() => {
        const p = mkClampPan(this.panX(), this.panY(), imgW, imgH, vpW, vpH, scale);
        this.panX.set(p.x);
        this.panY.set(p.y);
      });
    });

    afterNextRender(() => {
      this.measure();
      const viewport = this.viewportRef().nativeElement;
      // Angular's (wheel) binding may register passively; zooming must be
      // able to preventDefault, so attach by hand.
      viewport.addEventListener('wheel', this.onWheel, { passive: false });
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => this.measure());
        this.resizeObserver.observe(viewport);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.isBrowser) {
      this.viewportRef().nativeElement.removeEventListener('wheel', this.onWheel);
    }
  }

  // --- Public API -----------------------------------------------------------

  /** Centre the image and reset zoom to 1 (clamped to `minZoom`). */
  reset(): void {
    const zoom = this.clampZoom(1);
    const dirty =
      this.zoom() !== zoom || this.panX() !== 0 || this.panY() !== 0;
    this.zoom.set(zoom);
    this.panX.set(0);
    this.panY.set(0);
    if (dirty) this.changed.emit();
  }

  /**
   * Draw the visible crop region to an offscreen canvas and return it as a
   * data-URL (longest edge capped at `options.size ?? 1024`). Returns `null`
   * when the image is not loaded or the canvas is unavailable (SSR, jsdom).
   */
  crop(options?: { type?: string; quality?: number; size?: number }): string | null {
    const image = this.imageRef()?.nativeElement;
    if (!this.isBrowser || this.status() !== 'loaded' || !image) return null;
    const [natW, natH, vpW, vpH] = [this.natW(), this.natH(), this.vpW(), this.vpH()];
    if (!natW || !natH || !vpW || !vpH) return null;

    const { sx, sy, sw, sh } = mkCropRect(
      natW, natH, vpW, vpH, this.totalScale(), this.panX(), this.panY(),
    );
    const cap = options?.size ?? 1024;
    const factor = Math.min(1, cap / Math.max(sw, sh));
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw * factor));
      canvas.height = Math.max(1, Math.round(sh * factor));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL(options?.type ?? 'image/png', options?.quality) || null;
    } catch {
      // Environments without canvas rasterisation (e.g. jsdom).
      return null;
    }
  }

  // --- Image lifecycle ------------------------------------------------------

  protected onImageLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    this.natW.set(image.naturalWidth);
    this.natH.set(image.naturalHeight);
    this.status.set('loaded');
    this.reset();
  }

  protected onImageError(): void {
    this.status.set('error');
    this.imageError.emit();
  }

  // --- Pointer panning ------------------------------------------------------

  protected onPointerDown(event: PointerEvent): void {
    if (this.disabled()) return;
    try {
      this.viewportRef().nativeElement.setPointerCapture(event.pointerId);
    } catch {
      // jsdom / detached element.
    }
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      panX: this.panX(),
      panY: this.panY(),
    };
    this.dragging.set(true);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    const start = this.dragStart;
    if (!start) return;
    this.panTo(
      start.panX + event.clientX - start.x,
      start.panY + event.clientY - start.y,
    );
  }

  protected onPointerUp(): void {
    this.dragStart = null;
    this.dragging.set(false);
  }

  // --- Zooming --------------------------------------------------------------

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.disabled()) return;
    event.preventDefault();
    // Multiplicative steps feel uniform across the whole zoom range.
    this.zoomTo(this.zoom() * Math.exp(-event.deltaY * 0.0015));
  };

  protected onRangeInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isNaN(value)) this.zoomTo(value);
  }

  protected stepZoom(direction: 1 | -1): void {
    this.zoomTo(this.zoom() + direction * BUTTON_ZOOM_STEP);
  }

  /**
   * Zoom towards the viewport centre: the pan offset scales with the zoom
   * ratio so the image point at the centre stays put, then re-clamps.
   */
  protected zoomTo(next: number): void {
    const clamped = this.clampZoom(next);
    const previous = this.zoom();
    if (clamped === previous) return;
    const ratio = clamped / previous;
    this.zoom.set(clamped);
    const p = mkClampPan(
      this.panX() * ratio,
      this.panY() * ratio,
      this.natW(),
      this.natH(),
      this.vpW(),
      this.vpH(),
      this.coverScale() * clamped,
    );
    this.panX.set(p.x);
    this.panY.set(p.y);
    this.changed.emit();
  }

  // --- Keyboard -------------------------------------------------------------

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const step = event.shiftKey ? 1 : 10;
    switch (event.key) {
      case 'ArrowLeft':
        this.panTo(this.panX() - step, this.panY());
        break;
      case 'ArrowRight':
        this.panTo(this.panX() + step, this.panY());
        break;
      case 'ArrowUp':
        this.panTo(this.panX(), this.panY() - step);
        break;
      case 'ArrowDown':
        this.panTo(this.panX(), this.panY() + step);
        break;
      case '+':
      case '=':
        this.zoomTo(this.zoom() + KEY_ZOOM_STEP);
        break;
      case '-':
      case '_':
        this.zoomTo(this.zoom() - KEY_ZOOM_STEP);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  // --- Internals ------------------------------------------------------------

  private clampZoom(value: number): number {
    return Math.min(this.maxZoom(), Math.max(this.minZoom(), value));
  }

  private panTo(x: number, y: number): void {
    const p = mkClampPan(
      x, y, this.natW(), this.natH(), this.vpW(), this.vpH(), this.totalScale(),
    );
    if (p.x === this.panX() && p.y === this.panY()) return;
    this.panX.set(p.x);
    this.panY.set(p.y);
    this.changed.emit();
  }

  /** Capture the viewport's CSS size (initial render + every resize). */
  private measure(): void {
    if (!this.isBrowser) return;
    const rect = this.viewportRef().nativeElement.getBoundingClientRect();
    this.vpW.set(rect.width);
    this.vpH.set(rect.height);
  }
}
