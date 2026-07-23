import { MkCalendarEvent } from './event-calendar';
import { allDayEvents, layoutTimedEvents } from './event-calendar-layout';

const DAY = new Date(2026, 6, 23);

function ev(
  startH: number,
  startM: number,
  endH: number,
  endM: number,
  title = 'x',
): MkCalendarEvent {
  return {
    date: DAY,
    title,
    start: new Date(2026, 6, 23, startH, startM),
    end: new Date(2026, 6, 23, endH, endM),
  };
}

describe('layoutTimedEvents', () => {
  it('positions an event by time within the visible range', () => {
    const [p] = layoutTimedEvents([ev(10, 0, 11, 0)], DAY, 8, 22);
    // 8..22 = 14h; 10:00 is 2h in -> 2/14
    expect(p.top).toBeCloseTo((2 / 14) * 100, 5);
    expect(p.height).toBeCloseTo((1 / 14) * 100, 5);
    expect(p.lane).toBe(0);
    expect(p.lanes).toBe(1);
  });

  it('packs overlapping events into side-by-side lanes', () => {
    const placements = layoutTimedEvents(
      [ev(10, 0, 12, 0, 'a'), ev(10, 30, 11, 30, 'b'), ev(13, 0, 14, 0, 'c')],
      DAY,
      8,
      22,
    );
    const byTitle = Object.fromEntries(placements.map((p) => [p.event.title, p]));
    expect(byTitle['a'].lane).not.toBe(byTitle['b'].lane);
    expect(byTitle['a'].lanes).toBe(2);
    expect(byTitle['b'].lanes).toBe(2);
    // c starts after the cluster ended — full width again
    expect(byTitle['c'].lanes).toBe(1);
  });

  it('reuses a lane once its occupant has ended (no unbounded columns)', () => {
    const placements = layoutTimedEvents(
      [ev(10, 0, 11, 0, 'a'), ev(10, 0, 12, 30, 'b'), ev(11, 15, 12, 0, 'c')],
      DAY,
      8,
      22,
    );
    const byTitle = Object.fromEntries(placements.map((p) => [p.event.title, p]));
    // c overlaps only b, so it can take a's freed lane; cluster stays 2 wide
    expect(byTitle['c'].lane).toBe(byTitle['a'].lane);
    expect(byTitle['b'].lanes).toBe(2);
  });

  it('ignores events on other days and outside the hour range', () => {
    const other: MkCalendarEvent = {
      date: DAY,
      title: 'other-day',
      start: new Date(2026, 6, 24, 10, 0),
    };
    const early = ev(5, 0, 6, 0, 'early');
    expect(layoutTimedEvents([other, early], DAY, 8, 22)).toEqual([]);
  });

  it('clamps an event running past the range end', () => {
    const [p] = layoutTimedEvents([ev(21, 0, 23, 30)], DAY, 8, 22);
    expect(p.top + p.height).toBeCloseTo(100, 5);
  });

  it('gives a start-only event a clickable 30-minute block', () => {
    const [p] = layoutTimedEvents(
      [{ date: DAY, title: 'open-ended', start: new Date(2026, 6, 23, 10, 0) }],
      DAY,
      8,
      22,
    );
    expect(p.height).toBeCloseTo((0.5 / 14) * 100, 5);
  });
});

describe('allDayEvents', () => {
  it('returns only untimed events for the day', () => {
    const untimed: MkCalendarEvent = { date: DAY, title: 'all-day' };
    const timed = ev(10, 0, 11, 0);
    const otherDay: MkCalendarEvent = { date: new Date(2026, 6, 24), title: 'x' };
    expect(allDayEvents([untimed, timed, otherDay], DAY)).toEqual([untimed]);
  });
});
