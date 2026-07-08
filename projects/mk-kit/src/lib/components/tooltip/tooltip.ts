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
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '../../core/a11y/unique-id';
import type { MkPlacement } from '../../core/types';

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
  readonly visible = input(false);
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
    const gap = 8;
    const placement = this.mkTooltipPlacement();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        top = rect.bottom + gap;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tip.height / 2;
        left = rect.left - tip.width - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tip.height / 2;
        left = rect.right + gap;
        break;
      default: // top variants
        top = rect.top - tip.height - gap;
        break;
    }

    if (placement === 'left' || placement === 'right') {
      // top/left already computed above
    } else if (placement.endsWith('-start')) {
      left = rect.left;
    } else if (placement.endsWith('-end')) {
      left = rect.right - tip.width;
    } else {
      left = rect.left + rect.width / 2 - tip.width / 2;
    }

    // Clamp within the viewport.
    const vw = this.document.documentElement.clientWidth;
    const vh = this.document.documentElement.clientHeight;
    left = Math.max(gap, Math.min(left, vw - tip.width - gap));
    top = Math.max(gap, Math.min(top, vh - tip.height - gap));

    panel.style.position = 'fixed';
    panel.style.top = `${Math.round(top)}px`;
    panel.style.left = `${Math.round(left)}px`;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
