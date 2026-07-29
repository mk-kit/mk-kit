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
