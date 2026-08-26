import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCascader, type MkCascaderOption } from './cascader';

const OPTIONS: MkCascaderOption[] = [
  {
    label: 'Europe',
    value: 'eu',
    children: [
      { label: 'Poland', value: 'pl', children: [{ label: 'Kraków', value: 'krk' }, { label: 'Warsaw', value: 'waw' }] },
      { label: 'Germany', value: 'de', children: [{ label: 'Berlin', value: 'ber' }] },
      { label: 'Atlantis', value: 'atl', disabled: true },
    ],
  },
  { label: 'Remote', value: 'remote' },
];

@Component({
  imports: [MkCascader],
  template: `
    <mk-cascader
      [options]="options"
      [(value)]="value"
      [valueMode]="mode()"
      [selectParents]="parents()"
      [expandTrigger]="trigger()"
      clearable
      placeholder="Where?"
      (change)="changes.push($event)"
    />
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly value = signal<unknown>(null);
  readonly mode = signal<'path' | 'leaf'>('path');
  readonly parents = signal(false);
  readonly trigger = signal<'click' | 'hover'>('click');
  changes: unknown[] = [];
}

describe('MkCascader', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const trigger = () => root().querySelector<HTMLButtonElement>('.mk-cascader__trigger')!;
  const panel = () => document.querySelector<HTMLElement>('.mk-cascader__panel');
  const columns = () => [...(panel()?.querySelectorAll<HTMLElement>('.mk-cascader__column') ?? [])];
  const rows = (c: number) => [...columns()[c].querySelectorAll<HTMLElement>('[role=option]')];
  const key = (k: string) => panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

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

  afterEach(() => fixture.destroy());

  it('opens columns as parents are clicked and commits the path on a leaf', async () => {
    expect(trigger().textContent).toContain('Where?');
    trigger().click();
    await settle();
    expect(panel()).toBeTruthy();
    expect(columns()).toHaveLength(1);
    rows(0)[0].click(); // Europe
    await settle();
    expect(columns()).toHaveLength(2);
    expect(host.value()).toBeNull(); // parents don't commit by default
    rows(1)[0].click(); // Poland
    await settle();
    expect(columns()).toHaveLength(3);
    rows(2)[1].click(); // Warsaw
    await settle();
    expect(host.value()).toEqual(['eu', 'pl', 'waw']);
    expect(host.changes).toEqual([['eu', 'pl', 'waw']]);
    expect(panel()).toBeNull();
    expect(trigger().textContent).toContain('Europe / Poland / Warsaw');
    expect(document.activeElement).toBe(trigger());

    // Reopens on the committed path with all its columns.
    trigger().click();
    await settle();
    expect(columns()).toHaveLength(3);
    expect(rows(2)[1].getAttribute('aria-selected')).toBe('true');
    expect(panel()!.getAttribute('aria-activedescendant')).toBe(rows(2)[1].id);
  });

  it('keyboard: arrows move, Right / Left change column, Enter commits, typeahead jumps, Escape closes', async () => {
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await settle();
    expect(panel()).toBeTruthy();
    expect(document.activeElement).toBe(panel());
    key('ArrowRight'); // into Europe's children
    await settle();
    expect(columns()).toHaveLength(2);
    expect(panel()!.getAttribute('aria-activedescendant')).toBe(rows(1)[0].id);
    key('ArrowDown'); // Germany
    key('ArrowDown'); // skips disabled Atlantis → wraps to Poland
    await settle();
    expect(rows(1)[0].classList.contains('mk-cascader__option--cursor')).toBe(true);
    key('g'); // typeahead → Germany
    await settle();
    expect(rows(1)[1].classList.contains('mk-cascader__option--cursor')).toBe(true);
    key('Enter'); // parent + !selectParents → opens children
    await settle();
    expect(columns()).toHaveLength(3);
    key('ArrowLeft');
    await settle();
    expect(columns()).toHaveLength(2);
    key('ArrowRight');
    key('Enter'); // Berlin
    await settle();
    expect(host.value()).toEqual(['eu', 'de', 'ber']);

    trigger().click();
    await settle();
    key('Escape');
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('leaf mode binds only the final value and resolves the label back from the tree', async () => {
    host.mode.set('leaf');
    host.value.set('krk');
    await settle();
    expect(trigger().textContent).toContain('Europe / Poland / Kraków');
    trigger().click();
    await settle();
    rows(0)[1].click(); // Remote (leaf at root)
    await settle();
    expect(host.value()).toBe('remote');
  });

  it('selectParents commits a parent on click, hover expands with expandTrigger="hover", clear resets', async () => {
    host.parents.set(true);
    host.trigger.set('hover');
    await settle();
    trigger().click();
    await settle();
    rows(0)[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await settle();
    expect(columns()).toHaveLength(2);
    rows(1)[0].click(); // Poland commits
    await settle();
    expect(host.value()).toEqual(['eu', 'pl']);
    root().querySelector<HTMLButtonElement>('.mk-cascader__clear')!.click();
    await settle();
    expect(host.value()).toBeNull();
    expect(host.changes.at(-1)).toBeNull();
  });
});
