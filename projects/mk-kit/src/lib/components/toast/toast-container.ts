import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MkToast } from './toast';
import { MkToastService } from './toast.service';

/**
 * Fixed, bottom-right stack that renders the active toasts from
 * {@link MkToastService}. Mounted once, lazily, into `document.body` by the
 * service — not intended for direct template use.
 */
@Component({
  selector: 'mk-toast-container',
  imports: [MkToast],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-toast-container',
    'aria-label': 'Notifications',
  },
})
export class MkToastContainer {
  private readonly service = inject(MkToastService);
  /** Live list of toasts to render. */
  protected readonly toasts = this.service.toasts;
}
