import type { EnvironmentProviders } from '@angular/core';
import { provideMkIcons } from '@mk-kit/ui/icon';
import { MK_EXTENDED_ICONS } from './extended-icons';

/**
 * Registers the whole Lucide-derived extended set ({@link MK_EXTENDED_ICONS})
 * so every `<mk-icon name="…">` in the catalogue resolves. Opt-in: without
 * it only the hand-made defaults are available and an unknown name warns
 * once in dev mode.
 *
 * ```ts
 * import { provideMkExtendedIcons } from '@mk-kit/ui/icon/extended';
 *
 * bootstrapApplication(App, {
 *   providers: [provideMkExtendedIcons()],
 * });
 * ```
 *
 * Size-conscious alternatives (see `provideMkIcons`): register only the
 * themed subsets you use (`provideMkIcons(MK_EXTENDED_ICONS_FILES)`), or load
 * the full set lazily in its own chunk:
 * `provideMkIcons(() => import('@mk-kit/ui/icon/extended').then((m) => m.MK_EXTENDED_ICONS))`.
 * The hand-made defaults keep their names — the generated set never
 * overlaps them.
 */
export function provideMkExtendedIcons(): EnvironmentProviders {
  return provideMkIcons(MK_EXTENDED_ICONS);
}
