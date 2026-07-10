import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { mkEncodeQr, MkQrEcc } from './qr-encode';

/**
 * QR Code — a dependency-free QR generator rendered as an SVG. The entire
 * encoding (byte mode, Reed–Solomon ECC, masking, format info) is implemented
 * from scratch in {@link mkEncodeQr}; no npm library is used. Dark modules are
 * drawn as `<rect>`s over a background rectangle that also fills the quiet zone,
 * so the code is theme-aware (`var(--mk-text)` on `var(--mk-surface)`) and
 * fully overridable. Exposes `role="img"` with an `aria-label` for assistive
 * tech.
 *
 * Supports versions 1–10 and ECC levels L/M/Q/H (byte mode / UTF-8).
 *
 * ```html
 * <mk-qr-code value="https://example.com" ecc="M" [size]="200" />
 * ```
 */
@Component({
  selector: 'mk-qr-code',
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-qr-code',
    role: 'img',
    '[attr.aria-label]': 'label()',
  },
})
export class MkQrCode {
  /** The text to encode (UTF-8, byte mode). */
  readonly value = input.required<string>();
  /** Error-correction level: `L` (~7%), `M` (~15%), `Q` (~25%), `H` (~30%). */
  readonly ecc = input<MkQrEcc>('M');
  /** Rendered pixel size of the (square) SVG. */
  readonly size = input(160, { transform: numberAttribute });
  /** Width of the light margin around the code, in modules (spec recommends 4). */
  readonly quietZone = input(4, { transform: numberAttribute });
  /** Dark-module colour. */
  readonly color = input('var(--mk-text)');
  /** Background / quiet-zone colour. */
  readonly background = input('var(--mk-surface)');
  /** Accessible label for the image. */
  readonly label = input('QR code');

  /** The module matrix (`true` = dark); empty if encoding fails (e.g. too long). */
  protected readonly matrix = computed<boolean[][]>(() => {
    try {
      return mkEncodeQr(this.value() ?? '', this.ecc());
    } catch {
      return [];
    }
  });

  /** Quiet zone clamped to a non-negative integer. */
  protected readonly quiet = computed(() => Math.max(0, Math.round(this.quietZone())));

  /** Side length of the viewBox in modules (code + both quiet-zone margins). */
  protected readonly dimension = computed(() => this.matrix().length + 2 * this.quiet());

  /** Top-left coordinates (in module units) of every dark module. */
  protected readonly modules = computed(() => {
    const m = this.matrix();
    const q = this.quiet();
    const out: { x: number; y: number }[] = [];
    for (let r = 0; r < m.length; r++) {
      const row = m[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c]) out.push({ x: c + q, y: r + q });
      }
    }
    return out;
  });
}
