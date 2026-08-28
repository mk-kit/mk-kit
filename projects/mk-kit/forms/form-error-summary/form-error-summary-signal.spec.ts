import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormField, apply, form, min, required, submit } from '@angular/forms/signals';
import { MkFormErrorSummary } from './form-error-summary';
import { MkFormField } from '../form-field/form-field';
import { MkInput } from '../input/input';
import { MkNumberInput } from '../number-input/number-input';

@Component({
  imports: [MkFormErrorSummary, MkFormField, MkInput, MkNumberInput, FormField],
  template: `
    <form (submit)="onSubmit($event)">
      <mk-form-error-summary
        [field]="f"
        [showOn]="showOn()"
        [labels]="{ email: 'Email address', age: 'Age', 'address.city': 'City' }"
        [errorMessages]="{ min: 'Adults only' }"
      />
      <mk-form-field label="Email">
        <input mkInput [formField]="f.email" />
      </mk-form-field>
      <mk-form-field label="Age">
        <mk-number-input [formField]="f.age" />
      </mk-form-field>
      <mk-form-field label="City">
        <input mkInput [formField]="f.address.city" />
      </mk-form-field>
      <button type="submit">Save</button>
    </form>
  `,
})
class Host {
  readonly summary = viewChild.required(MkFormErrorSummary);
  readonly showOn = signal<'submit' | 'always'>('submit');
  readonly model = signal({ email: '', age: 12, address: { city: '' } });
  readonly f = form(this.model, (p) => {
    required(p.email);
    min(p.age, 18);
    apply(p.address, (a) => required(a.city));
  });

  onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.f, async () => undefined);
  }
}

describe('MkFormErrorSummary with Signal Forms', () => {
  let fixture: ComponentFixture<Host>;
  const root = () => fixture.nativeElement as HTMLElement;
  const links = () => Array.from(root().querySelectorAll<HTMLAnchorElement>('.mk-form-error-summary__link'));

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('stays hidden until the fields are touched, then lists every error with labels', async () => {
    const summary = root().querySelector('mk-form-error-summary')!;
    expect(summary.hasAttribute('hidden')).toBe(true);
    expect(links()).toHaveLength(0);

    fixture.componentInstance.f().markAsTouched();
    await settle();
    expect(summary.hasAttribute('hidden')).toBe(false);
    expect(links().map((a) => a.textContent?.trim())).toEqual([
      'Email address: This field is required',
      'Age: Adults only',
      'City: This field is required',
    ]);
  });

  it('showOn="always" lists errors immediately and drops them as they are fixed', async () => {
    fixture.componentInstance.showOn.set('always');
    await settle();
    expect(links()).toHaveLength(3);
    fixture.componentInstance.f.email().value.set('a@b.co');
    fixture.componentInstance.f.age().value.set(30);
    await settle();
    expect(links().map((a) => a.textContent?.trim())).toEqual(['City: This field is required']);
  });

  it('links each entry to the bound control and focuses it on click', async () => {
    fixture.componentInstance.f().markAsTouched();
    await settle();
    const emailInput = root().querySelector<HTMLInputElement>('input[type="email"], input')!;
    expect(links()[0].getAttribute('href')).toBe(`#${emailInput.id}`);
    links()[0].click();
    expect(document.activeElement).toBe(emailInput);
  });

  it('moves focus to itself after the form is submitted with errors', async () => {
    const formEl = root().querySelector('form')!;
    formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    await settle();
    expect(links()).toHaveLength(3);
    expect(document.activeElement).toBe(fixture.componentInstance.summary()['host'].nativeElement);
  });
});
