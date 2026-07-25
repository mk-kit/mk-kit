import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule } from '@angular/forms';
import { MkFormField } from '../form-field/form-field';
import {
  MkTaxIdInput,
  MK_TAX_ID_FORMATS,
  mkNipChecksum,
  mkTaxIdFormat,
  mkTaxIdIsValid,
  mkTaxIdValidator,
} from './tax-id-input';

// Valid NIPs (weighted sum of the first nine digits mod 11 === digit ten).
const NIP = '1234563218';
const NIP2 = '5260001246';
// Same first nine digits, wrong check digit.
const BAD_CHECK = '1234563219';
// First nine digits whose weighted sum leaves a remainder of 10 — no check
// digit can ever make this one valid.
const REMAINDER_10 = '1234560020';

function type(
  fixture: ComponentFixture<MkTaxIdInput>,
  text: string,
): HTMLInputElement {
  const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  el.value = text;
  el.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return el;
}

describe('mkNipChecksum / mkTaxIdIsValid / mkTaxIdFormat', () => {
  it('accepts valid NIPs and rejects broken ones', () => {
    expect(mkNipChecksum(NIP)).toBe(true);
    expect(mkNipChecksum(NIP2)).toBe(true);
    expect(mkNipChecksum(BAD_CHECK)).toBe(false);
    expect(mkNipChecksum(REMAINDER_10)).toBe(false);
    expect(mkNipChecksum('123456321')).toBe(false); // too short
  });

  it('checks shape and checksum per country', () => {
    expect(mkTaxIdIsValid('123-456-32-18', 'PL')).toBe(true);
    expect(mkTaxIdIsValid(NIP, 'pl')).toBe(true);
    expect(mkTaxIdIsValid(BAD_CHECK, 'PL')).toBe(false);
    // DE is pattern-only: nine digits pass, eight do not.
    expect(mkTaxIdIsValid('123456789', 'DE')).toBe(true);
    expect(mkTaxIdIsValid('12345678', 'DE')).toBe(false);
    // Unknown countries have no rule to fail.
    expect(mkTaxIdIsValid('whatever', 'ZZ')).toBe(true);
  });

  it('looks formats up case-insensitively', () => {
    expect(mkTaxIdFormat('pl')?.label).toBe('NIP');
    expect(mkTaxIdFormat('ZZ')).toBeUndefined();
  });

  it("every format's example matches its own rules", () => {
    for (const format of MK_TAX_ID_FORMATS) {
      expect(mkTaxIdIsValid(format.example, format.country)).toBe(true);
    }
  });
});

describe('mkTaxIdValidator', () => {
  it('validates through reactive forms', () => {
    const validate = mkTaxIdValidator('PL');
    expect(validate(new FormControl(''))).toBeNull();
    expect(validate(new FormControl('123-456-32-18'))).toBeNull();
    expect(validate(new FormControl(NIP))).toBeNull();
    expect(validate(new FormControl(BAD_CHECK))).toEqual({
      taxId: { country: 'PL', label: 'NIP', example: '123-456-32-18' },
    });
  });

  it('passes everything for an unknown country', () => {
    expect(mkTaxIdValidator('ZZ')(new FormControl('123'))).toBeNull();
  });
});

describe('MkTaxIdInput', () => {
  let fixture: ComponentFixture<MkTaxIdInput>;
  let cmp: MkTaxIdInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkTaxIdInput);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('masks as you type and stores the compact form', () => {
    const el = type(fixture, NIP);
    expect(el.value).toBe('123-456-32-18');
    expect(cmp.value()).toBe(NIP);
    expect(cmp.valid()).toBe(true);
  });

  it('drops non-digits and caps at the mask length', () => {
    type(fixture, 'ab12x3456321899');
    expect(cmp.value()).toBe(NIP);
  });

  it('reports null while incomplete and false for a bad checksum', () => {
    type(fixture, '123456');
    expect(cmp.valid()).toBeNull();
    type(fixture, BAD_CHECK);
    expect(cmp.valid()).toBe(false);
    expect((cmp as any).isInvalid()).toBe(false);
    (cmp as any).onBlur();
    expect((cmp as any).isInvalid()).toBe(true);
  });

  it('rejects a remainder-of-10 number', () => {
    type(fixture, REMAINDER_10);
    expect(cmp.valid()).toBe(false);
  });

  it('follows the country: mask, placeholder and validity', () => {
    fixture.componentRef.setInput('country', 'DE');
    fixture.detectChanges();
    const el = type(fixture, '1234567890');
    expect(el.value).toBe('123456789');
    expect(cmp.value()).toBe('123456789');
    expect(cmp.valid()).toBe(true);
    expect(el.placeholder).toBe('123456789');
  });

  it('leaves an unknown country unvalidated', () => {
    fixture.componentRef.setInput('country', 'ZZ');
    fixture.detectChanges();
    type(fixture, '42');
    expect(cmp.value()).toBe('42');
    expect(cmp.valid()).toBeNull();
  });

  it('writeValue accepts both the masked and the compact form', () => {
    cmp.writeValue('123-456-32-18');
    expect(cmp.value()).toBe(NIP);
    expect((cmp as any).masked()).toBe('123-456-32-18');
    cmp.writeValue(NIP2);
    expect(cmp.value()).toBe(NIP2);
    expect((cmp as any).masked()).toBe('526-000-12-46');
    cmp.writeValue(null);
    expect(cmp.value()).toBe('');
  });

  it('validates the bound control and lets an empty value pass', () => {
    expect(cmp.validate(new FormControl(''))).toBeNull();
    expect(cmp.validate(new FormControl(NIP))).toBeNull();
    expect(cmp.validate(new FormControl(BAD_CHECK))).toEqual({
      taxId: { country: 'PL', label: 'NIP', example: '123-456-32-18' },
    });
  });

  it('disables the field through the CVA and the input', () => {
    const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    cmp.setDisabledState(true);
    fixture.detectChanges();
    expect(el.disabled).toBe(true);
    cmp.setDisabledState(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(el.disabled).toBe(true);
  });

  it('is numeric-keyboard friendly', () => {
    const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(el.getAttribute('inputmode')).toBe('numeric');
    expect(el.getAttribute('maxlength')).toBe('13');
  });
});

@Component({
  imports: [FormsModule, MkFormField, MkTaxIdInput],
  template: `
    <mk-form-field label="NIP" hint="Ten digits" [error]="error()" required>
      <mk-tax-id-input [(ngModel)]="nip" />
    </mk-form-field>
  `,
})
class FieldHost {
  nip = NIP;
  readonly error = signal<string | null>(null);
}

describe('MkTaxIdInput inside mk-form-field', () => {
  it('adopts the field id, label and description wiring', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const label = fixture.nativeElement.querySelector(
      'label',
    ) as HTMLLabelElement;

    expect(input.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.value).toBe('123-456-32-18');

    fixture.componentInstance.error.set('Nope');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fixture.destroy();
  });
});
