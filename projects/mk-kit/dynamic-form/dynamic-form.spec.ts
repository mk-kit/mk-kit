import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { MkDynamicFieldDef, MkDynamicForm } from './dynamic-form';
import { MkDynamicSchema } from './dynamic-form.types';
import {
  mkDynamicCondition,
  mkDynamicDefaults,
  mkDynamicFlatten,
  mkDynamicForm,
  mkDynamicSpan,
  mkDynamicValidators,
} from './schema';

const SCHEMA: MkDynamicSchema = {
  columns: 2,
  fields: [
    { type: 'section', label: 'Account' },
    { key: 'name', type: 'text', label: 'Name', required: true, validators: { minLength: 2 } },
    { key: 'email', type: 'email', label: 'Email', required: true },
    { key: 'kind', type: 'select', label: 'Kind', default: 'person', options: [
      { label: 'Person', value: 'person' },
      { label: 'Company', value: 'company' },
    ] },
    { key: 'company', type: 'text', label: 'Company', showWhen: { field: 'kind', eq: 'company' }, required: true },
    { key: 'vat', type: 'text', label: 'VAT', disabledWhen: { field: 'kind', neq: 'company' } },
    { key: 'newsletter', type: 'switch', label: 'Newsletter', default: true },
    {
      type: 'group', key: 'address', label: 'Address',
      fields: [
        { key: 'city', type: 'text', label: 'City' },
        { key: 'zip', type: 'text', label: 'ZIP', validators: { pattern: '^\\d{5}$' } },
      ],
    },
    {
      type: 'array', key: 'phones', label: 'Phones', min: 1, max: 3, addLabel: 'Add phone',
      fields: [
        { key: 'label', type: 'text', label: 'Label', default: 'mobile' },
        { key: 'number', type: 'tel', label: 'Number', required: true },
      ],
      default: [{ number: '123' }],
    },
    { key: 'sig', type: 'custom', label: 'Signature', props: { renderer: 'sig' } },
  ],
};

describe('dynamic-form schema helpers', () => {
  it('builds defaults per type, group and array', () => {
    const d = mkDynamicDefaults(SCHEMA.fields);
    expect(d).toEqual({
      name: '',
      email: '',
      kind: 'person',
      company: '',
      vat: '',
      newsletter: true,
      address: { city: '', zip: '' },
      phones: [{ label: 'mobile', number: '123' }],
      sig: '',
    });
  });

  it('maps declarative validators to Angular validators', () => {
    const v = mkDynamicValidators({ key: 'x', type: 'number', required: true, validators: { min: 1, max: 5, custom: [Validators.nullValidator] } });
    expect(v.length).toBe(4);
    const checkbox = mkDynamicValidators({ key: 'c', type: 'checkbox', required: true });
    expect(checkbox[0]({ value: false } as never)).toEqual({ required: true });
    expect(checkbox[0]({ value: true } as never)).toBeNull();
    expect(mkDynamicValidators({ key: 'e', type: 'email' })[0]({ value: 'nope' } as never)).toEqual({ email: true });
  });

  it('builds a FormGroup with nested groups and arrays, applying a value', () => {
    const form = mkDynamicForm(SCHEMA, { name: 'Jo', address: { city: 'Kraków' }, phones: [{ number: '1' }, { number: '2' }] });
    expect(form.get('name')!.value).toBe('Jo');
    expect(form.get('address.city')!.value).toBe('Kraków');
    expect(form.get('address.zip')!.value).toBe('');
    expect((form.get('phones') as FormArray).length).toBe(2);
    expect(form.get('phones.0.label')!.value).toBe('mobile');
    expect(form.get('name')!.hasError('required')).toBe(false);
    form.get('name')!.setValue('');
    expect(form.get('name')!.hasError('required')).toBe(true);
  });

  it('array min/max produce minItems/maxItems errors', () => {
    const form = mkDynamicForm(SCHEMA, { phones: [] });
    expect(form.get('phones')!.errors).toEqual({ minItems: { requiredLength: 1, actualLength: 0 } });
  });

  it('evaluates the condition DSL', () => {
    const v = { kind: 'company', tags: [], address: { country: 'PL' }, n: 0 };
    expect(mkDynamicCondition(undefined, v)).toBe(true);
    expect(mkDynamicCondition({ field: 'kind', eq: 'company' }, v)).toBe(true);
    expect(mkDynamicCondition({ field: 'kind', neq: 'company' }, v)).toBe(false);
    expect(mkDynamicCondition({ field: 'kind', in: ['a', 'company'] }, v)).toBe(true);
    expect(mkDynamicCondition({ field: 'kind', notIn: ['company'] }, v)).toBe(false);
    expect(mkDynamicCondition({ field: 'address.country', eq: 'PL' }, v)).toBe(true);
    expect(mkDynamicCondition({ field: 'tags', empty: true }, v)).toBe(true);
    expect(mkDynamicCondition({ field: 'n', truthy: false }, v)).toBe(true);
    expect(mkDynamicCondition({ and: [{ field: 'kind', eq: 'company' }, { field: 'n', truthy: true }] }, v)).toBe(false);
    expect(mkDynamicCondition({ or: [{ field: 'kind', eq: 'company' }, { field: 'n', truthy: true }] }, v)).toBe(true);
    expect(mkDynamicCondition({ not: { field: 'kind', eq: 'company' } }, v)).toBe(false);
    expect(mkDynamicCondition((val) => val['kind'] === 'company', v)).toBe(true);
    expect(mkDynamicCondition({ field: 'missing.deep', empty: true }, v)).toBe(true);
  });

  it('flattens paths and computes spans', () => {
    expect(mkDynamicFlatten(SCHEMA.fields).map((f) => f.path)).toEqual([
      'name', 'email', 'kind', 'company', 'vat', 'newsletter', 'address', 'address.city', 'address.zip', 'phones', 'sig',
    ]);
    expect(mkDynamicSpan({ key: 'a', type: 'text' }, 2)).toBe(6);
    expect(mkDynamicSpan({ key: 'a', type: 'text', span: 4 }, 2)).toBe(4);
    expect(mkDynamicSpan({ type: 'section', label: 'x' }, 3)).toBe(12);
    expect(mkDynamicSpan({ key: 'a', type: 'text' }, 0)).toBe(12);
  });
});

@Component({
  imports: [MkDynamicForm, MkDynamicFieldDef],
  template: `
    <mk-dynamic-form
      [schema]="schema()"
      [(value)]="value"
      [disabled]="disabled()"
      (formSubmit)="submitted.set($event)"
      (invalidSubmit)="invalid.set(invalid() + 1)"
    >
      <ng-template mkDynamicField="sig" let-field let-control="control">
        <input class="sig-input" [value]="control.value" (input)="control.setValue($any($event.target).value)" />
      </ng-template>
      <button type="submit" class="save">Save</button>
    </mk-dynamic-form>
  `,
})
class Host {
  readonly form = viewChild.required(MkDynamicForm);
  readonly schema = signal<MkDynamicSchema>(SCHEMA);
  readonly value = signal<Record<string, unknown>>({});
  readonly disabled = signal(false);
  readonly submitted = signal<Record<string, unknown> | null>(null);
  readonly invalid = signal(0);
}

describe('MkDynamicForm', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const el = () => fixture.nativeElement as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('renders one form field per visible value field, sections, groups and arrays', () => {
    const labels = Array.from(el().querySelectorAll('.mk-form-field__label-text')).map((n) => n.textContent?.trim());
    expect(labels).toEqual(['Name', 'Email', 'Kind', 'VAT', 'City', 'ZIP', 'Label', 'Number', 'Signature']);
    expect(el().querySelector('.mk-dynamic-fields__section-title')?.textContent?.trim()).toBe('Account');
    expect(el().querySelectorAll('.mk-dynamic-fields__legend').length).toBe(2);
    expect(el().querySelector('mk-switch')?.textContent?.trim()).toBe('Newsletter');
    expect(el().querySelectorAll('.mk-dynamic-fields__item').length).toBe(1);
    expect(el().querySelector('.sig-input')).not.toBeNull();
  });

  it('exposes the visible value two-way and disables hidden / conditionally-disabled fields', async () => {
    const form = host.form().form;
    expect(host.value()).toEqual({
      name: '', email: '', kind: 'person', newsletter: true,
      address: { city: '', zip: '' }, phones: [{ label: 'mobile', number: '123' }], sig: '',
    });
    expect(form.get('company')!.disabled).toBe(true);
    expect(form.get('vat')!.disabled).toBe(true);

    form.get('kind')!.setValue('company');
    await settle();
    expect(form.get('company')!.enabled).toBe(true);
    expect(form.get('vat')!.enabled).toBe(true);
    expect(el().querySelectorAll('.mk-form-field__label-text').length).toBe(10);
    expect(host.value()).toMatchObject({ kind: 'company', company: '', vat: '' });

    host.value.set({ ...host.value(), name: 'ACME', kind: 'person' });
    await settle();
    expect(form.get('name')!.value).toBe('ACME');
    expect(form.get('company')!.disabled).toBe(true);
    expect((el().querySelector('input[type="text"]') as HTMLInputElement).value).toBe('ACME');
  });

  it('typing into a rendered control updates the value', async () => {
    const input = el().querySelector('input[type="email"]') as HTMLInputElement;
    input.value = 'a@b.co';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(host.value()['email']).toBe('a@b.co');
  });

  it('adds and removes array items within min/max', async () => {
    const add = () => el().querySelector('.mk-dynamic-fields__array-actions button') as HTMLButtonElement;
    const removes = () => Array.from(el().querySelectorAll<HTMLButtonElement>('.mk-dynamic-fields__remove'));
    expect(add().textContent?.trim()).toBe('Add phone');
    expect(removes()[0].disabled).toBe(true); // min 1
    add().click();
    await settle();
    add().click();
    await settle();
    expect((host.value()['phones'] as unknown[]).length).toBe(3);
    expect(add().disabled).toBe(true); // max 3
    removes()[1].click();
    await settle();
    expect((host.value()['phones'] as unknown[]).length).toBe(2);
    expect((host.form().form.get('phones') as FormArray).length).toBe(2);
  });

  it('submits only when valid, otherwise touches everything and emits invalidSubmit', async () => {
    const save = el().querySelector('.save') as HTMLButtonElement;
    save.click();
    await settle();
    expect(host.submitted()).toBeNull();
    expect(host.invalid()).toBe(1);
    expect(host.form().form.get('name')!.touched).toBe(true);
    expect(el().querySelectorAll('.mk-form-field__error').length).toBeGreaterThan(0);

    host.form().patch({ name: 'Jo', email: 'jo@x.io' });
    await settle();
    expect(host.form().valid()).toBe(true);
    save.click();
    await settle();
    expect(host.submitted()).toMatchObject({ name: 'Jo', email: 'jo@x.io', kind: 'person' });
  });

  it('custom templates receive the control', async () => {
    const sig = el().querySelector('.sig-input') as HTMLInputElement;
    sig.value = 'signed';
    sig.dispatchEvent(new Event('input'));
    await settle();
    expect(host.value()['sig']).toBe('signed');
  });

  it('disabled input disables the whole form and re-enables respecting conditions', async () => {
    host.disabled.set(true);
    await settle();
    expect(host.form().form.disabled).toBe(true);
    host.disabled.set(false);
    await settle();
    expect(host.form().form.get('name')!.enabled).toBe(true);
    expect(host.form().form.get('company')!.disabled).toBe(true);
  });

  it('reset restores defaults and schema changes rebuild while keeping values', async () => {
    host.form().patch({ name: 'Keep me' });
    await settle();
    host.schema.set({ fields: [{ key: 'name', type: 'text', label: 'Name' }, { key: 'extra', type: 'number', label: 'Extra' }] });
    await settle();
    expect(host.form().form.get('name')!.value).toBe('Keep me');
    expect(host.form().form.get('extra')!.value).toBeNull();
    expect(host.form().form.get('email')).toBeNull();
    host.form().reset();
    await settle();
    expect(host.form().form.get('name')!.value).toBe('');
    expect(host.value()).toEqual({ name: '', extra: null });
    expect(host.form().form instanceof FormGroup).toBe(true);
  });
});
