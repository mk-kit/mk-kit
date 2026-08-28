import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MK_HEATMAP_MIN_CONTRAST,
  MkHeatmap,
  type MkHeatmapPalette,
  type MkRgb,
  mkContrastRatio,
  mkHeatmapCellColors,
  mkMixRgb,
  mkParseRgb,
} from './heatmap';

/**
 * The default palettes: `--mk-primary` over `--mk-surface-2`, with `--mk-text`
 * / `--mk-text-inverse` as the candidate text colours (values from
 * mk-kit.scss; the token file itself is checked by contrast-smoke.spec.ts).
 */
const LIGHT: MkHeatmapPalette = {
  accent: mkParseRgb('#4f46e5')!,
  surface: mkParseRgb('#f1f3f5')!,
  text: mkParseRgb('#1a1d23')!,
  textInverse: mkParseRgb('#ffffff')!,
};
const DARK: MkHeatmapPalette = {
  accent: mkParseRgb('#6164f0')!,
  surface: mkParseRgb('#1e252e')!,
  text: mkParseRgb('#e6edf3')!,
  textInverse: mkParseRgb('#0d1117')!,
};

/** The contrast a cell's value actually gets with the chosen token. */
function valueContrast(t: number, palette: MkHeatmapPalette, showValues = true): number {
  const c = mkHeatmapCellColors(t, palette, showValues);
  const bg = mkMixRgb(palette.accent, palette.surface, c.intensity);
  return mkContrastRatio(c.inverse ? palette.textInverse : palette.text, bg);
}

describe('mkHeatmapCellColors', () => {
  it('parses CSSOM and hex colours', () => {
    expect(mkParseRgb('rgb(79, 70, 229)')).toEqual([79, 70, 229]);
    expect(mkParseRgb('rgba(79 70 229 / 0.5)')).toEqual([79, 70, 229]);
    expect(mkParseRgb('#4f46e5')).toEqual([79, 70, 229]);
    expect(mkParseRgb('#fff')).toEqual([255, 255, 255]);
    expect(mkParseRgb('var(--mk-primary)')).toBeNull();
    expect(mkParseRgb('')).toBeNull();
  });

  it('puts dark text on light cells and light text on dark cells', () => {
    // Light theme: the ramp runs from a pale surface to a deep accent.
    expect(mkHeatmapCellColors(0, LIGHT, true).inverse).toBe(false);
    expect(mkHeatmapCellColors(1, LIGHT, true).inverse).toBe(true);
    // Dark theme: the surface is dark, so low cells take the (light) --mk-text.
    expect(mkHeatmapCellColors(0, DARK, true).inverse).toBe(false);
  });

  it('would have caught the fixed 0.55 threshold: white on a 55 % cell is under 4.5:1', () => {
    const bg = mkMixRgb(LIGHT.accent, LIGHT.surface, 0.55);
    expect(mkContrastRatio(LIGHT.textInverse, bg)).toBeLessThan(MK_HEATMAP_MIN_CONTRAST);
    // …and so was --mk-text-muted on a 20 % cell (the old low-intensity colour).
    const muted: MkRgb = mkParseRgb('#56606e')!;
    expect(mkContrastRatio(muted, mkMixRgb(LIGHT.accent, LIGHT.surface, 0.2))).toBeLessThan(
      MK_HEATMAP_MIN_CONTRAST,
    );
    expect(valueContrast(0.55, LIGHT)).toBeGreaterThanOrEqual(MK_HEATMAP_MIN_CONTRAST);
    expect(valueContrast(0.2, LIGHT)).toBeGreaterThanOrEqual(MK_HEATMAP_MIN_CONTRAST);
  });

  for (const [name, palette] of [
    ['light', LIGHT],
    ['dark', DARK],
  ] as const) {
    it(`reaches 4.5:1 for every printed value across the ${name} ramp, nudging the cell at most 15 %`, () => {
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        const c = mkHeatmapCellColors(t, palette, true);
        expect(valueContrast(t, palette), `t=${t}`).toBeGreaterThanOrEqual(MK_HEATMAP_MIN_CONTRAST);
        expect(Math.abs(c.intensity - t), `t=${t}`).toBeLessThanOrEqual(0.15);
      }
    });
  }

  it('never shifts the intensity while values are hidden', () => {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      expect(mkHeatmapCellColors(t, LIGHT, false).intensity).toBe(t);
      expect(mkHeatmapCellColors(t, DARK, false).intensity).toBe(t);
    }
  });

  it('falls back to a threshold without a resolved palette', () => {
    expect(mkHeatmapCellColors(0.2, null, true)).toMatchObject({ intensity: 0.2, inverse: false });
    expect(mkHeatmapCellColors(0.9, null, true)).toMatchObject({ intensity: 0.9, inverse: true });
  });
});

@Component({
  imports: [MkHeatmap],
  template: `
    <mk-heatmap [xLabels]="['lo', 'hi']" [yLabels]="['row']" [data]="[[0, 100]]" showValues />
  `,
})
class Host {}

describe('MkHeatmap cell text', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('applies the per-cell text token once the palette resolves', async () => {
    vi.spyOn(
      MkHeatmap.prototype as unknown as { resolvePalette: () => MkHeatmapPalette | null },
      'resolvePalette',
    ).mockReturnValue(LIGHT);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cells = (fixture.nativeElement as HTMLElement).querySelectorAll('.mk-heatmap__cell');
    expect(cells).toHaveLength(2);
    expect(cells[0].classList.contains('mk-heatmap__cell--inverse')).toBe(false);
    expect(cells[1].classList.contains('mk-heatmap__cell--inverse')).toBe(true);
    // The probe never lingers in the DOM.
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('span[aria-hidden][style*="hidden"]'),
    ).toBeNull();
  });
});
