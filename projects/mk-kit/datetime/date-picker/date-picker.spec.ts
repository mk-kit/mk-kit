import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkDatePicker } from './date-picker';

/**
 * Keyboard dismissal of the calendar panel (WCAG 2.1.1, dialog pattern).
 *
 * The panel is teleported to `document.body` by MkAnchoredPanel, so handlers
 * on the component host never see events fired inside it. Escape was only
 * wired on the input — a keyboard user whose focus sat in the calendar grid
 * could not dismiss it — and Tab-out of the panel leaked it open. Both are
 * now handled on the panel element itself.
 */
describe('MkDatePicker panel keyboard dismissal', () => {
  let fixture: ComponentFixture<MkDatePicker>;
  let dp: MkDatePicker;

  function panelEl(): HTMLElement | null {
    return document.querySelector('.mk-date-picker__panel');
  }

  async function openPanel(): Promise<HTMLElement> {
    (dp as any).openPanel();
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = panelEl();
    expect(panel).toBeTruthy();
    return panel!;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkDatePicker);
    dp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('moves focus into the calendar grid on open', async () => {
    const panel = await openPanel();
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(
      (document.activeElement as HTMLElement).classList.contains(
        'mk-calendar__day',
      ),
    ).toBe(true);
  });

  it('Escape inside the panel closes it and returns focus to the input', async () => {
    const panel = await openPanel();
    const day = panel.querySelector<HTMLElement>(
      '.mk-calendar__day[tabindex="0"]',
    )!;
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    day.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((dp as any).open()).toBe(false);
    expect(panelEl()).toBeNull();
    const input =
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input');
    expect(document.activeElement).toBe(input);
    // Consumed, so an enclosing dialog's Escape handling does not also fire.
    expect(event.defaultPrevented).toBe(true);
  });

  it('Tab-out of the panel (focusout to an outside target) closes it', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    try {
      const panel = await openPanel();
      outside.focus();
      panel.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      expect((dp as any).open()).toBe(false);
      expect(panelEl()).toBeNull();
    } finally {
      outside.remove();
    }
  });

  it('focus moving from the panel back into the field keeps it open', async () => {
    const panel = await openPanel();
    const input =
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input')!;
    panel.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: input }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect((dp as any).open()).toBe(true);
  });
});

/**
 * Text parsing with a numeric `displayFormat`. `Date.parse` reads
 * '09.10.2026' as September 10, so a value displayed as `dd.MM.yyyy` was
 * swapped to another day (then clamped into min/max) the moment focus left
 * the field after a calendar pick — found on a restaurant booking form whose
 * reservations landed on days the guest never picked.
 */
describe('MkDatePicker text parsing', () => {
  let fixture: ComponentFixture<MkDatePicker>;
  let dp: MkDatePicker;

  const input = (): HTMLInputElement =>
    (fixture.nativeElement as HTMLElement).querySelector('input')!;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function blur(): Promise<void> {
    fixture.nativeElement.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    );
    await settle();
  }

  async function type(text: string): Promise<void> {
    input().value = text;
    input().dispatchEvent(new Event('input', { bubbles: true }));
    await blur();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkDatePicker);
    dp = fixture.componentInstance;
    fixture.componentRef.setInput('displayFormat', 'dd.MM.yyyy');
    await settle();
  });

  afterEach(() => fixture.destroy());

  const ymd = (d: Date | null | undefined) =>
    d ? [d.getFullYear(), d.getMonth() + 1, d.getDate()] : null;

  it('keeps a picked day whose number is a valid month when focus leaves', async () => {
    dp.value.set(new Date(2026, 9, 9));
    await settle();
    expect(input().value).toBe('09.10.2026');
    await blur();
    expect(ymd(dp.value())).toEqual([2026, 10, 9]);
  });

  it('does not clamp an untouched value into min/max on blur', async () => {
    fixture.componentRef.setInput('min', new Date(2026, 9, 8));
    fixture.componentRef.setInput('max', new Date(2026, 10, 7));
    dp.value.set(new Date(2026, 9, 11));
    await settle();
    await blur();
    expect(ymd(dp.value())).toEqual([2026, 10, 11]);
  });

  it('parses typed text day-first per the display format', async () => {
    await type('09.10.2026');
    expect(ymd(dp.value())).toEqual([2026, 10, 9]);
    await type('1.2.2027');
    expect(ymd(dp.value())).toEqual([2027, 2, 1]);
  });

  it('parses month-first when the format says so', async () => {
    fixture.componentRef.setInput('displayFormat', 'MM/dd/yyyy');
    await type('09/10/2026');
    expect(ymd(dp.value())).toEqual([2026, 9, 10]);
  });

  it('rejects an impossible day instead of rolling it over', async () => {
    dp.value.set(new Date(2026, 9, 9));
    await settle();
    await type('31.02.2026');
    expect(ymd(dp.value())).toEqual([2026, 10, 9]);
    expect(input().value).toBe('09.10.2026');
  });

  it('still accepts ISO input', async () => {
    await type('2026-10-09');
    expect(ymd(dp.value())).toEqual([2026, 10, 9]);
  });
});
