import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MkListbox, type MkListboxOption } from './listbox';

const OPTIONS: MkListboxOption[] = [
  { label: 'Apple', value: 'apple', group: 'Fruit' },
  { label: 'Apricot', value: 'apricot', group: 'Fruit' },
  { label: 'Banana', value: 'banana', group: 'Fruit', disabled: true },
  { label: 'Carrot', value: 'carrot', group: 'Veg', description: 'Root vegetable' },
  { label: 'Celery', value: 'celery', group: 'Veg' },
];

@Component({
  imports: [MkListbox, FormsModule],
  template: `
    <mk-listbox
      [options]="options"
      [multiple]="multiple()"
      [filterable]="filterable()"
      [selectionFollowsFocus]="follows()"
      [(value)]="value"
      (change)="changes.push($event)"
      ariaLabel="Food"
    />
    <mk-listbox id="ngm" [options]="options" [(ngModel)]="modelValue" ariaLabel="Model" />
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly multiple = signal(false);
  readonly filterable = signal(false);
  readonly follows = signal(true);
  readonly value = signal<unknown>(null);
  modelValue: unknown = 'carrot';
  changes: unknown[] = [];
}

describe('MkListbox', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const box = () => root().querySelector<HTMLElement>('mk-listbox')!;
  const list = () => box().querySelector<HTMLElement>('[role=listbox]')!;
  const options = () => [...box().querySelectorAll<HTMLElement>('[role=option]')];
  const labels = () => options().map((o) => o.querySelector('.mk-listbox__label')!.textContent!.trim());
  const key = (k: string, init: KeyboardEventInit = {}) =>
    list().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('renders groups and options with listbox semantics', () => {
    expect(list().getAttribute('aria-label')).toBe('Food');
    expect(list().getAttribute('aria-multiselectable')).toBeNull();
    expect([...box().querySelectorAll('.mk-listbox__group')].map((g) => g.textContent!.trim())).toEqual(['Fruit', 'Veg']);
    expect(labels()).toEqual(['Apple', 'Apricot', 'Banana', 'Carrot', 'Celery']);
    expect(options()[2].getAttribute('aria-disabled')).toBe('true');
    expect(options()[3].querySelector('.mk-listbox__description')!.textContent).toBe('Root vegetable');
  });

  it('single: click selects, arrows move and select (selection follows focus), typeahead jumps', async () => {
    options()[3].click();
    await settle();
    expect(host.value()).toBe('carrot');
    expect(options()[3].getAttribute('aria-selected')).toBe('true');
    expect(host.changes).toEqual(['carrot']);

    key('ArrowDown');
    await settle();
    expect(host.value()).toBe('celery');
    expect(list().getAttribute('aria-activedescendant')).toBe(options()[4].id);
    key('ArrowDown'); // wraps to Apple
    await settle();
    expect(host.value()).toBe('apple');
    key('ArrowDown'); // Apricot
    key('ArrowDown'); // skips disabled Banana → Carrot
    await settle();
    expect(host.value()).toBe('carrot');

    key('Home');
    await settle();
    expect(host.value()).toBe('apple');
    key('c');
    key('e');
    await settle();
    expect(host.value()).toBe('celery');
    key('End');
    await settle();
    expect(host.value()).toBe('celery');
  });

  it('single without selectionFollowsFocus needs Enter / Space', async () => {
    host.follows.set(false);
    await settle();
    key('ArrowDown');
    await settle();
    expect(host.value()).toBeNull();
    expect(options()[0].classList.contains('mk-listbox__option--active')).toBe(true);
    key(' ');
    await settle();
    expect(host.value()).toBe('apple');
  });

  it('multiple: click and Space toggle, Shift extends a range, Ctrl+A selects all then clears', async () => {
    host.multiple.set(true);
    host.value.set([]);
    await settle();
    expect(list().getAttribute('aria-multiselectable')).toBe('true');
    options()[0].click();
    options()[3].click();
    await settle();
    expect(host.value()).toEqual(['apple', 'carrot']);
    options()[0].click();
    await settle();
    expect(host.value()).toEqual(['carrot']);

    key('End'); // active → Celery
    key(' ');
    await settle();
    expect(host.value()).toEqual(['carrot', 'celery']);

    key('Home');
    key('ArrowDown', { shiftKey: true }); // range Apple..Apricot replaces
    await settle();
    expect(host.value()).toEqual(['apple', 'apricot']);
    key('ArrowDown', { shiftKey: true }); // Apple..Carrot (Banana disabled, skipped)
    await settle();
    expect(host.value()).toEqual(['apple', 'apricot', 'carrot']);

    key('a', { ctrlKey: true });
    await settle();
    expect(host.value()).toEqual(['apple', 'apricot', 'carrot', 'celery']);
    key('a', { ctrlKey: true });
    await settle();
    expect(host.value()).toEqual([]);

    options()[3].click();
    options()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    await settle();
    expect(host.value()).toEqual(['apple', 'apricot', 'carrot']);
  });

  it('filters by label or description, hands arrows from the box to the list, and shows an empty state', async () => {
    host.filterable.set(true);
    await settle();
    const input = box().querySelector<HTMLInputElement>('input[type=search]')!;
    input.value = 'root';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(labels()).toEqual(['Carrot']);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await settle();
    expect(document.activeElement).toBe(list());
    expect(host.value()).toBe('carrot'); // selection follows focus on the first visible row
    input.value = 'zzz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(labels()).toEqual([]);
    expect(box().querySelector('.mk-listbox__empty')!.textContent).toContain('No matching options');
  });

  it('works as a ControlValueAccessor', async () => {
    const model = root().querySelector<HTMLElement>('#ngm')!;
    await settle();
    await settle();
    const selected = model.querySelector<HTMLElement>('[aria-selected="true"]')!;
    expect(selected.textContent).toContain('Carrot');
    model.querySelectorAll<HTMLElement>('[role=option]')[4].click();
    await settle();
    expect(host.modelValue).toBe('celery');
  });
});
