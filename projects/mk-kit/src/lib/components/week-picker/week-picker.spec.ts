import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkWeekPicker } from './week-picker';
import {
  endOfWeek,
  getISOWeek,
  startOfWeek,
} from '../datetime/date-utils';

describe('week date-utils', () => {
  it('startOfWeek/endOfWeek anchor to firstDayOfWeek', () => {
    const wed = new Date(2026, 6, 8); // Wed 2026-07-08
    // Sunday-based week: Sun Jul 5 … Sat Jul 11.
    expect(startOfWeek(wed, 0)).toEqual(new Date(2026, 6, 5));
    expect(endOfWeek(wed, 0)).toEqual(new Date(2026, 6, 11));
    // Monday-based week: Mon Jul 6 … Sun Jul 12.
    expect(startOfWeek(wed, 1)).toEqual(new Date(2026, 6, 6));
    expect(endOfWeek(wed, 1)).toEqual(new Date(2026, 6, 12));
  });

  it('getISOWeek returns the ISO-8601 week number', () => {
    // 2026-01-01 is a Thursday → ISO week 1.
    expect(getISOWeek(new Date(2026, 0, 1))).toBe(1);
    // 2026-07-08 falls in ISO week 28.
    expect(getISOWeek(new Date(2026, 6, 8))).toBe(28);
    // 2024-12-30 (Monday) belongs to ISO week 1 of 2025.
    expect(getISOWeek(new Date(2024, 11, 30))).toBe(1);
  });
});

describe('MkWeekPicker', () => {
  let fixture: ComponentFixture<MkWeekPicker>;
  let wp: MkWeekPicker;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkWeekPicker);
    wp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('selecting a day commits its whole week and notifies the form', () => {
    const onChange = vi.fn();
    wp.registerOnChange(onChange);
    (wp as any).onPick(new Date(2026, 6, 8)); // Wednesday
    const week = wp.value();
    expect(week?.start).toEqual(new Date(2026, 6, 5)); // Sun (default fdow 0)
    expect(week?.end).toEqual(new Date(2026, 6, 11)); // Sat
    expect(onChange).toHaveBeenCalledWith(week);
  });

  it('honours firstDayOfWeek when building the week', () => {
    fixture.componentRef.setInput('firstDayOfWeek', 1); // Monday
    (wp as any).onPick(new Date(2026, 6, 8));
    expect(wp.value()?.start).toEqual(new Date(2026, 6, 6)); // Monday
    expect(wp.value()?.end).toEqual(new Date(2026, 6, 12)); // Sunday
  });

  it('writeValue re-anchors an arbitrary date to a full week', () => {
    wp.writeValue({ start: new Date(2026, 6, 8), end: new Date(2026, 6, 8) });
    expect(wp.value()?.start).toEqual(new Date(2026, 6, 5));
    expect(wp.value()?.end).toEqual(new Date(2026, 6, 11));
  });

  it('renders a range label, optionally prefixed with the ISO week', () => {
    wp.value.set({ start: new Date(2026, 6, 6), end: new Date(2026, 6, 12) });
    expect((wp as any).displayLabel()).toBe('Jul 6 – Jul 12, 2026');
    fixture.componentRef.setInput('showWeekNumber', true);
    expect((wp as any).displayLabel()).toBe('W28 · Jul 6 – Jul 12, 2026');
  });

  it('previews the hovered week, falling back to the value otherwise', () => {
    wp.value.set({ start: new Date(2026, 6, 5), end: new Date(2026, 6, 11) });
    expect((wp as any).highlightStart()).toEqual(new Date(2026, 6, 5));
    // Hovering another week overrides the highlight.
    (wp as any).onHover(new Date(2026, 6, 15)); // following week
    expect((wp as any).highlightStart()).toEqual(new Date(2026, 6, 12));
    // Leaving restores the selected week.
    (wp as any).onHover(null);
    expect((wp as any).highlightStart()).toEqual(new Date(2026, 6, 5));
  });
});
