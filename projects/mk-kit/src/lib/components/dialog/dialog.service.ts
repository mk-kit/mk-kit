import { Injectable, Type, inject } from '@angular/core';
import {
  MkOverlayConfig,
  MkOverlayService,
} from '../../core/overlay/overlay.service';
import { MK_I18N } from '../../core/i18n/mk-i18n';
import { MkOverlayRef } from '../../core/overlay/overlay-ref';
import { MkConfirmDialog, MkConfirmDialogData } from './confirm-dialog';
import { MkPromptDialog, MkPromptDialogData } from './prompt-dialog';

/** Configuration for `MkDialogService.open`. Extends the raw overlay config. */
export interface MkDialogConfig<TData = unknown>
  extends MkOverlayConfig<TData> {}

const DIALOG_PANEL_CLASS = 'mk-dialog-panel';

/**
 * Dialog service — a thin, opinionated layer over {@link MkOverlayService} that
 * renders content on a themed `--mk-surface` panel (shadow, radius, entrance
 * animation) and adds a `confirm()` convenience.
 *
 * ```ts
 * const ref = dialog.open(EditUserDialog, { data: user });
 * const saved = await ref.afterClosed;
 *
 * if (await dialog.confirm({ title: 'Delete?', message: 'This cannot be undone.', tone: 'danger' })) {
 *   remove();
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkDialogService {
  private readonly overlay = inject(MkOverlayService);
  private readonly i18n = inject(MK_I18N);

  /** Open `component` inside a themed dialog panel. */
  open<TComponent, TResult = unknown, TData = unknown>(
    component: Type<TComponent>,
    config: MkDialogConfig<TData> = {},
  ): MkOverlayRef<TResult, TComponent> {
    return this.overlay.open<TComponent, TResult, TData>(component, {
      ...config,
      role: config.role ?? 'dialog',
      panelClass: this.mergePanelClass(config.panelClass),
    });
  }

  /**
   * Open a confirmation dialog. Resolves `true` if confirmed, `false` if the
   * user cancels, presses Escape, or clicks the backdrop.
   */
  confirm(data: MkConfirmDialogData): Promise<boolean> {
    const ref = this.open<MkConfirmDialog, boolean, MkConfirmDialogData>(
      MkConfirmDialog,
      {
        data,
        role: data.tone === 'danger' ? 'alertdialog' : 'dialog',
        ariaLabel: data.title,
      },
    );
    return ref.afterClosed.then((result) => result === true);
  }

  /**
   * Open a single-button acknowledgement dialog. Resolves when the user
   * dismisses it (button, Escape, or backdrop).
   */
  alert(data: Omit<MkConfirmDialogData, 'hideCancel' | 'cancelText'>): Promise<void> {
    const ref = this.open<MkConfirmDialog, boolean, MkConfirmDialogData>(
      MkConfirmDialog,
      {
        data: {
          ...data,
          hideCancel: true,
          confirmText: data.confirmText ?? this.i18n.ok,
        },
        role: data.tone === 'danger' ? 'alertdialog' : 'dialog',
        ariaLabel: data.title,
      },
    );
    return ref.afterClosed.then(() => undefined);
  }

  /**
   * Open a single-field prompt dialog. Resolves with the entered string, or
   * `null` if the user cancels, presses Escape, or clicks the backdrop.
   */
  prompt(data: MkPromptDialogData): Promise<string | null> {
    const ref = this.open<MkPromptDialog, string | null, MkPromptDialogData>(
      MkPromptDialog,
      { data, ariaLabel: data.title },
    );
    return ref.afterClosed.then((result) => result ?? null);
  }

  private mergePanelClass(
    panelClass: string | string[] | undefined,
  ): string[] {
    if (!panelClass) return [DIALOG_PANEL_CLASS];
    const extra = Array.isArray(panelClass) ? panelClass : [panelClass];
    return [DIALOG_PANEL_CLASS, ...extra];
  }
}
