import {
  DOCUMENT,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Grows a `<textarea>` to fit its content, between `minRows` and `maxRows`
 * (0 = unbounded). Resizes on input and when the bound value changes.
 *
 * ```html
 * <textarea mkInput mkAutosize [mkAutosizeMaxRows]="8" [(ngModel)]="note"></textarea>
 * ```
 */
@Directive({
  selector: 'textarea[mkAutosize]',
  host: {
    '(input)': 'resize()',
    style: 'resize: none;',
  },
})
export class MkAutosize {
  private readonly el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Minimum height in rows. */
  readonly minRows = input(1, {
    alias: 'mkAutosizeMinRows',
    transform: numberAttribute,
  });
  /** Maximum height in rows before scrolling (0 = unbounded). */
  readonly maxRows = input(0, {
    alias: 'mkAutosizeMaxRows',
    transform: numberAttribute,
  });
  /** Bind the textarea's value so programmatic changes trigger a resize. */
  readonly value = input<unknown>(undefined, { alias: 'mkAutosizeValue' });

  constructor() {
    afterNextRender(() => this.resize());
    // Re-fit whenever the bound value (or the row bounds) change.
    effect(() => {
      this.value();
      this.minRows();
      this.maxRows();
      if (this.isBrowser) queueMicrotask(() => this.resize());
    });
  }

  /** Recompute the textarea height from its content. */
  resize(): void {
    if (!this.isBrowser) return;
    const ta = this.el.nativeElement;
    const style = this.document.defaultView?.getComputedStyle(ta);
    const line = parseFloat(style?.lineHeight ?? '') || 20;
    const vPad =
      parseFloat(style?.paddingTop ?? '0') +
      parseFloat(style?.paddingBottom ?? '0') +
      parseFloat(style?.borderTopWidth ?? '0') +
      parseFloat(style?.borderBottomWidth ?? '0');

    ta.style.height = 'auto';
    const content = ta.scrollHeight;
    const min = this.minRows() * line + vPad;
    const max = this.maxRows() > 0 ? this.maxRows() * line + vPad : Infinity;
    const height = Math.min(max, Math.max(min, content));
    ta.style.height = `${height}px`;
    ta.style.overflowY = content > max ? 'auto' : 'hidden';
  }
}
