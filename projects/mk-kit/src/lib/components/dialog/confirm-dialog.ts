import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MK_OVERLAY_DATA, MkOverlayRef } from '../../core/overlay/overlay-ref';
import { MkButton } from '../button';
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
  imports: [MkDialog, MkButton],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkConfirmDialog {
  private readonly ref =
    inject<MkOverlayRef<boolean>>(MkOverlayRef);
  protected readonly data = inject<MkConfirmDialogData>(MK_OVERLAY_DATA);

  protected readonly confirmTone = computed(() => this.data.tone ?? 'primary');
  protected readonly confirmText = computed(
    () => this.data.confirmText ?? 'Confirm',
  );
  protected readonly cancelText = computed(
    () => this.data.cancelText ?? 'Cancel',
  );

  protected confirm(): void {
    this.ref.close(true);
  }

  protected cancel(): void {
    this.ref.close(false);
  }
}
