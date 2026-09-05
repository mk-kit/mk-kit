import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import type { Html5Qrcode } from 'html5-qrcode';

/** Symbologies the scanner reads; names follow `Html5QrcodeSupportedFormats`. */
export type MkBarcodeFormat =
  | 'QR_CODE'
  | 'EAN_13'
  | 'EAN_8'
  | 'CODE_128'
  | 'CODE_39'
  | 'UPC_A'
  | 'UPC_E'
  | 'DATA_MATRIX'
  | 'ITF'
  | 'CODABAR';

export const MK_BARCODE_DEFAULT_FORMATS: MkBarcodeFormat[] = [
  'QR_CODE', 'EAN_13', 'EAN_8', 'CODE_128', 'CODE_39', 'UPC_A', 'UPC_E',
];

let nextId = 0;

/**
 * Camera barcode / QR reader. Starts the rear camera when it appears, emits
 * `scanned` once with the first decoded text and stops. The decoder
 * (`html5-qrcode`, an optional peer dependency) is loaded on demand, so pages
 * that only *offer* scanning ship nothing extra until a scan starts. Use
 * inline, or through {@link MkBarcodeScannerDialog}.
 *
 * ```html
 * <mk-barcode-scanner (scanned)="onCode($event)" (failed)="show($event)" />
 * ```
 */
@Component({
  selector: 'mk-barcode-scanner',
  template: `
    @if (error(); as message) {
      <p class="mk-barcode-scanner__error" role="alert">{{ message }}</p>
    } @else if (hint()) {
      <p class="mk-barcode-scanner__hint">{{ i18n.scannerHint }}</p>
    }
    <div #reader class="mk-barcode-scanner__reader" [class.mk-barcode-scanner__reader--live]="scanning()"></div>
  `,
  styles: `
    :host { display: block; }
    .mk-barcode-scanner__hint { margin: 0 0 var(--mk-space-3); color: var(--mk-text-muted); font-size: var(--mk-font-size-sm); }
    .mk-barcode-scanner__error { margin: 0 0 var(--mk-space-3); color: var(--mk-danger); font-size: var(--mk-font-size-sm); }
    .mk-barcode-scanner__reader { width: 100%; min-height: 12rem; border-radius: var(--mk-radius-md); overflow: hidden; background: var(--mk-surface-2); }
    .mk-barcode-scanner__reader video { width: 100% !important; display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-barcode-scanner' },
})
export class MkBarcodeScanner implements AfterViewInit, OnDestroy {
  protected readonly i18n = inject(MK_I18N);
  private readonly readerEl = viewChild.required<ElementRef<HTMLDivElement>>('reader');

  /** Symbologies to decode. Default: QR + the retail 1-D codes. */
  readonly formats = input<MkBarcodeFormat[]>(MK_BARCODE_DEFAULT_FORMATS);
  /** Frames per second offered to the decoder. Default 10. */
  readonly fps = input(10);
  /** Show the built-in hint line above the viewfinder. Default `true`. */
  readonly hint = input(true);
  /** Keep scanning after a hit instead of stopping. Default `false`. */
  readonly continuous = input(false);

  /** Decoded text. */
  readonly scanned = output<string>();
  /** The camera could not start (permission, no device, insecure context). */
  readonly failed = output<string>();

  protected readonly error = signal<string | null>(null);
  protected readonly scanning = signal(false);
  private scanner: Html5Qrcode | null = null;
  private destroyed = false;
  private lastHit = '';

  async ngAfterViewInit(): Promise<void> {
    const id = `mk-barcode-reader-${++nextId}`;
    this.readerEl().nativeElement.id = id;
    let lib: typeof import('html5-qrcode');
    try {
      lib = await import('html5-qrcode');
    } catch {
      this.fail('html5-qrcode is not installed');
      return;
    }
    // Dismissed while the chunk loaded — never start a camera nobody can stop.
    if (this.destroyed) return;
    const formats = this.formats()
      .map((f) => lib.Html5QrcodeSupportedFormats[f])
      .filter((f) => f !== undefined);
    this.scanner = new lib.Html5Qrcode(id, { formatsToSupport: formats, verbose: false });
    try {
      this.scanning.set(true);
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: this.fps(), qrbox: { width: 260, height: 160 } },
        (text) => void this.onHit(text),
        () => undefined,
      );
    } catch (err) {
      this.scanning.set(false);
      this.fail((err as { message?: string })?.message || this.i18n.scannerCameraError);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    void this.stop();
  }

  /** Stop the camera and release it. Safe to call twice. */
  async stop(): Promise<void> {
    const s = this.scanner;
    if (!s) return;
    this.scanner = null;
    try {
      if (s.isScanning) await s.stop();
      await s.clear();
    } catch {
      /* teardown races are fine */
    }
    this.scanning.set(false);
  }

  private async onHit(text: string): Promise<void> {
    if (this.continuous()) {
      if (text === this.lastHit) return; // the same code across consecutive frames
      this.lastHit = text;
      this.scanned.emit(text);
      return;
    }
    await this.stop();
    this.scanned.emit(text);
  }

  private fail(message: string): void {
    this.error.set(message);
    this.failed.emit(message);
  }
}
