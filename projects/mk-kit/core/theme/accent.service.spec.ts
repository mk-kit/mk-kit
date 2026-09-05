import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MK_ACCENTS, MK_ACCENT_ORDER, MkAccentService, mkAccentSwatch, mkHexAlpha } from './accent.service';
import { MkThemeService } from './theme.service';

describe('MkAccentService', () => {
  const root = () => document.documentElement;
  const prop = (p: string) => root().style.getPropertyValue(p).trim();

  beforeEach(() => {
    // jsdom has no matchMedia; the theme service reads the OS preference through it.
    window.matchMedia ??= (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    localStorage.removeItem('mk-kit-accent');
    for (const p of ['--mk-primary', '--mk-accent', '--mk-accent-ink', '--mk-accent-glow', '--mk-focus-ring']) root().style.removeProperty(p);
    root().removeAttribute('data-mk-accent');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('writes nothing until an accent is chosen, then the --mk-primary family, its own tokens and the attribute', async () => {
    const service = TestBed.inject(MkAccentService);
    await TestBed.inject(MkThemeService).setTheme('light');
    TestBed.tick();
    expect(service.key()).toBeNull();
    expect(prop('--mk-primary')).toBe('');
    expect(root().getAttribute('data-mk-accent')).toBeNull();

    service.set('coral');
    TestBed.tick();
    expect(prop('--mk-primary')).toBe('#FF6B3D');
    expect(prop('--mk-accent')).toBe('#FF6B3D');
    expect(prop('--mk-accent-ink')).toBe('#F0561F');
    expect(prop('--mk-focus-ring')).toBe('#FF6B3D');
    expect(prop('--mk-accent-glow')).toBe('rgba(255,107,61,0.45)');
    expect(root().getAttribute('data-mk-accent')).toBe('coral');
    expect(localStorage.getItem('mk-kit-accent')).toBe('coral');
    expect(service.accent().name).toBe('Coral');
  });

  it('lightens the ink in dark theme and clears everything on reset', async () => {
    const service = TestBed.inject(MkAccentService);
    const theme = TestBed.inject(MkThemeService);
    theme.setTheme('dark');
    service.set('teal');
    TestBed.tick();
    expect(prop('--mk-accent-ink')).toContain('color-mix');
    service.reset();
    TestBed.tick();
    expect(service.key()).toBeNull();
    expect(prop('--mk-primary')).toBe('');
    expect(root().getAttribute('data-mk-accent')).toBeNull();
    expect(localStorage.getItem('mk-kit-accent')).toBeNull();
    theme.setTheme('system');
  });

  it('restores the stored accent on start', () => {
    localStorage.setItem('mk-kit-accent', 'lime');
    expect(TestBed.inject(MkAccentService).key()).toBe('lime');
  });

  it('exposes the palette helpers', () => {
    expect(MK_ACCENT_ORDER.length).toBe(8);
    expect(Object.keys(MK_ACCENTS)).toEqual([...MK_ACCENT_ORDER]);
    expect(mkAccentSwatch('bumblebee')).toContain('linear-gradient');
    expect(mkAccentSwatch('indigo')).toBe('#5B4FE0');
    expect(mkHexAlpha('#5B4FE0', 0.45)).toBe('rgba(91,79,224,0.45)');
  });
});
