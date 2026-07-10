import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  OnDestroy,
  PLATFORM_ID,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MkPlacement } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkAnchoredPanel } from '../../core/overlay/anchored-overlay';

/**
 * Hovercard — a rich hover-preview panel anchored to a trigger, in the spirit of
 * GitHub's user hovercards. Unlike {@link MkTooltip} (short text) it projects
 * arbitrary content, and unlike {@link MkPopover} (click) it opens on hover/focus
 * after a short delay and closes when the pointer leaves both the trigger and the
 * card. It is driven by the `mkHovercardFor` directive (or the `open`/`close` API).
 *
 * The panel renders in the browser top layer through {@link MkAnchoredPanel}, so
 * it is never clipped by an ancestor's `overflow`/`transform`. It is non-modal —
 * no focus trap. Moving the pointer from the trigger onto the card keeps it open;
 * Escape closes it.
 *
 * ```html
 * <a href="/u/ada" [mkHovercardFor]="ada">@ada</a>
 * <mk-hovercard #ada ariaLabel="Ada Lovelace">
 *   <img src="/ada.png" alt="" /><strong>Ada Lovelace</strong>
 * </mk-hovercard>
 * ```
 */
@Component({
  selector: 'mk-hovercard',
  exportAs: 'mkHovercard',
  templateUrl: './hovercard.html',
  styleUrl: './hovercard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-hovercard',
  },
})
export class MkHovercard implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Stable id for `aria-controls` on the trigger. */
  readonly panelId = mkUniqueId('mk-hovercard');

  /** Preferred placement relative to the trigger. */
  readonly placement = input<MkPlacement>('bottom-start');
  /** Accessible label for the panel. */
  readonly ariaLabel = input<string>();
  /** Delay in ms before the card opens on hover/focus. Default `300`. */
  readonly openDelay = input(300, { transform: numberAttribute });
  /** Delay in ms before the card closes after the pointer leaves. Default `200`. */
  readonly closeDelay = input(200, { transform: numberAttribute });
  /** Close the card when Escape is pressed while it is open. Default `true`. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });

  /** Emitted whenever the hovercard closes (any reason). */
  readonly closed = output<void>();

  private readonly _open = signal(false);
  /** Whether the hovercard is open. */
  readonly opened = this._open.asReadonly();

  protected readonly anchorEl = signal<HTMLElement | undefined>(undefined);
  private triggerEl: HTMLElement | null = null;

  private openTimer: number | null = null;
  private closeTimer: number | null = null;

  /** Open the card anchored to `trigger` after `openDelay` (cancels a pending close). */
  scheduleOpen(trigger: HTMLElement): void {
    if (!this.isBrowser) return;
    this.clearCloseTimer();
    if (this._open()) {
      // Already open — just make sure the anchor is current.
      this.triggerEl = trigger;
      this.anchorEl.set(trigger);
      return;
    }
    if (this.openTimer !== null) return;
    this.openTimer = this.setTimer(() => {
      this.openTimer = null;
      this.open(trigger);
    }, this.openDelay());
  }

  /** Close the card after `closeDelay` (cancels a pending open). */
  scheduleClose(): void {
    if (!this.isBrowser) return;
    this.clearOpenTimer();
    if (!this._open() || this.closeTimer !== null) return;
    this.closeTimer = this.setTimer(() => {
      this.closeTimer = null;
      this.close();
    }, this.closeDelay());
  }

  /**
   * Keep the card open: cancel any pending open/close. Called when the pointer
   * enters the card itself, so moving from the trigger to the card is seamless.
   */
  keepOpen(): void {
    this.clearCloseTimer();
  }

  /** Open the card immediately, anchored to `trigger`. */
  open(trigger: HTMLElement): void {
    if (!this.isBrowser || this._open()) return;
    this.clearOpenTimer();
    this.triggerEl = trigger;
    this.anchorEl.set(trigger);
    this._open.set(true);
  }

  /** Close the card immediately. */
  close(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
    if (!this._open()) return;
    this._open.set(false);
    this.anchorEl.set(undefined);
    this.triggerEl = null;
    this.closed.emit();
  }

  protected onCardEnter(): void {
    this.keepOpen();
  }

  protected onCardLeave(): void {
    this.scheduleClose();
  }

  /**
   * Keyboard mirror of `mouseleave`: when focus moves somewhere outside BOTH
   * the card and its trigger, schedule a close. Focus hopping between the
   * trigger and the card (either direction) keeps it open, so the card's
   * content stays reachable with Tab.
   */
  protected onCardFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related) return;
    const panel = event.currentTarget as HTMLElement | null;
    if (panel?.contains(related) || this.triggerEl?.contains(related)) return;
    this.scheduleClose();
  }

  protected onEscape(event: Event): void {
    if (!this.closeOnEscape()) return;
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  private setTimer(fn: () => void, delay: number): number | null {
    const view = this.document.defaultView;
    return view ? view.setTimeout(fn, delay) : null;
  }

  private clearOpenTimer(): void {
    if (this.openTimer !== null) {
      this.document.defaultView?.clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      this.document.defaultView?.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
  }
}
