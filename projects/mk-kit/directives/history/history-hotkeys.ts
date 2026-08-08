import { DestroyRef, inject } from '@angular/core';
import { MkHotkeysService } from '../hotkeys/hotkeys.service';
import { MkHistoryService, type MkHistoryStack } from './history.service';

/**
 * Opt-in helper wiring the standard editor shortcuts to a history stack
 * through {@link MkHotkeysService}:
 *
 * - `mod+z` → `undo()`
 * - `mod+shift+z` **and** `mod+y` → `redo()`
 *
 * Must be called in an **injection context** (constructor, field initializer,
 * or `runInInjectionContext`). Nothing is registered automatically — apps own
 * their shortcuts and call this where (and if) they want them:
 *
 * ```ts
 * export class AppShell {
 *   private readonly disposeHistoryKeys = registerHistoryHotkeys();
 * }
 * ```
 *
 * Pass a specific stack (e.g. a `createScope()` stack for a dialog) to bind
 * the shortcuts to it instead of the app-wide {@link MkHistoryService}.
 *
 * Returns a dispose function that unregisters all three shortcuts; it is also
 * called automatically when the current injection context is destroyed.
 *
 * Notes:
 * - `MkHotkeysService` ignores keydowns while an editable element
 *   (input/textarea/select/contentEditable) is focused, so native text-field
 *   undo keeps working — no extra handling needed here.
 * - The shortcuts register with `preventDefault` so the browser's own
 *   history/document undo does not fire alongside yours.
 */
export function registerHistoryHotkeys(
  history: MkHistoryStack = inject(MkHistoryService),
): () => void {
  const hotkeys = inject(MkHotkeysService);
  const disposers = [
    hotkeys.register('mod+z', () => void history.undo(), { preventDefault: true }),
    hotkeys.register('mod+shift+z', () => void history.redo(), { preventDefault: true }),
    hotkeys.register('mod+y', () => void history.redo(), { preventDefault: true }),
  ];

  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    for (const off of disposers) off();
  };
  inject(DestroyRef, { optional: true })?.onDestroy(dispose);
  return dispose;
}
