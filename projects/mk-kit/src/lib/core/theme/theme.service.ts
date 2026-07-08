import {
  DOCUMENT,
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
    mql?.addEventListener('change', (e) => this._systemPrefersDark.set(e.matches));
  }

  private isBrowserEnv(): boolean {
    return this.isBrowser && typeof this.document !== 'undefined';
  }
}
