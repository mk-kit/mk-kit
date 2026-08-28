import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkBarChart } from './bar-chart';

/**
 * Category-axis label fitting.
 *
 * A narrow chart with many categories used to render every label flat at its
 * band centre, so they overlapped into an unreadable smear — a 24-hour axis in
 * a card is the canonical case. The axis now tilts when labels would collide,
 * reserves the vertical room the tilt needs, and thins the labels when even
 * tilting cannot fit them.
 */
describe('MkBarChart category labels', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function make(categories: string[], width: number, inputs: object = {}) {
    const f = TestBed.createComponent(MkBarChart);
    f.componentRef.setInput('categories', categories);
    f.componentRef.setInput('series', [
      { name: 'S', data: categories.map((_, i) => i + 1) },
    ]);
    f.componentRef.setInput('width', width);
    f.componentRef.setInput('height', 200);
    f.componentRef.setInput('responsive', false);
    for (const [k, v] of Object.entries(inputs)) {
      f.componentRef.setInput(k, v);
    }
    f.detectChanges();
    return f;
  }

  const hours = Array.from(
    { length: 24 },
    (_, h) => `${String(h).padStart(2, '0')}:00`,
  );

  describe('auto (default)', () => {
    it('leaves labels flat when they comfortably fit', () => {
      const f = make(['Q1', 'Q2', 'Q3', 'Q4'], 600);
      const cmp = f.componentInstance as any;
      expect(cmp.resolvedAngle()).toBe(0);
      expect(cmp.bands()[0].transform).toBeNull();
      f.destroy();
    });

    it('tilts to 45° when flat labels would collide', () => {
      const f = make(hours, 326);
      expect((f.componentInstance as any).resolvedAngle()).toBe(45);
      f.destroy();
    });

    // A 12-month axis in a card fits by the strict measure (labels are just
    // narrower than their band) but reads as one cramped run of words with no
    // gap. Tilt on "tight", not only on "overlapping".
    it('tilts a technically-fitting but cramped axis', () => {
      const months = [
        'sie', 'wrz', 'paź', 'lis', 'gru', 'sty',
        'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie',
      ];
      const f = make(months, 326);
      const cmp = f.componentInstance as any;
      const band = Math.max(326 - 58, 1) / months.length;
      // Genuinely fits — this is not an overlap case.
      expect(cmp.widestLabelPx()).toBeLessThan(band);
      expect(cmp.resolvedAngle()).toBe(45);
      f.destroy();
    });

    it('leaves a roomy axis flat rather than tilting everything', () => {
      const f = make(['Q1', 'Q2', 'Q3', 'Q4'], 600);
      expect((f.componentInstance as any).resolvedAngle()).toBe(0);
      f.destroy();
    });

    it('rotates each label about its own tick, not the origin', () => {
      const f = make(hours, 326);
      const band = (f.componentInstance as any).bands()[3];
      expect(band.transform).toBe(
        `rotate(-45 ${band.labelX} ${band.labelY})`,
      );
      f.destroy();
    });
  });

  describe('explicit angle', () => {
    it('honours a pinned angle even when labels would fit flat', () => {
      const f = make(['Q1', 'Q2'], 600, { labelAngle: 30 });
      const cmp = f.componentInstance as any;
      expect(cmp.resolvedAngle()).toBe(30);
      expect(cmp.bands()[0].transform).toContain('rotate(-30');
      f.destroy();
    });

    it('labelAngle=0 forces flat even on a crowded axis', () => {
      const f = make(hours, 326, { labelAngle: 0 });
      const cmp = f.componentInstance as any;
      expect(cmp.resolvedAngle()).toBe(0);
      expect(cmp.bands()[0].transform).toBeNull();
      f.destroy();
    });

    it('clamps out-of-range angles', () => {
      expect(
        (make(hours, 326, { labelAngle: 200 }).componentInstance as any)
          .resolvedAngle(),
      ).toBe(90);
      expect(
        (make(hours, 326, { labelAngle: -20 }).componentInstance as any)
          .resolvedAngle(),
      ).toBe(0);
    });
  });

  describe('room reservation', () => {
    it('grows the bottom margin so tilted labels are not clipped', () => {
      const flat = (make(['A', 'B'], 600).componentInstance as any).plot();
      const tilted = (make(hours, 326).componentInstance as any).plot();
      // Same declared height, less plot height — the difference is the room
      // the tilted labels now occupy below the axis.
      expect(tilted.h).toBeLessThan(flat.h);
      f_destroyAll();
    });

    it('keeps the reservation bounded so labels cannot eat the plot', () => {
      const long = Array.from({ length: 12 }, () => 'A'.repeat(80));
      const cmp = make(long, 300).componentInstance as any;
      expect(cmp.plot().h).toBeGreaterThan(0);
      f_destroyAll();
    });
  });

  describe('thinning', () => {
    it('drops labels rather than overlapping them when tilt is not enough', () => {
      const cmp = make(hours, 326).componentInstance as any;
      expect(cmp.labelStep()).toBeGreaterThan(1);
      const shown = cmp.bands().filter((b: { label: string }) => b.label);
      expect(shown.length).toBeLessThan(hours.length);
      // Every category keeps its slot, so bars stay aligned with their bands.
      expect(cmp.bands()).toHaveLength(24);
      f_destroyAll();
    });

    it('keeps every label when they all fit', () => {
      const cmp = make(['A', 'B', 'C'], 600).componentInstance as any;
      expect(cmp.labelStep()).toBe(1);
      expect(
        cmp.bands().filter((b: { label: string }) => b.label),
      ).toHaveLength(3);
      f_destroyAll();
    });
  });

  it('never tilts a horizontal chart — its categories run down the Y axis', () => {
    const f = make(hours, 326, { orientation: 'horizontal' });
    const cmp = f.componentInstance as any;
    expect(cmp.resolvedAngle()).toBe(0);
    expect(cmp.bands()[0].transform).toBeNull();
    f.destroy();
  });

  function f_destroyAll() {
    // Fixtures are torn down by TestBed between specs; this keeps the intent
    // explicit where a spec creates more than one.
  }
});
