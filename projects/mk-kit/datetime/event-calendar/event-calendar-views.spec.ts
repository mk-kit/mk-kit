import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkEventCalendar } from './event-calendar';

describe('MkEventCalendar week/day views', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function make(view: 'month' | 'week' | 'day') {
    const f = TestBed.createComponent(MkEventCalendar);
    f.componentRef.setInput('view', view);
    f.componentRef.setInput('viewDate', new Date(2026, 6, 23)); // Thursday
    f.componentRef.setInput('events', [
      {
        date: new Date(2026, 6, 23),
        title: 'Rezerwacja',
        start: new Date(2026, 6, 23, 18, 0),
        end: new Date(2026, 6, 23, 19, 30),
      },
    ]);
    f.detectChanges();
    return f;
  }

  it('month view keeps the original grid', () => {
    const f = make('month');
    expect(f.nativeElement.querySelector('.mk-event-calendar__grid')).toBeTruthy();
    expect(f.nativeElement.querySelector('.mk-event-calendar__timegrid')).toBeFalsy();
  });

  it('day view renders one column with the event block positioned', () => {
    const f = make('day');
    const cols = f.nativeElement.querySelectorAll('.mk-event-calendar__col');
    expect(cols).toHaveLength(1);
    const block = f.nativeElement.querySelector('.mk-event-calendar__block');
    expect(block.textContent.trim()).toBe('Rezerwacja');
    // 18:00 in an 8–22 grid = 10/14 down
    expect(parseFloat(block.style.top)).toBeCloseTo((10 / 14) * 100, 1);
  });

  it('week view renders seven columns with heads', () => {
    const f = make('week');
    expect(f.nativeElement.querySelectorAll('.mk-event-calendar__col')).toHaveLength(7);
    expect(
      f.nativeElement.querySelectorAll('.mk-event-calendar__col-head'),
    ).toHaveLength(7);
  });

  it('clicking an empty slot emits its start instant', () => {
    const f = make('day');
    const emitted: Date[] = [];
    f.componentInstance.slotClick.subscribe((d: Date) => emitted.push(d));
    const slots = f.nativeElement.querySelectorAll('.mk-event-calendar__slot');
    (slots[2] as HTMLButtonElement).click(); // 8 + 2 = 10:00
    expect(emitted).toHaveLength(1);
    expect(emitted[0].getHours()).toBe(10);
    expect(emitted[0].getMinutes()).toBe(0);
  });

  it('nav steps by a day in day view and a week in week view', () => {
    const day = make('day');
    (day.nativeElement.querySelectorAll('.mk-event-calendar__nav')[1] as HTMLButtonElement).click();
    expect(day.componentInstance.viewDate().getDate()).toBe(24);

    const week = make('week');
    (week.nativeElement.querySelectorAll('.mk-event-calendar__nav')[1] as HTMLButtonElement).click();
    expect(week.componentInstance.viewDate().getDate()).toBe(30);
  });

  it('an untimed event lands in the all-day strip, not the grid', () => {
    const f = TestBed.createComponent(MkEventCalendar);
    f.componentRef.setInput('view', 'day');
    f.componentRef.setInput('viewDate', new Date(2026, 6, 23));
    f.componentRef.setInput('events', [
      { date: new Date(2026, 6, 23), title: 'Święto' },
    ]);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.mk-event-calendar__block')).toBeFalsy();
    expect(
      f.nativeElement.querySelector('.mk-event-calendar__all-day .mk-event-calendar__pill')
        .textContent.trim(),
    ).toBe('Święto');
  });
});
