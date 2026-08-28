import {
  DOCUMENT,
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MkResolvedTheme, MkThemePreference } from '../types';

const STORAGE_KEY = 'mk-kit-theme';
const THEME_ATTR = 'data-mk-theme';
const DENSITY_STORAGE_KEY = 'mk-kit-density';
const DENSITY_ATTR = 'data-mk-density';
const CONTRAST_STORAGE_KEY = 'mk-kit-contrast';
const CONTRAST_ATTR = 'data-mk-contrast';
const CONTRAST_QUERY = '(prefers-contrast: more)';

/**
 * Global control-density mode.
 *
 * `touch` sizes controls for fingers (48px default) rather than a cursor —
 * tablets, kiosks, order screens. It is usually applied per-subtree with the
 * `data-mk-density` attribute rather than globally, since one app often has
 * both a mouse-driven admin and a touch-driven screen.
 */
export type MkDensity = 'comfortable' | 'compact' | 'touch';

/**
 * Contrast preference.
 *
 * `high` applies the high-contrast token preset (`data-mk-contrast="high"`):
 * pure text colours, line-like borders, opaque interaction washes, a thicker
 * focus ring. `system` (the default) writes no attribute and lets the
 * stylesheet follow the OS `prefers-contrast: more` setting; `normal` opts
 * out of that even when the OS asks for more contrast.
 */
export type MkContrastPreference = 'normal' | 'high' | 'system';

/** Concrete resolved contrast (never `system`). */
export type MkResolvedContrast = 'normal' | 'high';

/**
 * Reactive theme controller for mk-kit.
 *
 * - `preference()` is the user's choice: `light`, `dark`, or `system`.
 * - `resolvedTheme()` is the concrete theme currently applied.
 * - Writes `data-mk-theme` on `<html>` and persists the choice to
 *   `localStorage`. When set to `system`, it live-tracks the OS setting and
 *   removes the attribute so pure-CSS `prefers-color-scheme` takes over.
 *
 * Provided in root — inject it anywhere and bind to the signals.
 */
@Injectable({ providedIn: 'root' })
export class MkThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _preference = signal<MkThemePreference>(this.readInitial());
  /** The user's theme preference. */
  readonly preference = this._preference.asReadonly();

  private readonly _systemPrefersDark = signal<boolean>(this.readSystemDark());

  /** The concrete theme in effect (`light` or `dark`). */
  readonly resolvedTheme = computed<MkResolvedTheme>(() => {
    const pref = this._preference();
    if (pref === 'system') {
      return this._systemPrefersDark() ? 'dark' : 'light';
    }
    return pref;
  });

  /** Convenience boolean for template bindings. */
  readonly isDark = computed(() => this.resolvedTheme() === 'dark');

  private readonly _density = signal<MkDensity>(this.readInitialDensity());
  /**
   * The global density mode. `compact` tightens control heights and the core
   * spacing steps via the `data-mk-density` attribute, `touch` enlarges them —
   * every component follows automatically because they read the same tokens.
   *
   * This signal is the GLOBAL mode only. To make one screen or dialog touch-
   * sized inside an otherwise comfortable app, put `data-mk-density="touch"`
   * on that element instead; the tokens inherit and this service stays out of
   * it.
   */
  readonly density = this._density.asReadonly();

  private readonly _contrast = signal<MkContrastPreference>(this.readInitialContrast());
  /**
   * The user's contrast preference: `normal`, `high` or `system` (follow the
   * OS `prefers-contrast` setting — the default). Written as
   * `data-mk-contrast` on `<html>` and persisted; `system` removes the
   * attribute so the pure-CSS `prefers-contrast: more` mapping takes over.
   *
   * Like density, the attribute also works per subtree: put
   * `data-mk-contrast="high"` on any element to raise contrast there only.
   */
  readonly contrast = this._contrast.asReadonly();

  private readonly _systemPrefersContrast = signal<boolean>(this.readSystemContrast());

  /** The concrete contrast in effect (`normal` or `high`). */
  readonly resolvedContrast = computed<MkResolvedContrast>(() => {
    const pref = this._contrast();
    if (pref === 'system') {
      return this._systemPrefersContrast() ? 'high' : 'normal';
    }
    return pref;
  });

  /** Convenience boolean for template bindings. */
  readonly isHighContrast = computed(() => this.resolvedContrast() === 'high');

  constructor() {
    if (this.isBrowser) {
      this.watchSystemPreference();
      this.watchSystemContrast();
    }

    // Keep the contrast attribute + storage in sync. `system` is the ABSENCE
    // of the attribute (the stylesheet then follows `prefers-contrast`);
    // `normal` and `high` name themselves so CSS can tell an explicit opt-out
    // from "no preference".
    effect(() => {
      const contrast = this._contrast();
      if (!this.isBrowser) return;
      const root = this.document.documentElement;
      if (contrast === 'system') {
        root.removeAttribute(CONTRAST_ATTR);
      } else {
        root.setAttribute(CONTRAST_ATTR, contrast);
      }
      try {
        localStorage.setItem(CONTRAST_STORAGE_KEY, contrast);
      } catch {
        /* ignore */
      }
    });

    // Keep the DOM attribute + storage in sync with the signal.
    effect(() => {
      const pref = this._preference();
      if (!this.isBrowser) return;

      const root = this.document.documentElement;
      if (pref === 'system') {
        root.removeAttribute(THEME_ATTR);
      } else {
        root.setAttribute(THEME_ATTR, pref);
      }
      try {
        localStorage.setItem(STORAGE_KEY, pref);
      } catch {
        /* storage may be unavailable (private mode) — ignore */
      }
    });

    // Keep the density attribute + storage in sync.
    effect(() => {
      const density = this._density();
      if (!this.isBrowser) return;
      const root = this.document.documentElement;
      // `comfortable` is the token default, so it is the ABSENCE of the
      // attribute — anything else names itself. Written this way so a new mode
      // needs no change here.
      if (density === 'comfortable') {
        root.removeAttribute(DENSITY_ATTR);
      } else {
        root.setAttribute(DENSITY_ATTR, density);
      }
      try {
        localStorage.setItem(DENSITY_STORAGE_KEY, density);
      } catch {
        /* ignore */
      }
    });
  }

  /** Set the global density mode. */
  setDensity(density: MkDensity): void {
    this._density.set(density);
  }

  /**
   * Toggle between comfortable and compact — the two modes a density switch in
   * a UI offers. `touch` is a deliberate choice for a specific screen, not
   * something to land on by toggling, so from `touch` this returns to
   * comfortable rather than cycling.
   */
  toggleDensity(): void {
    this._density.update((d) => (d === 'comfortable' ? 'compact' : 'comfortable'));
  }

  private readInitialDensity(): MkDensity {
    if (!this.isBrowser) return 'comfortable';
    try {
      const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
      if (stored === 'compact' || stored === 'comfortable' || stored === 'touch') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'comfortable';
  }

  /** Set the contrast preference explicitly. */
  setContrast(contrast: MkContrastPreference): void {
    this._contrast.set(contrast);
  }

  /** Toggle between normal and high contrast (resolving `system` first). */
  toggleContrast(): void {
    this._contrast.set(this.resolvedContrast() === 'high' ? 'normal' : 'high');
  }

  private readInitialContrast(): MkContrastPreference {
    if (!this.isBrowserEnv()) return 'system';
    try {
      const stored = localStorage.getItem(CONTRAST_STORAGE_KEY);
      if (stored === 'normal' || stored === 'high' || stored === 'system') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'system';
  }

  private readSystemContrast(): boolean {
    if (!this.isBrowserEnv()) return false;
    return this.document.defaultView?.matchMedia?.(CONTRAST_QUERY).matches ?? false;
  }

  private watchSystemContrast(): void {
    const mql = this.document.defaultView?.matchMedia?.(CONTRAST_QUERY);
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) =>
      this._systemPrefersContrast.set(e.matches);
    mql.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => mql.removeEventListener('change', onChange));
  }

  /** Set the theme preference explicitly. */
  setTheme(preference: MkThemePreference): void {
    this._preference.set(preference);
  }

  /** Toggle between light and dark (resolving `system` first). */
  toggle(): void {
    this._preference.set(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): MkThemePreference {
    if (!this.isBrowserEnv()) return 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'system';
  }

  private readSystemDark(): boolean {
    if (!this.isBrowserEnv()) return false;
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)')
      .matches ?? false;
  }

  private watchSystemPreference(): void {
    const mql = this.document.defaultView?.matchMedia(
      '(prefers-color-scheme: dark)',
    );
    if (!mql) return;
    const onChange = (e: MediaQueryListEvent) =>
      this._systemPrefersDark.set(e.matches);
    mql.addEventListener('change', onChange);
    // Detach when the injector dies (repeated bootstraps in SSR/HMR/tests).
    this.destroyRef.onDestroy(() => mql.removeEventListener('change', onChange));
  }

  private isBrowserEnv(): boolean {
    return this.isBrowser && typeof this.document !== 'undefined';
  }
}
