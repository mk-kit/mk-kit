import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MkMention,
  type MkMentionOption,
  type MkMentionSearchEvent,
  type MkMentionSelectEvent,
} from './mention';

const USERS: MkMentionOption[] = [
  { value: 'alice', label: 'Alice', hint: 'alice@example.com' },
  { value: 'albert', label: 'Albert' },
  { value: 'bob', label: 'Bob' },
  { value: 'ng', label: 'angular', trigger: '#' },
];

@Component({
  imports: [MkMention],
  template: `<textarea
    mkMention
    [mentionTriggers]="['@', '#']"
    [mentionOptions]="options()"
    [mentionFilter]="filter()"
    [mentionLoading]="loading()"
    [mentionInsert]="insert()"
    (mentionSearch)="searches.push($event)"
    (mentionSelect)="selections.push($event)"
  ></textarea>`,
})
class Host {
  options = signal<readonly MkMentionOption[]>(USERS);
  filter = signal<'contains' | 'startsWith' | 'none'>('contains');
  loading = signal(false);
  insert = signal<((o: MkMentionOption, t: string) => string) | null>(null);
  searches: MkMentionSearchEvent[] = [];
  selections: MkMentionSelectEvent[] = [];
}

describe('MkMention', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const ta = (fixture.nativeElement as HTMLElement).querySelector('textarea')!;
    return { fixture, ta, host: fixture.componentInstance };
  }

  // The panel is teleported to document.body by mkAnchoredPanel, so it is
  // never inside the fixture's own element.
  const listbox = () => document.querySelector('[role=listbox]');
  const options = () =>
    [...document.querySelectorAll<HTMLElement>('[role=option]')];
  const labels = () =>
    options().map(
      (o) => o.querySelector('.mk-mention__option-label')!.textContent!.trim(),
    );

  /** Flush zoneless CD + effects (panel creation renders one cycle later). */
  async function settle(fixture: ComponentFixture<Host>) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  /** Sets the value + caret and dispatches a real `input` event. */
  async function type(
    fixture: ComponentFixture<Host>,
    ta: HTMLTextAreaElement,
    text: string,
    caret = text.length,
  ) {
    ta.value = text;
    ta.setSelectionRange(caret, caret);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);
  }

  async function press(
    fixture: ComponentFixture<Host>,
    ta: HTMLTextAreaElement,
    key: string,
  ) {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    ta.dispatchEvent(e);
    await settle(fixture);
    return e;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('opens a session when a trigger starts a word and filters by the query', async () => {
    const { fixture, ta, host } = mount();
    await type(fixture, ta, 'hello @al');

    expect(listbox()).toBeTruthy();
    expect(labels()).toEqual(['Alice', 'Albert']);
    expect(host.searches.at(-1)).toEqual({ trigger: '@', query: 'al' });
  });

  it('ignores a trigger typed mid-word', async () => {
    const { fixture, ta } = mount();
    await type(fixture, ta, 'email@al');
    expect(listbox()).toBeNull();

    await type(fixture, ta, 'a@b');
    expect(listbox()).toBeNull();
  });

  it('filters label and value with contains and startsWith', async () => {
    const { fixture, ta, host } = mount();
    // 'li' matches Alice by label and by value; Albert by neither.
    await type(fixture, ta, '@li');
    expect(labels()).toEqual(['Alice']);

    host.filter.set('startsWith');
    await settle(fixture);
    await type(fixture, ta, '@al');
    expect(labels()).toEqual(['Alice', 'Albert']);
    await type(fixture, ta, '@li');
    expect(listbox()).toBeNull(); // zero matches closes the panel

    host.filter.set('none');
    await settle(fixture);
    await type(fixture, ta, '@zzz');
    expect(labels()).toEqual(['Alice', 'Albert', 'Bob']);
  });

  it('scopes options to their trigger character', async () => {
    const { fixture, ta } = mount();
    await type(fixture, ta, '@ng');
    expect(listbox()).toBeNull(); // 'angular' is #-only

    await type(fixture, ta, '#ng');
    expect(labels()).toEqual(['angular']);
  });

  it('moves the active option with wrapping and exposes it via aria-activedescendant', async () => {
    const { fixture, ta } = mount();
    await type(fixture, ta, '@al');
    const active = () => ta.getAttribute('aria-activedescendant');
    expect(active()).toBe(options()[0].id);

    await press(fixture, ta, 'ArrowDown');
    expect(active()).toBe(options()[1].id);
    await press(fixture, ta, 'ArrowDown'); // wraps
    expect(active()).toBe(options()[0].id);
    await press(fixture, ta, 'ArrowUp'); // wraps backwards
    expect(active()).toBe(options()[1].id);
  });

  it('inserts the mention on Enter, places the caret and fires input', async () => {
    const { fixture, ta, host } = mount();
    await type(fixture, ta, 'hi @al');

    let inputs = 0;
    ta.addEventListener('input', () => inputs++);
    await press(fixture, ta, 'ArrowDown'); // Albert
    const enter = await press(fixture, ta, 'Enter');

    expect(enter.defaultPrevented).toBe(true);
    expect(ta.value).toBe('hi @Albert ');
    expect(ta.selectionStart).toBe('hi @Albert '.length);
    expect(inputs).toBe(1);
    expect(host.selections).toEqual([{ option: USERS[1], trigger: '@' }]);
    expect(listbox()).toBeNull();
  });

  it('commits with Tab as well', async () => {
    const { fixture, ta } = mount();
    await type(fixture, ta, '@bo');
    const tab = await press(fixture, ta, 'Tab');
    expect(tab.defaultPrevented).toBe(true);
    expect(ta.value).toBe('@Bob ');
  });

  it('replaces only the trigger-to-caret range', async () => {
    const { fixture, ta } = mount();
    const text = '@al and more';
    await type(fixture, ta, text, 3); // caret right after '@al'
    await press(fixture, ta, 'Enter');
    expect(ta.value).toBe('@Alice  and more');
  });

  it('uses a custom mentionInsert function when provided', async () => {
    const { fixture, ta, host } = mount();
    host.insert.set((o, t) => `${t}${o.value}`);
    await settle(fixture);

    await type(fixture, ta, '@al');
    await press(fixture, ta, 'Enter');
    expect(ta.value).toBe('@alice');
  });

  it('Escape closes, swallows the event and keeps the session dismissed', async () => {
    const { fixture, ta } = mount();
    await type(fixture, ta, '@al');

    let leaked = false;
    const spy = () => (leaked = true);
    document.addEventListener('keydown', spy);
    const esc = await press(fixture, ta, 'Escape');
    document.removeEventListener('keydown', spy);

    expect(esc.defaultPrevented).toBe(true);
    expect(leaked).toBe(false); // stopPropagation — an enclosing dialog stays open
    expect(listbox()).toBeNull();

    // Typing on inside the same mention keeps it dismissed…
    await type(fixture, ta, '@ali');
    expect(listbox()).toBeNull();

    // …but a freshly typed trigger elsewhere opens a new session.
    await type(fixture, ta, '@ali #n');
    expect(labels()).toEqual(['angular']);
  });

  it('a closed panel lets Escape propagate', async () => {
    const { fixture, ta } = mount();
    const esc = await press(fixture, ta, 'Escape');
    expect(esc.defaultPrevented).toBe(false);
  });

  it('closes on blur unless focus moves into the panel', async () => {
    const { fixture, ta } = mount();
    await type(fixture, ta, '@al');

    ta.dispatchEvent(
      new FocusEvent('blur', { relatedTarget: options()[0] }),
    );
    await settle(fixture);
    expect(listbox()).toBeTruthy();

    ta.dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('commits on option pointerdown and keeps textarea focus', async () => {
    const { fixture, ta, host } = mount();
    await type(fixture, ta, '@bo');

    const down = new Event('pointerdown', { bubbles: true, cancelable: true });
    options()[0].dispatchEvent(down);
    await settle(fixture);

    expect(down.defaultPrevented).toBe(true); // focus never leaves the textarea
    expect(ta.value).toBe('@Bob ');
    expect(host.selections.at(-1)).toEqual({ option: USERS[2], trigger: '@' });
  });

  it('re-renders the open panel when async options arrive and closes on empty', async () => {
    const { fixture, ta, host } = mount();
    host.filter.set('none');
    await settle(fixture);

    await type(fixture, ta, '@j');
    await type(fixture, ta, '@jo');
    expect(host.searches.slice(-2)).toEqual([
      { trigger: '@', query: 'j' },
      { trigger: '@', query: 'jo' },
    ]);

    host.options.set([{ value: 'john', label: 'John' }]);
    await settle(fixture);
    expect(labels()).toEqual(['John']);

    host.options.set([]);
    await settle(fixture);
    expect(listbox()).toBeNull();

    // The session survived — results arriving later reopen the panel.
    host.options.set([{ value: 'jo', label: 'Jo' }]);
    await settle(fixture);
    expect(labels()).toEqual(['Jo']);
  });

  it('stays open with a loading row while async results are pending', async () => {
    const { fixture, ta, host } = mount();
    host.filter.set('none');
    host.options.set([]);
    host.loading.set(true);
    await settle(fixture);

    await type(fixture, ta, '@x');
    expect(listbox()).toBeTruthy();
    expect(document.querySelector('.mk-mention__status')).toBeTruthy();
    expect(options()).toEqual([]);
  });

  it('wires the textarea aria attributes while open and clears them closed', async () => {
    const { fixture, ta } = mount();
    expect(ta.getAttribute('aria-autocomplete')).toBe('list');
    expect(ta.getAttribute('aria-haspopup')).toBe('listbox');
    expect(ta.getAttribute('aria-expanded')).toBe('false');
    expect(ta.getAttribute('aria-controls')).toBeNull();
    expect(ta.getAttribute('aria-activedescendant')).toBeNull();

    await type(fixture, ta, '@al');
    expect(ta.getAttribute('aria-expanded')).toBe('true');
    expect(ta.getAttribute('aria-controls')).toBe(listbox()!.id);
    expect(ta.getAttribute('aria-activedescendant')).toBe(options()[0].id);

    await press(fixture, ta, 'Escape');
    expect(ta.getAttribute('aria-expanded')).toBe('false');
    expect(ta.getAttribute('aria-controls')).toBeNull();
    expect(ta.getAttribute('aria-activedescendant')).toBeNull();
  });
});
