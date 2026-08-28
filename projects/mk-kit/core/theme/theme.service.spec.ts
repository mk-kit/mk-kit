/**
 * MkThemeService — density mode.
 *
 * The contract that matters to consumers: `comfortable` is the token default
 * and is therefore the ABSENCE of `data-mk-density`, while every other mode
 * writes its own name. Anything that special-cased a single mode here would
 * silently drop the next one added, which is exactly how `touch` would have
 * been missed.
 */
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MkThemeService } from './theme.service';

describe('MkThemeService density', () => {
  let service: MkThemeService;
  let appRef: ApplicationRef;

  beforeEach(() => {
    // jsdom has no matchMedia, and the service reads it for the system theme
    // during construction. Density does not depend on it — this just lets the
    // service exist.
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    localStorage.clear();
    document.documentElement.removeAttribute('data-mk-density');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(MkThemeService);
    appRef = TestBed.inject(ApplicationRef);
    appRef.tick();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-mk-density');
    localStorage.clear();
  });

  /** The attribute is written by an effect; flush it. */
  function flush(): string | null {
    appRef.tick();
    return document.documentElement.getAttribute('data-mk-density');
  }

  it('starts comfortable, with no attribute to inherit', () => {
    expect(service.density()).toBe('comfortable');
    expect(flush()).toBeNull();
  });

  it('writes the attribute for compact', () => {
    service.setDensity('compact');
    expect(flush()).toBe('compact');
  });

  it('writes the attribute for touch', () => {
    // The mode that motivated this: tablets and kiosks, 48px controls.
    service.setDensity('touch');
    expect(flush()).toBe('touch');
  });

  it('removes the attribute again on the way back to comfortable', () => {
    service.setDensity('touch');
    flush();
    service.setDensity('comfortable');
    // Not `data-mk-density="comfortable"` — the default is the absence of the
    // attribute, so a stale one would keep overriding the tokens.
    expect(flush()).toBeNull();
  });

  it('persists the choice, including touch', () => {
    service.setDensity('touch');
    flush();
    expect(localStorage.getItem('mk-kit-density')).toBe('touch');

    // A fresh service in a new injector reads it back rather than defaulting.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    expect(TestBed.inject(MkThemeService).density()).toBe('touch');
  });

  describe('toggleDensity', () => {
    it('flips between comfortable and compact', () => {
      service.toggleDensity();
      expect(service.density()).toBe('compact');
      service.toggleDensity();
      expect(service.density()).toBe('comfortable');
    });

    it('returns to comfortable from touch rather than cycling into it', () => {
      // A density switch in a UI offers two modes. `touch` is a deliberate
      // choice for a specific screen, so toggling must never land ON it —
      // a mouse user hitting the button must not get finger-sized controls.
      service.setDensity('touch');
      service.toggleDensity();
      expect(service.density()).toBe('comfortable');
    });
  });
});

/**
 * MkThemeService — contrast preference.
 *
 * `system` is the ABSENCE of `data-mk-contrast` (the stylesheet follows the
 * OS `prefers-contrast: more`); `normal` and `high` write themselves so CSS
 * can tell an explicit opt-out from "no preference".
 */
describe('MkThemeService contrast', () => {
  let service: MkThemeService;
  let appRef: ApplicationRef;
  /** What `matchMedia('(prefers-contrast: more)')` reports, per test. */
  let systemMore = false;
  let contrastListener: ((e: { matches: boolean }) => void) | null = null;

  function install(): void {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-contrast') ? systemMore : false,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        if (query.includes('prefers-contrast')) contrastListener = cb;
      },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  function boot(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(MkThemeService);
    appRef = TestBed.inject(ApplicationRef);
    appRef.tick();
  }

  beforeEach(() => {
    systemMore = false;
    contrastListener = null;
    install();
    localStorage.clear();
    document.documentElement.removeAttribute('data-mk-contrast');
    boot();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-mk-contrast');
    localStorage.clear();
  });

  function flush(): string | null {
    appRef.tick();
    return document.documentElement.getAttribute('data-mk-contrast');
  }

  it('starts on system, with no attribute, resolving to normal', () => {
    expect(service.contrast()).toBe('system');
    expect(service.resolvedContrast()).toBe('normal');
    expect(service.isHighContrast()).toBe(false);
    expect(flush()).toBeNull();
  });

  it('writes the attribute for high', () => {
    service.setContrast('high');
    expect(flush()).toBe('high');
    expect(service.resolvedContrast()).toBe('high');
    expect(service.isHighContrast()).toBe(true);
  });

  it('writes the attribute for an explicit normal (an opt-out, not the default)', () => {
    // The OS asks for more contrast, the user said no: the attribute must be
    // PRESENT so the `prefers-contrast` CSS mapping can exclude it.
    systemMore = true;
    service.setContrast('normal');
    expect(flush()).toBe('normal');
    expect(service.resolvedContrast()).toBe('normal');
  });

  it('removes the attribute again on the way back to system', () => {
    service.setContrast('high');
    flush();
    service.setContrast('system');
    expect(flush()).toBeNull();
  });

  it('resolves system from the OS preference and tracks changes live', () => {
    systemMore = true;
    boot();
    expect(service.contrast()).toBe('system');
    expect(service.resolvedContrast()).toBe('high');

    contrastListener?.({ matches: false });
    expect(service.resolvedContrast()).toBe('normal');
  });

  it('persists the choice and reads it back in a fresh injector', () => {
    service.setContrast('high');
    flush();
    expect(localStorage.getItem('mk-kit-contrast')).toBe('high');
    boot();
    expect(service.contrast()).toBe('high');
  });

  describe('toggleContrast', () => {
    it('flips between normal and high', () => {
      service.toggleContrast();
      expect(service.contrast()).toBe('high');
      service.toggleContrast();
      expect(service.contrast()).toBe('normal');
    });

    it('resolves system first, so it always moves away from what is shown', () => {
      systemMore = true;
      boot();
      // Shown: high (from the OS). Toggling must turn it OFF.
      service.toggleContrast();
      expect(service.contrast()).toBe('normal');
    });
  });
});
