import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  isDevMode,
  makeStateKey,
  PLATFORM_ID,
  runInInjectionContext,
  signal,
  TransferState,
} from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import type {
  MkFlatTranslations,
  MkTranslateConfig,
  MkTranslateLoader,
  MkTranslateParams,
  MkTranslationTree,
} from './translate.types';

/** Configuration token; set by {@link provideMkTranslate}. */
export const MK_TRANSLATE_CONFIG = new InjectionToken<MkTranslateConfig>('MK_TRANSLATE_CONFIG');

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;

/** `{ a: { b: 'x' } }` → `{ 'a.b': 'x' }`; already-dotted keys pass through. */
export function mkFlattenTranslations(
  tree: MkTranslationTree | null | undefined,
  prefix = '',
  out: MkFlatTranslations = {},
): MkFlatTranslations {
  if (!tree) return out;
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') mkFlattenTranslations(v, key, out);
    else if (typeof v === 'string') out[key] = v;
  }
  return out;
}

/** `{ 'a.b': 'x' }` → `{ a: { b: 'x' } }` — for editors that write files back. */
export function mkUnflattenTranslations(flat: MkFlatTranslations): MkTranslationTree {
  const tree: MkTranslationTree = {};
  for (const key of Object.keys(flat).sort()) {
    const parts = key.split('.');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = node[parts[i]];
      if (!next || typeof next !== 'object') node[parts[i]] = {};
      node = node[parts[i]] as MkTranslationTree;
    }
    node[parts[parts.length - 1]] = flat[key];
  }
  return tree;
}

/** Replace `{{name}}` placeholders; unknown names are left in place. */
export function mkInterpolate(template: string, params?: MkTranslateParams): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = name.split('.').reduce<unknown>(
      (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
      params,
    );
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * App translations as signals: a `lang` you switch with `use()`, `instant()`
 * for code, the `translate` pipe for templates, and `plural()` for CLDR
 * count forms. Dictionaries are the plain nested JSON you already have; an
 * optional overrides loader (a database of edits, say) is merged on top per
 * language. On the server the loaded strings ride to the browser through
 * `TransferState`, so hydration never refetches or flashes raw keys.
 *
 * ```ts
 * provideMkTranslate({
 *   lang: 'pl',
 *   fallbackLang: 'pl',
 *   loader: mkHttpTranslateLoader({ prefix: '/assets/i18n/' }),
 * });
 * ```
 * ```html
 * {{ 'checkout.cart.total' | translate }}
 * {{ 'checkout.cart.freeDeliveryMissing' | translate: { amount: 12 } }}
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkTranslate {
  private readonly config = inject(MK_TRANSLATE_CONFIG, { optional: true });
  private readonly injector = inject(Injector);
  private readonly transfer = inject(TransferState, { optional: true });
  private readonly isServer = isPlatformServer(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT, { optional: true });

  private loader: MkTranslateLoader | null = null;
  private overridesLoader: MkTranslateLoader | null = null;
  private readonly dictionaries = new Map<string, MkFlatTranslations>();
  private readonly declared = new Set<string>();
  private readonly pending = new Map<string, Promise<void>>();
  /** Bumped whenever a dictionary changes, so readers recompute. */
  private readonly version = signal(0);
  // Missing keys are noticed while templates render, where writing a signal
  // is forbidden (NG0600) — so the set is plain and a tick signal is bumped
  // in a microtask, once per batch of misses.
  private readonly missing = new Set<string>();
  private readonly missingTick = signal(0);
  private missingFlush: Promise<void> | null = null;

  /** The active language. Read it in a `computed()` to follow switches. */
  readonly lang = signal<string>(this.config?.lang ?? 'en');
  /** `true` once the active language's strings are in memory. */
  readonly ready = computed(() => {
    this.version();
    return this.dictionaries.has(this.lang());
  });
  /** `lang` as an observable, for code still written around streams. */
  readonly langChange = toObservable(this.lang);
  /** Keys asked for that neither the active nor the fallback language has. */
  readonly missingKeys = computed(() => {
    this.missingTick();
    return [...this.missing].sort();
  });

  constructor() {
    if (!this.config && isDevMode()) {
      console.warn('[mk-translate] provideMkTranslate() is missing — every key renders as itself.');
    }
  }

  /** The active language as a plain string (for non-reactive call sites). */
  getCurrentLang(): string {
    return this.lang();
  }

  /** ngx-translate-compatible alias of {@link getCurrentLang}. */
  get currentLang(): string {
    return this.lang();
  }

  /** Languages known to the service: loaded ones plus any added with {@link addLangs}. */
  getLangs(): string[] {
    this.version();
    return [...new Set([...this.declared, ...this.dictionaries.keys()])];
  }

  /** Declare languages up front (a switcher's list); loading still happens on `use()`. */
  addLangs(langs: string[]): void {
    for (const lang of langs) this.declared.add(lang);
    this.bump();
  }

  /**
   * ngx-translate-compatible alias: `setTranslation(lang, strings, true)`
   * merges like {@link patch}, `false` (the default there) replaces like
   * {@link set}.
   */
  setTranslation(lang: string, strings: MkTranslationTree | MkFlatTranslations, shouldMerge = false): void {
    if (shouldMerge) this.patch(lang, strings);
    else this.set(lang, strings);
  }

  /**
   * Load `lang` (once — later calls are cached) and make it active. Resolves
   * when the strings are in memory; a failed load rejects and leaves the
   * previous language active.
   */
  use(lang: string): Promise<void> {
    // A language already in memory switches synchronously — no microtask
    // between the click and the re-render, and code that reads the service
    // right after `use()` (tests, `computed()` setups) sees the new state.
    if (this.dictionaries.has(lang)) {
      this.activate(lang);
      return Promise.resolve();
    }
    return this.load(lang).then(() => this.activate(lang));
  }

  private activate(lang: string): void {
    const fallback = this.config?.fallbackLang;
    if (fallback && fallback !== lang && !this.dictionaries.has(fallback)) {
      // Best effort: a missing fallback file must not block the switch.
      this.load(fallback).catch(() => undefined);
    }
    this.lang.set(lang);
    if (this.config?.documentLang !== false) {
      this.document?.documentElement?.setAttribute('lang', lang);
    }
  }

  /** Load a language into memory without switching to it. */
  load(lang: string): Promise<void> {
    if (this.dictionaries.has(lang)) return Promise.resolve();
    let task = this.pending.get(lang);
    if (!task) {
      task = this.fetch(lang).finally(() => this.pending.delete(lang));
      this.pending.set(lang, task);
    }
    return task;
  }

  /**
   * Translate `key` in the active language, then the fallback; `{{name}}`
   * placeholders come from `params`. A missing key renders as the key
   * itself (or whatever `onMissing` returns) and is recorded in
   * {@link missingKeys}. Reactive: reading it inside a template or a
   * `computed()` re-runs on language switch and after `patch()`.
   */
  instant(key: string, params?: MkTranslateParams): string {
    const lang = this.lang();
    this.version();
    const found = this.lookup(key, lang);
    if (found === undefined) {
      this.recordMissing(key);
      const replacement = this.config?.onMissing?.(key, lang);
      return typeof replacement === 'string' ? replacement : key;
    }
    return mkInterpolate(found, params);
  }

  /** Whether `key` exists in `lang` (default: the active language) or its fallback. */
  has(key: string, lang = this.lang()): boolean {
    this.version();
    return this.lookup(key, lang) !== undefined;
  }

  /**
   * CLDR plural form: `keyBase.{zero|one|two|few|many|other}` picked with
   * `Intl.PluralRules` for the active language, `other` as the fallback,
   * interpolated with `{ count, ...params }`.
   *
   * ```json
   * { "guests": { "one": "{{count}} osoba", "few": "{{count}} osoby", "many": "{{count}} osób", "other": "{{count}} osoby" } }
   * ```
   */
  plural(keyBase: string, count: number, params?: MkTranslateParams): string {
    const n = Number(count) || 0;
    const lang = this.lang();
    let category: string = 'other';
    try {
      category = new Intl.PluralRules(lang).select(n);
    } catch {
      /* unknown locale → other */
    }
    const merged = { count: n, ...params };
    const key = `${keyBase}.${category}`;
    return this.has(key) ? this.instant(key, merged) : this.instant(`${keyBase}.other`, merged);
  }

  /** The flat dictionary of `lang` (default: active), `{}` before it loads. */
  translations(lang = this.lang()): MkFlatTranslations {
    this.version();
    return { ...(this.dictionaries.get(lang) ?? {}) };
  }

  /** Languages currently in memory. */
  loadedLangs(): string[] {
    this.version();
    return [...this.dictionaries.keys()];
  }

  /**
   * Merge strings into `lang` at runtime — a translation editor previewing
   * an edit, or a late-arriving overrides payload. Nested or flat.
   */
  patch(lang: string, strings: MkTranslationTree | MkFlatTranslations): void {
    const current = this.dictionaries.get(lang) ?? {};
    this.dictionaries.set(lang, { ...current, ...mkFlattenTranslations(strings as MkTranslationTree) });
    this.bump();
  }

  /** Replace `lang` entirely (tests, editors reloading from source). */
  set(lang: string, strings: MkTranslationTree | MkFlatTranslations): void {
    this.dictionaries.set(lang, mkFlattenTranslations(strings as MkTranslationTree));
    this.bump();
  }

  // ── internals ────────────────────────────────────────────────────────────

  private lookup(key: string, lang: string): string | undefined {
    const direct = this.dictionaries.get(lang)?.[key];
    if (direct !== undefined) return direct;
    const fallback = this.config?.fallbackLang;
    if (fallback && fallback !== lang) return this.dictionaries.get(fallback)?.[key];
    return undefined;
  }

  private async fetch(lang: string): Promise<void> {
    const stateKey = makeStateKey<MkFlatTranslations>(`mk-translate:${lang}`);
    // Hydration: the server already loaded and serialised this language.
    if (!this.isServer && this.transfer?.hasKey(stateKey)) {
      const flat = this.transfer.get(stateKey, {});
      this.transfer.remove(stateKey);
      this.dictionaries.set(lang, flat);
      this.bump();
      return;
    }
    if (!this.config) {
      this.dictionaries.set(lang, {});
      this.bump();
      return;
    }
    const base = mkFlattenTranslations(await this.baseLoader().load(lang));
    let overrides: MkFlatTranslations = {};
    const overridesLoader = this.overridesLoaderOrNull();
    if (overridesLoader) {
      try {
        overrides = mkFlattenTranslations(await overridesLoader.load(lang));
      } catch (err) {
        if (isDevMode()) console.warn(`[mk-translate] overrides for "${lang}" failed to load`, err);
      }
    }
    const flat = { ...base, ...overrides };
    this.dictionaries.set(lang, flat);
    if (this.isServer && this.transfer) this.transfer.set(stateKey, flat);
    this.bump();
  }

  private baseLoader(): MkTranslateLoader {
    if (!this.loader) {
      this.loader = runInInjectionContext(this.injector, () => this.config!.loader());
    }
    return this.loader;
  }

  private overridesLoaderOrNull(): MkTranslateLoader | null {
    const factory = this.config?.overrides;
    if (!factory) return null;
    if (!this.overridesLoader) {
      this.overridesLoader = runInInjectionContext(this.injector, factory);
    }
    return this.overridesLoader;
  }

  private bump(): void {
    this.version.update((v) => v + 1);
  }

  private recordMissing(key: string): void {
    if (this.missing.has(key)) return;
    this.missing.add(key);
    this.missingFlush ??= Promise.resolve().then(() => {
      this.missingFlush = null;
      this.missingTick.update((v) => v + 1);
    });
  }
}
