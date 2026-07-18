import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MkCurrencyInput } from './currency-input';

function type(
  fixture: ComponentFixture<MkCurrencyInput>,
  text: string,
): HTMLInputElement {
  const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  el.value = text;
  el.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  return el;
}

describe('MkCurrencyInput', () => {
  let fixture: ComponentFixture<MkCurrencyInput>;
  let cmp: MkCurrencyInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkCurrencyInput);
    cmp = fixture.componentInstance;
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('groups thousands live while typing', () => {
    const el = type(fixture, '1234567');
    expect(el.value).toBe('1,234,567');
    expect(cmp.value()).toBe(1234567);
  });

  it('keeps a partially-typed fraction and pads it on blur', () => {
    const el = type(fixture, '1234.5');
    expect(el.value).toBe('1,234.5');
    expect(cmp.value()).toBe(1234.5);
    (cmp as any).onBlur();
    fixture.detectChanges();
    expect((cmp as any).display()).toBe('1,234.50');
  });

  it('uses locale separators (de-DE)', () => {
    fixture.componentRef.setInput('locale', 'de-DE');
    fixture.detectChanges();
    const el = type(fixture, '1234,5');
    expect(el.value).toBe('1.234,5');
    expect(cmp.value()).toBe(1234.5);
  });

  it('honours zero-decimal currencies (JPY): fraction input is dropped', () => {
    fixture.componentRef.setInput('currency', 'JPY');
    fixture.detectChanges();
    type(fixture, '12.5');
    expect(cmp.value()).toBe(12);
  });

  it('derives the symbol and its side from the locale', () => {
    fixture.componentRef.setInput('currency', 'USD');
    fixture.detectChanges();
    let info = (cmp as any).localeInfo();
    expect(info.symbol).toBe('$');
    expect(info.symbolPrefix).toBe(true);

    fixture.componentRef.setInput('locale', 'pl-PL');
    fixture.componentRef.setInput('currency', 'PLN');
    fixture.detectChanges();
    info = (cmp as any).localeInfo();
    expect(info.symbol).toBe('zł');
    expect(info.symbolPrefix).toBe(false);
  });

  it('clamps to min/max and rounds on blur', () => {
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    type(fixture, '250');
    (cmp as any).onBlur();
    expect(cmp.value()).toBe(100);
  });

  it('drops the minus sign when negatives are disallowed', () => {
    fixture.componentRef.setInput('allowNegative', false);
    type(fixture, '-42');
    expect(cmp.value()).toBe(42);
  });

  it('writeValue renders a settled value and null clears', () => {
    cmp.writeValue(1234.5);
    fixture.detectChanges();
    expect((cmp as any).display()).toBe('1,234.50');
    cmp.writeValue(null);
    fixture.detectChanges();
    expect((cmp as any).display()).toBe('');
    expect(cmp.value()).toBeNull();
  });

  it('notifies the form only on user input', () => {
    const changes: unknown[] = [];
    cmp.registerOnChange((v) => changes.push(v));
    cmp.writeValue(5);
    type(fixture, '7');
    expect(changes).toEqual([7]);
  });
});
