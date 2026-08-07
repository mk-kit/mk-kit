import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MkCalendar } from './calendar';

/**
 * Calendar layout and the today marker.
 *
 * Both cases here came from the same screen: a calendar sitting in a page
 * sidebar rather than a picker popover. It refused to fill the column, and
 * today-when-selected showed a smudge across the date.
 */
@Component({
  standalone: true,
  imports: [MkCalendar],
  template: `<mk-calendar [fullWidth]="full" [value]="today" />`,
})
class Host {
  full = false;
  today = new Date();
}

/** Host for range-mode aria assertions. */
@Component({
  standalone: true,
  imports: [MkCalendar],
  template: `<mk-calendar
    [rangeMode]="true"
    [rangeStart]="start"
    [rangeEnd]="end"
  />`,
})
class RangeHost {
  start: Date | null = null;
  end: Date | null = null;
}

describe('MkCalendar layout', () => {
  function render(full: boolean): HTMLElement {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [Host],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.full = full;
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('mk-calendar');
  }

  it('sizes to content by default', () => {
    // The common host is a date-picker popover, which must stay compact —
    // stretching it there would be the regression.
    expect(render(false).classList.contains('mk-calendar--full')).toBe(false);
  });

  it('opts into filling its container', () => {
    expect(render(true).classList.contains('mk-calendar--full')).toBe(true);
  });

  describe('today marker', () => {
    it('puts the today class on the button that owns the dot', () => {
      // The dot is a ::after on `.mk-calendar__day--today`. Its PLACEMENT is
      // pure CSS and jsdom has no layout engine — it cannot even parse the
      // component stylesheet — so this pins only that the class lands on the
      // button rather than the span. The fix itself (anchoring to the button,
      // whose box is the whole cell, instead of the `line-height: 1` span,
      // where `bottom: 4px` fell across the digits) needs a real browser.
      const today = render(false).querySelector('.mk-calendar__day--today');
      expect(today).toBeTruthy();
      expect(today!.tagName).toBe('BUTTON');
      expect(today!.querySelector('.mk-calendar__day-num')).toBeTruthy();
    });

    it('marks today as selected when it is the value', () => {
      // The combination that showed the artefact.
      const today = render(false).querySelector('.mk-calendar__day--today');
      expect(today!.classList.contains('mk-calendar__day--selected')).toBe(true);
    });
  });
});

/**
 * Range mode used to hard-return `false` from `isSelected`, so the selected
 * endpoints carried no `aria-selected` at all (WCAG 4.1.2) — the range state
 * existed only as CSS classes. The gridcells of the start, end and in-between
 * days now expose `aria-selected="true"`.
 */
describe('MkCalendar range-mode aria-selected', () => {
  function render(start: Date | null, end: Date | null) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [RangeHost],
    });
    const fixture = TestBed.createComponent(RangeHost);
    fixture.componentInstance.start = start;
    fixture.componentInstance.end = end;
    fixture.detectChanges();
    return {
      fixture,
      el: fixture.nativeElement.querySelector('mk-calendar') as HTMLElement,
    };
  }

  /** Day numbers of the cells currently exposing aria-selected="true". */
  function selectedDayNums(el: HTMLElement): number[] {
    return Array.from(
      el.querySelectorAll('[role="gridcell"][aria-selected="true"]'),
    ).map((cell) => Number(cell.textContent!.trim()));
  }

  // The view shows the current month (range mode has no value to follow), so
  // pick mid-month days that are always inside it.
  const now = new Date();
  const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), d);

  it('exposes aria-selected on the start, end and in-between days', () => {
    const { el } = render(day(10), day(13));
    expect(selectedDayNums(el)).toEqual([10, 11, 12, 13]);
  });

  it('marks only the start while the range is half-picked', () => {
    const { el } = render(day(10), null);
    expect(selectedDayNums(el)).toEqual([10]);
  });

  it('exposes nothing when no range is picked', () => {
    const { el } = render(null, null);
    expect(selectedDayNums(el)).toEqual([]);
  });

  it('hover preview stays visual-only (no aria-selected churn)', () => {
    const { fixture, el } = render(day(10), null);
    // Hover a later day: the CSS preview may extend, but the accessibility
    // tree still reports only the committed endpoint.
    const buttons = Array.from(
      el.querySelectorAll<HTMLElement>('.mk-calendar__day'),
    );
    const target = buttons.find((b) => b.textContent!.trim() === '14')!;
    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(selectedDayNums(el)).toEqual([10]);
  });
});
