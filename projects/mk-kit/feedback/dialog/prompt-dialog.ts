import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MK_OVERLAY_DATA, MkOverlayRef } from '@mkornas/ui/core';
import { MkButton } from '@mkornas/ui/button';
import { MkInput } from '@mkornas/ui/forms';
import { MkFormField } from '@mkornas/ui/forms';
import { MkDialog } from './dialog';

/** Data contract for {@link MkPromptDialog} / `MkDialogService.prompt`. */
export interface MkPromptDialogData {
  /** Heading text. */
  title: string;
  /** Optional body message shown above the input. */
  message?: string;
  /** Field label. */
  label?: string;
  /** Pre-filled value. */
  value?: string;
  /** Input placeholder. */
  placeholder?: string;
  /** Confirm button label. Default `OK`. */
  confirmText?: string;
  /** Cancel button label. Default `Cancel`. */
  cancelText?: string;
  /** Require a non-empty value before the confirm button enables. */
  required?: boolean;
  /** Native input type (e.g. `text`, `email`, `number`, `password`). */
  inputType?: string;
}

/**
 * Internal component backing `MkDialogService.prompt`. Renders a single text
 * field and resolves the overlay ref with the entered string on confirm, or
 * `null` on cancel / Escape / backdrop. Submitting the form (Enter) confirms.
 */
@Component({
  selector: 'mk-prompt-dialog',
  imports: [MkDialog, MkButton, MkInput, MkFormField],
  templateUrl: './prompt-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkPromptDialog {
  private readonly ref = inject<MkOverlayRef<string | null>>(MkOverlayRef);
  protected readonly data = inject<MkPromptDialogData>(MK_OVERLAY_DATA);
  protected readonly i18n = inject(MK_I18N);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly value = signal(this.data.value ?? '');
  protected readonly confirmText = computed(
    () => this.data.confirmText ?? this.i18n.ok,
  );
  protected readonly cancelText = computed(
    () => this.data.cancelText ?? this.i18n.cancel,
  );
  protected readonly canConfirm = computed(
    () => !this.data.required || this.value().trim().length > 0,
  );

  constructor() {
    afterNextRender(() => this.inputRef()?.nativeElement.focus());
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected submit(): void {
    if (this.canConfirm()) this.ref.close(this.value());
  }

  protected cancel(): void {
    this.ref.close(null);
  }
}
