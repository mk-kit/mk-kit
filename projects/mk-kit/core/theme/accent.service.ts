import { DOCUMENT, Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MkThemeService } from './theme.service';

/** One of the eight kit accents (the Momentum palette). */
export type MkAccentKey = 'indigo' | 'blue' | 'teal' | 'violet' | 'coral' | 'lime' | 'pink' | 'bumblebee';

/** `fill` = bars, rings and buttons · `ink` = small accent text on a light ground. */
export interface MkAccent {
  fill: string;
  ink: string;
  name: string;
}

/** High-saturation, distinct, energising accents — the set the `momentum` preset was designed around. */
export const MK_ACCENTS: Record<MkAccentKey, MkAccent> = {
  indigo: { fill: '#5B4FE0', ink: '#5B4FE0', name: 'Indigo' },
  blue: { fill: '#2E7DF6', ink: '#2E7DF6', name: 'Focus blue' },
  teal: { fill: '#12B5A5', ink: '#0E9C8E', name: 'Teal' },
  violet: { fill: '#8B5CF6', ink: '#8B5CF6', name: 'Violet' },
  coral: { fill: '#FF6B3D', ink: '#F0561F', name: 'Coral' },
  lime: { fill: '#46C24A', ink: '#2FA336', name: 'Lime' },
  pink: { fill: '#EC4899', ink: '#DB2777', name: 'Magenta' },
  bumblebee: { fill: '#FFC400', ink: '#D99E00', name: 'Bumblebee' },
};

/** Picker order. */
export const MK_ACCENT_ORDER: readonly MkAccentKey[] = ['indigo', 'blue', 'teal', 'violet', 'coral', 'lime', 'pink', 'bumblebee'];

/** The swatch a picker shows for an accent (bumblebee is the black / yellow split). */
export function mkAccentSwatch(key: MkAccentKey): string {
  return key === 'bumblebee' ? 'linear-gradient(135deg,#16161F 0 48%,#FFC400 52% 100%)' : MK_ACCENTS[key].fill;
}

/** `#rrggbb` → `rgba(r,g,b,a)`. */
export function mkHexAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const STORAGE_KEY = 'mk-kit-accent';
const ATTR = 'data-mk-accent';

/**
 * Runtime accent — the user picks one of {@link MK_ACCENTS} and every kit
 * control recolours: the service writes the `--mk-primary` family
 * (`primary`, `-hover`, `-active`, `-subtle`, `-subtle-hover`,
 * `-subtle-text`), `--mk-focus-ring`, `--mk-selected-bg` / `-text` and three
 * accent tokens of its own — `--mk-accent`, `--mk-accent-ink`,
 * `--mk-accent-glow` — onto `<html>`, and mirrors the key as
 * `data-mk-accent`. Hover / active are a touch darker in light and a touch
 * lighter in dark (it follows {@link MkThemeService}). The choice persists
 * in `localStorage` (`mk-kit-accent`); nothing is written until `set()` is
 * called, so an app that never picks keeps the preset's own primary.
 *
 * ```ts
 * readonly accent = inject(MkAccentService);
 * accent.set('coral');           // every button, ring and chip turns coral
 * accent.key();                  // 'coral'
 * mkAccentSwatch(accent.key());  // for the picker
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkAccentService {
  private readonly document = inject(DOCUMENT);
  private readonly theme = inject(MkThemeService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _key = signal<MkAccentKey | null>(this.readInitial());
  /** The chosen accent, or `null` while the preset's own primary is in use. */
  readonly key = this._key.asReadonly();
  /** The chosen accent's definition (indigo when none is chosen). */
  readonly accent = computed<MkAccent>(() => MK_ACCENTS[this._key() ?? 'indigo']);

  constructor() {
    effect(() => {
      const key = this._key();
      const dark = this.theme.isDark();
      if (!this.isBrowser) return;
      const root = this.document.documentElement;
      if (!key) {
        root.removeAttribute(ATTR);
        for (const p of WRITTEN) root.style.removeProperty(p);
        return;
      }
      const { fill, ink: lightInk } = MK_ACCENTS[key];
      const hover = dark ? `color-mix(in srgb, ${fill} 88%, white)` : `color-mix(in srgb, ${fill} 90%, black)`;
      const active = dark ? `color-mix(in srgb, ${fill} 78%, white)` : `color-mix(in srgb, ${fill} 80%, black)`;
      const ink = dark ? `color-mix(in srgb, ${fill} 72%, white)` : lightInk;
      const s = root.style;
      s.setProperty('--mk-primary', fill);
      s.setProperty('--mk-primary-hover', hover);
      s.setProperty('--mk-primary-active', active);
      s.setProperty('--mk-primary-subtle', `color-mix(in srgb, ${fill} 12%, var(--mk-surface))`);
      s.setProperty('--mk-primary-subtle-hover', `color-mix(in srgb, ${fill} 20%, var(--mk-surface))`);
      s.setProperty('--mk-primary-subtle-text', ink);
      s.setProperty('--mk-focus-ring', fill);
      s.setProperty('--mk-selected-bg', `color-mix(in srgb, ${fill} 12%, var(--mk-surface))`);
      s.setProperty('--mk-selected-text', ink);
      s.setProperty('--mk-accent', fill);
      s.setProperty('--mk-accent-ink', ink);
      s.setProperty('--mk-accent-glow', mkHexAlpha(fill, 0.45));
      root.setAttribute(ATTR, key);
    });
  }

  /** Pick an accent; persisted. */
  set(key: MkAccentKey): void {
    this._key.set(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      /* ignore */
    }
  }

  /** Back to the preset's own primary; the stored choice is cleared. */
  reset(): void {
    this._key.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  private readInitial(): MkAccentKey | null {
    if (!this.isBrowser) return null;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v && v in MK_ACCENTS ? (v as MkAccentKey) : null;
    } catch {
      return null;
    }
  }
}

const WRITTEN = [
  '--mk-primary',
  '--mk-primary-hover',
  '--mk-primary-active',
  '--mk-primary-subtle',
  '--mk-primary-subtle-hover',
  '--mk-primary-subtle-text',
  '--mk-focus-ring',
  '--mk-selected-bg',
  '--mk-selected-text',
  '--mk-accent',
  '--mk-accent-ink',
  '--mk-accent-glow',
];
