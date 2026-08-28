import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormField, disabled, form, minLength, required, submit } from '@angular/forms/signals';
import { MkFormField } from './form-field';
import { MkInput } from '../input/input';
import { MkSelect } from '../select/select';

@Component({
  imports: [MkFormField, MkInput, MkSelect, FormField],
  template: `
    <mk-form-field id="email" label="Email">
      <input mkInput type="email" [formField]="f.email" />
    </mk-form-field>
    <mk-form-field id="name" label="Name" [errorMessages]="{ minlength: 'Too short' }">
      <input mkInput [formField]="f.name" />
    </mk-form-field>
    <mk-form-field id="country" label="Country" [field]="f.country">
      <div><mk-select [formField]="f.country" [options]="opts" /></div>
    </mk-form-field>
    <mk-form-field id="always" label="Always" errorOn="always">
      <input mkInput [formField]="f.note" />
    </mk-form-field>
    <mk-form-field id="locked" label="Locked">
      <input mkInput [formField]="f.locked" />
    </mk-form-field>
  `,
})
class Host {
  readonly opts = [{ label: 'Poland', value: 'pl' }];
  readonly model = signal({ email: '', name: 'A', country: null as string | null, note: '', locked: '' });
  readonly f = form(this.model, (p) => {
    required(p.email, { message: 'Enter your email' });
    minLength(p.name, 2);
    required(p.country);
    required(p.note);
    disabled(p.locked);
  });
}

describe('MkFormField with Signal Forms', () => {
  let fixture: ComponentFixture<Host>;
  const root = () => fixture.nativeElement as HTMLElement;
  const field = (id: string) => root().querySelector<HTMLElement>(`#${id}`)!;
  const errorOf = (id: string) => field(id).querySelector('.mk-form-field__error')?.textContent?.trim() ?? null;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  it('marks the label required from the schema and wires the control', () => {
    expect(field('email').classList.contains('mk-form-field--required')).toBe(true);
    expect(field('email').querySelector('.mk-form-field__required')).toBeTruthy();
    expect(field('name').classList.contains('mk-form-field--required')).toBe(false);
    const input = field('email').querySelector('input')!;
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(field('email').querySelector('label')!.htmlFor).toBe(input.id);
  });

  it('shows the error only after the field is touched, wording from the schema message', async () => {
    expect(errorOf('email')).toBeNull();
    expect(field('email').classList.contains('mk-form-field--invalid')).toBe(false);
    const input = field('email').querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBeNull();

    fixture.componentInstance.f.email().markAsTouched();
    await settle();
    expect(errorOf('email')).toBe('Enter your email');
    expect(field('email').classList.contains('mk-form-field--invalid')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('-error');

    input.value = 'a@b.co';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(errorOf('email')).toBeNull();
    expect(fixture.componentInstance.model().email).toBe('a@b.co');
  });

  it('uses the i18n table and per-field overrides for built-in kinds', async () => {
    const input = field('name').querySelector('input')!;
    input.value = 'B';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(errorOf('name')).toBe('Too short');

    fixture.componentInstance.f.country().markAsTouched();
    await settle();
    expect(errorOf('country')).toBe('This field is required');
  });

  it('reads an explicit [field] when the control is nested deeper', () => {
    expect(field('country').classList.contains('mk-form-field--required')).toBe(true);
  });

  it('errorOn="always" shows the error immediately', () => {
    expect(errorOf('always')).toBe('This field is required');
  });

  it('reflects a disabled field', () => {
    expect(field('locked').classList.contains('mk-form-field--disabled')).toBe(true);
    expect(field('locked').querySelector('input')!.disabled).toBe(true);
  });

  it('surfaces every error after a failed submit()', async () => {
    const action = vi.fn(async () => undefined);
    const ok = await submit(fixture.componentInstance.f, action);
    await settle();
    expect(ok).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(errorOf('email')).toBe('Enter your email');
    expect(errorOf('country')).toBe('This field is required');
  });
});
