import {
  mkArcPath,
  mkAreaPath,
  mkChartColor,
  mkFormatCompact,
  mkLinePath,
  mkLinearScale,
  mkNiceTicks,
} from './chart-utils';

describe('chart-utils', () => {
  describe('mkChartColor', () => {
    it('maps an index to the 1-based palette token', () => {
      expect(mkChartColor(0)).toBe('var(--mk-chart-1)');
      expect(mkChartColor(7)).toBe('var(--mk-chart-8)');
    });
    it('wraps past the palette size', () => {
      expect(mkChartColor(8)).toBe('var(--mk-chart-1)');
      expect(mkChartColor(9)).toBe('var(--mk-chart-2)');
    });
  });

  describe('mkLinearScale', () => {
    it('maps the domain onto the range linearly', () => {
      const s = mkLinearScale(0, 10, 0, 100);
      expect(s(0)).toBe(0);
      expect(s(5)).toBe(50);
      expect(s(10)).toBe(100);
    });
    it('avoids divide-by-zero on a degenerate domain', () => {
      const s = mkLinearScale(5, 5, 0, 100);
      expect(Number.isFinite(s(5))).toBe(true);
    });
  });

  describe('mkNiceTicks', () => {
    it('produces human-rounded ticks covering the range', () => {
      expect(mkNiceTicks(0, 22, 5)).toEqual([0, 5, 10, 15, 20, 25]);
    });
    it('handles a flat range', () => {
      const ticks = mkNiceTicks(4, 4);
      expect(ticks[0]).toBeLessThanOrEqual(4);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(4);
    });
  });

  describe('path builders', () => {
    it('mkLinePath draws M/L segments', () => {
      expect(mkLinePath([{ x: 0, y: 0 }, { x: 1, y: 2 }])).toBe('M0 0 L1 2');
      expect(mkLinePath([])).toBe('');
    });
    it('mkAreaPath closes down to the baseline', () => {
      expect(mkAreaPath([{ x: 0, y: 0 }, { x: 2, y: 2 }], 10)).toBe(
        'M0 0 L2 2 L2 10 L0 10 Z',
      );
    });
    it('mkArcPath returns a ring segment path', () => {
      const d = mkArcPath(50, 50, 40, 20, 0, Math.PI / 2);
      expect(d.startsWith('M')).toBe(true);
      expect(d).toContain('A');
    });
  });

  describe('mkFormatCompact', () => {
    it('formats thousands and millions', () => {
      expect(mkFormatCompact(999)).toBe('999');
      expect(mkFormatCompact(1500)).toBe('1.5k');
      expect(mkFormatCompact(2_000_000)).toBe('2M');
    });
  });
});
