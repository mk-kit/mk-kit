import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  MkCardNumberInput,
  mkDetectCardBrand,
  mkLuhnCheck,
} from './card-number-input';

function type(
  fixture: ComponentFixture<MkCardNumberInput>,
  text: string,
): HTMLInputElement {
  const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  el.value = text;
  el.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return el;
}

describe('mkDetectCardBrand', () => {
  it('recognises the major networks', () => {
    expect(mkDetectCardBrand('4111')).toBe('visa');
    expect(mkDetectCardBrand('5555')).toBe('mastercard');
    expect(mkDetectCardBrand('2221')).toBe('mastercard');
    expect(mkDetectCardBrand('3714')).toBe('amex');
    expect(mkDetectCardBrand('6011')).toBe('discover');
    expect(mkDetectCardBrand('3610')).toBe('diners');
    expect(mkDetectCardBrand('3530')).toBe('jcb');
    expect(mkDetectCardBrand('9999')).toBeNull();
    expect(mkDetectCardBrand('')).toBeNull();
  });
});

describe('mkLuhnCheck', () => {
  it('validates known numbers', () => {
    expect(mkLuhnCheck('4111111111111111')).toBe(true);
    expect(mkLuhnCheck('378282246310005')).toBe(true);
    expect(mkLuhnCheck('4111111111111112')).toBe(false);
    expect(mkLuhnCheck('abc')).toBe(false);
  });
});

describe('MkCardNumberInput', () => {
  let fixture: ComponentFixture<MkCardNumberInput>;
  let cmp: MkCardNumberInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkCardNumberInput);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('groups a Visa number 4-4-4-4 and stores raw digits', () => {
    const el = type(fixture, '4111111111111111');
    expect(el.value).toBe('4111 1111 1111 1111');
    expect(cmp.value()).toBe('4111111111111111');
    expect(cmp.brand()).toBe('visa');
    expect(cmp.valid()).toBe(true);
  });

  it('uses the Amex 4-6-5 grouping and 15-digit length', () => {
    const el = type(fixture, '378282246310005');
    expect(el.value).toBe('3782 822463 10005');
    expect(cmp.brand()).toBe('amex');
    expect(cmp.valid()).toBe(true);
  });

  it('reports null validity while incomplete and false for bad Luhn', () => {
    type(fixture, '4111');
    expect(cmp.valid()).toBeNull();
    type(fixture, '4111111111111112');
    expect(cmp.valid()).toBe(false);
    expect((cmp as any).isInvalid()).toBe(false);
    (cmp as any).onBlur();
    expect((cmp as any).isInvalid()).toBe(true);
  });

  it('writeValue strips formatting', () => {
    cmp.writeValue('4111 1111 1111 1111');
    expect(cmp.value()).toBe('4111111111111111');
  });
});
