import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    // The theme service reads matchMedia, which the test DOM doesn't implement.
    globalThis.matchMedia ??= ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof globalThis.matchMedia;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('creates the docs shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the mk-kit brand and the version badge', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.docs-brand__name')?.textContent).toContain('mk-kit');
    // Reads the published version straight from the library's package.json.
    expect(el.querySelector('.docs-brand__ver')?.textContent).toMatch(/^v\d+\.\d+\.\d+/);
  });

  it('renders the sidebar navigation as a labelled landmark with grouped links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const nav = el.querySelector('nav.docs-nav');
    expect(nav).toBeTruthy();
    expect(nav?.getAttribute('aria-label')).toBe('Documentation');

    // Flat text nav (the docs IA overhaul replaced the earlier mk-nav-list):
    // one heading per section, one anchor per page.
    expect(nav!.querySelectorAll('.docs-nav__heading').length).toBeGreaterThan(0);
    const links = nav!.querySelectorAll<HTMLAnchorElement>('a.docs-nav__link');
    expect(links.length).toBeGreaterThan(0);
    expect([...links].every((a) => !!a.getAttribute('href'))).toBe(true);
  });

  it('opens the appearance popover with theme, contrast and density groups', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.docs-appearance-btn') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-label')).toMatch(/^Appearance: /);

    trigger.click();
    await fixture.whenStable();
    const panel = document.querySelector('.mk-popover__panel') as HTMLElement;
    expect(panel).not.toBeNull();
    const groups = [...panel.querySelectorAll('mk-button-toggle-group')].map((g) =>
      g.getAttribute('aria-label'),
    );
    expect(groups).toEqual(['Theme', 'Contrast', 'Density']);

    // Picking a value applies it through the theme service.
    const dark = [...panel.querySelectorAll('mk-button-toggle button')].find(
      (b) => b.textContent?.trim() === 'Dark',
    ) as HTMLButtonElement;
    dark.click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-mk-theme')).toBe('dark');
  });
});
