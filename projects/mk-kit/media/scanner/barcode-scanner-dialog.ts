import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MK_I18N, MK_OVERLAY_DATA, MkOverlayRef } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkDialog } from '@mk-kit/ui/feedback';
import { MK_BARCODE_DEFAULT_FORMATS, MkBarcodeFormat, MkBarcodeScanner } from './barcode-scanner';

/** Optional data for {@link MkBarcodeScannerDialog}. */
export interface MkBarcodeScannerDialogData {
  title?: string;
  formats?: MkBarcodeFormat[];
}

/**
 * The scanner in a dialog: resolves with the decoded text, or `null` when
 * cancelled. Open it with `MkDialogService`:
 *
 * ```ts
 * const code = await dialog.open<MkBarcodeScannerDialog, string | null>(MkBarcodeScannerDialog, { size: 'sm' }).afterClosed;
 * if (code) this.search.setValue(code);
 * ```
 */
@Component({
  selector: 'mk-barcode-scanner-dialog',
  imports: [MkDialog, MkButton, MkBarcodeScanner],
  template: `
    <mk-dialog [dialogTitle]="data?.title || i18n.scannerTitle" hideClose>
      <mk-barcode-scanner
        [formats]="data?.formats || defaultFormats"
        (scanned)="ref.close($event)"
      />
      <div mkDialogFooter>
        <button mkButton variant="ghost" tone="neutral" type="button" (click)="ref.close(null)">
          {{ i18n.cancel }}
        </button>
      </div>
    </mk-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkBarcodeScannerDialog {
  protected readonly i18n = inject(MK_I18N);
  protected readonly data = inject<MkBarcodeScannerDialogData | null>(MK_OVERLAY_DATA, { optional: true });
  protected readonly ref = inject<MkOverlayRef<string | null>>(MkOverlayRef);
  protected readonly defaultFormats = MK_BARCODE_DEFAULT_FORMATS;
}
