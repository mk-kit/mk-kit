import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkSnackbarItem, MkSnackbarService } from './snackbar.service';

/**
 * The visual snackbar bar. Internal to the snackbar system — rendered by
 * {@link MkSnackbarContainer}. Shows a message, an optional action button and
 * (when `dismissible`) a close button. Auto-dismiss pauses on hover/focus.
 */
@Component({
  selector: 'mk-snackbar',
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-snackbar',
    '[attr.data-tone]': 'item().tone',
    '[attr.role]': 'role()',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'resume()',
    '(focusin)': 'pause()',
    '(focusout)': 'resume()',
  },
})
export class MkSnackbar {
  private readonly service = inject(MkSnackbarService);
  protected readonly i18n = inject(MK_I18N);

  /** The snackbar model to render. */
  readonly item = input.required<MkSnackbarItem>();

  /** Assertive alert for danger/warning, polite status otherwise. */
  protected readonly role = computed(() =>
    this.item().tone === 'danger' || this.item().tone === 'warning'
      ? 'alert'
      : 'status',
  );

  protected runAction(): void {
    this.service.runAction(this.item().id);
  }

  protected dismiss(): void {
    this.service.dismiss(this.item().id);
  }

  protected pause(): void {
    this.service.pause();
  }

  protected resume(): void {
    this.service.resume();
  }
}
