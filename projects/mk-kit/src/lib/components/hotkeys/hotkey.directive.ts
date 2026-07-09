import {
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { MkHotkeysService } from './hotkeys.service';

/**
 * `[mkHotkey]` — declaratively bind a keyboard shortcut to a host element.
 *
 * When the combo fires, a `<button>` or `<a>` host is `click()`ed; any other
 * host emits `(mkHotkeyPressed)`. Registration is scoped to the element's
 * lifetime (auto-unregistered on destroy) via {@link MkHotkeysService}.
 *
 * ```html
 * <button mkHotkey="mod+s" (click)="save()">Save</button>
 * <div mkHotkey="?" (mkHotkeyPressed)="showHelp()">…</div>
 * ```
 */
@Directive({
  selector: '[mkHotkey]',
  exportAs: 'mkHotkey',
})
export class MkHotkey {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly hotkeys = inject(MkHotkeysService);

  /** The combo (or space-separated chord) to bind, e.g. `mod+k`, `g i`, `?`. */
  readonly mkHotkey = input.required<string>();
  /** Fire even while an editable field is focused. */
  readonly mkHotkeyAllowInInput = input(false, { transform: booleanAttribute });
  /** Call `preventDefault()` when the hotkey fires. Defaults to `true`. */
  readonly mkHotkeyPreventDefault = input(true, { transform: booleanAttribute });

  /** Emitted when the hotkey fires and the host is not a button/link. */
  readonly mkHotkeyPressed = output<KeyboardEvent>();

  private dispose?: () => void;

  constructor() {
    afterNextRender(() => {
      this.dispose = this.hotkeys.register(this.mkHotkey(), (e) => this.onTrigger(e), {
        allowInInput: this.mkHotkeyAllowInInput(),
        preventDefault: this.mkHotkeyPreventDefault(),
      });
    });
  }

  private onTrigger(e: KeyboardEvent): void {
    const el = this.host.nativeElement;
    const tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A') {
      el.click();
      return;
    }
    this.mkHotkeyPressed.emit(e);
  }

  ngOnDestroy(): void {
    this.dispose?.();
  }
}
