import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { provideMkExtendedIcons } from '@mk-kit/ui/icon/extended';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // The docs use the whole Lucide-derived catalogue (gallery, demos), so
    // register it eagerly. Apps can pass a themed subset or a lazy loader to
    // provideMkIcons() instead — see /components/icon.
    provideMkExtendedIcons(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withPreloading(PreloadAllModules),
    ),
  ],
};
