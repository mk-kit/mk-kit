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
import { mkUniqueId } from '@mkornas/ui/core';
import { mkComputeAnchoredPosition } from '@mkornas/ui/core';
import type { MkPlacement } from '@mkornas/ui/core';

/** Delay (ms) before a pointer-triggered tooltip opens. Focus opens instantly. */
const OPEN_DELAY = 400;

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
 * hides on blur, mouse-leave, or Escape. The tooltip is appended to
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
    '(mouseleave)': 'hide()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
  },
})
export class MkTooltip {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Tooltip text. When empty the tooltip is suppressed. */
  readonly mkTooltip = input('');
  /** Preferred placement relative to the host. */
  readonly mkTooltipPlacement = input<MkPlacement>('top');

  private readonly tooltipId = mkUniqueId('mk-tooltip');
  private ref?: ComponentRef<MkTooltipPanel>;
  private openTimer?: ReturnType<typeof setTimeout>;
  private previousDescribedBy: string | null = null;

  protected onPointerEnter(): void {
    this.scheduleShow(OPEN_DELAY);
  }

  protected onFocus(): void {
    this.scheduleShow(0);
  }

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
    if (!this.ref) return;

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
    this.document.body.appendChild(panel);
    this.ref = ref;

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
