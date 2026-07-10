import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkQrCode } from './qr-code';
import { mkEncodeQr } from './qr-encode';

/** The canonical 7×7 finder pattern (true = dark). */
const FINDER: boolean[][] = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
].map((row) => row.map(Boolean));

function finderMatches(m: boolean[][], top: number, left: number): boolean {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (m[top + r][left + c] !== FINDER[r][c]) return false;
    }
  }
  return true;
}

describe('mkEncodeQr', () => {
  it('produces a square version-1 matrix (21×21) for a short byte payload', () => {
    const m = mkEncodeQr('HI', 'L');
    expect(m.length).toBe(21); // 17 + 4 * version(1)
    expect(m.every((row) => row.length === 21)).toBe(true);
  });

  it('places the three finder patterns at the three corners', () => {
    const m = mkEncodeQr('HI', 'L');
    const n = m.length;
    expect(finderMatches(m, 0, 0)).toBe(true); // top-left
    expect(finderMatches(m, 0, n - 7)).toBe(true); // top-right
    expect(finderMatches(m, n - 7, 0)).toBe(true); // bottom-left
  });

  it('has alternating timing patterns between the finders', () => {
    const m = mkEncodeQr('HI', 'L');
    const n = m.length;
    for (let i = 8; i < n - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0); // horizontal timing (row 6)
      expect(m[i][6]).toBe(i % 2 === 0); // vertical timing (col 6)
    }
  });

  it('is deterministic for the same input', () => {
    expect(mkEncodeQr('hello world', 'M')).toEqual(mkEncodeQr('hello world', 'M'));
  });

  it('bumps to a higher version for a longer string', () => {
    const short = mkEncodeQr('HI', 'L');
    const long = mkEncodeQr('x'.repeat(100), 'L');
    expect(long.length).toBeGreaterThan(short.length);
    // Stronger ECC needs a larger matrix for the same payload.
    expect(mkEncodeQr('x'.repeat(100), 'H').length).toBeGreaterThanOrEqual(long.length);
  });

  it('encodes multi-byte UTF-8 without throwing', () => {
    const m = mkEncodeQr('héllo · 日本語 · 😀', 'M');
    expect(m.length).toBeGreaterThanOrEqual(21);
    expect(m.every((row) => row.length === m.length)).toBe(true);
  });
});

describe('MkQrCode', () => {
  let fixture: ComponentFixture<MkQrCode>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkQrCode);
    fixture.componentRef.setInput('value', 'Hello');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders dark module rects and a square SVG', () => {
    const el: HTMLElement = fixture.nativeElement;
    const svg = el.querySelector('svg')!;
    const darkRects = el.querySelectorAll('.mk-qr-code__module');

    expect(darkRects.length).toBeGreaterThan(0);

    const [, , w, h] = svg.getAttribute('viewBox')!.split(' ');
    expect(w).toBe(h); // square
  });

  it('reflects the module matrix count in the rendered rects', () => {
    const el: HTMLElement = fixture.nativeElement;
    const darkModules = (fixture.componentInstance as any)
      .matrix()
      .flat()
      .filter(Boolean).length;
    expect(el.querySelectorAll('.mk-qr-code__module').length).toBe(darkModules);
  });

  it('applies the configured colours to the rects', () => {
    fixture.componentRef.setInput('color', 'rgb(10, 20, 30)');
    fixture.detectChanges();
    const rect = fixture.nativeElement.querySelector('.mk-qr-code__module') as SVGRectElement;
    expect(rect.style.fill).toBe('rgb(10, 20, 30)');
  });

  it('defaults the aria-label to the encoded content', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('QR code: Hello');
  });

  it('prefers an explicit label over the generated one', () => {
    fixture.componentRef.setInput('label', 'Ticket QR');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-label')).toBe('Ticket QR');
  });
});
