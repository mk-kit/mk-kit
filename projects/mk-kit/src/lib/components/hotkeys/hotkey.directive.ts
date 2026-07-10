import {
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  MkHotkeysService,
  type MkParsedHotkey,
  mkIsMacPlatform,
  mkParseHotkey,
} from './hotkeys.service';

/**
 * `aria-keyshortcuts` names (UI Events `KeyboardEvent.key` values) keyed by
 * the lowercase form {@link mkParseHotkey} produces. Space and plus have
 * dedicated names because they collide with the ARIA separators.
 */
const ARIA_KEY_NAMES: Record<string, string> = {
  ' ': 'Space',
  '+': 'Plus',
  escape: 'Escape',
  enter: 'Enter',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  insert: 'Insert',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
};

/** Map a parsed (lowercase) key to its `aria-keyshortcuts` spelling. */
function ariaKeyName(key: string): string {
  const mapped = ARIA_KEY_NAMES[key];
  if (mapped) return mapped;
  if (/^f\d{1,2}$/.test(key)) return key.toUpperCase(); // F1 … F12
  return key.length === 1 ? key.toUpperCase() : key;
}

/**
 * One parsed combo as an ARIA `+`-joined token, e.g. `Control+Shift+P`.
 * `mod` resolves the same way the matcher does: Meta on macOS, Control
 * elsewhere ({@link mkIsMacPlatform}).
 */
function ariaCombo(parsed: MkParsedHotkey): string {
  const mac = mkIsMacPlatform();
  const tokens: string[] = [];
  if (parsed.ctrl || (parsed.mod && !mac)) tokens.push('Control');
  if (parsed.alt) tokens.push('Alt');
  if (parsed.shift) tokens.push('Shift');
  if (parsed.meta || (parsed.mod && mac)) tokens.push('Meta');
  if (parsed.key) tokens.push(ariaKeyName(parsed.key));
  return tokens.join('+');
}

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
  host: {
    '[attr.aria-keyshortcuts]': 'ariaKeyshortcuts()',
  },
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

  /**
   * The combo in `aria-keyshortcuts` syntax — per-step tokens `+`-joined
   * (`Control+K`), chord steps space-separated (`G I`). Exposed on the host.
   */
  protected readonly ariaKeyshortcuts = computed(() => {
    const combos = this.mkHotkey()
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0)
      .map((step) => ariaCombo(mkParseHotkey(step)))
      .filter((s) => s.length > 0);
    return combos.length ? combos.join(' ') : null;
  });

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
