import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MkPhoneInput, MkPhoneValue } from './phone-input';
import { mkCountryFlag } from './phone-countries';

describe('MkPhoneInput', () => {
  let fixture: ComponentFixture<MkPhoneInput>;
  let cmp: MkPhoneInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkPhoneInput);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('defaults to US with an empty value', () => {
    expect(cmp.country()).toBe('US');
    expect(cmp.value()).toBeNull();
  });

  it('emits an E.164 string as digits are typed', () => {
    const changes: unknown[] = [];
    cmp.registerOnChange((v) => changes.push(v));
    (cmp as any).onNationalChange('2025550123');
    expect(cmp.value()).toBe('+12025550123');
    expect(changes).toEqual(['+12025550123']);
  });

  it('emits structured parts in parts mode', () => {
    fixture.componentRef.setInput('valueFormat', 'parts');
    cmp.country.set('PL');
    (cmp as any).onNationalChange('601234567');
    const v = cmp.value() as MkPhoneValue;
    expect(v.country).toBe('PL');
    expect(v.dialCode).toBe('+48');
    expect(v.national).toBe('601234567');
    expect(v.e164).toBe('+48601234567');
  });

  it('writeValue parses an E.164 string and detects the country', () => {
    cmp.writeValue('+48601234567');
    expect(cmp.country()).toBe('PL');
    expect((cmp as any).nationalMasked()).toBe('601 234 567');
    expect(cmp.value()).toBe('+48601234567');
  });

  it('keeps the current country when it shares the detected dial code', () => {
    cmp.country.set('CA');
    cmp.writeValue('+12025550123');
    expect(cmp.country()).toBe('CA');
  });

  it('writeValue accepts a parts object', () => {
    cmp.writeValue({
      country: 'DE',
      dialCode: '+49',
      national: '30123456',
      e164: '+4930123456',
    });
    expect(cmp.country()).toBe('DE');
    expect(cmp.value()).toBe('+4930123456');
  });

  it('writeValue(null) clears without notifying the form', () => {
    const changes: unknown[] = [];
    cmp.registerOnChange((v) => changes.push(v));
    cmp.writeValue('+48601234567');
    cmp.writeValue(null);
    expect(cmp.value()).toBeNull();
    expect(changes).toEqual([]);
  });

  it('re-formats the national number when the country changes', () => {
    cmp.writeValue('+48601234567');
    (cmp as any).query.set('');
    cmp.country.set('DE');
    fixture.detectChanges();
    expect(cmp.value()).toBe('+49601234567');
  });

  it('switches country on pasting a full international number', () => {
    (cmp as any).onNationalPaste({
      clipboardData: { getData: () => '+44 7911 123456' },
      preventDefault: () => {},
    } as unknown as ClipboardEvent);
    expect(cmp.country()).toBe('GB');
    expect(cmp.value()).toBe('+447911123456');
  });

  it('filters countries by name, code and dial code', () => {
    (cmp as any).query.set('pol');
    const byName = (cmp as any)
      .filtered()
      .map((o: any) => o.country.code);
    expect(byName).toContain('PL');

    (cmp as any).query.set('+48');
    const byDial = (cmp as any)
      .filtered()
      .map((o: any) => o.country.code);
    expect(byDial).toEqual(['PL']);
  });

  it('pins preferred countries to the top of the list', () => {
    fixture.componentRef.setInput('preferredCountries', ['PL', 'DE']);
    const codes = (cmp as any)
      .filtered()
      .map((o: any) => o.country.code);
    expect(codes.slice(0, 2)).toEqual(['PL', 'DE']);
  });

  it('reflects the CVA disabled state', () => {
    cmp.setDisabledState(true);
    expect((cmp as any).isDisabled()).toBe(true);
  });
});

describe('mkCountryFlag', () => {
  it('builds a regional-indicator flag', () => {
    expect(mkCountryFlag('PL')).toBe('🇵🇱');
    expect(mkCountryFlag('us')).toBe('🇺🇸');
    expect(mkCountryFlag('X')).toBe('');
  });
});
