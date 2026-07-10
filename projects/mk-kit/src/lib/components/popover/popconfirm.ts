import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MK_I18N } from '../../core/i18n/mk-i18n';
import type { MkPlacement, MkTone } from '../../core/types';
import { MkButton } from '../button/button';
import { MkPopover } from './popover';

/**
 * Popconfirm — an inline confirmation popover (e.g. a row-level "Delete?").
 * Composes {@link MkPopover} with a message and cancel/confirm buttons, so it
 * inherits the top-layer positioning + focus behaviour. Attach it with the
 * `mkPopconfirmFor` directive.
 *
 * ```html
 * <button mkButton tone="danger" [mkPopconfirmFor]="del">Delete</button>
 * <mk-popconfirm #del message="Delete this item?" (confirm)="remove()" />
 * ```
 */
@Component({
  selector: 'mk-popconfirm',
  exportAs: 'mkPopconfirm',
  templateUrl: './popconfirm.html',
  styleUrl: './popconfirm.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkPopover, MkButton],
  host: {
    class: 'mk-popconfirm',
  },
})
export class MkPopconfirm {
  private readonly popover = viewChild(MkPopover);
  protected readonly i18n = inject(MK_I18N);

  /** Confirmation message. */
  readonly message = input(this.i18n.confirmMessage);
  /** Optional bold heading above the message. */
  readonly title = input<string>();
  /** Confirm button label. */
  readonly confirmText = input(this.i18n.confirm);
  /** Cancel button label. */
  readonly cancelText = input(this.i18n.cancel);
  /** Tone of the confirm button (destructive actions use `danger`). */
  readonly tone = input<MkTone>('danger');
  /** Preferred placement relative to the trigger. */
  readonly placement = input<MkPlacement>('top');

  /** Emitted when the user confirms. */
  readonly confirm = output<void>();
  /** Emitted when the user cancels (button, Escape or outside click). */
  readonly cancel = output<void>();

  /** Id of the underlying dialog panel (for the trigger's `aria-controls`). */
  get panelId(): string | null {
    return this.popover()?.panelId ?? null;
  }

  /** Whether the popconfirm is open. */
  opened(): boolean {
    return this.popover()?.opened() ?? false;
  }

  /** Open anchored to `trigger`. */
  open(trigger: HTMLElement): void {
    this.popover()?.open(trigger);
  }

  /** Toggle from a trigger. */
  toggle(trigger: HTMLElement): void {
    this.popover()?.toggle(trigger);
  }

  /** Close the popconfirm. */
  close(): void {
    this.popover()?.close(true);
  }

  /** Set when the user confirms, so the close handler doesn't also cancel. */
  private confirmed = false;

  protected onConfirm(): void {
    this.confirmed = true;
    this.confirm.emit();
    this.popover()?.close(true);
  }

  protected onCancel(): void {
    // Closing emits `closed`, which routes to `cancel` (see onPopoverClosed).
    this.popover()?.close(true);
  }

  /** Any close that wasn't a confirm counts as a cancel (Escape / outside). */
  protected onPopoverClosed(): void {
    if (this.confirmed) {
      this.confirmed = false;
      return;
    }
    this.cancel.emit();
  }
}
