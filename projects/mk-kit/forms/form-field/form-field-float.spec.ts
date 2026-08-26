import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MkFormField } from './form-field';
import { MkInput } from '../input/input';

@Component({
  imports: [MkFormField, MkInput, FormsModule],
  template: `
    <mk-form-field id="plain" label="Email" labelPosition="float" required>
      <input mkInput type="email" placeholder="you@example.com" />
    </mk-form-field>
    <mk-form-field id="bound" label="Name" labelPosition="float">
      <input mkInput [ngModel]="name()" (ngModelChange)="name.set($event)" />
    </mk-form-field>
    <mk-form-field id="top" label="Top">
      <input mkInput />
    </mk-form-field>
  `,
})
class Host {
  readonly name = signal('Ada');
}

describe('MkFormField float label', () => {
  let fixture: ComponentFixture<Host>;
  const root = () => fixture.nativeElement as HTMLElement;
  const field = (id: string) => root().querySelector<HTMLElement>(`#${id}`)!;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    await settle();
    await settle();
  });

  it('renders the label inside the control only in float mode', () => {
    const plain = field('plain');
    expect(plain.classList.contains('mk-form-field--float')).toBe(true);
    expect(plain.querySelector('.mk-form-field__control .mk-form-field__label--float')).toBeTruthy();
    expect(plain.querySelector(':scope > .mk-form-field__label')).toBeNull();
    const label = plain.querySelector<HTMLLabelElement>('label')!;
    expect(label.htmlFor).toBe(plain.querySelector('input')!.id);
    expect(label.textContent).toContain('*');
    const top = field('top');
    expect(top.classList.contains('mk-form-field--float')).toBe(false);
    expect(top.querySelector(':scope > .mk-form-field__label')).toBeTruthy();
  });

  it('floats on focus and on a typed value (native input, no form binding)', async () => {
    const plain = field('plain');
    const input = plain.querySelector<HTMLInputElement>('input')!;
    expect(plain.classList.contains('mk-form-field--filled')).toBe(false);
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await settle();
    expect(plain.classList.contains('mk-form-field--focused')).toBe(true);
    input.value = 'a@b.c';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await settle();
    expect(plain.classList.contains('mk-form-field--focused')).toBe(false);
    expect(plain.classList.contains('mk-form-field--filled')).toBe(true);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(plain.classList.contains('mk-form-field--filled')).toBe(false);
  });

  it('floats from a bound control value, including the initial one', async () => {
    const bound = field('bound');
    expect(bound.classList.contains('mk-form-field--filled')).toBe(true);
    fixture.componentInstance.name.set('');
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r)); // ngModel writes the control on a microtask
    await settle();
    expect(bound.classList.contains('mk-form-field--filled')).toBe(false);
  });
});
