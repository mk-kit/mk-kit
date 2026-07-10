import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MkButton } from '@mkornas/ui/button';
import { MK_I18N } from '@mkornas/ui/core';
import { MkToastItem, MkToastService } from './toast.service';

/**
 * A single toast card. Internal to the toast system — rendered by
 * {@link MkToastContainer}. Displays a tone accent, optional title, message,
 * optional action button, and (when dismissible) a close button. Auto-dismiss
 * pauses while the toast is hovered or focused.
 */
@Component({
  selector: 'mk-toast',
  imports: [MkButton],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-toast',
    '[attr.data-tone]': 'item().tone',
    '[attr.role]': 'role()',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'resume()',
    '(focusin)': 'pause()',
    '(focusout)': 'resume()',
  },
})
export class MkToast {
  private readonly service = inject(MkToastService);
  protected readonly i18n = inject(MK_I18N);

  /** The toast model to render. */
  readonly item = input.required<MkToastItem>();

  /** Assertive alert for danger, polite status otherwise. */
  protected readonly role = computed(() =>
    this.item().tone === 'danger' ? 'alert' : 'status',
  );

  protected dismiss(): void {
    this.service.dismiss(this.item().id);
  }

  protected runAction(): void {
    this.service.runAction(this.item());
  }

  protected pause(): void {
    this.service.pause(this.item().id);
  }

  protected resume(): void {
    this.service.resume(this.item().id);
  }
}
