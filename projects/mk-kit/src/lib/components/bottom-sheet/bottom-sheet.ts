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

/** Distance in px the sheet must be dragged down before it dismisses. */
const DISMISS_THRESHOLD = 120;

/**
 * BottomSheet layout — the surface rendered inside an {@link MkOverlayService}
 * panel by {@link MkBottomSheetService}. Provides a drag handle (swipe down to
 * dismiss), an optional titled header with a close button, and a scrollable
 * body for projected content.
 *
 * Slots: `[mkBottomSheetHeader]` (extra header content), default content
 * (body), `[mkBottomSheetFooter]` (sticky footer).
 *
 * ```html
 * <mk-bottom-sheet sheetTitle="Share">
 *   <button mkButton fullWidth variant="ghost">Copy link</button>
 *   <button mkButton fullWidth variant="ghost">Email</button>
 * </mk-bottom-sheet>
 * ```
 */
@Component({
  selector: 'mk-bottom-sheet',
  templateUrl: './bottom-sheet.html',
  styleUrl: './bottom-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Unencapsulated so `.mk-bottom-sheet-panel` (the body-level overlay panel
  // outside this component's view) can be styled from here.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'mk-bottom-sheet' },
})
export class MkBottomSheet {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly overlayRef = inject(MkOverlayRef, { optional: true });

  /** Optional plain-text title rendered in the header. */
  readonly sheetTitle = input<string>();
  /** Stable id for the built-in title element. */
  readonly titleId = input(mkUniqueId('mk-bottom-sheet-title'));
  /** Hide the drag handle (also disables swipe-to-dismiss). */
  readonly hideHandle = input(false, { transform: booleanAttribute });
  /** Hide the header close button. */
  readonly hideClose = input(false, { transform: booleanAttribute });

  private panel: HTMLElement | null = null;
  private dragging = false;
  private startY = 0;

  constructor() {
    afterNextRender(() => this.wireLabelledBy());
  }

  /** Close the surrounding overlay, if any. */
  protected close(): void {
    this.overlayRef?.close();
  }

  protected onHandlePointerDown(event: PointerEvent): void {
    this.panel ??= this.host.nativeElement.closest<HTMLElement>(
      '.mk-bottom-sheet-panel',
    );
    if (!this.panel) return;
    this.dragging = true;
    this.startY = event.clientY;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    this.panel.style.transition = 'none';
  }

  protected onHandlePointerMove(event: PointerEvent): void {
    if (!this.dragging || !this.panel) return;
    const dy = Math.max(0, event.clientY - this.startY);
    this.panel.style.transform = `translateY(${dy}px)`;
  }

  protected onHandlePointerUp(event: PointerEvent): void {
    if (!this.dragging || !this.panel) return;
    this.dragging = false;
    const dy = Math.max(0, event.clientY - this.startY);
    this.panel.style.transition = '';
    if (dy > DISMISS_THRESHOLD) {
      this.overlayRef?.close();
    } else {
      this.panel.style.transform = '';
    }
  }

  /** Point the owning panel's `aria-labelledby` at the title element. */
  private wireLabelledBy(): void {
    const el = this.host.nativeElement;
    const panel = el.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]');
    const titleEl = el.querySelector<HTMLElement>('.mk-bottom-sheet__title');
    if (!panel || !titleEl) return;
    if (!titleEl.id) titleEl.id = this.titleId();
    panel.setAttribute('aria-labelledby', titleEl.id);
  }
}
