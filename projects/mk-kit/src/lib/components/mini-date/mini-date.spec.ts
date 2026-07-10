import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkMiniDate } from './mini-date';

describe('MkMiniDate', () => {
  let fixture: ComponentFixture<MkMiniDate>;
  let cmp: MkMiniDate;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkMiniDate);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('builds a Date once all three segments are set and calls onChange', () => {
    const onChange = vi.fn();
    (cmp as any).registerOnChange(onChange);

    (cmp as any).setSegment('year', 2026);
    expect(cmp.value()).toBeNull(); // incomplete → null
    (cmp as any).setSegment('month', 7);
    (cmp as any).setSegment('day', 15);

    const v = cmp.value()!;
    expect(v).toBeInstanceOf(Date);
    expect(v.getFullYear()).toBe(2026);
    expect(v.getMonth()).toBe(6); // July (0-based)
    expect(v.getDate()).toBe(15);

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as Date;
    expect(last.getDate()).toBe(15);
  });

  it('wraps the day within the month when stepping past its length', () => {
    (cmp as any).setSegment('year', 2026); // non-leap
    (cmp as any).setSegment('month', 2); // February → 28 days
    (cmp as any).setSegment('day', 28);

    (cmp as any).step('day', 1); // past the last day → wraps to 1
    expect(cmp.value()!.getDate()).toBe(1);

    (cmp as any).step('day', -1); // wraps back to the last day
    expect(cmp.value()!.getDate()).toBe(28);
  });

  it('clamps day 31 to the February length (28 in a common year)', () => {
    (cmp as any).setSegment('year', 2026); // common year
    (cmp as any).setSegment('month', 2);
    (cmp as any).setSegment('day', 31);

    const v = cmp.value()!;
    expect(v.getMonth()).toBe(1); // February
    expect(v.getDate()).toBe(28);
  });

  it('clamps day 31 to 29 for February in a leap year', () => {
    (cmp as any).setSegment('year', 2024); // leap year
    (cmp as any).setSegment('month', 2);
    (cmp as any).setSegment('day', 31);

    expect(cmp.value()!.getDate()).toBe(29);
  });

  it('respects the min bound when composing the date', () => {
    fixture.componentRef.setInput('min', new Date(2026, 6, 10));
    (cmp as any).setSegment('year', 2026);
    (cmp as any).setSegment('month', 7);
    (cmp as any).setSegment('day', 1); // before min → clamped up

    const v = cmp.value()!;
    expect(v.getDate()).toBe(10);
  });

  it('splits an incoming Date into the segments via writeValue', () => {
    cmp.writeValue(new Date(2026, 6, 15));
    const parts = (cmp as any).parts() as Array<{
      key: string;
      valueNow: number | null;
    }>;
    const byKey = Object.fromEntries(parts.map((p) => [p.key, p.valueNow]));
    expect(byKey['day']).toBe(15);
    expect(byKey['month']).toBe(7);
    expect(byKey['year']).toBe(2026);
    expect(cmp.value()).toEqual(new Date(2026, 6, 15));
  });

  it('clears the segments when writeValue(null) is passed', () => {
    cmp.writeValue(new Date(2026, 6, 15));
    cmp.writeValue(null);
    const parts = (cmp as any).parts() as Array<{ filled: boolean }>;
    expect(parts.every((p) => !p.filled)).toBe(true);
    expect(cmp.value()).toBeNull();
  });

  it('Home/End jump a segment to its min/max', () => {
    (cmp as any).setSegment('year', 2026);
    (cmp as any).setSegment('month', 2); // February → 28 days
    (cmp as any).setSegment('day', 10);

    const event = (key: string) =>
      Object.assign(new KeyboardEvent('keydown', { key }), {
        preventDefault: () => {},
      });
    (cmp as any).onSegKeydown('day', 0, event('End'));
    expect(cmp.value()!.getDate()).toBe(28);

    (cmp as any).onSegKeydown('day', 0, event('Home'));
    expect(cmp.value()!.getDate()).toBe(1);
  });

  it('orders the rendered segments by the `order` input', () => {
    fixture.componentRef.setInput('order', 'ymd');
    fixture.detectChanges();
    const keys = ((cmp as any).parts() as Array<{ key: string }>).map(
      (p) => p.key,
    );
    expect(keys).toEqual(['year', 'month', 'day']);
  });
});
