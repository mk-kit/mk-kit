import {
  DOCUMENT,
  Directive,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Ripple — a Material-style touch ripple that expands from the pointer on press.
 * Apply it to any pressable surface (button, list item, card). The directive
 * makes the host a positioned, clipping container and paints a short-lived wave;
 * it respects `prefers-reduced-motion`.
 *
 * ```html
 * <button mkRipple>Save</button>
 * <li mkRipple mkRippleColor="var(--mk-primary)">Item</li>
 * ```
 */
@Directive({
  selector: '[mkRipple]',
  host: {
    '(pointerdown)': 'spawn($event)',
  },
})
export class MkRipple {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Wave colour (any CSS colour). Defaults to the host's `currentColor`. */
  readonly color = input<string>('', { alias: 'mkRippleColor' });
  /** Start every ripple from the centre instead of the pointer. */
  readonly centered = input(false, {
    alias: 'mkRippleCentered',
    transform: booleanAttribute,
  });
  /** Turn the effect off. */
  readonly disabled = input(false, {
    alias: 'mkRippleDisabled',
    transform: booleanAttribute,
  });

  protected spawn(event: PointerEvent): void {
    if (!this.isBrowser || this.disabled()) return;
    const el = this.host.nativeElement;
    const view = this.document.defaultView;
    if (view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // Make the host a positioned, clipping container (idempotent).
    const cs = view?.getComputedStyle(el);
    if (cs && cs.position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';

    const rect = el.getBoundingClientRect();
    const x = this.centered() ? rect.width / 2 : event.clientX - rect.left;
    const y = this.centered() ? rect.height / 2 : event.clientY - rect.top;
    // Radius that reaches the farthest corner from the origin.
    const radius = Math.hypot(
      Math.max(x, rect.width - x),
      Math.max(y, rect.height - y),
    );

    const wave = this.document.createElement('span');
    wave.className = 'mk-ripple__wave';
    Object.assign(wave.style, {
      position: 'absolute',
      left: `${x - radius}px`,
      top: `${y - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: '50%',
      background: this.color() || 'currentColor',
      pointerEvents: 'none',
      transform: 'scale(0)',
      opacity: '0.3',
    });
    el.appendChild(wave);

    const cleanup = () => wave.remove();
    const anim = wave.animate?.(
      [
        { transform: 'scale(0)', opacity: 0.3 },
        { transform: 'scale(1)', opacity: 0 },
      ],
      { duration: 500, easing: 'ease-out' },
    );
    if (anim) anim.onfinish = cleanup;
    // Fallback removal in case the animation never resolves (or is unsupported).
    view?.setTimeout(cleanup, 650);
  }
}
