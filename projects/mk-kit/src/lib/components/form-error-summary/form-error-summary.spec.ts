import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
});
