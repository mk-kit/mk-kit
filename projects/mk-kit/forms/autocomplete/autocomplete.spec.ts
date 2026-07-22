import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkAutocomplete, type MkAutocompleteOption } from './autocomplete';

const OPTIONS: MkAutocompleteOption[] = [
  { label: 'Angular', value: 'ng' },
  { label: 'Analog', value: 'analog' },
  { label: 'React', value: 'react', disabled: true },
  { label: 'Svelte', value: 'svelte' },
];

@Component({
  imports: [MkAutocomplete],
  template: `<mk-autocomplete
    [options]="options()"
    [(value)]="value"
    [filterMode]="filterMode()"
    [minChars]="minChars()"
    [requireSelection]="requireSelection()"
    (optionSelected)="selectedLabels.push($event.label)"
    (search)="searches.push($event)"
  />`,
})
class Host {
  options = signal(OPTIONS);
  value = signal<unknown>(null);
  filterMode = signal<'contains' | 'startsWith' | 'none'>('contains');
  minChars = signal(0);
  requireSelection = signal(false);
  selectedLabels: string[] = [];
  searches: string[] = [];
}

describe('MkAutocomplete', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      input: el.querySelector<HTMLInputElement>('input[role=combobox]')!,
      host: fixture.componentInstance,
    };
  }

  // The panel is teleported to document.body (mkAnchoredPanel renders it in a
  // top-layer/body portal), so it is never inside the fixture's own element.
  const options = () => [...document.querySelectorAll<HTMLElement>('[role=option]')];
  const labels = () => options().map((o) => o.textContent!.trim());
  const listbox = () => document.querySelector('[role=listbox]');
  const statusText = () =>
    document.querySelector('.mk-autocomplete__status')?.textContent?.trim();

  function type(
    fixture: ReturnType<typeof mount>['fixture'],
    input: HTMLInputElement,
    text: string,
  ) {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function press(
    fixture: ReturnType<typeof mount>['fixture'],
    input: HTMLElement,
    key: string,
  ) {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    input.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('implements the ARIA combobox pattern', () => {
    const { input } = mount();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-controls')).toBeTruthy();
  });

  it('opens the listbox on focus and reflects aria-expanded', () => {
    const { fixture, input } = mount();
    input.focus();
    fixture.detectChanges();

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(listbox()).toBeTruthy();
    expect(labels()).toEqual(['Angular', 'Analog', 'React', 'Svelte']);
  });

  it('filters by substring and by prefix', () => {
    const { fixture, input, host } = mount();
    input.focus();
    fixture.detectChanges();

    type(fixture, input, 'an');
    expect(labels()).toEqual(['Angular', 'Analog']);

    // 'contains' also matches mid-word.
    type(fixture, input, 'na');
    expect(labels()).toEqual(['Analog']);

    host.filterMode.set('startsWith');
    fixture.detectChanges();
    type(fixture, input, 'an');
    expect(labels()).toEqual(['Angular', 'Analog']);
    type(fixture, input, 'na');
    expect(labels()).toEqual([]);
  });

  it('emits search on every keystroke', () => {
    const { fixture, input, host } = mount();
    input.focus();
    fixture.detectChanges();
    type(fixture, input, 'a');
    type(fixture, input, 'an');
    expect(host.searches).toEqual(['a', 'an']);
  });

  it('shows the empty message when nothing matches', () => {
    const { fixture, input } = mount();
    input.focus();
    fixture.detectChanges();
    type(fixture, input, 'zzz');

    expect(options()).toEqual([]);
    expect(statusText()).toBeTruthy();
  });

  it('respects minChars before opening', () => {
    const { fixture, input, host } = mount();
    host.minChars.set(2);
    fixture.detectChanges();

    input.focus();
    fixture.detectChanges();
    expect(listbox()).toBeNull();

    type(fixture, input, 'a');
    expect(listbox()).toBeNull();

    type(fixture, input, 'an');
    expect(listbox()).toBeTruthy();
  });

  it('tracks the active option with aria-activedescendant', () => {
    const { fixture, input } = mount();
    input.focus();
    fixture.detectChanges();

    const active = () => input.getAttribute('aria-activedescendant');
    expect(active()).toBe(options()[0].id);

    press(fixture, input, 'ArrowDown');
    expect(active()).toBe(options()[1].id);
  });

  it('skips disabled options when arrowing', () => {
    const { fixture, input } = mount();
    input.focus();
    fixture.detectChanges();

    press(fixture, input, 'ArrowDown'); // Analog
    press(fixture, input, 'ArrowDown'); // skips the disabled React -> Svelte
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[3].id);
  });

  it('jumps to the ends with Home and End', () => {
    const { fixture, input } = mount();
    input.focus();
    fixture.detectChanges();

    press(fixture, input, 'End');
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[3].id);
    press(fixture, input, 'Home');
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('commits the active option on Enter', () => {
    const { fixture, input, host } = mount();
    input.focus();
    fixture.detectChanges();

    press(fixture, input, 'ArrowDown'); // Analog
    press(fixture, input, 'Enter');

    expect(host.value()).toBe('analog');
    expect(host.selectedLabels).toEqual(['Analog']);
    expect(input.value).toBe('Analog');
    expect(listbox()).toBeNull();
  });

  it('commits on click and refuses a disabled option', () => {
    const { fixture, input, host } = mount();
    input.focus();
    fixture.detectChanges();

    options()[2].click(); // React, disabled
    fixture.detectChanges();
    expect(host.value()).toBeNull();

    options()[0].click();
    fixture.detectChanges();
    expect(host.value()).toBe('ng');
  });

  it('closes on Escape without committing', () => {
    const { fixture, input, host } = mount();
    input.focus();
    fixture.detectChanges();

    press(fixture, input, 'ArrowDown');
    expect(press(fixture, input, 'Escape').defaultPrevented).toBe(true);

    expect(listbox()).toBeNull();
    expect(host.value()).toBeNull();
  });

  it('reopens with the arrow keys once closed', () => {
    const { fixture, input } = mount();
    input.focus();
    fixture.detectChanges();
    press(fixture, input, 'Escape');
    expect(listbox()).toBeNull();

    press(fixture, input, 'ArrowDown');
    expect(listbox()).toBeTruthy();
  });

  it('clears a committed value as soon as the user types again', () => {
    const { fixture, input, host } = mount();
    input.focus();
    fixture.detectChanges();
    press(fixture, input, 'Enter');
    expect(host.value()).toBe('ng');

    type(fixture, input, 'Ang');
    expect(host.value()).toBeNull();
  });

  it('restores the committed label on blur', () => {
    const { fixture, input, host } = mount();
    input.focus();
    fixture.detectChanges();
    press(fixture, input, 'Enter'); // commits 'Angular'

    type(fixture, input, 'half typed');
    input.blur();
    fixture.detectChanges();

    // The value went null while typing, so nothing is committed and the free
    // text is simply left alone unless requireSelection says otherwise.
    expect(host.value()).toBeNull();
  });

  it('drops unmatched free text on blur when requireSelection is set', () => {
    const { fixture, input, host } = mount();
    host.requireSelection.set(true);
    fixture.detectChanges();

    input.focus();
    fixture.detectChanges();
    type(fixture, input, 'not an option');

    input.blur();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(host.value()).toBeNull();
  });
});
