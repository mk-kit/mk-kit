import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { MkPlacement } from '@mk-kit/ui/core';
import { MK_I18N, MkAnchoredPanel, mkUniqueId } from '@mk-kit/ui/core';
import { MkIcon } from '@mk-kit/ui/icon';
import {
  MK_KEYBOARD_LAYOUT_QWERTY_PL,
  type MkKeyboardActionKey,
  type MkKeyboardKey,
  type MkKeyboardLayout,
} from './keyboard-layouts';

/** A resolved key ready for the template. */
interface RenderKey {
  readonly char?: string;
  readonly action?: MkKeyboardActionKey['action'];
  readonly span: number;
}

export type MkOnScreenKeyboardTarget = HTMLInputElement | HTMLTextAreaElement;

/**
 * On-screen keyboard — a touch QWERTY panel for kiosk/till screens where no
 * physical keyboard exists. Anchored below its input in the browser top layer
 * (via {@link MkAnchoredPanel}), it writes caret-aware into the target's
 * native value and dispatches `input` events, so `ngModel`/reactive forms
 * stay in sync with no extra wiring.
 *
 * Pair it with the `mkOnScreenKeyboardFor` directive, which opens the panel
 * on focus and suppresses the OS keyboard (`inputmode="none"`):
 *
 * ```html
 * <input mkInput [mkOnScreenKeyboardFor]="kbd" />
 * <mk-on-screen-keyboard #kbd />
 * ```
 *
 * Layers: base (letters + digit row), shift (auto-resets after one
 * character) and an alternate layer (Polish diacritics + symbols in the
 * default {@link MK_KEYBOARD_LAYOUT_QWERTY_PL}); pass `layout` for other
 * languages. Enter inserts a newline in a `<textarea>` and emits `enter`
 * for single-line inputs. Keys are excluded from the tab order — physical
 * keyboards type into the input directly, the panel is a pointer surface.
 */
@Component({
  selector: 'mk-on-screen-keyboard',
  exportAs: 'mkOnScreenKeyboard',
  templateUrl: './on-screen-keyboard.html',
  styleUrl: './on-screen-keyboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel, MkIcon],
  host: {
    class: 'mk-on-screen-keyboard',
  },
})
export class MkOnScreenKeyboard {
  protected readonly i18n = inject(MK_I18N);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Stable id for `aria-controls` on the trigger. */
  readonly panelId = mkUniqueId('mk-on-screen-keyboard');

  /** Key layout. Defaults to QWERTY with a Polish alternate layer. */
  readonly layout = input<MkKeyboardLayout>(MK_KEYBOARD_LAYOUT_QWERTY_PL);
  /** Preferred placement relative to the input. */
  readonly placement = input<MkPlacement>('bottom-start');

  /** Enter pressed on a single-line input (textareas insert a newline instead). */
  readonly enter = output<void>();
  /** Emitted whenever the keyboard closes (any reason). */
  readonly closed = output<void>();

  private readonly _open = signal(false);
  /** Whether the panel is open. */
  readonly opened = this._open.asReadonly();

  protected readonly anchorEl = signal<HTMLElement | undefined>(undefined);
  protected readonly shift = signal(false);
  protected readonly layer = signal<'base' | 'alt'>('base');
  private target: MkOnScreenKeyboardTarget | null = null;

  protected readonly rows = computed<RenderKey[][]>(() => {
    const layout = this.layout();
    const rows = this.layer() === 'alt' ? layout.alt : layout.base;
    const shift = this.shift();
    return rows.map((row) =>
      row.map((key) => this.resolve(key, shift, layout)),
    );
  });

  private resolve(
    key: MkKeyboardKey,
    shift: boolean,
    layout: MkKeyboardLayout,
  ): RenderKey {
    if (typeof key !== 'string') {
      return { action: key.action, span: key.span ?? 1 };
    }
    const char = shift ? (layout.shiftMap?.[key] ?? key.toUpperCase()) : key;
    return { char, span: 1 };
  }

  /** Open anchored to `anchor`, typing into `target`. */
  open(anchor: HTMLElement, target: MkOnScreenKeyboardTarget): void {
    if (!this.isBrowser) return;
    this.target = target;
    if (this._open()) return;
    this.anchorEl.set(anchor);
    this._open.set(true);
  }

  /** Close the panel. */
  close(): void {
    if (!this._open()) return;
    this._open.set(false);
    this.anchorEl.set(undefined);
    this.target = null;
    this.shift.set(false);
    this.layer.set('base');
    this.closed.emit();
  }

  /** Keys must never steal focus from the input. */
  protected onPanelPointerdown(event: Event): void {
    event.preventDefault();
  }

  protected onKeyClick(key: RenderKey): void {
    if (key.char !== undefined) {
      this.insert(key.char);
      if (this.shift()) this.shift.set(false);
      return;
    }
    switch (key.action) {
      case 'shift':
        this.shift.update((s) => !s);
        break;
      case 'layer':
        this.layer.update((l) => (l === 'base' ? 'alt' : 'base'));
        this.shift.set(false);
        break;
      case 'space':
        this.insert(' ');
        break;
      case 'backspace':
        this.deleteBack();
        break;
      case 'enter':
        if (this.target instanceof HTMLTextAreaElement) this.insert('\n');
        else this.enter.emit();
        break;
    }
  }

  protected keyLabel(key: RenderKey): string {
    switch (key.action) {
      case 'shift':
        return this.i18n.keyboardShift;
      case 'backspace':
        return this.i18n.keypadBackspace;
      case 'space':
        return this.i18n.keyboardSpace;
      case 'enter':
        return this.i18n.keyboardEnter;
      case 'layer':
        return this.layer() === 'base'
          ? this.i18n.keyboardAltLayer
          : this.i18n.keyboardBaseLayer;
      default:
        return key.char ?? '';
    }
  }

  /** The visible face of the layer key: `?ąę` on base, `abc` on alt. */
  protected layerFace(): string {
    return this.layer() === 'base' ? '?ąę' : 'abc';
  }

  private insert(text: string): void {
    const el = this.target;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.setRangeText(text, start, end, 'end');
    this.notify(el);
  }

  private deleteBack(): void {
    const el = this.target;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (start === end) {
      if (start === 0) return;
      el.setRangeText('', start - 1, start, 'end');
    } else {
      el.setRangeText('', start, end, 'end');
    }
    this.notify(el);
  }

  private notify(el: MkOnScreenKeyboardTarget): void {
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
