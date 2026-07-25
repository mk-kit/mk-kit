import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkNavList } from './nav-list';
import { MkNavItem } from './nav-item';
import { MkNavGroup } from './nav-group';

@Component({
  imports: [MkNavList, MkNavItem, MkNavGroup],
  template: `<mk-nav-list [collapsed]="collapsed()">
    <mk-nav-group [label]="groupLabel()" [collapsible]="collapsible()">
      <mk-nav-item label="Dashboard" href="/dash" [active]="dashActive()" />
      <mk-nav-item
        label="Settings"
        [disabled]="settingsDisabled()"
        [badge]="badge()"
        (action)="hits = hits + 1"
      />
      <mk-nav-item
        label="Reports"
        [(expanded)]="reportsOpen"
        (action)="parentHits = parentHits + 1"
      >
        <mk-nav-item label="Monthly" href="/m" />
      </mk-nav-item>
    </mk-nav-group>
  </mk-nav-list>`,
})
class Host {
  collapsed = signal(false);
  groupLabel = signal('Main');
  collapsible = signal(false);
  dashActive = signal(false);
  settingsDisabled = signal(false);
  badge = signal<string | number | undefined>(undefined);
  reportsOpen = signal(false);
  hits = 0;
  parentHits = 0;
}

describe('MkNavList', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      list: el.querySelector<HTMLElement>('mk-nav-list')!,
      group: el.querySelector<HTMLElement>('mk-nav-group')!,
      items: [...el.querySelectorAll<HTMLElement>('mk-nav-item')],
      host: fixture.componentInstance,
    };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('builds a list of listitems', () => {
    const { list, items } = mount();
    expect(list.querySelector('ul')?.getAttribute('role')).toBe('list');
    expect(items.every((i) => i.getAttribute('role') === 'listitem')).toBe(true);
  });

  it('labels the group region', () => {
    const { group } = mount();
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Main');
  });

  it('renders a plain header for a non-collapsible group', () => {
    const { el } = mount();
    expect(el.querySelector('.mk-nav-group__header--toggle')).toBeNull();
    expect(el.querySelector('.mk-nav-group__label')?.textContent).toContain('Main');
  });

  it('turns the group header into a disclosure when collapsible', () => {
    const { fixture, el, host } = mount();
    host.collapsible.set(true);
    fixture.detectChanges();

    const toggle = el.querySelector<HTMLButtonElement>('.mk-nav-group__header--toggle')!;
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBeTruthy();

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders a link for an item with an href', () => {
    const { el } = mount();
    const link = el.querySelector<HTMLAnchorElement>('a.mk-nav-item__link')!;
    expect(link.getAttribute('href')).toBe('/dash');
    expect(link.textContent).toContain('Dashboard');
  });

  it('marks the active item as the current page', () => {
    const { fixture, el, host } = mount();
    expect(el.querySelector('[aria-current="page"]')).toBeNull();

    host.dashActive.set(true);
    fixture.detectChanges();
    expect(el.querySelector('[aria-current="page"]')?.textContent).toContain(
      'Dashboard',
    );
  });

  it('emits action for an item with no href', () => {
    const { fixture, el, host } = mount();
    const settings = [...el.querySelectorAll<HTMLElement>('.mk-nav-item__link')].find(
      (n) => n.textContent?.includes('Settings'),
    )!;
    settings.click();
    fixture.detectChanges();
    expect(host.hits).toBe(1);
  });

  it('does not emit action for a disabled item', () => {
    const { fixture, el, host } = mount();
    host.settingsDisabled.set(true);
    fixture.detectChanges();

    const settings = [...el.querySelectorAll<HTMLElement>('.mk-nav-item__link')].find(
      (n) => n.textContent?.includes('Settings'),
    )!;
    settings.click();
    fixture.detectChanges();
    expect(host.hits).toBe(0);
  });

  it('renders a badge when given one', () => {
    const { fixture, el, host } = mount();
    expect(el.querySelector('.mk-nav-item__badge')).toBeNull();

    host.badge.set(3);
    fixture.detectChanges();
    expect(el.querySelector('.mk-nav-item__badge')?.textContent?.trim()).toBe('3');
  });

  it('makes an item with children an expandable disclosure', () => {
    const { fixture, el, host } = mount();
    const toggle = [...el.querySelectorAll<HTMLButtonElement>('.mk-nav-item__link')].find(
      (n) => n.textContent?.includes('Reports'),
    )!;

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBeTruthy();

    toggle.click();
    fixture.detectChanges();
    expect(host.reportsOpen()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('propagates the collapsed rail state to its items', () => {
    const { fixture, list, items, host } = mount();
    expect(list.classList.contains('mk-nav-list--collapsed')).toBe(false);

    host.collapsed.set(true);
    fixture.detectChanges();

    expect(list.classList.contains('mk-nav-list--collapsed')).toBe(true);
    expect(items[0].classList.contains('mk-nav-item--collapsed')).toBe(true);
  });

  it('titles items in the collapsed rail so the label is still reachable', () => {
    const { fixture, el, host } = mount();
    host.collapsed.set(true);
    fixture.detectChanges();

    const link = el.querySelector<HTMLElement>('.mk-nav-item__link')!;
    expect(link.getAttribute('title')).toBe('Dashboard');
  });

  it('a parent in the collapsed rail navigates instead of toggling a hidden sub-list', () => {
    const { fixture, el, host } = mount();
    host.collapsed.set(true);
    fixture.detectChanges();

    const toggle = [...el.querySelectorAll<HTMLElement>('.mk-nav-item__link')].find(
      (n) => n.textContent?.includes('Reports'),
    )!;
    toggle.click();
    fixture.detectChanges();

    // The sub-list can't be shown at rail width, so the click must emit
    // `action` (host navigates) and must NOT flip the invisible disclosure.
    expect(host.parentHits).toBe(1);
    expect(host.reportsOpen()).toBe(false);
  });

  it('a parent in an expanded list still toggles its sub-list, not action', () => {
    const { fixture, el, host } = mount();

    const toggle = [...el.querySelectorAll<HTMLElement>('.mk-nav-item__link')].find(
      (n) => n.textContent?.includes('Reports'),
    )!;
    toggle.click();
    fixture.detectChanges();

    expect(host.reportsOpen()).toBe(true);
    expect(host.parentHits).toBe(0);
  });
});
