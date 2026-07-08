import { Injectable, Type, inject } from '@angular/core';
import {
  MkOverlayConfig,
  MkOverlayService,
} from '../../core/overlay/overlay.service';
import { MkOverlayRef } from '../../core/overlay/overlay-ref';

/** Configuration for `MkBottomSheetService.open`. Extends the overlay config. */
export interface MkBottomSheetConfig<TData = unknown>
  extends MkOverlayConfig<TData> {}

const BOTTOM_SHEET_PANEL_CLASS = 'mk-bottom-sheet-panel';

/**
 * BottomSheet service — a thin layer over {@link MkOverlayService} that renders
 * a component in a panel anchored to the bottom edge of the viewport: full
 * width on small screens, a centred card capped at ~42rem on large ones. It
 * slides up on open and can be swiped down to dismiss (via {@link MkBottomSheet}).
 *
 * Use it for contextual actions, pickers and mobile-style menus. For a centred
 * modal use `MkDialogService` instead.
 *
 * ```ts
 * const ref = bottomSheet.open(ShareSheet, { data: { url } });
 * const choice = await ref.afterClosed;
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkBottomSheetService {
  private readonly overlay = inject(MkOverlayService);

  /** Open `component` inside a bottom-anchored sheet panel. */
  open<TComponent, TResult = unknown, TData = unknown>(
    component: Type<TComponent>,
    config: MkBottomSheetConfig<TData> = {},
  ): MkOverlayRef<TResult, TComponent> {
    return this.overlay.open<TComponent, TResult, TData>(component, {
      ...config,
      role: config.role ?? 'dialog',
      panelClass: this.mergePanelClass(config.panelClass),
    });
  }

  private mergePanelClass(
    panelClass: string | string[] | undefined,
  ): string[] {
    if (!panelClass) return [BOTTOM_SHEET_PANEL_CLASS];
    const extra = Array.isArray(panelClass) ? panelClass : [panelClass];
    return [BOTTOM_SHEET_PANEL_CLASS, ...extra];
  }
}
