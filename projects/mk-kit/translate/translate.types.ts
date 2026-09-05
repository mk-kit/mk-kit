/**
 * A translation file: nested objects of strings. Keys are addressed with
 * dots (`checkout.cart.total`), so `{ checkout: { cart: { total: '…' } } }`
 * and `{ 'checkout.cart.total': '…' }` are the same dictionary. This is the
 * plain JSON most apps already ship (ngx-translate's format included).
 */
export interface MkTranslationTree {
  [key: string]: string | MkTranslationTree;
}

/** Flattened dictionary: dotted key → string. */
export type MkFlatTranslations = Record<string, string>;

/** Values interpolated into `{{name}}` placeholders. */
export type MkTranslateParams = Record<string, unknown>;

/**
 * Where a language's strings come from. Return the tree (or a promise of
 * it); the service flattens, caches per language and merges overrides.
 */
export interface MkTranslateLoader {
  load(lang: string): Promise<MkTranslationTree> | MkTranslationTree;
}

/** A loader factory; runs inside an injection context, so `inject()` works. */
export type MkTranslateLoaderFactory = () => MkTranslateLoader;

/** Options for {@link provideMkTranslate}. */
export interface MkTranslateConfig {
  /** Language loaded first and used until `use()` switches it. */
  lang: string;
  /** Looked up when the active language lacks a key. Default: none. */
  fallbackLang?: string;
  /** Base strings — the bundled JSON, typically ({@link mkHttpTranslateLoader}). */
  loader: MkTranslateLoaderFactory;
  /**
   * Optional second source merged OVER the base per language: edits kept in
   * a database, a tenant's wording, a translator's work in progress. A
   * loader that throws or resolves `{}` leaves the base untouched.
   */
  overrides?: MkTranslateLoaderFactory;
  /**
   * Block application bootstrap until the initial language is loaded, so the
   * first render never shows raw keys and `instant()` calls inside
   * `computed()` never cache them. Default `true`.
   */
  preload?: boolean;
  /**
   * What a server render hands to the browser through `TransferState`:
   * - `'used'` (default): only the keys read while rendering this page —
   *   a few KB — so hydration never flashes raw keys, while the full
   *   dictionary loads in the background right after;
   * - `'all'`: the whole dictionary (no second request, but every page
   *   carries it);
   * - `'none'`: nothing; the browser loads the file itself before bootstrap.
   */
  transfer?: 'used' | 'all' | 'none';
  /**
   * Mirror the active language onto `<html lang>` (server and browser), so
   * screen readers, hyphenation and search engines follow `use()`. Default
   * `true`.
   */
  documentLang?: boolean;
  /**
   * Called for a key missing in both the active and the fallback language.
   * Return a string to render instead of the key. Missing keys are also
   * collected in {@link MkTranslate.missingKeys}.
   */
  onMissing?: (key: string, lang: string) => string | undefined | void;
}
