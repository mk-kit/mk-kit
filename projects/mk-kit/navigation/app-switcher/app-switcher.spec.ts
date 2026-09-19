import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkAppSwitcher, type MkAppLink } from './app-switcher';

const APPS: MkAppLink[] = [
  { id: 'board', name: 'Board', url: 'https://board.example' },
  { id: 'sales', name: 'Sales', url: 'https://sales.example', icon: '$', color: 'rebeccapurple' },
  { id: 'notes', name: 'Notes', url: 'https://notes.example/' },
];

@Component({
  imports: [MkAppSwitcher],
  template: `<mk-app-switcher [apps]="apps" [current]="current" label="Apps" />`,
})
class Host {
  apps = APPS;
  current = 'sales';
}

@Component({
  imports: [MkAppSwitcher],
  template: `<mk-app-switcher src="https://home.example/apps.json" current="https://notes.example" />`,
})
class RegistryHost {}

describe('MkAppSwitcher', () => {
  let fixture: ComponentFixture<unknown>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });
  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const trigger = () => el().querySelector<HTMLButtonElement>('.mk-app-switcher__trigger')!;
  const panel = () => document.getElementById(trigger().getAttribute('aria-controls') ?? '');
  const tiles = () => Array.from(panel()?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
  const tick = () => new Promise((r) => setTimeout(r, 0));

  it('is a closed disclosure with an accessible name', () => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-label')).toBe('Apps');
    expect(trigger().hasAttribute('aria-controls')).toBe(false);
  });

  it('opens a labelled group of links, the current app first and marked', async () => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(panel()?.getAttribute('role')).toBe('group');
    expect(panel()?.getAttribute('aria-label')).toBe('Apps');
    const names = tiles().map((a) => a.querySelector('.mk-app-switcher__name')?.textContent?.trim());
    expect(names).toEqual(['Sales', 'Board', 'Notes']);
    expect(tiles().map((a) => a.querySelector('.mk-app-switcher__icon')?.textContent?.trim())).toEqual(['$', 'B', 'N']);
    expect(tiles()[0].getAttribute('aria-current')).toBe('page');
    expect(tiles()[1].hasAttribute('aria-current')).toBe(false);
    expect(tiles()[0].getAttribute('href')).toBe('https://sales.example');
  });

  it('Escape closes and returns focus to the trigger; arrows move between tiles', async () => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
    await tick();
    expect(document.activeElement).toBe(tiles()[0]);
    tiles()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(tiles()[1]);
    tiles()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(tiles()[2]);
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger());
  });

  it('fetches the registry once when first opened and matches current by url', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ apps: APPS }), { status: 200 }));
    fixture = TestBed.createComponent(RegistryHost);
    fixture.detectChanges();
    expect(fetchMock).not.toHaveBeenCalled();
    trigger().click();
    fixture.detectChanges();
    await tick();
    fixture.detectChanges();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://home.example/apps.json');
    expect(tiles()[0].textContent).toContain('Notes');
    expect(tiles()[0].getAttribute('aria-current')).toBe('page');
    // close and reopen: no second fetch
    panel()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows the error note when the registry cannot be fetched and keeps working', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));
    fixture = TestBed.createComponent(RegistryHost);
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    await tick();
    fixture.detectChanges();
    expect(panel()?.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });
});
