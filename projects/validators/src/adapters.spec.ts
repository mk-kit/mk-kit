import { describe, expect, it } from 'vitest';
import {
  cardNumberValidator,
  e164Validator,
  ibanValidator,
  nipValidator,
  peselValidator,
  postalCodeValidator,
  vatIdValidator,
} from './forms.js';
import { ibanSchema, nipSchema, peselSchema, postalCodeSchema, schemaFrom } from './signals.js';

/** Minimal stand-in for Angular's AbstractControl — the adapters only read `.value`. */
const control = (value: unknown) => ({ value }) as never;

describe('@mk-kit/validators/forms', () => {
  it('returns null for valid and empty values, an error object otherwise', () => {
    expect(nipValidator()(control('123-456-32-18'))).toBeNull();
    expect(nipValidator()(control(''))).toBeNull();
    expect(nipValidator()(control(null))).toBeNull();
    expect(nipValidator()(control('1234563219'))).toEqual({ nip: { value: '1234563219' } });
    expect(peselValidator()(control('44051401359'))).toBeNull();
    expect(peselValidator()(control('44051401358'))).toEqual({ pesel: { value: '44051401358' } });
    expect(ibanValidator()(control('DE89 3704 0044 0532 0130 00'))).toBeNull();
    expect(cardNumberValidator()(control('4111111111111111'))).toBeNull();
    expect(e164Validator()(control('601234567'))).toEqual({ e164: { value: '601234567' } });
  });
  it('carries the country on postal-code and VAT errors', () => {
    expect(postalCodeValidator('PL')(control('00-950'))).toBeNull();
    expect(postalCodeValidator('PL')(control('0095'))).toEqual({
      postalCode: { value: '0095', country: 'PL' },
    });
    expect(vatIdValidator('DE')(control('123456789'))).toBeNull();
    expect(vatIdValidator('DE')(control('PL1234563218'))).toEqual({
      vatId: { value: 'PL1234563218', country: 'DE' },
    });
    expect(vatIdValidator()(control('bogus'))).toEqual({ vatId: { value: 'bogus' } });
  });
  it('stringifies non-string control values before testing', () => {
    expect(nipValidator()(control(1234563218))).toBeNull();
  });
});

describe('@mk-kit/validators/signals (Standard Schema)', () => {
  it('implements the v1 contract', () => {
    const s = nipSchema();
    expect(s['~standard'].version).toBe(1);
    expect(s['~standard'].vendor).toBe('mk-kit');
    expect(s['~standard'].validate('1234563218')).toEqual({ value: '1234563218' });
    expect(s['~standard'].validate('1234563219')).toEqual({ issues: [{ message: 'Invalid NIP' }] });
    expect(s['~standard'].validate(42)).toEqual({ issues: [{ message: 'Invalid NIP' }] });
  });
  it('passes empty values by default and can be told not to', () => {
    expect(peselSchema()['~standard'].validate('')).toEqual({ value: '' });
    expect(peselSchema()['~standard'].validate(null)).toEqual({ value: '' });
    expect(peselSchema({ allowEmpty: false })['~standard'].validate('')).toEqual({
      issues: [{ message: 'Invalid PESEL' }],
    });
  });
  it('takes a custom message and per-country parameters', () => {
    expect(ibanSchema({ message: 'Nieprawidłowy IBAN' })['~standard'].validate('x')).toEqual({
      issues: [{ message: 'Nieprawidłowy IBAN' }],
    });
    expect(postalCodeSchema('NL')['~standard'].validate('1012 AB')).toEqual({ value: '1012 AB' });
    expect(postalCodeSchema('NL')['~standard'].validate('1012')).toEqual({
      issues: [{ message: 'Invalid postal code' }],
    });
  });
  it('schemaFrom wraps any predicate', () => {
    const even = schemaFrom((v) => Number(v) % 2 === 0, 'Must be even');
    expect(even['~standard'].validate('4')).toEqual({ value: '4' });
    expect(even['~standard'].validate('5')).toEqual({ issues: [{ message: 'Must be even' }] });
  });
});
