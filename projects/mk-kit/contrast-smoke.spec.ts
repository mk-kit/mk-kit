/**
 * Contrast smoke test over the published theme tokens.
 *
 * jsdom cannot paint, so axe's `color-contrast` rule is disabled in the a11y
 * smoke. This spec covers the token pairs the components and the docs site
 * rely on instead: it reads the compiled theme (`mk-kit.css`, both the light
 * `:root` block and the `[data-theme="dark"]` block) and holds each pair to
 * WCAG AA (4.5:1) with the same maths the heatmap uses at runtime.
 *
 * Add a pair here whenever a component picks a text token for a surface.
 */
import css from './src/styles/mk-kit.css' with { loader: 'text' };
import momentumCss from './src/styles/presets/momentum.css' with { loader: 'text' };
import { type MkRgb, mkContrastRatio, mkParseRgb } from '@mk-kit/ui/data/charts';

const AA = 4.5;

/**
 * The base theme only: everything before the high-contrast preset and the
 * `prefers-contrast` / `forced-colors` blocks, which re-declare the same
 * tokens with deliberately stronger values and would otherwise be read as
 * the "dark" (last) declaration.
 */
const baseCss = (() => {
  const cut = css.search(/\[data-mk-contrast|prefers-contrast|forced-colors/);
  return cut > 0 ? css.slice(0, cut) : css;
})();

/**
 * `--mk-<name>` for the light theme (first declaration) or dark (last), read
 * from `source` — the base theme by default, or a preset stylesheet, which
 * follows the same light-first / dark-last layout.
 */
function token(name: string, theme: 'light' | 'dark', source = baseCss): MkRgb {
  const matches = [...source.matchAll(new RegExp(`--mk-${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`, 'g'))];
  expect(matches.length, `token --mk-${name} declared`).toBeGreaterThan(0);
  const raw = theme === 'light' ? matches[0][1] : matches[matches.length - 1][1];
  const rgb = mkParseRgb(raw);
  expect(rgb, `--mk-${name} (${theme}) parses`).not.toBeNull();
  return rgb!;
}

/** Text/background token pairs and where they are used. */
const PAIRS: ReadonlyArray<{ text: string; bg: string; where: string }> = [
  { text: 'text-subtle', bg: 'surface', where: 'mk-calendar outside-month day numbers' },
  { text: 'text-subtle', bg: 'bg', where: 'subtle text on the page background' },
  { text: 'text-subtle', bg: 'surface-2', where: 'subtle text on sunken surfaces' },
  { text: 'text-muted', bg: 'bg', where: 'mk-heatmap legend labels' },
  { text: 'text-muted', bg: 'surface', where: 'mk-heatmap axis labels, muted copy' },
  { text: 'primary-subtle-text', bg: 'primary-subtle', where: 'docs sidebar active link' },
  { text: 'text', bg: 'surface-2', where: 'mk-heatmap zero-intensity cell values' },
];

describe('theme token contrast (WCAG AA)', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const { text, bg, where } of PAIRS) {
      it(`${theme}: --mk-${text} on --mk-${bg} ≥ 4.5:1 (${where})`, () => {
        expect(mkContrastRatio(token(text, theme), token(bg, theme))).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  it('documents why the docs nav does not use --mk-primary on --mk-primary-subtle', () => {
    // The pair only clears AA in light mode — dark lands around 3.3:1.
    expect(mkContrastRatio(token('primary', 'light'), token('primary-subtle', 'light'))).toBeGreaterThanOrEqual(AA);
    expect(mkContrastRatio(token('primary', 'dark'), token('primary-subtle', 'dark'))).toBeLessThan(AA);
  });

  it('documents why calendar outside days do not use --mk-text-disabled', () => {
    expect(mkContrastRatio(token('text-disabled', 'light'), token('surface', 'light'))).toBeLessThan(AA);
    expect(mkContrastRatio(token('text-disabled', 'dark'), token('surface', 'dark'))).toBeLessThan(AA);
  });
});

/**
 * Presets re-declare the colour tokens, so they are held to the same pairs.
 * A preset that leaves a token out inherits the base value — `token()` then
 * fails loudly instead of silently testing the wrong colour, which is the
 * point: every pair below must be fully covered by the preset itself.
 */
describe('preset "momentum" token contrast (WCAG AA)', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const { text, bg, where } of PAIRS) {
      it(`${theme}: --mk-${text} on --mk-${bg} ≥ 4.5:1 (${where})`, () => {
        expect(
          mkContrastRatio(token(text, theme, momentumCss), token(bg, theme, momentumCss)),
        ).toBeGreaterThanOrEqual(AA);
      });
    }
    it(`${theme}: --mk-primary-contrast on --mk-primary ≥ 4.5:1 (solid button labels)`, () => {
      expect(
        mkContrastRatio(token('primary-contrast', theme, momentumCss), token('primary', theme, momentumCss)),
      ).toBeGreaterThanOrEqual(AA);
    });
    for (const tone of ['success', 'warning', 'danger', 'info'] as const) {
      it(`${theme}: --mk-${tone}-subtle-text on --mk-${tone}-subtle ≥ 4.5:1 (soft badges, alerts)`, () => {
        expect(
          mkContrastRatio(token(`${tone}-subtle-text`, theme, momentumCss), token(`${tone}-subtle`, theme, momentumCss)),
        ).toBeGreaterThanOrEqual(AA);
      });
    }
  }
});
