import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { form } from '@angular/forms/signals';
import { MkDynamicSchema } from './dynamic-form.types';
import { mkDynamicDefaults } from './schema';
import { mkDynamicFormToSignalSchema } from './signal-schema';

const SCHEMA: MkDynamicSchema = {
  fields: [
    { type: 'section', label: 'Account' },
    { key: 'name', type: 'text', label: 'Name', required: true, validators: { minLength: 2, maxLength: 5 } },
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'kind', type: 'select', default: 'person', options: [] },
    { key: 'company', type: 'text', showWhen: { field: 'kind', eq: 'company' }, required: true },
    { key: 'vat', type: 'text', disabledWhen: { field: 'kind', neq: 'company' }, validators: { pattern: '^[A-Z]{2}\\d+$' } },
    { key: 'seats', type: 'number', default: 1, validators: { min: 1, max: 5 } },
    { key: 'locked', type: 'text', disabled: true },
    { key: 'terms', type: 'checkbox', required: true },
    { key: 'code', type: 'text', validators: { custom: [Validators.pattern(/^\d+$/), (c) => (c.value === 'x' ? { banned: { reason: 'x' } } : null)] } },
    { type: 'group', key: 'address', fields: [{ key: 'city', type: 'text', required: true }] },
    {
      type: 'array', key: 'phones', min: 1, max: 2,
      fields: [
        { key: 'number', type: 'tel', required: true },
        { key: 'ext', type: 'text', showWhen: { field: 'number', empty: false } },
        { key: 'primary', type: 'checkbox', disabledWhen: { field: '$root.locked', empty: false } },
      ],
    },
  ],
};

type Model = ReturnType<typeof mkDynamicDefaults>;

function build(overrides: Record<string, unknown> = {}) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const model = signal<Model>({ ...mkDynamicDefaults(SCHEMA.fields), ...overrides });
  const f = TestBed.runInInjectionContext(() => form(model, mkDynamicFormToSignalSchema(SCHEMA)));
  return { model, f: f as any };
}

const kinds = (field: any): string[] => field().errors().map((e: { kind: string }) => e.kind);

afterEach(() => TestBed.resetTestingModule());

describe('mkDynamicFormToSignalSchema', () => {
  it('maps required / minLength / maxLength / email and sets the field metadata', () => {
    const { f } = build();
    expect(kinds(f.name)).toEqual(['required']);
    expect(f.name().required()).toBe(true);
    expect(f.name().minLength?.()).toBe(2);
    expect(f.name().maxLength?.()).toBe(5);
    f.name().value.set('A');
    expect(kinds(f.name)).toEqual(['minLength']);
    f.name().value.set('Abcdefg');
    expect(kinds(f.name)).toEqual(['maxLength']);
    f.email().value.set('nope');
    expect(kinds(f.email)).toEqual(['email']);
    f.email().value.set('a@b.co');
    expect(kinds(f.email)).toEqual([]);
  });

  it('maps min / max / pattern and a checkbox required to "must be on"', () => {
    const { f } = build({ seats: 9 });
    expect(kinds(f.seats)).toEqual(['max']);
    expect(f.seats().max?.()).toBe(5);
    f.seats().value.set(0);
    expect(kinds(f.seats)).toEqual(['min']);
    expect(kinds(f.terms)).toEqual(['required']);
    f.terms().value.set(true);
    expect(kinds(f.terms)).toEqual([]);
    f.kind().value.set('company');
    f.vat().value.set('pl123');
    expect(kinds(f.vat)).toEqual(['pattern']);
    f.vat().value.set('PL123');
    expect(kinds(f.vat)).toEqual([]);
  });

  it('runs custom ValidatorFns and keeps their keys and payloads as error kinds', () => {
    const { f } = build({ code: 'abc' });
    const errors = f.code().errors();
    expect(errors.map((e: { kind: string }) => e.kind)).toEqual(['pattern']);
    expect(errors[0].requiredPattern).toBe('/^\\d+$/');
    f.code().value.set('x');
    expect(f.code().errors().map((e: { kind: string; reason?: string }) => [e.kind, e.reason])).toEqual([
      ['pattern', undefined],
      ['banned', 'x'],
    ]);
    f.code().value.set('42');
    expect(kinds(f.code)).toEqual([]);
  });

  it('maps showWhen to hidden(), disabledWhen and disabled to disabled()', () => {
    const { f } = build({ phones: [{ number: '123', ext: '', primary: false }] });
    expect(f.company().hidden()).toBe(true);
    expect(f.vat().disabled()).toBe(true);
    expect(f.locked().disabled()).toBe(true);
    // A hidden required field does not invalidate the form.
    expect(f().valid()).toBe(false);
    f.name().value.set('Jo');
    f.terms().value.set(true);
    f.address.city().value.set('Kraków');
    expect(f().valid()).toBe(true);

    f.kind().value.set('company');
    expect(f.company().hidden()).toBe(false);
    expect(f.vat().disabled()).toBe(false);
    expect(kinds(f.company)).toEqual(['required']);
    expect(f().valid()).toBe(false);
  });

  it('applies nested groups and array items, with minItems / maxItems on the array', () => {
    const { f, model } = build();
    expect(kinds(f.address.city)).toEqual(['required']);
    expect(kinds(f.phones)).toEqual(['minItems']);
    expect(f.phones().errors()[0].requiredLength).toBe(1);

    model.update((m) => ({ ...m, phones: [{ number: '', ext: '', primary: false }] }));
    expect(kinds(f.phones)).toEqual([]);
    expect(kinds(f.phones[0].number)).toEqual(['required']);
    // Item conditions see the item's own value…
    expect(f.phones[0].ext().hidden()).toBe(true);
    f.phones[0].number().value.set('555');
    expect(f.phones[0].ext().hidden()).toBe(false);
    // …and the whole form under $root.
    expect(f.phones[0].primary().disabled()).toBe(false);
    f.locked().value.set('yes');
    expect(f.phones[0].primary().disabled()).toBe(true);

    model.update((m) => ({ ...m, phones: [1, 2, 3].map((n) => ({ number: String(n), ext: '', primary: false })) }));
    expect(kinds(f.phones)).toEqual(['maxItems']);
  });

  it('accepts a bare field list', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const model = signal({ a: '' });
    const f = TestBed.runInInjectionContext(() =>
      form(model, mkDynamicFormToSignalSchema<{ a: string }>([{ key: 'a', type: 'text', required: true }])),
    );
    expect(f.a().required()).toBe(true);
  });
});
