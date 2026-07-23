import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MkI18nInput, MkI18nLocale } from './i18n-input';

const LOCALES: MkI18nLocale[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pl', label: 'PL', name: 'Polish' },
  { code: 'ru', label: 'RU', name: 'Russian' },
];

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MkI18nInput],
  template: `<mk-i18n-input
    [formControl]="control"
    [locales]="locales"
    [requiredLocales]="required()"
  />`,
})
class Host {
  control = new FormControl<Record<string, string> | null>({ en: 'Hello' });
  locales = LOCALES;
  required = signal<string[]>([]);
}

describe('MkI18nInput', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }),
  );

  function setup() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const cmp = f.debugElement.children[0].componentInstance as MkI18nInput;
    return { f, host: f.componentInstance, cmp };
  }

  function field(f: ReturnType<typeof setup>['f']): HTMLInputElement {
    return f.nativeElement.querySelector('input.mk-i18n-input__field');
  }

  it('edits one locale at a time rather than stacking a field per language', () => {
    const { f } = setup();
    expect(f.nativeElement.querySelectorAll('input.mk-i18n-input__field')).toHaveLength(1);
    expect(f.nativeElement.querySelectorAll('mk-button-toggle')).toHaveLength(3);
  });

  it('shows the first locale until switched', () => {
    const { f } = setup();
    expect(field(f).value).toBe('Hello');
    expect(field(f).getAttribute('lang')).toBe('en');
  });

  it('writes only the active locale, preserving the others', () => {
    const { f, host, cmp } = setup();
    (cmp as unknown as { onSwitch(c: string): void }).onSwitch('pl');
    f.detectChanges();
    (cmp as unknown as { onInput(t: string): void }).onInput('Cześć');
    expect(host.control.value).toEqual({ en: 'Hello', pl: 'Cześć' });
  });

  it('switching locale swaps the visible text', () => {
    const { f, cmp } = setup();
    (cmp as unknown as { onInput(t: string): void }).onInput('Hi');
    (cmp as unknown as { onSwitch(c: string): void }).onSwitch('pl');
    f.detectChanges();
    expect(field(f).value).toBe('');
    (cmp as unknown as { onSwitch(c: string): void }).onSwitch('en');
    f.detectChanges();
    expect(field(f).value).toBe('Hi');
  });

  it('accepts a null value from the form without throwing', () => {
    const { f, host } = setup();
    host.control.setValue(null);
    f.detectChanges();
    expect(field(f).value).toBe('');
  });

  it('marks a required locale that is still empty', () => {
    const { f, host, cmp } = setup();
    host.required.set(['pl']);
    f.detectChanges();
    const missing = (c: string) =>
      (cmp as unknown as { missing(c: string): boolean }).missing(c);
    expect(missing('pl')).toBe(true);
    expect(missing('en')).toBe(false); // has text
    expect(missing('ru')).toBe(false); // empty but not required
  });

  it('clears the marker once the locale has content', () => {
    const { f, host, cmp } = setup();
    host.required.set(['pl']);
    f.detectChanges();
    const api = cmp as unknown as {
      onSwitch(c: string): void;
      onInput(t: string): void;
      missing(c: string): boolean;
    };
    api.onSwitch('pl');
    api.onInput('Cześć');
    f.detectChanges();
    expect(api.missing('pl')).toBe(false);
  });

  it('treats whitespace as empty for the marker', () => {
    const { f, host, cmp } = setup();
    host.required.set(['pl']);
    f.detectChanges();
    const api = cmp as unknown as {
      onSwitch(c: string): void;
      onInput(t: string): void;
      missing(c: string): boolean;
    };
    api.onSwitch('pl');
    api.onInput('   ');
    f.detectChanges();
    expect(api.missing('pl')).toBe(true);
  });

  it('propagates the disabled state from the form', () => {
    const { f, host } = setup();
    host.control.disable();
    f.detectChanges();
    expect(field(f).disabled).toBe(true);
  });

  it('marks the control touched on blur', () => {
    const { f, host, cmp } = setup();
    expect(host.control.touched).toBe(false);
    (cmp as unknown as { onBlur(): void }).onBlur();
    f.detectChanges();
    expect(host.control.touched).toBe(true);
  });

  it('hides the switcher for a single locale', () => {
    const f = TestBed.createComponent(MkI18nInput);
    f.componentRef.setInput('locales', [{ code: 'en', label: 'EN' }]);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('mk-button-toggle')).toHaveLength(0);
  });
});
