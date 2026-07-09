import {
  DOCUMENT,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Focuses the host element once it renders. Handy for dialogs, drawers and
 * newly-revealed forms. Disable conditionally with `[mkAutofocus]="cond"`.
 *
 * ```html
 * <input mkInput mkAutofocus />
 * <input mkInput [mkAutofocus]="isEditing()" [mkAutofocusDelay]="100" />
 * ```
 */
@Directive({
  selector: '[mkAutofocus]',
})
export class MkAutofocus {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Whether to focus. Bare `mkAutofocus` = true. */
  readonly enabled = input(true, {
    alias: 'mkAutofocus',
    transform: booleanAttribute,
  });
  /** Delay before focusing, in ms (e.g. to wait out an entrance animation). */
  readonly delay = input(0, {
    alias: 'mkAutofocusDelay',
    transform: numberAttribute,
  });

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser || !this.enabled()) return;
      if (this.delay() > 0) {
        this.document.defaultView?.setTimeout(() => this.focus(), this.delay());
      } else {
        this.focus();
      }
    });
  }

  private focus(): void {
    this.el.nativeElement.focus();
  }
}
