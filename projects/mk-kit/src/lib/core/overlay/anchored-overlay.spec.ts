import { mkComputeAnchoredPosition } from './anchored-overlay';

/** Build a rect-like object from top/left/width/height. */
function rect(top: number, left: number, width: number, height: number) {
  return { top, left, right: left + width, bottom: top + height, width, height };
}

const VIEWPORT = { width: 1000, height: 800 };
const OPTS = { gap: 4, flip: true, clamp: true } as const;

describe('mkComputeAnchoredPosition', () => {
  it('places a bottom-start panel below and left-aligned to the anchor', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 50, 100, 30),
      { width: 200, height: 80 },
      VIEWPORT,
      { ...OPTS, placement: 'bottom-start' },
    );
    expect(pos).toEqual({ top: 134, left: 50, placement: 'bottom-start' });
  });

  it('flips above the anchor when the panel would overflow the bottom edge', () => {
    const pos = mkComputeAnchoredPosition(
      rect(750, 50, 100, 30),
      { width: 200, height: 80 },
      VIEWPORT,
      { ...OPTS, placement: 'bottom-start' },
    );
    // 750 - 80 - 4 = 666, placement flips to top-start.
    expect(pos).toEqual({ top: 666, left: 50, placement: 'top-start' });
  });

  it('clamps the panel back inside the right viewport edge', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 950, 100, 30),
      { width: 200, height: 80 },
      VIEWPORT,
      { ...OPTS, placement: 'bottom-start' },
    );
    // Preferred left 950 → clamped to 1000 - 200 - 4 = 796.
    expect(pos.left).toBe(796);
  });

  it('centres a left-placed panel on the anchor’s vertical axis', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 400, 100, 40),
      { width: 60, height: 20 },
      VIEWPORT,
      { ...OPTS, gap: 8, placement: 'left' },
    );
    // left = 400 - 60 - 8 = 332; top = 100 + 40/2 - 20/2 = 110.
    expect(pos).toEqual({ top: 110, left: 332, placement: 'left' });
  });

  it('does not flip when flip is disabled, only clamps (tooltip behaviour)', () => {
    const pos = mkComputeAnchoredPosition(
      rect(10, 50, 100, 30),
      { width: 120, height: 40 },
      VIEWPORT,
      { gap: 8, flip: false, clamp: true, placement: 'top' },
    );
    // Preferred top = 10 - 40 - 8 = -38 → clamped to gap (8). Stays 'top'.
    expect(pos.top).toBe(8);
    expect(pos.placement).toBe('top');
  });
});
