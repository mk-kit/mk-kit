import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkOverlayRef } from '@mk-kit/ui/core';

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
  styleUrl: './dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Unencapsulated so `.mk-dialog-panel` (applied to the body-level overlay
  // panel outside this component's view) can be styled from here.
  encapsulation: ViewEncapsulation.None,
  host: { class: 'mk-dialog' },
})
export class MkDialog {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  private readonly overlayRef = inject(MkOverlayRef, { optional: true });

  /** Optional plain-text title. Ignored when a `<mk-dialog-title>` is projected. */
  readonly dialogTitle = input<string>();
  /** Stable id for the built-in title element. */
  readonly titleId = input(mkUniqueId('mk-dialog-title'));
  /** Hide the header close button. */
  readonly hideClose = input(false, { transform: booleanAttribute });
  /**
   * Let the user move the dialog by dragging its header (pointer / touch) or
   * with the arrow keys on the grip that appears in the header. Double-click
   * the header or press Home on the grip to snap back to the centre.
   */
  readonly draggable = input(false, { transform: booleanAttribute });
  /**
   * Let the user resize the dialog from the corner grip (pointer / touch, or
   * arrow keys on the grip; Home resets). The panel never grows past the
   * viewport or shrinks below a usable minimum.
   */
  readonly resizable = input(false, { transform: booleanAttribute });

  private readonly destroyRef = inject(DestroyRef);
  /** The body-level overlay panel this dialog lives in (`null` when inline). */
  private panelEl: HTMLElement | null | undefined;
  /** Current drag offset from the centred position, px. */
  private offset = { x: 0, y: 0 };

  constructor() {
    afterNextRender(() => this.wireLabelledBy());
    afterRenderEffect(() => {
      const draggable = this.draggable();
      const resizable = this.resizable();
      const panel = this.panel();
      if (!panel) return;
      panel.classList.toggle('mk-dialog-panel--draggable', draggable);
      panel.classList.toggle('mk-dialog-panel--resizable', resizable);
    });
    const view = this.host.nativeElement.ownerDocument.defaultView;
    if (view) {
      const onResize = () => this.clampIntoView();
      view.addEventListener('resize', onResize);
      this.destroyRef.onDestroy(() => view.removeEventListener('resize', onResize));
    }
  }

  /** Close the surrounding overlay, if any. */
  protected close(): void {
    this.overlayRef?.close();
  }

  /** Snap back to the centred, preset-sized panel. */
  reset(): void {
    const panel = this.panel();
    if (!panel) return;
    this.offset = { x: 0, y: 0 };
    panel.style.translate = '';
    panel.style.width = '';
    panel.style.height = '';
  }

  // --- Drag / resize -----------------------------------------------------------

  protected onHeaderPointerDown(event: PointerEvent): void {
    if (!this.draggable()) return;
    const target = event.target as HTMLElement;
    // Controls in the header keep their own pointer behaviour.
    if (target.closest('button, a, input, textarea, select, [contenteditable="true"]') && !target.closest('.mk-dialog__grip')) return;
    this.startPointer(event, 'move');
  }

  protected onGripPointerDown(event: PointerEvent): void {
    this.startPointer(event, 'move');
  }

  protected onResizerPointerDown(event: PointerEvent): void {
    this.startPointer(event, 'resize');
  }

  protected onHeaderDoubleClick(event: MouseEvent): void {
    if (!this.draggable()) return;
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return;
    this.reset();
  }

  protected onGripKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 32 : 8;
    const delta = MkDialog.arrowDelta(event.key, step);
    if (delta) {
      event.preventDefault();
      this.moveTo(this.offset.x + delta.x, this.offset.y + delta.y);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.reset();
    }
  }

  protected onResizerKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 64 : 16;
    const delta = MkDialog.arrowDelta(event.key, step);
    const panel = this.panel();
    if (delta && panel) {
      event.preventDefault();
      const rect = panel.getBoundingClientRect();
      const rtl = this.isRtl(panel);
      this.resizeTo(rect.width + (rtl ? -delta.x : delta.x), rect.height + delta.y);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.reset();
    }
  }

  private static arrowDelta(key: string, step: number): { x: number; y: number } | null {
    switch (key) {
      case 'ArrowLeft':
        return { x: -step, y: 0 };
      case 'ArrowRight':
        return { x: step, y: 0 };
      case 'ArrowUp':
        return { x: 0, y: -step };
      case 'ArrowDown':
        return { x: 0, y: step };
      default:
        return null;
    }
  }

  private startPointer(event: PointerEvent, mode: 'move' | 'resize'): void {
    const panel = this.panel();
    if (!panel || event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = { ...this.offset };
    const rect = panel.getBoundingClientRect();
    const rtl = this.isRtl(panel);
    handle.setPointerCapture?.(event.pointerId);
    this.markMoved(panel);
    panel.classList.add('mk-dialog-panel--dragging');

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (mode === 'move') this.moveTo(startOffset.x + dx, startOffset.y + dy);
      else this.resizeTo(rect.width + (rtl ? -dx : dx), rect.height + dy);
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      handle.releasePointerCapture?.(event.pointerId);
      panel.classList.remove('mk-dialog-panel--dragging');
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  }

  /** Move the panel to `(x, y)` px from its centred spot, kept inside the viewport. */
  private moveTo(x: number, y: number): void {
    const panel = this.panel();
    const view = panel?.ownerDocument.defaultView;
    if (!panel || !view) return;
    const rect = panel.getBoundingClientRect();
    // Where the panel sits with no offset at all.
    const baseLeft = rect.left - this.offset.x;
    const baseTop = rect.top - this.offset.y;
    const maxX = Math.max(-baseLeft, view.innerWidth - rect.width - baseLeft);
    const maxY = Math.max(-baseTop, view.innerHeight - rect.height - baseTop);
    this.offset = {
      x: Math.min(Math.max(x, -baseLeft), maxX),
      y: Math.min(Math.max(y, -baseTop), maxY),
    };
    this.markMoved(panel);
    panel.style.translate = `${Math.round(this.offset.x)}px ${Math.round(this.offset.y)}px`;
  }

  /** Resize the panel to `w × h` px within [minimum, viewport]. */
  private resizeTo(w: number, h: number): void {
    const panel = this.panel();
    const view = panel?.ownerDocument.defaultView;
    if (!panel || !view) return;
    const width = Math.min(Math.max(w, 240), view.innerWidth);
    const height = Math.min(Math.max(h, 160), view.innerHeight);
    this.markMoved(panel);
    panel.style.width = `${Math.round(width)}px`;
    panel.style.height = `${Math.round(height)}px`;
    panel.style.maxWidth = '100vw';
    panel.style.maxHeight = '100vh';
    this.clampIntoView();
  }

  /**
   * Once the user takes hold, the entrance animation must never run again —
   * toggling `animation` back on (as a transient class would) restarts it,
   * so the panel would blink after every drag. The class is never removed.
   */
  private markMoved(panel: HTMLElement): void {
    panel.classList.add('mk-dialog-panel--moved');
  }

  private clampIntoView(): void {
    if (this.offset.x === 0 && this.offset.y === 0) return;
    this.moveTo(this.offset.x, this.offset.y);
  }

  private isRtl(panel: HTMLElement): boolean {
    const view = panel.ownerDocument.defaultView;
    return (view?.getComputedStyle(panel).direction ?? 'ltr') === 'rtl';
  }

  private panel(): HTMLElement | null {
    if (this.panelEl === undefined) {
      this.panelEl = this.host.nativeElement.closest<HTMLElement>('.mk-overlay-panel');
    }
    return this.panelEl;
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
