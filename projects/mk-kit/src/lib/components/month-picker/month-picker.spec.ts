import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkMonthPicker } from './month-picker';

describe('MkMonthPicker', () => {
  let fixture: ComponentFixture<MkMonthPicker>;
  let mp: MkMonthPicker;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkMonthPicker);
    mp = fixture.componentInstance;
    mp.value.set(new Date(2026, 6, 1)); // July 2026
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('builds a 12-month grid with the selected month marked', () => {
    const cells = (mp as any).cells() as { selected: boolean; label: string }[];
    expect(cells).toHaveLength(12);
    expect(cells[6].selected).toBe(true); // July
    expect(cells[0].label).toBe('Jan');
  });

  it('selecting a month sets the value and notifies the form', () => {
    const onChange = vi.fn();
    mp.registerOnChange(onChange);
    const march = (mp as any).cells()[2];
    (mp as any).selectCell(march);
    expect(mp.value()?.getFullYear()).toBe(2026);
    expect(mp.value()?.getMonth()).toBe(2);
    expect(onChange).toHaveBeenCalled();
  });

  it('disables months outside [min, max]', () => {
    fixture.componentRef.setInput('min', new Date(2026, 3, 1)); // April
    const cells = (mp as any).cells() as { disabled: boolean }[];
    expect(cells[2].disabled).toBe(true); // March — before min
    expect(cells[3].disabled).toBe(false); // April
  });

  it('year mode builds a decade grid and selects Jan 1 of the year', () => {
    fixture.componentRef.setInput('mode', 'year');
    (mp as any).viewYear.set(2026);
    fixture.detectChanges();
    const cells = (mp as any).cells() as { year: number; label: string }[];
    expect(cells).toHaveLength(12);
    (mp as any).selectCell(cells[0]);
    expect(mp.value()?.getMonth()).toBe(0);
    expect(mp.value()?.getFullYear()).toBe(cells[0].year);
  });

  it('shiftView moves by 1 year (month) or 12 years (year)', () => {
    (mp as any).viewYear.set(2026);
    (mp as any).shiftView(1);
    expect((mp as any).viewYear()).toBe(2027);
    fixture.componentRef.setInput('mode', 'year');
    (mp as any).shiftView(1);
    expect((mp as any).viewYear()).toBe(2039);
  });
});
