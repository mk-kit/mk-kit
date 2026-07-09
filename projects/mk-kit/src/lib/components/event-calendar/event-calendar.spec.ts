import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkEventCalendar, type MkCalendarEvent } from './event-calendar';

describe('MkEventCalendar', () => {
  let fixture: ComponentFixture<MkEventCalendar>;
  let cmp: MkEventCalendar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkEventCalendar);
    cmp = fixture.componentInstance;
    // July 2026.
    fixture.componentRef.setInput('viewDate', new Date(2026, 6, 15));
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function findCell(day: number): any {
    for (const week of (cmp as any).weekCells()) {
      for (const cell of week) {
        if (!cell.outside && cell.date.getDate() === day) return cell;
      }
    }
    throw new Error(`cell for day ${day} not found`);
  }

  it('groups events onto the correct day cell', () => {
    const events: MkCalendarEvent[] = [
      { date: new Date(2026, 6, 9, 10, 0), title: 'Standup' },
      { date: new Date(2026, 6, 9, 14, 0), title: 'Review' },
      { date: new Date(2026, 6, 20), title: 'Ship' },
    ];
    fixture.componentRef.setInput('events', events);
    fixture.detectChanges();

    const day9 = findCell(9);
    expect(day9.visible.map((e: MkCalendarEvent) => e.title)).toEqual([
      'Standup',
      'Review',
    ]);
    const day20 = findCell(20);
    expect(day20.visible).toHaveLength(1);
    expect(day20.visible[0].title).toBe('Ship');
    // A day with no events has an empty bucket.
    expect(findCell(10).visible).toHaveLength(0);
  });

  it('shows "+N more" once events exceed maxPerDay', () => {
    fixture.componentRef.setInput('maxPerDay', 2);
    const events: MkCalendarEvent[] = [
      { date: new Date(2026, 6, 9), title: 'A' },
      { date: new Date(2026, 6, 9), title: 'B' },
      { date: new Date(2026, 6, 9), title: 'C' },
      { date: new Date(2026, 6, 9), title: 'D' },
    ];
    fixture.componentRef.setInput('events', events);
    fixture.detectChanges();

    const day9 = findCell(9);
    expect(day9.visible).toHaveLength(2);
    expect(day9.overflow).toBe(2);
  });

  it('nextMonth shifts viewDate forward one month and emits monthChange', () => {
    const seen: Date[] = [];
    cmp.monthChange.subscribe((d) => seen.push(d));

    (cmp as any).nextMonth();
    expect(cmp.viewDate().getMonth()).toBe(7); // August
    expect(cmp.viewDate().getFullYear()).toBe(2026);
    expect(seen).toHaveLength(1);
    expect(seen[0].getMonth()).toBe(7);
  });

  it('prevMonth shifts viewDate back one month and emits monthChange', () => {
    const seen: Date[] = [];
    cmp.monthChange.subscribe((d) => seen.push(d));

    (cmp as any).prevMonth();
    expect(cmp.viewDate().getMonth()).toBe(5); // June
    expect(seen).toHaveLength(1);
  });

  it('dayClick emits the clicked date; eventClick stops propagation', () => {
    const event: MkCalendarEvent = { date: new Date(2026, 6, 9), title: 'A' };
    const days: Date[] = [];
    const events: MkCalendarEvent[] = [];
    cmp.dayClick.subscribe((d) => days.push(d));
    cmp.eventClick.subscribe((e) => events.push(e));

    (cmp as any).onDayClick(event.date);
    expect(days).toHaveLength(1);
    expect(days[0].getDate()).toBe(9);

    const stop = vi.fn();
    (cmp as any).onEventClick({ stopPropagation: stop } as any, event);
    expect(stop).toHaveBeenCalled();
    expect(events).toEqual([event]);
  });
});
