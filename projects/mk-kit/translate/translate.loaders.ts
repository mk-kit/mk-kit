import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { MkTranslateLoaderFactory, MkTranslationTree } from './translate.types';

/** Options for {@link mkHttpTranslateLoader}. */
export interface MkHttpTranslateLoaderOptions {
  /** URL prefix; the language code is appended. Default `/assets/i18n/`. */
  prefix?: string;
  /** URL suffix after the language code. Default `.json`. */
  suffix?: string;
}

/**
 * Fetch `<prefix><lang><suffix>` with `HttpClient` — the bundled JSON files
 * in `assets/i18n/`. Needs `provideHttpClient()`; SSR apps that read the
 * files from disk can supply their own {@link MkTranslateLoader} instead.
 */
export function mkHttpTranslateLoader(
  options: MkHttpTranslateLoaderOptions = {},
): MkTranslateLoaderFactory {
  const { prefix = '/assets/i18n/', suffix = '.json' } = options;
  return () => {
    const http = inject(HttpClient);
    return {
      load: (lang: string) => firstValueFrom(http.get<MkTranslationTree>(`${prefix}${lang}${suffix}`)),
    };
  };
}

/**
 * Strings given up front, keyed by language — tests, storybooks, tiny apps.
 * A language not in the map resolves to `{}`.
 */
export function mkStaticTranslateLoader(
  byLang: Record<string, MkTranslationTree>,
): MkTranslateLoaderFactory {
  return () => ({ load: (lang: string) => byLang[lang] ?? {} });
}
