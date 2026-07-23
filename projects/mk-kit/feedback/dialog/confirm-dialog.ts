import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MK_OVERLAY_DATA, MkOverlayRef } from '@mkornas/ui/core';
import { MkButton } from '@mkornas/ui/button';
import { MkIcon } from '@mkornas/ui/icon';
import { MkDialog } from './dialog';

/** Data contract for {@link MkConfirmDialog} / `MkDialogService.confirm`. */
export interface MkConfirmDialogData {
  /** Heading text. */
  title: string;
  /** Body message. */
  message: string;
  /** Confirm button label. Default `Confirm`. */
  confirmText?: string;
  /** Cancel button label. Default `Cancel`. */
  cancelText?: string;
  /** Tone of the confirm button (and `alertdialog` semantics when `danger`). */
  tone?: 'primary' | 'danger' | 'warning' | 'success';
  /**
   * Optional registered icon name shown beside the message. Useful when the
   * action is destructive and the wording alone carries no visual weight
   * (`trash`, `alert-triangle`, `user-x`).
   */
  icon?: string;
  /** Hide the cancel button — a single-button acknowledgement (`alert`). */
  hideCancel?: boolean;
}

/**
 * Internal component backing `MkDialogService.confirm`. Renders a title,
 * message, and cancel/confirm buttons. Resolves the overlay ref with `true`
 * on confirm and `false` on cancel. Uses `alertdialog` semantics for the
 * `danger` tone (set on the panel by the service).
 */
@Component({
  selector: 'mk-confirm-dialog',
  imports: [MkDialog, MkButton, MkIcon],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkConfirmDialog {
  private readonly ref =
    inject<MkOverlayRef<boolean>>(MkOverlayRef);
  protected readonly data = inject<MkConfirmDialogData>(MK_OVERLAY_DATA);
  protected readonly i18n = inject(MK_I18N);

  protected readonly confirmTone = computed(() => this.data.tone ?? 'primary');
  protected readonly confirmText = computed(
    () => this.data.confirmText ?? this.i18n.confirm,
  );
  protected readonly cancelText = computed(
    () => this.data.cancelText ?? this.i18n.cancel,
  );

  protected confirm(): void {
    this.ref.close(true);
  }

  protected cancel(): void {
    this.ref.close(false);
  }
}
