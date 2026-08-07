import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkPasswordInput } from './password-input';

describe('MkPasswordInput', () => {
  let fixture: ComponentFixture<MkPasswordInput>;
  let cmp: MkPasswordInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkPasswordInput);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('toggles the reveal state and flips the input type', () => {
    expect((cmp as any).revealed()).toBe(false);
    const input = (): HTMLInputElement =>
      fixture.nativeElement.querySelector('.mk-password-input__input');
    expect(input().type).toBe('password');

    (cmp as any).toggleReveal();
    fixture.detectChanges();
    expect((cmp as any).revealed()).toBe(true);
    expect(input().type).toBe('text');

    (cmp as any).toggleReveal();
    fixture.detectChanges();
    expect(input().type).toBe('password');
  });

  it('computes an increasing strength score with complexity', () => {
    cmp.value.set('');
    expect((cmp as any).strength()).toBe(0);

    cmp.value.set('abc');
    expect((cmp as any).strength()).toBe(1);
    expect((cmp as any).strengthLabel()).toBe('Weak');

    cmp.value.set('Abc123!x'); // 8 chars, lower+upper+digit+symbol -> capped 4
    expect((cmp as any).strength()).toBe(4);
    expect((cmp as any).strengthLabel()).toBe('Strong');
  });

  it('respects minLength for the length component of the score', () => {
    // A single character class (lowercase) so only length can add a point.
    cmp.value.set('abcdefghij'); // 10 lowercase-only chars
    fixture.componentRef.setInput('minLength', 8);
    expect((cmp as any).strength()).toBe(2); // length + 1 class
    fixture.componentRef.setInput('minLength', 20);
    expect((cmp as any).strength()).toBe(1); // fails length → 1 class only
  });

  it('writeValue seeds the model and onInput calls the registered onChange', () => {
    cmp.writeValue('seed');
    expect(cmp.value()).toBe('seed');

    let emitted = '';
    cmp.registerOnChange((v: string) => (emitted = v));
    (cmp as any).onInput({ target: { value: 'typed' } } as unknown as Event);
    expect(cmp.value()).toBe('typed');
    expect(emitted).toBe('typed');
  });

  it('evaluates the rules against the current value', () => {
    cmp.value.set('abc');
    let rules = (cmp as any).rules() as { key: string; met: boolean }[];
    const byKey = (k: string) => rules.find((r) => r.key === k)!.met;
    expect(byKey('length')).toBe(false);
    expect(byKey('uppercase')).toBe(false);
    expect(byKey('number')).toBe(false);
    expect(byKey('symbol')).toBe(false);

    cmp.value.set('Abcdef1!');
    rules = (cmp as any).rules();
    expect(byKey('length')).toBe(true);
    expect(byKey('uppercase')).toBe(true);
    expect(byKey('number')).toBe(true);
    expect(byKey('symbol')).toBe(true);
  });

  it('exposes disabled state through the CVA hook', () => {
    cmp.setDisabledState(true);
    expect((cmp as any).isDisabled()).toBe(true);
  });

  it('defaults autocomplete to current-password and binds the input through', () => {
    const input = (): HTMLInputElement =>
      fixture.nativeElement.querySelector('.mk-password-input__input');
    expect(input().getAttribute('autocomplete')).toBe('current-password');

    // Signup / change-password forms want the browser to offer a generated
    // password rather than the saved one.
    fixture.componentRef.setInput('autocomplete', 'new-password');
    fixture.detectChanges();
    expect(input().getAttribute('autocomplete')).toBe('new-password');
  });
});
