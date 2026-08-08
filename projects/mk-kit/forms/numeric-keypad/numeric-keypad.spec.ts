import { Component, provideZonelessChangeDetection, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MkNumericKeypad } from './numeric-keypad';

@Component({
  imports: [MkNumericKeypad],
  template: `<mk-numeric-keypad
    [mode]="mode"
    [length]="4"
    [min]="min"
    [max]="max"
    (submit)="submitted = $event"
  />`,
})
class Host {
  readonly pad = viewChild.required(MkNumericKeypad);
  mode: 'pin' | 'quantity' | 'amount' = 'quantity';
  min: number | null = null;
  max: number | null = null;
  submitted: string | number | null | undefined;
}

describe('MkNumericKeypad', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  function setup(mutate?: (host: Host) => void) {
    const fixture = TestBed.createComponent(Host);
    if (mutate) mutate(fixture.componentInstance);
    fixture.detectChanges();
    return fixture;
  }

  function keyButton(fixture: ReturnType<typeof setup>, id: string): HTMLButtonElement {
    const pad = fixture.componentInstance.pad();
    return fixture.nativeElement.querySelector(`#${pad.padId}-${id}`)!;
  }

  it('renders 12 keys: digits 0-9, clear and backspace in quantity mode', () => {
    const fixture = setup();
    const keys = fixture.nativeElement.querySelectorAll('.mk-numeric-keypad__key');
    expect(keys.length).toBe(12);
    expect(keyButton(fixture, 'clear')).toBeTruthy();
    expect(keyButton(fixture, 'backspace')).toBeTruthy();
  });

  it('builds a numeric value from taps; clear and backspace edit it', () => {
    const fixture = setup();
    const pad = fixture.componentInstance.pad();
    keyButton(fixture, '1').click();
    keyButton(fixture, '2').click();
    expect(pad.value()).toBe(12);
    keyButton(fixture, 'backspace').click();
    expect(pad.value()).toBe(1);
    keyButton(fixture, 'clear').click();
    expect(pad.value()).toBeNull();
  });

  it('amount mode swaps clear for a decimal key and caps fraction digits', () => {
    const fixture = setup((h) => (h.mode = 'amount'));
    const pad = fixture.componentInstance.pad();
    keyButton(fixture, '4').click();
    keyButton(fixture, 'decimal').click();
    keyButton(fixture, '5').click();
    keyButton(fixture, '9').click();
    keyButton(fixture, '9').click(); // third fraction digit — ignored
    expect(pad.value()).toBe(4.59);
    // Second separator is ignored.
    keyButton(fixture, 'decimal').click();
    expect(pad.value()).toBe(4.59);
  });

  it('pin mode keeps a string (leading zeros) and auto-submits when full', () => {
    const fixture = setup((h) => (h.mode = 'pin'));
    const pad = fixture.componentInstance.pad();
    for (const d of ['0', '2', '3', '1']) keyButton(fixture, d).click();
    expect(pad.value()).toBe('0231');
    expect(fixture.componentInstance.submitted).toBe('0231');
    // A fifth digit is ignored at full length.
    keyButton(fixture, '9').click();
    expect(pad.value()).toBe('0231');
  });

  it('pin mode renders masked dots that fill with entry', () => {
    const fixture = setup((h) => (h.mode = 'pin'));
    keyButton(fixture, '1').click();
    keyButton(fixture, '2').click();
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.mk-numeric-keypad__dot');
    const filled = fixture.nativeElement.querySelectorAll('.mk-numeric-keypad__dot--filled');
    expect(dots.length).toBe(4);
    expect(filled.length).toBe(2);
  });

  it('supports physical keyboard entry and Enter-to-submit', () => {
    const fixture = setup();
    const pad = fixture.componentInstance.pad();
    const grid = fixture.nativeElement.querySelector('.mk-numeric-keypad__grid')!;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: '7', bubbles: true }));
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }));
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(pad.value()).toBe(7);
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fixture.componentInstance.submitted).toBe(7);
  });

  it('moves the roving tabindex with arrow keys', () => {
    const fixture = setup();
    const grid = fixture.nativeElement.querySelector('.mk-numeric-keypad__grid')!;
    const keys = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.mk-numeric-keypad__key',
    );
    expect(keys[0].tabIndex).toBe(0);
    expect(keys[1].tabIndex).toBe(-1);
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(keys[0].tabIndex).toBe(-1);
    expect(keys[1].tabIndex).toBe(0);
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(keys[4].tabIndex).toBe(0);
  });

  it('replaces a bare 0 instead of building 05', () => {
    const fixture = setup();
    const pad = fixture.componentInstance.pad();
    keyButton(fixture, '0').click();
    keyButton(fixture, '5').click();
    expect(pad.value()).toBe(5);
  });
});

describe('MkNumericKeypad as a form control', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  @Component({
    imports: [MkNumericKeypad, ReactiveFormsModule],
    template: `<mk-numeric-keypad [mode]="mode" [min]="1" [max]="10" [formControl]="ctrl" />`,
  })
  class FormHost {
    readonly pad = viewChild.required(MkNumericKeypad);
    mode: 'pin' | 'quantity' = 'quantity';
    readonly ctrl = new FormControl<number | string | null>(null);
  }

  it('writeValue seeds the pad and setDisabledState disables the keys', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    fixture.componentInstance.ctrl.setValue(7);
    fixture.detectChanges();
    expect(fixture.componentInstance.pad().value()).toBe(7);
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    const key = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.mk-numeric-keypad__key',
    )!;
    expect(key.disabled).toBe(true);
  });

  it('validates min/max in quantity mode', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.ctrl;
    ctrl.setValue(0);
    expect(ctrl.errors?.['min']).toEqual({ min: 1, actual: 0 });
    ctrl.setValue(11);
    expect(ctrl.errors?.['max']).toEqual({ max: 10, actual: 11 });
    ctrl.setValue(5);
    expect(ctrl.errors).toBeNull();
  });

  it('validates minlength for a partial pin; empty passes for required to catch', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.componentInstance.mode = 'pin';
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.ctrl;
    ctrl.addValidators(Validators.required);
    ctrl.setValue('12');
    expect(ctrl.errors?.['minlength']).toEqual({
      requiredLength: 4,
      actualLength: 2,
    });
    ctrl.setValue('');
    expect(ctrl.errors?.['required']).toBeTruthy();
    ctrl.setValue('1234');
    expect(ctrl.errors).toBeNull();
  });
});
