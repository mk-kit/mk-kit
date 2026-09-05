import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { MK_TRANSLATE_CONFIG, MkTranslate } from './translate.service';
import type { MkTranslateConfig } from './translate.types';

/**
 * Register app translations. By default the initial language is loaded
 * before the first render (`preload`), so no view ever shows raw keys and
 * nothing caches them.
 *
 * ```ts
 * providers: [
 *   provideHttpClient(withFetch()),
 *   provideMkTranslate({
 *     lang: 'pl',
 *     fallbackLang: 'pl',
 *     loader: mkHttpTranslateLoader(),
 *     overrides: () => inject(TranslationOverridesApi), // optional
 *   }),
 * ]
 * ```
 */
export function provideMkTranslate(config: MkTranslateConfig): EnvironmentProviders {
  const providers: Parameters<typeof makeEnvironmentProviders>[0] = [
    { provide: MK_TRANSLATE_CONFIG, useValue: config },
  ];
  if (config.preload !== false) {
    providers.push(
      provideAppInitializer(() =>
        inject(MkTranslate)
          .use(config.lang)
          .catch((err: unknown) => {
            // A broken file must not blank the app — keys render as themselves.
            console.error(`[mk-translate] "${config.lang}" failed to load before first render`, err);
          }),
      ),
    );
  }
  return makeEnvironmentProviders(providers);
}
