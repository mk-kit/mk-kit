import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkOverlayRef } from '../../core/overlay/overlay-ref';

/**
 * Accessible heading for a dialog. Renders as a level-2 heading and exposes a
 * stable id that {@link MkDialog} wires to the panel's `aria-labelledby`.
 *
 * ```html
 * <mk-dialog>
 *   <mk-dialog-title>Delete workspace</mk-dialog-title>
 *   …
 * </mk-dialog>
 * ```
 */
@Component({
  selector: 'mk-dialog-title',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-dialog__title',
    role: 'heading',
    'aria-level': '2',
    '[attr.id]': 'id()',
  },
})
export class MkDialogTitle {
  /** Stable id used for `aria-labelledby` wiring. */
  readonly id = input(mkUniqueId('mk-dialog-title'));
}

/**
 * Dialog layout — a surface with a sticky header, scrollable body, and sticky
 * footer, designed to be rendered inside an {@link MkOverlayService} panel. The
 * header exposes a close button wired to the injected {@link MkOverlayRef} and
 * the dialog's title is linked to the panel via `aria-labelledby`.
 *
 * Slots: `[mkDialogHeader]` / `<mk-dialog-title>` (header), default content
 * (body), `[mkDialogFooter]` (footer).
 *
 * ```html
 * <mk-dialog>
 *   <mk-dialog-title>Rename</mk-dialog-title>
 *   <p>Choose a new name.</p>
 *   <div mkDialogFooter>
 *     <button mkButton variant="ghost">Cancel</button>
 *     <button mkButton>Save</button>
 *   </div>
 * </mk-dialog>
 * ```
 */
@Component({
  selector: 'mk-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Unencapsulated so `.mk-dialog-panel` (applied to the body-level overlay
  // panel outside this component's view) can be styled from here.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'mk-dialog' },
})
export class MkDialog {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly overlayRef = inject(MkOverlayRef, { optional: true });

  /** Optional plain-text title. Ignored when a `<mk-dialog-title>` is projected. */
  readonly dialogTitle = input<string>();
  /** Stable id for the built-in title element. */
  readonly titleId = input(mkUniqueId('mk-dialog-title'));
  /** Hide the header close button. */
  readonly hideClose = input(false, { transform: booleanAttribute });

  constructor() {
    afterNextRender(() => this.wireLabelledBy());
  }

  /** Close the surrounding overlay, if any. */
  protected close(): void {
    this.overlayRef?.close();
  }

  /** Point the owning dialog panel's `aria-labelledby` at the title element. */
  private wireLabelledBy(): void {
    const el = this.host.nativeElement;
    const panel = el.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]');
    if (!panel) return;

    const titleEl = el.querySelector<HTMLElement>(
      'mk-dialog-title, .mk-dialog__title',
    );
    if (!titleEl) return;
    if (!titleEl.id) titleEl.id = this.titleId();
    panel.setAttribute('aria-labelledby', titleEl.id);
  }
}
