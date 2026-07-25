import { Component, provideZonelessChangeDetection, signal, type Type } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MkFormField } from '@mkornas/ui/forms/form-field';
import { MkInput } from '@mkornas/ui/forms/input';
import { MK_FIELD_PRESETS, MkField, type MkFieldKind } from './field';

@Component({
  imports: [MkField],
  template: `<input [mkField]="kind()" />`,
})
class KindHost {
  readonly kind = signal<MkFieldKind>('email');
}

@Component({
  imports: [MkField],
  template: `
    <input id="static" mkField="username" type="password" autocomplete="new-password" />
    <input id="bound" mkField="email" [attr.autocomplete]="'off'" />
  `,
})
class PrecedenceHost {}

@Component({
  imports: [MkField, MkInput, MkFormField, ReactiveFormsModule],
  template: `
    <mk-form-field label="Street">
      <input mkInput mkField="street" [formControl]="control" />
    </mk-form-field>
  `,
})
class ComposedHost {
  readonly control = new FormControl('', Validators.required);
}

function mount<T>(type: Type<T>) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  return fixture;
}

/** Read the attributes the directive owns off an element. */
function bundle(el: Element): Record<string, string | null> {
  return {
    type: el.getAttribute('type'),
    inputmode: el.getAttribute('inputmode'),
    autocomplete: el.getAttribute('autocomplete'),
    autocapitalize: el.getAttribute('autocapitalize'),
    autocorrect: el.getAttribute('autocorrect'),
    spellcheck: el.getAttribute('spellcheck'),
    enterkeyhint: el.getAttribute('enterkeyhint'),
  };
}

describe('MkField', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('applies the email bundle (no iOS auto-capitalisation, email keyboard)', () => {
    const fixture = mount(KindHost);
    expect(bundle(fixture.nativeElement.querySelector('input'))).toEqual({
      type: 'email',
      inputmode: 'email',
      autocomplete: 'email',
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      enterkeyhint: null,
    });
  });

  it('gives address fields the autocomplete tokens browsers autofill from', () => {
    const fixture = mount(KindHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    fixture.componentInstance.kind.set('street');
    fixture.detectChanges();
    expect(bundle(input)).toEqual({
      type: 'text',
      inputmode: null,
      autocomplete: 'street-address',
      autocapitalize: 'words',
      autocorrect: null,
      spellcheck: null,
      enterkeyhint: null,
    });

    fixture.componentInstance.kind.set('city');
    fixture.detectChanges();
    expect(input.getAttribute('autocomplete')).toBe('address-level2');
    expect(input.getAttribute('autocapitalize')).toBe('words');
  });

  it('applies the search bundle including enterkeyhint', () => {
    const fixture = mount(KindHost);
    fixture.componentInstance.kind.set('search');
    fixture.detectChanges();
    expect(bundle(fixture.nativeElement.querySelector('input'))).toEqual({
      type: 'search',
      inputmode: 'search',
      autocomplete: 'off',
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      enterkeyhint: 'search',
    });
  });

  it('numeric only sets inputmode, leaving type alone', () => {
    const fixture = mount(KindHost);
    fixture.componentInstance.kind.set('numeric');
    fixture.detectChanges();
    expect(bundle(fixture.nativeElement.querySelector('input'))).toEqual({
      type: null,
      inputmode: 'numeric',
      autocomplete: null,
      autocapitalize: null,
      autocorrect: null,
      spellcheck: null,
      enterkeyhint: null,
    });
  });

  it('uppercases postal codes without spellchecking them', () => {
    const fixture = mount(KindHost);
    fixture.componentInstance.kind.set('postal-code');
    fixture.detectChanges();
    expect(bundle(fixture.nativeElement.querySelector('input'))).toEqual({
      type: 'text',
      inputmode: null,
      autocomplete: 'postal-code',
      autocapitalize: 'characters',
      autocorrect: 'off',
      spellcheck: 'false',
      enterkeyhint: null,
    });
  });

  it('swaps the whole bundle when the bound kind changes, clearing stale attributes', () => {
    const fixture = mount(KindHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('inputmode')).toBe('email');

    fixture.componentInstance.kind.set('given-name');
    fixture.detectChanges();
    expect(bundle(input)).toEqual({
      type: 'text',
      inputmode: null,
      autocomplete: 'given-name',
      autocapitalize: 'words',
      autocorrect: null,
      spellcheck: null,
      enterkeyhint: null,
    });
  });

  it('sets autocorrect=off exactly where the preset disables spellcheck', () => {
    for (const preset of Object.values(MK_FIELD_PRESETS)) {
      expect(preset.autocorrect).toBe(preset.spellcheck === 'false' ? 'off' : undefined);
    }
  });

  describe('precedence', () => {
    it('keeps an attribute the consumer wrote on the element and fills in the rest', () => {
      const fixture = mount(PrecedenceHost);
      const el = fixture.nativeElement.querySelector('#static') as HTMLInputElement;
      // Authored statically → untouched.
      expect(el.getAttribute('type')).toBe('password');
      expect(el.getAttribute('autocomplete')).toBe('new-password');
      // Not authored → preset fills them in.
      expect(el.getAttribute('autocapitalize')).toBe('off');
      expect(el.getAttribute('spellcheck')).toBe('false');
      expect(el.getAttribute('autocorrect')).toBe('off');
    });

    it('overrides a template [attr.…] binding on the same element (Angular runs host bindings last)', () => {
      // Documented behaviour: only attributes present when the element is
      // created (i.e. static ones) are preserved — a template [attr.x] binding
      // is applied before the directive's host binding and therefore loses.
      // Use a static attribute to override the preset.
      const fixture = mount(PrecedenceHost);
      const el = fixture.nativeElement.querySelector('#bound') as HTMLInputElement;
      expect(el.getAttribute('autocomplete')).toBe('email');
      expect(el.getAttribute('type')).toBe('email');
      expect(el.getAttribute('inputmode')).toBe('email');
    });
  });

  it('composes with mkInput inside an mk-form-field without breaking the wiring', async () => {
    const fixture = mount(ComposedHost);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;

    // Field wiring intact: label association, required marker, mk-input class.
    expect(input.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.classList.contains('mk-input')).toBe(true);
    expect(input.getAttribute('aria-required')).toBe('true');

    // Field bundle applied on top.
    expect(input.getAttribute('autocomplete')).toBe('street-address');
    expect(input.getAttribute('autocapitalize')).toBe('words');

    // The CVA still round-trips.
    input.value = 'Marszałkowska 1';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('Marszałkowska 1');

    fixture.componentInstance.control.setValue('');
    fixture.detectChanges();
    expect(input.value).toBe('');
  });
});
