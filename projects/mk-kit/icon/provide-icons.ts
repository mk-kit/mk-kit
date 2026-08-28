import {
  type EnvironmentProviders,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { MkIconLoader, MkIconMap, MkIconRegistry } from './icon-registry';

/**
 * Registers extra icons at bootstrap — a themed subset of the extended set,
 * a hand-picked few, your own SVGs, or a lazily loaded map. Call it as many
 * times as you like; each call adds to the {@link MkIconRegistry}. The
 * hand-made defaults are always there; this is for everything else.
 *
 * ```ts
 * import { provideMkIcons } from '@mk-kit/ui/icon';
 * import { MK_EXTENDED_ICONS_FILES, MK_EXTENDED_ICONS_DATA } from '@mk-kit/ui/icon/extended';
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     // themed subsets — only these glyphs end up in the bundle
 *     provideMkIcons(MK_EXTENDED_ICONS_FILES),
 *     provideMkIcons(MK_EXTENDED_ICONS_DATA),
 *     // your own
 *     provideMkIcons({ logo: '<svg viewBox="0 0 24 24">…</svg>' }),
 *     // or the whole extended set in its own lazy chunk, off the critical path
 *     provideMkIcons(() => import('@mk-kit/ui/icon/extended').then((m) => m.MK_EXTENDED_ICONS)),
 *   ],
 * });
 * ```
 *
 * A loader runs once at bootstrap without blocking it: icons already on
 * screen fill in when the chunk lands, and server-side rendering waits for
 * it. Picking single names out of the full map
 * (`{ receipt: MK_EXTENDED_ICONS['receipt'] }`) works but still bundles the
 * whole map — use a subset or copy the SVG when size matters.
 */
export function provideMkIcons(icons: MkIconMap | MkIconLoader): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const registry = inject(MkIconRegistry);
    if (typeof icons === 'function') void registry.load(icons);
    else registry.registerIcons(icons);
  });
}
