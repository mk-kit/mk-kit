import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MkPlacement } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { mkGetFocusable } from '@mkornas/ui/core';
import { MkAnchoredPanel } from '@mkornas/ui/core';

/**
 * Popover — a non-modal floating panel for rich (non-text) content, anchored to
 * a trigger. Unlike {@link MkTooltip} (text, hover) it holds arbitrary projected
 * content and is opened by click via the `mkPopoverTriggerFor` directive (or the
 * `open`/`toggle` API).
 *
 * The panel renders in the browser top layer through {@link MkAnchoredPanel}, so
 * it is never clipped by an ancestor's `overflow`/`transform`. On open, focus
 * moves into the panel; Escape closes and restores focus to the trigger, an
 * outside click or Tabbing out closes it (non-modal — no keyboard trap).
 *
 * ```html
 * <button mkButton [mkPopoverTriggerFor]="info">Details</button>
 * <mk-popover #info ariaLabel="Details">
 *   <h4>Shipping</h4><p>Ships in 2–3 business days.</p>
 * </mk-popover>
 * ```
 */
@Component({
  selector: 'mk-popover',
  exportAs: 'mkPopover',
  templateUrl: './popover.html',
  styleUrl: './popover.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-popover',
  },
})
export class MkPopover {
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** Stable id for `aria-controls` on the trigger. */
  readonly panelId = mkUniqueId('mk-popover');

  /** Preferred placement relative to the trigger. */
  readonly placement = input<MkPlacement>('bottom');
  /** Accessible label for the dialog panel. */
  readonly ariaLabel = input<string>();
  /** Move focus into the panel on open. Default `true`. */
  readonly autoFocus = input(true, { transform: booleanAttribute });

  /** Emitted whenever the popover closes (any reason). */
  readonly closed = output<void>();

  private readonly _open = signal(false);
  /** Whether the popover is open. */
  readonly opened = this._open.asReadonly();

  protected readonly anchorEl = signal<HTMLElement | undefined>(undefined);
  private triggerEl: HTMLElement | null = null;

  /** Open the popover anchored to `trigger`. */
  open(trigger: HTMLElement): void {
    if (!this.isBrowser || this._open()) return;
    this.triggerEl = trigger;
    this.anchorEl.set(trigger);
    this._open.set(true);
    if (this.autoFocus()) {
      afterNextRender(() => this.focusInitial(), { injector: this.injector });
    }
  }

  /** Close the popover; optionally restore focus to the trigger. */
  close(restoreFocus = true): void {
    if (!this._open()) return;
    this._open.set(false);
    this.anchorEl.set(undefined);
    const trigger = this.triggerEl;
    this.triggerEl = null;
    if (restoreFocus) trigger?.focus();
    this.closed.emit();
  }

  /** Toggle open/closed from a trigger. */
  toggle(trigger: HTMLElement): void {
    this._open() ? this.close(true) : this.open(trigger);
  }

  private focusInitial(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    (mkGetFocusable(panel)[0] ?? panel).focus();
  }

  protected onEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.close(true);
  }

  protected onPanelFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    // Focus moved to a non-focusable spot (stays in document.body) — keep open;
    // outside pointerdown is handled separately by the anchored panel.
    if (!related) return;
    const panel = this.panelRef()?.nativeElement;
    if (panel?.contains(related) || this.triggerEl?.contains(related)) return;
    // Tabbed out of the panel — close without yanking focus back.
    this.close(false);
  }
}
