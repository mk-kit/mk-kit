import { Directive, ElementRef, inject, input } from '@angular/core';
import type { MkOnScreenKeyboardTarget } from './on-screen-keyboard';
import { MkOnScreenKeyboard } from './on-screen-keyboard';

/**
 * Binds an `<input>`/`<textarea>` to an {@link MkOnScreenKeyboard}: opens the
 * panel on focus/click, closes it when focus leaves, and sets
 * `inputmode="none"` so touch devices don't raise the OS keyboard on top of
 * it. Disabled/readonly fields never open the panel.
 *
 * ```html
 * <input mkInput [mkOnScreenKeyboardFor]="kbd" />
 * <mk-on-screen-keyboard #kbd />
 * ```
 */
@Directive({
  selector: 'input[mkOnScreenKeyboardFor], textarea[mkOnScreenKeyboardFor]',
  exportAs: 'mkOnScreenKeyboardTrigger',
  // No aria-expanded: a plain textbox doesn't permit it (axe aria-allowed-attr)
  // and promoting the role to combobox would misdescribe the field.
  host: {
    inputmode: 'none',
    '[attr.aria-controls]': 'keyboard().opened() ? keyboard().panelId : null',
    'aria-haspopup': 'true',
    '(focus)': 'open()',
    '(click)': 'open()',
    '(blur)': 'onBlur()',
    '(keydown.escape)': 'keyboard().close()',
  },
})
export class MkOnScreenKeyboardTrigger {
  private readonly host = inject<ElementRef<MkOnScreenKeyboardTarget>>(ElementRef);

  /** The keyboard instance to open for this field. */
  readonly keyboard = input.required<MkOnScreenKeyboard>({
    alias: 'mkOnScreenKeyboardFor',
  });

  protected open(): void {
    const el = this.host.nativeElement;
    if (el.disabled || el.readOnly) return;
    this.keyboard().open(el, el);
  }

  /**
   * Panel keys `preventDefault()` their pointerdown, so the input only blurs
   * when focus genuinely moves elsewhere — close then.
   */
  protected onBlur(): void {
    this.keyboard().close();
  }
}
