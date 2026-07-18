import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import {
  MkPostalCodeInput,
  mkPostalCodeValidator,
} from './postal-code-input';

function type(
  fixture: ComponentFixture<MkPostalCodeInput>,
  text: string,
): HTMLInputElement {
  const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  el.value = text;
  el.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return el;
}

describe('MkPostalCodeInput', () => {
  let fixture: ComponentFixture<MkPostalCodeInput>;
  let cmp: MkPostalCodeInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkPostalCodeInput);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('masks a Polish code as 00-000', () => {
    fixture.componentRef.setInput('country', 'PL');
    const el = type(fixture, '00950');
    expect(el.value).toBe('00-950');
    expect(cmp.value()).toBe('00-950');
    expect(cmp.valid()).toBe(true);
  });

  it('masks and uppercases a Canadian code', () => {
    fixture.componentRef.setInput('country', 'CA');
    const el = type(fixture, 'k1a0b1');
    expect(el.value).toBe('K1A 0B1');
    expect(cmp.valid()).toBe(true);
  });

  it('accepts a short and a ZIP+4 US code', () => {
    fixture.componentRef.setInput('country', 'US');
    type(fixture, '90210');
    expect(cmp.valid()).toBe(true);
    type(fixture, '902101234');
    expect(cmp.value()).toBe('90210-1234');
    expect(cmp.valid()).toBe(true);
  });

  it('uppercases free-format GB codes and normalises the space on blur', () => {
    fixture.componentRef.setInput('country', 'GB');
    const el = type(fixture, 'sw1a1aa');
    expect(el.value).toBe('SW1A1AA');
    expect(cmp.valid()).toBe(false);
    (cmp as any).onBlur();
    expect(cmp.value()).toBe('SW1A 1AA');
    expect(cmp.valid()).toBe(true);
  });

  it('reports null validity when empty or the country is unknown', () => {
    fixture.componentRef.setInput('country', 'PL');
    expect(cmp.valid()).toBeNull();
    fixture.componentRef.setInput('country', 'XX');
    type(fixture, 'anything');
    expect(cmp.valid()).toBeNull();
  });

  it('only styles invalid after the field was touched', () => {
    fixture.componentRef.setInput('country', 'PL');
    type(fixture, '009');
    expect((cmp as any).isInvalid()).toBe(false);
    (cmp as any).onBlur();
    expect((cmp as any).isInvalid()).toBe(true);
  });

  it('defaults the placeholder to the country example', () => {
    fixture.componentRef.setInput('country', 'NL');
    fixture.detectChanges();
    expect((cmp as any).effectivePlaceholder()).toBe('1012 AB');
  });

  it('writeValue formats through the mask', () => {
    fixture.componentRef.setInput('country', 'PL');
    cmp.writeValue('00950');
    expect(cmp.value()).toBe('00-950');
  });
});

describe('mkPostalCodeValidator', () => {
  it('validates against the country pattern', () => {
    const validate = mkPostalCodeValidator('PL');
    expect(validate(new FormControl('00-950'))).toBeNull();
    expect(validate(new FormControl(''))).toBeNull();
    expect(validate(new FormControl('00950'))).toEqual({
      postalCode: { country: 'PL', example: '00-950' },
    });
  });

  it('passes unknown countries', () => {
    const validate = mkPostalCodeValidator('XX');
    expect(validate(new FormControl('whatever'))).toBeNull();
  });
});
