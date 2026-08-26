import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MkDateTimePicker } from './datetime-picker';

@Component({
  imports: [MkDateTimePicker],
  template: `
    <mk-datetime-picker
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [hour12]="hour12()"
      clearable
    />
  `,
})
class Host {
  readonly value = signal<Date | null>(null);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly step = signal(30);
  readonly hour12 = signal(false);
}

describe('MkDateTimePicker', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const picker = (): MkDateTimePicker =>
    fixture.debugElement.children[0].componentInstance as MkDateTimePicker;
  const input = (): HTMLInputElement =>
    (fixture.nativeElement as HTMLElement).querySelector('input')!;
  const panel = (): HTMLElement | null =>
    document.querySelector('.mk-datetime-picker__panel');

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function type(text: string, commit = true): Promise<void> {
    const el = input();
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    if (commit) {
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      );
    }
    await settle();
  }

  async function openPanel(): Promise<HTMLElement> {
    (picker() as any).openPanel();
    await settle();
    const p = panel();
    expect(p).toBeTruthy();
    return p!;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  afterEach(() => fixture.destroy());

  describe('display', () => {
    it('renders the value with date and 24h time by default', async () => {
      host.value.set(new Date(2026, 7, 26, 14, 5));
      await settle();
      expect(input().value).toBe('Aug 26, 2026 14:05');
    });

    it('renders 12-hour time with AM/PM under hour12', async () => {
      host.hour12.set(true);
      host.value.set(new Date(2026, 7, 26, 14, 5));
      await settle();
      expect(input().value).toBe('Aug 26, 2026 2:05 PM');
    });

    it('is empty when there is no value', () => {
      expect(input().value).toBe('');
    });
  });

  describe('typing', () => {
    it('parses "YYYY-MM-DD HH:mm"', async () => {
      await type('2026-08-26 14:30');
      const v = host.value()!;
      expect(v).toBeInstanceOf(Date);
      expect([v.getFullYear(), v.getMonth(), v.getDate(), v.getHours(), v.getMinutes()]).toEqual(
        [2026, 7, 26, 14, 30],
      );
      expect(v.getSeconds()).toBe(0);
    });

    it('parses the ISO "T" separator and am/pm suffixes', async () => {
      await type('2026-08-26T09:05');
      expect(host.value()!.getHours()).toBe(9);
      await type('2026-08-26 2:30 pm');
      expect(host.value()!.getHours()).toBe(14);
      expect(host.value()!.getMinutes()).toBe(30);
    });

    it('treats a bare ISO date as midnight', async () => {
      await type('2026-08-26');
      const v = host.value()!;
      expect([v.getDate(), v.getHours(), v.getMinutes()]).toEqual([26, 0, 0]);
    });

    it('parses a natural date followed by a time', async () => {
      await type('Aug 26, 2026 7:45');
      const v = host.value()!;
      expect([v.getMonth(), v.getDate(), v.getHours(), v.getMinutes()]).toEqual([7, 26, 7, 45]);
    });

    it('reverts invalid text to the current value', async () => {
      host.value.set(new Date(2026, 7, 26, 14, 5));
      await settle();
      await type('not a date');
      expect(host.value()!.getHours()).toBe(14);
      expect(input().value).toBe('Aug 26, 2026 14:05');
    });

    it('clears the value on empty text', async () => {
      host.value.set(new Date(2026, 7, 26, 14, 5));
      await settle();
      await type('');
      expect(host.value()).toBeNull();
    });

    it('clamps typed values into [min, max] at minute precision', async () => {
      host.min.set(new Date(2026, 7, 26, 9, 0));
      host.max.set(new Date(2026, 7, 26, 17, 0));
      await settle();
      await type('2026-08-26 08:15');
      expect(host.value()!.getHours()).toBe(9);
      await type('2026-08-27 12:00');
      expect([host.value()!.getDate(), host.value()!.getHours()]).toEqual([26, 17]);
    });
  });

  describe('panel', () => {
    it('opens with focus in the calendar grid and lists times from step', async () => {
      host.step.set(60);
      await settle();
      const p = await openPanel();
      expect(p.contains(document.activeElement)).toBe(true);
      expect(
        (document.activeElement as HTMLElement).classList.contains('mk-calendar__day'),
      ).toBe(true);
      expect(p.querySelectorAll('.mk-datetime-picker__option').length).toBe(24);
    });

    it('holds a picked day until a time is chosen, then commits both', async () => {
      const p = await openPanel();
      (picker() as any).onCalendarPick(new Date(2026, 7, 26));
      await settle();
      expect(host.value()).toBeNull();
      expect(panel()).toBeTruthy();
      // The time list took focus so the second pick is one keystroke away.
      expect(document.activeElement).toBe(p.querySelector('.mk-datetime-picker__times'));

      (picker() as any).selectTime(29); // 30-min steps → index 29 = 14:30
      await settle();
      const v = host.value()!;
      expect([v.getDate(), v.getHours(), v.getMinutes()]).toEqual([26, 14, 30]);
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(input());
    });

    it('moves an existing value to the picked day and keeps its time', async () => {
      host.value.set(new Date(2026, 7, 26, 14, 30));
      await settle();
      await openPanel();
      (picker() as any).onCalendarPick(new Date(2026, 8, 3));
      await settle();
      const v = host.value()!;
      expect([v.getMonth(), v.getDate(), v.getHours(), v.getMinutes()]).toEqual([8, 3, 14, 30]);
      expect(panel()).toBeTruthy();
    });

    it('uses today when a time is picked before any day', async () => {
      await openPanel();
      (picker() as any).selectTime(0);
      await settle();
      const v = host.value()!;
      const today = new Date();
      expect([v.getFullYear(), v.getMonth(), v.getDate()]).toEqual([
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ]);
      expect([v.getHours(), v.getMinutes()]).toEqual([0, 0]);
    });

    it('only lists times inside the bound on the min / max boundary day', async () => {
      host.min.set(new Date(2026, 7, 26, 9, 0));
      host.max.set(new Date(2026, 7, 27, 12, 0));
      host.value.set(new Date(2026, 7, 26, 10, 0));
      await settle();
      let p = await openPanel();
      const labels = () =>
        Array.from(p.querySelectorAll('.mk-datetime-picker__option')).map((o) =>
          o.textContent!.trim(),
        );
      expect(labels()[0]).toBe('09:00');
      expect(labels().at(-1)).toBe('23:30');

      (picker() as any).onCalendarPick(new Date(2026, 7, 27));
      await settle();
      p = panel()!;
      expect(labels()[0]).toBe('00:00');
      expect(labels().at(-1)).toBe('12:00');
    });

    it('keyboard on the time list: arrows move, Enter selects', async () => {
      host.value.set(new Date(2026, 7, 26, 10, 0));
      await settle();
      const p = await openPanel();
      const list = p.querySelector<HTMLElement>('.mk-datetime-picker__times')!;
      const key = (k: string) =>
        list.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      key('ArrowDown');
      key('ArrowDown');
      await settle();
      expect(list.getAttribute('aria-activedescendant')).toContain('-opt-660'); // 11:00
      key('Enter');
      await settle();
      expect(host.value()!.getHours()).toBe(11);
      expect(panel()).toBeNull();
    });

    it('Escape inside the panel closes it and returns focus to the input', async () => {
      const p = await openPanel();
      const day = p.querySelector<HTMLElement>('.mk-calendar__day[tabindex="0"]')!;
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      day.dispatchEvent(event);
      await settle();
      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(input());
      expect(event.defaultPrevented).toBe(true);
    });

    it('Tab-out of the panel closes it; focus back into the field keeps it open', async () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      try {
        let p = await openPanel();
        p.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: input() }));
        await settle();
        expect(panel()).toBeTruthy();

        p = panel()!;
        outside.focus();
        p.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
        await settle();
        expect(panel()).toBeNull();
      } finally {
        outside.remove();
      }
    });

    it('clear resets the value and the pending day', async () => {
      await openPanel();
      (picker() as any).onCalendarPick(new Date(2026, 7, 26));
      await settle();
      (picker() as any).clear();
      await settle();
      expect(host.value()).toBeNull();
      expect((picker() as any).calendarValue()).toBeNull();
    });
  });

  describe('validation', () => {
    it('reports mkMinDate / mkMaxDate at minute precision', () => {
      host.min.set(new Date(2026, 7, 26, 9, 0));
      host.max.set(new Date(2026, 7, 26, 17, 0));
      fixture.detectChanges();
      const p = picker();
      const ctrl = new FormControl<Date | null>(null);
      ctrl.setValue(new Date(2026, 7, 26, 8, 59));
      expect(p.validate(ctrl)).toEqual({ mkMinDate: expect.anything() });
      ctrl.setValue(new Date(2026, 7, 26, 9, 0, 30));
      expect(p.validate(ctrl)).toBeNull();
      ctrl.setValue(new Date(2026, 7, 26, 17, 1));
      expect(p.validate(ctrl)).toEqual({ mkMaxDate: expect.anything() });
      ctrl.setValue(null);
      expect(p.validate(ctrl)).toBeNull();
    });
  });

  describe('reactive forms', () => {
    @Component({
      imports: [MkDateTimePicker, ReactiveFormsModule],
      template: `<mk-datetime-picker [formControl]="ctrl" />`,
    })
    class FormHost {
      readonly ctrl = new FormControl<Date | null>(new Date(2026, 7, 26, 14, 30));
    }

    it('writes the control value in and pushes picks out', async () => {
      const f = TestBed.createComponent(FormHost);
      f.detectChanges();
      await f.whenStable();
      const el = (f.nativeElement as HTMLElement).querySelector('input')!;
      expect(el.value).toBe('Aug 26, 2026 14:30');
      const dp = f.debugElement.children[0].componentInstance as any;
      dp.openPanel();
      f.detectChanges();
      await f.whenStable();
      dp.selectTime(20); // 10:00
      f.detectChanges();
      await f.whenStable();
      expect(f.componentInstance.ctrl.value!.getHours()).toBe(10);
      expect(f.componentInstance.ctrl.value!.getDate()).toBe(26);
      f.destroy();
    });
  });
});
