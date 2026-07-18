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

/** Global control-density mode. */
export type MkDensity = 'comfortable' | 'compact';

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
   * spacing steps via the `data-mk-density` attribute — every component
   * follows automatically because they read the same tokens.
   */
  readonly density = this._density.asReadonly();

  constructor() {
    if (this.isBrowser) {
      this.watchSystemPreference();
    }

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
      if (density === 'compact') {
        root.setAttribute(DENSITY_ATTR, density);
      } else {
        root.removeAttribute(DENSITY_ATTR);
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

  /** Toggle between comfortable and compact density. */
  toggleDensity(): void {
    this._density.update((d) => (d === 'compact' ? 'comfortable' : 'compact'));
  }

  private readInitialDensity(): MkDensity {
    if (!this.isBrowser) return 'comfortable';
    try {
      const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
      if (stored === 'compact' || stored === 'comfortable') return stored;
    } catch {
      /* ignore */
    }
    return 'comfortable';
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
