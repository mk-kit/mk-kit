import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DOCUMENT,
  Directive,
  ElementRef,
  EnvironmentInjector,
  PLATFORM_ID,
  createComponent,
  inject,
  input,
  booleanAttribute,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MK_OVERLAY_ROOT } from '@mk-kit/ui/core';
import { mkComputeAnchoredPosition } from '@mk-kit/ui/core';
import type { MkPlacement } from '@mk-kit/ui/core';

/** Delay (ms) before a pointer-triggered tooltip opens. Focus opens instantly. */
const OPEN_DELAY = 400;

/**
 * Grace period (ms) after the pointer leaves the trigger (or the panel) before
 * the tooltip hides. Long enough to cross the 8px gap onto the panel — WCAG
 * 1.4.13 "hoverable" — without making the tip feel sticky.
 */
const CLOSE_DELAY = 150;

/**
 * Body-level presentation surface for {@link MkTooltip}. Rendered imperatively
 * by the directive; not intended for direct template use.
 */
@Component({
  selector: 'mk-tooltip',
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-tooltip',
    role: 'tooltip',
    '[attr.id]': 'id()',
    '[attr.data-placement]': 'placement()',
    '[class.mk-tooltip--visible]': 'visible()',
  },
})
export class MkTooltipPanel {
  /** Text content shown inside the tooltip. */
  readonly text = input('');
  /** DOM id used to wire `aria-describedby` on the trigger. */
  readonly id = input<string>();
  /** Resolved placement relative to the trigger. */
  readonly placement = input<MkPlacement>('top');
  /** Drives the entrance/exit transition. */
  readonly visible = input(false, { transform: booleanAttribute });
}

/**
 * Tooltip directive — shows a themed tooltip on hover AND keyboard focus, and
 * hides on blur, mouse-leave (after a short grace period — the pointer may
 * move onto the tooltip itself, which keeps it open, per WCAG 1.4.13), or
 * Escape pressed anywhere while it is visible. The tooltip is appended to
 * `document.body`, positioned relative to the host, and wired to the host via
 * `aria-describedby` for screen-reader users. Respects `prefers-reduced-motion`.
 *
 * ```html
 * <button mkButton [mkTooltip]="'Delete row'" mkTooltipPlacement="bottom">
 *   <svg>…</svg>
 * </button>
 * ```
 */
@Directive({
  selector: '[mkTooltip]',
  host: {
    '(mouseenter)': 'onPointerEnter()',
    '(mouseleave)': 'onPointerLeave()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
    // A tooltip must not outlive the interaction that spawned it. Without
    // this, tapping a tooltipped control leaves the tip on screen — and since
    // tooltips deliberately sit ABOVE dialogs (so a tip inside a modal is
    // visible), a stale one floats over whatever the tap just opened.
    // Exception: a TOUCH tap on the trigger of a hidden tooltip SHOWS it —
    // touch has no hover, so this is the only way a finger reaches the tip.
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class MkTooltip {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly overlayRoot = inject(MK_OVERLAY_ROOT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Set by pointerdown so the focusin it causes doesn't re-open the tip. */
  private suppressFocusShow = false;

  /** Tooltip text. When empty the tooltip is suppressed. */
  readonly mkTooltip = input('');
  /** Preferred placement relative to the host. */
  readonly mkTooltipPlacement = input<MkPlacement>('top');

  private readonly tooltipId = mkUniqueId('mk-tooltip');
  private ref?: ComponentRef<MkTooltipPanel>;
  private openTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private previousDescribedBy: string | null = null;

  /**
   * Hovering the tooltip itself keeps it open (WCAG 1.4.13 "hoverable"): the
   * pointer may cross the gap between trigger and panel, so leaving either one
   * only SCHEDULES a hide, and entering either one cancels it.
   */
  private readonly onPanelEnter = (): void => {
    clearTimeout(this.hideTimer);
  };
  private readonly onPanelLeave = (): void => {
    this.scheduleHide();
  };

  /**
   * WCAG 1.4.13 "dismissible": Escape hides a visible tooltip no matter where
   * focus is. Attached to the document only while the tooltip is shown, and
   * preventDefault only fires when a tooltip was actually hidden.
   */
  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.ref) return;
    event.preventDefault();
    this.hide();
  };

  protected onPointerEnter(): void {
    // Re-entering the trigger during the hide grace period keeps the tip up.
    clearTimeout(this.hideTimer);
    this.scheduleShow(OPEN_DELAY);
  }

  protected onPointerLeave(): void {
    clearTimeout(this.openTimer);
    this.scheduleHide();
  }

  private scheduleHide(): void {
    if (!this.ref) return;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), CLOSE_DELAY);
  }

  protected onFocus(): void {
    // Pointer-driven focus already dismissed the tip on pointerdown; showing
    // it again here would defeat that. Keyboard focus still gets a tooltip.
    if (this.suppressFocusShow) {
      this.suppressFocusShow = false;
      return;
    }
    this.scheduleShow(0);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.suppressFocusShow = true;
    // Touch toggle: hover never happens on a touchscreen, so a tap on the
    // trigger is the show gesture. Tap again (ref exists → fall through to
    // hide) or tap elsewhere (document pointerdown) dismisses. Mouse and pen
    // keep the plain dismiss-on-pointerdown behaviour.
    if (event.pointerType === 'touch' && !this.ref) {
      this.scheduleShow(0);
      return;
    }
    this.hide();
  }

  /**
   * Outside-tap dismissal (attached to the document only while visible): a
   * pointerdown that lands on neither the trigger nor the panel hides the
   * tooltip. The trigger's own pointerdown handles show/hide/toggle itself,
   * and a press on the panel keeps it up (WCAG 1.4.13 "hoverable").
   */
  private readonly onDocumentPointerdown = (event: Event): void => {
    const target = event.target as Node | null;
    if (!target || this.host.nativeElement.contains(target)) return;
    const panel = this.ref?.location.nativeElement as HTMLElement | undefined;
    if (panel?.contains(target)) return;
    this.hide();
  };

  private scheduleShow(delay: number): void {
    if (!this.isBrowser || !this.mkTooltip().trim() || this.ref) return;
    clearTimeout(this.openTimer);
    if (delay === 0) {
      this.show();
    } else {
      this.openTimer = setTimeout(() => this.show(), delay);
    }
  }

  protected hide(): void {
    clearTimeout(this.openTimer);
    clearTimeout(this.hideTimer);
    if (!this.ref) return;

    this.document.removeEventListener('keydown', this.onDocumentKeydown, true);
    this.document.removeEventListener(
      'pointerdown',
      this.onDocumentPointerdown,
      true,
    );

    // Restore the trigger's original aria-describedby.
    const el = this.host.nativeElement;
    if (this.previousDescribedBy === null) {
      el.removeAttribute('aria-describedby');
    } else {
      el.setAttribute('aria-describedby', this.previousDescribedBy);
    }
    this.previousDescribedBy = null;

    const panel = this.ref.location.nativeElement as HTMLElement & {
      hidePopover?: () => void;
    };
    if (panel.matches('[popover]') && typeof panel.hidePopover === 'function') {
      try {
        panel.hidePopover();
      } catch {
        // Already disconnected — nothing to do.
      }
    }

    this.appRef.detachView(this.ref.hostView);
    this.ref.destroy();
    this.ref = undefined;
  }

  private show(): void {
    if (this.ref) return;

    const ref = createComponent(MkTooltipPanel, {
      environmentInjector: this.envInjector,
    });
    ref.setInput('text', this.mkTooltip());
    ref.setInput('id', this.tooltipId);
    ref.setInput('placement', this.mkTooltipPlacement());
    this.appRef.attachView(ref.hostView);

    const panel = ref.location.nativeElement as HTMLElement;
    this.overlayRoot().appendChild(panel);
    this.ref = ref;

    // Hoverable (the listeners die with the panel element on hide) …
    panel.addEventListener('mouseenter', this.onPanelEnter);
    panel.addEventListener('mouseleave', this.onPanelLeave);
    // … and dismissible from anywhere while visible (removed in hide()).
    // Capture phase so the Escape that hides the tooltip is marked
    // defaultPrevented before any bubbling handler (e.g. a dialog deciding
    // whether to close) sees it — layered dismissal, tooltip first.
    this.document.addEventListener('keydown', this.onDocumentKeydown, true);
    // … and from an outside tap — the touch analogue of mouseleave. Capture
    // phase so the tooltip is gone before the tap's own target reacts.
    this.document.addEventListener(
      'pointerdown',
      this.onDocumentPointerdown,
      true,
    );

    // Promote into the top layer so the tooltip is never clipped by an
    // ancestor's overflow/transform or hidden behind a stacking context.
    const withPopover = panel as HTMLElement & { showPopover?: () => void };
    if (typeof withPopover.showPopover === 'function') {
      panel.setAttribute('popover', 'manual');
      try {
        withPopover.showPopover();
      } catch {
        // Unsupported context — fall back to the plain body portal.
      }
    }

    // Wire aria-describedby, preserving any pre-existing value.
    const trigger = this.host.nativeElement;
    this.previousDescribedBy = trigger.getAttribute('aria-describedby');
    trigger.setAttribute(
      'aria-describedby',
      this.previousDescribedBy
        ? `${this.previousDescribedBy} ${this.tooltipId}`
        : this.tooltipId,
    );

    this.position(panel);
    // Reveal on the next frame so the entrance transition runs.
    this.document.defaultView?.requestAnimationFrame(() => {
      this.ref?.setInput('visible', true);
    });
  }

  private position(panel: HTMLElement): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const tip = panel.getBoundingClientRect();
    const pos = mkComputeAnchoredPosition(
      rect,
      { width: tip.width, height: tip.height },
      {
        width: this.document.documentElement.clientWidth,
        height: this.document.documentElement.clientHeight,
      },
      // Clamp back on-screen but keep the requested side (no flip) so the
      // panel's `data-placement` styling stays correct.
      {
        placement: this.mkTooltipPlacement(),
        gap: 8,
        flip: false,
        clamp: true,
        rtl:
          this.document.defaultView?.getComputedStyle(this.host.nativeElement)
            .direction === 'rtl',
      },
    );
    panel.style.position = 'fixed';
    panel.style.margin = '0';
    panel.style.inset = 'auto';
    panel.style.top = `${pos.top}px`;
    panel.style.left = `${pos.left}px`;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
