import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MkSnackbar } from './snackbar';
import { MkSnackbarService } from './snackbar.service';

/**
 * Fixed, bottom-centre host that renders the single active snackbar from
 * {@link MkSnackbarService}. Mounted once, lazily, into `document.body` by the
 * service — not intended for direct template use.
 */
@Component({
  selector: 'mk-snackbar-container',
  imports: [MkSnackbar],
  templateUrl: './snackbar-container.html',
  styleUrl: './snackbar-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-snackbar-container',
  },
})
export class MkSnackbarContainer {
  private readonly service = inject(MkSnackbarService);
  /** The active snackbar to render, or `null`. */
  protected readonly active = this.service.active;
}
