import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MK_DEFAULT_I18N } from '@mkornas/ui/core';
import { MkFormErrorSummary, type MkFormError } from './form-error-summary';

const ERRORS: MkFormError[] = [
  { fieldId: 'email', message: 'Enter a valid email' },
  { fieldId: 'age', message: 'Age must be a number' },
];

describe('MkFormErrorSummary', () => {
  let fixture: ComponentFixture<MkFormErrorSummary>;
  let cmp: MkFormErrorSummary;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkFormErrorSummary);
    cmp = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('is hidden with no errors and shown once errors arrive', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.hasAttribute('hidden')).toBe(true);

    fixture.componentRef.setInput('errors', ERRORS);
    fixture.detectChanges();
    expect(el.hasAttribute('hidden')).toBe(false);
    expect(el.querySelectorAll('.mk-form-error-summary__link')).toHaveLength(2);
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('renders each message as a link to its field', () => {
    fixture.componentRef.setInput('errors', ERRORS);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll(
      '.mk-form-error-summary__link',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(links[0].getAttribute('href')).toBe('#email');
    expect(links[0].textContent?.trim()).toBe('Enter a valid email');
  });

  it('focus() moves focus to the summary only when there are errors', () => {
    cmp.focus();
    expect(document.activeElement).not.toBe(fixture.nativeElement);

    fixture.componentRef.setInput('errors', ERRORS);
    fixture.detectChanges();
    cmp.focus();
    expect(document.activeElement).toBe(fixture.nativeElement);
  });

  it('clicking an entry focuses the referenced field', () => {
    const input = document.createElement('input');
    input.id = 'email';
    document.body.appendChild(input);

    fixture.componentRef.setInput('errors', ERRORS);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector(
      '.mk-form-error-summary__link',
    ) as HTMLAnchorElement;
    link.click();

    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('defaults the title to the i18n errorSummaryTitle', () => {
    fixture.componentRef.setInput('errors', ERRORS);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector(
      '.mk-form-error-summary__title',
    ) as HTMLElement;
    expect(title.textContent?.trim()).toBe(MK_DEFAULT_I18N.errorSummaryTitle);
  });
});

@Component({
  imports: [ReactiveFormsModule, MkFormErrorSummary],
  template: `
    <form [formGroup]="form">
      <mk-form-error-summary [form]="form" [autoFocus]="autoFocus" />
      <input formControlName="email" />
      <button type="submit">Go</button>
    </form>
  `,
})
class SubmitHost {
  readonly form = new FormGroup({
    email: new FormControl('', Validators.required),
  });
  autoFocus = true;
}

describe('MkFormErrorSummary auto-focus on submit', () => {
  let fixture: ComponentFixture<SubmitHost>;

  function mount(autoFocus: boolean) {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(SubmitHost);
    fixture.componentInstance.autoFocus = autoFocus;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  }

  async function submit() {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('moves focus to the summary when a submit surfaces errors', async () => {
    mount(true);
    const summary = fixture.nativeElement.querySelector(
      'mk-form-error-summary',
    ) as HTMLElement;
    expect(summary.hasAttribute('hidden')).toBe(true);

    await submit();

    expect(summary.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).toBe(summary);
  });

  it('does not steal focus when autoFocus is off', async () => {
    mount(false);
    await submit();
    const summary = fixture.nativeElement.querySelector(
      'mk-form-error-summary',
    ) as HTMLElement;
    expect(summary.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).not.toBe(summary);
  });

  it('does not move focus when the form is valid on submit', async () => {
    mount(true);
    fixture.componentInstance.form.controls.email.setValue('a@b.c');
    await submit();
    const summary = fixture.nativeElement.querySelector(
      'mk-form-error-summary',
    ) as HTMLElement;
    expect(summary.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).not.toBe(summary);
  });
});
