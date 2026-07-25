import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTimePicker } from './time-picker';

describe('MkTimePicker', () => {
  let fixture: ComponentFixture<MkTimePicker>;
  let tp: MkTimePicker;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkTimePicker);
    tp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  /** Type into the field and commit, as blur/Enter would. */
  function type(text: string): void {
    (tp as any).inputText.set(text);
    (tp as any).commitInput();
  }

  function dateMode(): void {
    fixture.componentRef.setInput('valueFormat', 'date');
    fixture.detectChanges();
  }

  // --- default (`string`) mode ----------------------------------------------

  it('starts empty', () => {
    expect(tp.value()).toBeNull();
    expect((tp as any).inputText()).toBe('');
  });

  it('emits a canonical HH:mm string by default', () => {
    const changes: unknown[] = [];
    tp.registerOnChange((v) => changes.push(v));
    type('2:30 pm');
    expect(tp.value()).toBe('14:30');
    expect(changes).toEqual(['14:30']);
  });

  it('selecting an option sets the value and notifies the form', () => {
    const changes: unknown[] = [];
    tp.registerOnChange((v) => changes.push(v));
    const options = (tp as any).options() as { value: string }[];
    (tp as any).selectOption(2); // 30-minute steps → 01:00
    expect(tp.value()).toBe(options[2].value);
    expect(changes).toEqual(['01:00']);
  });

  it('rejects a typed time outside [min, max] and restores the display', () => {
    fixture.componentRef.setInput('min', '09:00');
    fixture.detectChanges();
    type('10:30');
    type('07:30');
    expect(tp.value()).toBe('10:30');
    expect((tp as any).inputText()).toBe('10:30');
  });

  // --- `date` mode -----------------------------------------------------------

  it('valueFormat="date" emits a Date carrying the local time', () => {
    dateMode();
    const changes: unknown[] = [];
    tp.registerOnChange((v) => changes.push(v));
    type('14:30');
    const v = tp.value() as Date;
    expect(v).toBeInstanceOf(Date);
    expect(v.getHours()).toBe(14);
    expect(v.getMinutes()).toBe(30);
    expect(v.getSeconds()).toBe(0);
    expect(v.getMilliseconds()).toBe(0);
    expect(changes).toEqual([v]);
  });

  it('date mode with no prior Date lands the time on today', () => {
    dateMode();
    type('14:30');
    const v = tp.value() as Date;
    const today = new Date();
    expect(v.getFullYear()).toBe(today.getFullYear());
    expect(v.getMonth()).toBe(today.getMonth());
    expect(v.getDate()).toBe(today.getDate());
  });

  it('keeps the date part across repeated edits in date mode', () => {
    dateMode();
    tp.value.set(new Date(2026, 0, 5, 10, 0));
    fixture.detectChanges();
    type('14:30');
    type('16:45');
    const v = tp.value() as Date;
    expect(v.getFullYear()).toBe(2026);
    expect(v.getMonth()).toBe(0);
    expect(v.getDate()).toBe(5);
    expect(v.getHours()).toBe(16);
    expect(v.getMinutes()).toBe(45);
  });

  // --- reading either shape back --------------------------------------------

  it('writeValue(Date) displays the local time in string mode', () => {
    tp.writeValue(new Date(2026, 0, 5, 8, 5));
    fixture.detectChanges();
    expect((tp as any).inputText()).toBe('08:05');
    expect(tp.value()).toBe('08:05');
  });

  it('writeValue(Date) displays the local time in date mode', () => {
    dateMode();
    tp.writeValue(new Date(2026, 0, 5, 8, 5));
    fixture.detectChanges();
    expect((tp as any).inputText()).toBe('08:05');
    const v = tp.value() as Date;
    expect(v.getDate()).toBe(5);
    expect(v.getHours()).toBe(8);
    expect(v.getMinutes()).toBe(5);
  });

  it("writeValue('14:30') works in date mode too", () => {
    dateMode();
    tp.writeValue('14:30');
    fixture.detectChanges();
    expect((tp as any).inputText()).toBe('14:30');
    const v = tp.value() as Date;
    expect(v).toBeInstanceOf(Date);
    expect(v.getHours()).toBe(14);
    expect(v.getMinutes()).toBe(30);
  });

  it('writeValue does not notify the form', () => {
    const changes: unknown[] = [];
    tp.registerOnChange((v) => changes.push(v));
    tp.writeValue(new Date(2026, 0, 5, 8, 5));
    fixture.detectChanges();
    expect(changes).toEqual([]);
  });

  it('reads and writes local wall time, not UTC', () => {
    // 23:45 → 00:15 near midnight: `getUTCHours`/`setUTCHours` would report a
    // different hour (and day) in any zone with a non-zero offset.
    dateMode();
    tp.writeValue(new Date(2026, 0, 5, 23, 45));
    fixture.detectChanges();
    expect((tp as any).inputText()).toBe('23:45');
    type('00:15');
    const v = tp.value() as Date;
    expect(v.getHours()).toBe(0);
    expect(v.getMinutes()).toBe(15);
    expect(v.getDate()).toBe(5);
  });

  // --- clearing --------------------------------------------------------------

  it('clearing emits null in string mode', () => {
    type('14:30');
    const changes: unknown[] = [];
    tp.registerOnChange((v) => changes.push(v));
    (tp as any).clear();
    expect(tp.value()).toBeNull();
    expect(changes).toEqual([null]);
  });

  it('clearing emits null in date mode', () => {
    dateMode();
    type('14:30');
    const changes: unknown[] = [];
    tp.registerOnChange((v) => changes.push(v));
    (tp as any).clear();
    expect(tp.value()).toBeNull();
    expect(changes).toEqual([null]);
  });

  // --- validation ------------------------------------------------------------

  it('validates min/max against a HH:mm string', () => {
    fixture.componentRef.setInput('min', '09:00');
    fixture.componentRef.setInput('max', '17:00');
    fixture.detectChanges();
    expect(tp.validate({ value: '07:30' } as any)).toEqual({
      mkMinTime: { min: '09:00', actual: '07:30' },
    });
    expect(tp.validate({ value: '18:00' } as any)).toEqual({
      mkMaxTime: { max: '17:00', actual: '18:00' },
    });
    expect(tp.validate({ value: '10:00' } as any)).toBeNull();
    expect(tp.validate({ value: null } as any)).toBeNull();
  });

  it('validates min/max when the model is a Date', () => {
    dateMode();
    fixture.componentRef.setInput('min', '09:00');
    fixture.componentRef.setInput('max', '17:00');
    fixture.detectChanges();
    expect(tp.validate({ value: new Date(2026, 0, 5, 7, 30) } as any)).toEqual({
      mkMinTime: { min: '09:00', actual: '07:30' },
    });
    expect(tp.validate({ value: new Date(2026, 0, 5, 18, 0) } as any)).toEqual({
      mkMaxTime: { max: '17:00', actual: '18:00' },
    });
    expect(tp.validate({ value: new Date(2026, 0, 5, 10, 0) } as any)).toBeNull();
  });
});
