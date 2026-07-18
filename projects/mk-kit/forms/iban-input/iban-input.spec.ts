import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import {
  MkIbanInput,
  mkIbanChecksum,
  mkIbanIsValid,
  mkIbanValidator,
} from './iban-input';

// Well-known test IBANs (valid checksums).
const GB = 'GB82WEST12345698765432';
const DE = 'DE89370400440532013000';
const PL = 'PL61109010140000071219812874';

function type(
  fixture: ComponentFixture<MkIbanInput>,
  text: string,
): HTMLInputElement {
  const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  el.value = text;
  el.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return el;
}

describe('mkIbanChecksum / mkIbanIsValid', () => {
  it('accepts valid IBANs and rejects corrupted ones', () => {
    expect(mkIbanChecksum(GB)).toBe(true);
    expect(mkIbanChecksum(DE)).toBe(true);
    expect(mkIbanChecksum(PL)).toBe(true);
    expect(mkIbanChecksum('GB82WEST12345698765431')).toBe(false);
    expect(mkIbanIsValid(DE)).toBe(true);
    expect(mkIbanIsValid(DE + '0')).toBe(false);
    expect(mkIbanIsValid('ZZ' + DE.slice(2))).toBe(false);
  });
});

describe('mkIbanValidator', () => {
  it('validates through reactive forms', () => {
    const validate = mkIbanValidator();
    expect(validate(new FormControl(''))).toBeNull();
    expect(validate(new FormControl('de89 3704 0044 0532 0130 00'))).toBeNull();
    expect(validate(new FormControl('DE89370400440532013001'))).toEqual({
      iban: { country: 'DE', expectedLength: 22 },
    });
  });
});

describe('MkIbanInput', () => {
  let fixture: ComponentFixture<MkIbanInput>;
  let cmp: MkIbanInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkIbanInput);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('uppercases, groups by four and stores the compact form', () => {
    const el = type(fixture, 'de89370400440532013000');
    expect(el.value).toBe('DE89 3704 0044 0532 0130 00');
    expect(cmp.value()).toBe(DE);
    expect(cmp.valid()).toBe(true);
  });

  it('caps input at the country length', () => {
    type(fixture, DE + '999');
    expect(cmp.value()).toBe(DE);
  });

  it('reports null while incomplete and false for a bad checksum', () => {
    type(fixture, 'DE8937040044');
    expect(cmp.valid()).toBeNull();
    type(fixture, 'DE89370400440532013001');
    expect(cmp.valid()).toBe(false);
    expect((cmp as any).isInvalid()).toBe(false);
    (cmp as any).onBlur();
    expect((cmp as any).isInvalid()).toBe(true);
  });

  it('writeValue normalises formatting', () => {
    cmp.writeValue('pl61 1090 1014 0000 0712 1981 2874');
    expect(cmp.value()).toBe(PL);
    expect((cmp as any).grouped()).toBe('PL61 1090 1014 0000 0712 1981 2874');
  });
});
