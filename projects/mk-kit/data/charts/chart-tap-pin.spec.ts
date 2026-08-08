import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkBarChart } from './bar-chart';
import { MkLineChart } from './line-chart';
import { MkDonutChart } from './donut-chart';

const touchDown = () =>
  new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' });
const mouseDown = () =>
  new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' });

/**
 * Tap-to-pin: hover tooltips have no touch path (with a finger the tooltip
 * only lives between pointerenter and pointerleave — i.e. while the finger is
 * down), so a touch tap on a hit target PINS the tooltip until a tap lands
 * outside the chart or on another hit target.
 */
describe('chart tap-to-pin (MkBarChart)', () => {
  let fixture: ComponentFixture<MkBarChart>;
  let chart: MkBarChart;
  let bars: NodeListOf<SVGRectElement>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkBarChart);
    chart = fixture.componentInstance;
    fixture.componentRef.setInput('categories', ['A', 'B']);
    fixture.componentRef.setInput('series', [{ name: 'S', data: [10, 20] }]);
    fixture.detectChanges();
    await fixture.whenStable();
    bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'rect.mk-chart__bar',
    );
    expect(bars).toHaveLength(2);
  });

  afterEach(() => fixture.destroy());

  it('a touch tap on a bar pins its tooltip', async () => {
    bars[0].dispatchEvent(touchDown());
    await fixture.whenStable();

    const t = (chart as any).tooltip();
    expect(t).toBeTruthy();
    expect(t.category).toBe('A');
  });

  it('mouse pointerleave does not clear a pinned tooltip', async () => {
    bars[0].dispatchEvent(touchDown());
    bars[0].dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    await fixture.whenStable();

    expect((chart as any).tooltip()).toBeTruthy();
  });

  it('tapping another bar moves the pin', async () => {
    bars[0].dispatchEvent(touchDown());
    bars[1].dispatchEvent(touchDown());
    await fixture.whenStable();

    expect((chart as any).tooltip()?.category).toBe('B');
  });

  it('a pointerdown outside the chart clears the pin', async () => {
    bars[0].dispatchEvent(touchDown());
    expect((chart as any).tooltip()).toBeTruthy();

    document.body.dispatchEvent(touchDown());
    await fixture.whenStable();

    expect((chart as any).tooltip()).toBeNull();
  });

  it('mouse pointerdown does not pin — hover in/out stays transient', async () => {
    bars[0].dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    bars[0].dispatchEvent(mouseDown());
    bars[0].dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    await fixture.whenStable();

    expect((chart as any).tooltip()).toBeNull();
  });

  it('detaches its document listener on destroy', () => {
    bars[0].dispatchEvent(touchDown());
    fixture.destroy();

    // A later outside pointerdown must be a no-op (listener removed).
    expect(() => document.body.dispatchEvent(touchDown())).not.toThrow();
  });
});

describe('chart tap-to-pin (MkLineChart hit bands)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  it('pins on tap, survives pointerleave, clears on outside tap', async () => {
    const fixture = TestBed.createComponent(MkLineChart);
    fixture.componentRef.setInput('categories', ['Jan', 'Feb']);
    fixture.componentRef.setInput('series', [{ name: 'S', data: [1, 2] }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const chart = fixture.componentInstance as any;

    // The transparent hit bands are the last rects in the SVG.
    const bands = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'svg rect[fill="transparent"]',
    );
    expect(bands).toHaveLength(2);

    bands[1].dispatchEvent(touchDown());
    bands[1].dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    await fixture.whenStable();
    expect(chart.tooltip()?.category).toBe('Feb');

    document.body.dispatchEvent(touchDown());
    await fixture.whenStable();
    expect(chart.tooltip()).toBeNull();
    fixture.destroy();
  });
});

describe('chart tap-to-pin (MkDonutChart slices)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  it('pins a slice on tap and clears on outside tap', async () => {
    const fixture = TestBed.createComponent(MkDonutChart);
    fixture.componentRef.setInput('slices', [
      { name: 'Direct', value: 540 },
      { name: 'Search', value: 700 },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    const chart = fixture.componentInstance as any;

    const slices = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'path.mk-chart__slice',
    );
    expect(slices).toHaveLength(2);

    slices[1].dispatchEvent(touchDown());
    slices[1].dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    await fixture.whenStable();
    expect(chart.tooltip()?.name).toBe('Search');

    document.body.dispatchEvent(touchDown());
    await fixture.whenStable();
    expect(chart.tooltip()).toBeNull();
    fixture.destroy();
  });
});
