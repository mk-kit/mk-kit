import { Injectable, Type, inject } from '@angular/core';
import {
  MkOverlayConfig,
  MkOverlayService,
} from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkOverlayRef } from '@mk-kit/ui/core';
import { MkConfirmDialog, MkConfirmDialogData } from './confirm-dialog';
import type { MkPromptDialog, MkPromptDialogData } from './prompt-dialog';

/**
 * Panel width preset. The panel is always `min(target, 92vw)`, so it shrinks to
 * fit a phone and grows to its target on a desktop.
 *
 * - `sm` (32rem) — the default; confirmations, single-field prompts
 * - `md` (45rem) — two-column forms
 * - `lg` (56rem) — forms with nested sections
 * - `xl` (75rem) — tables or side-by-side content inside a modal
 */
export type MkDialogSize = 'sm' | 'md' | 'lg' | 'xl';

/** Configuration for `MkDialogService.open`. Extends the raw overlay config. */
export interface MkDialogConfig<TData = unknown>
  extends MkOverlayConfig<TData> {
  /** Panel width preset. Defaults to `sm`, matching pre-0.9 behaviour. */
  size?: MkDialogSize;
}

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
    const sizeClass = `mk-dialog-panel--${config.size ?? 'sm'}`;
    return this.overlay.open<TComponent, TResult, TData>(component, {
      ...config,
      role: config.role ?? 'dialog',
      panelClass: this.mergePanelClass(config.panelClass, sizeClass),
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
  async prompt(data: MkPromptDialogData): Promise<string | null> {
    // Loaded on demand: the prompt dialog is the only thing in `feedback` that
    // needs `@mk-kit/ui/forms`, and a static reference here shipped the whole
    // forms entry (input, form field, and their dependencies) to every app
    // that injects this service — including ones that never prompt.
    const { MkPromptDialog } = await import('./prompt-dialog');
    const ref = this.open<MkPromptDialog, string | null, MkPromptDialogData>(
      MkPromptDialog,
      { data, ariaLabel: data.title },
    );
    return ref.afterClosed.then((result) => result ?? null);
  }

  private mergePanelClass(
    panelClass: string | string[] | undefined,
    sizeClass: string,
  ): string[] {
    const base = [DIALOG_PANEL_CLASS, sizeClass];
    if (!panelClass) return base;
    const extra = Array.isArray(panelClass) ? panelClass : [panelClass];
    return [...base, ...extra];
  }
}
