import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * A single hotkey combo parsed into a normalized key + modifier flags.
 * Produced by {@link mkParseHotkey}; consumed by {@link mkMatchesHotkey}.
 */
export interface MkParsedHotkey {
  /** The non-modifier key, lowercased and alias-normalized (e.g. `k`, `escape`, `?`). */
  key: string;
  /** `mod` — Cmd on macOS, Ctrl elsewhere. */
  mod: boolean;
  /** The Control key. */
  ctrl: boolean;
  /** The Meta / Command / Windows key. */
  meta: boolean;
  /** The Alt / Option key. */
  alt: boolean;
  /** The Shift key. */
  shift: boolean;
}

/** Options accepted by {@link MkHotkeysService.register}. */
export interface MkHotkeyOptions {
  /** Call `preventDefault()` on the event when the hotkey fires. Default `false`. */
  preventDefault?: boolean;
  /** Also fire while an editable field (input/textarea/select/contentEditable) is focused. Default `false`. */
  allowInInput?: boolean;
}

/** Tokens that count as modifiers rather than the trigger key. */
const MODIFIERS = new Set(['mod', 'ctrl', 'control', 'meta', 'cmd', 'command', 'alt', 'option', 'shift']);

/** Human-friendly aliases mapped onto their `KeyboardEvent.key` (lowercased) form. */
const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  space: ' ',
  spacebar: ' ',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  del: 'delete',
  return: 'enter',
  plus: '+',
};

/** Keys that are themselves modifiers — ignored as sequence/trigger keys. */
const MODIFIER_KEYS = new Set(['control', 'shift', 'alt', 'meta', 'os', 'altgraph']);

/** True on Apple platforms, where `mod` maps to the Command (meta) key. */
export function mkIsMacPlatform(): boolean {
  return typeof navigator !== 'undefined' && (navigator.platform ?? '').includes('Mac');
}

/**
 * Parse a single hotkey combo (e.g. `'mod+k'`, `'ctrl+shift+p'`, `'?'`) into a
 * structured {@link MkParsedHotkey}. Tokens are joined by `+`; the last
 * non-modifier token is the trigger key. Pure and SSR-safe.
 *
 * For a chord (space-separated sequence like `'g i'`), split on whitespace and
 * parse each step — {@link MkHotkeysService} does this for you.
 */
export function mkParseHotkey(combo: string): MkParsedHotkey {
  const parsed: MkParsedHotkey = {
    key: '',
    mod: false,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
  };
  const tokens = combo
    .trim()
    .split('+')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  for (const token of tokens) {
    switch (token) {
      case 'mod':
        parsed.mod = true;
        break;
      case 'ctrl':
      case 'control':
        parsed.ctrl = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        parsed.meta = true;
        break;
      case 'alt':
      case 'option':
        parsed.alt = true;
        break;
      case 'shift':
        parsed.shift = true;
        break;
      default:
        parsed.key = KEY_ALIASES[token] ?? token;
    }
  }
  return parsed;
}

/**
 * Does a `keydown` event satisfy a hotkey? `combo` may be a raw string (parsed
 * on the fly) or an already-parsed {@link MkParsedHotkey}.
 *
 * The key is compared case-insensitively; modifier flags must match exactly.
 * `mod` resolves to Meta on macOS and Ctrl elsewhere. Shift is not enforced for
 * symbol keys (e.g. `'?'`), whose shifted state varies by keyboard layout.
 */
export function mkMatchesHotkey(event: KeyboardEvent, combo: string | MkParsedHotkey): boolean {
  const parsed = typeof combo === 'string' ? mkParseHotkey(combo) : combo;
  if (!parsed.key) return false;

  if (event.key.toLowerCase() !== parsed.key) return false;

  const mac = mkIsMacPlatform();
  const wantCtrl = parsed.ctrl || (parsed.mod && !mac);
  const wantMeta = parsed.meta || (parsed.mod && mac);
  if (event.ctrlKey !== wantCtrl) return false;
  if (event.metaKey !== wantMeta) return false;
  if (event.altKey !== parsed.alt) return false;

  // Shift: enforce when requested; for symbol keys (non-alphanumeric single
  // chars) the shifted state is layout-dependent, so don't enforce its absence.
  if (parsed.shift) {
    if (!event.shiftKey) return false;
  } else {
    const symbolKey = parsed.key.length === 1 && !/[a-z0-9]/i.test(parsed.key);
    if (!symbolKey && event.shiftKey) return false;
  }
  return true;
}

interface Registration {
  steps: MkParsedHotkey[];
  handler: (e: KeyboardEvent) => void;
  preventDefault: boolean;
  allowInInput: boolean;
}

/** Window (ms) to complete a two-step chord before the pending key is dropped. */
const SEQUENCE_TIMEOUT = 1000;

/**
 * MkHotkeysService — app-wide keyboard shortcuts. Register a combo string and a
 * handler; a single `keydown` listener (attached lazily on the first
 * registration, browser only) dispatches to every match.
 *
 * Supports single combos (`'mod+k'`, `'ctrl+shift+p'`, `'?'`) and simple
 * two-step chords (`'g i'`). By default hotkeys are ignored while an editable
 * field is focused — pass `allowInInput` to opt in per registration.
 *
 * ```ts
 * const off = hotkeys.register('mod+k', (e) => openPalette(), { preventDefault: true });
 * // …later
 * off();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkHotkeysService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly registrations = new Set<Registration>();
  private attached = false;

  /** The first key of an in-progress chord, awaiting its second key. */
  private pendingEvent: KeyboardEvent | null = null;
  private pendingTimer?: ReturnType<typeof setTimeout>;

  /**
   * Register `combo` → `handler`. Returns a disposer that unregisters it.
   * `combo` may be a single combo or a space-separated two-step chord.
   */
  register(
    combo: string,
    handler: (e: KeyboardEvent) => void,
    options: MkHotkeyOptions = {},
  ): () => void {
    const steps = combo
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0)
      .map(mkParseHotkey);

    const registration: Registration = {
      steps,
      handler,
      preventDefault: options.preventDefault ?? false,
      allowInInput: options.allowInInput ?? false,
    };
    this.registrations.add(registration);
    this.ensureAttached();

    return () => {
      this.registrations.delete(registration);
      if (this.registrations.size === 0) this.detach();
    };
  }

  /** Remove every registration and detach the listener. */
  unregisterAll(): void {
    this.registrations.clear();
    this.clearPending();
    this.detach();
  }

  private ensureAttached(): void {
    if (this.attached || !this.isBrowser) return;
    this.document.addEventListener('keydown', this.onKeydown, true);
    this.attached = true;
  }

  private detach(): void {
    if (!this.attached) return;
    this.document.removeEventListener('keydown', this.onKeydown, true);
    this.attached = false;
  }

  private readonly onKeydown = (event: Event): void => {
    const e = event as KeyboardEvent;
    // Bare modifier presses neither trigger nor advance a chord.
    if (MODIFIER_KEYS.has(e.key.toLowerCase())) return;

    const editable = this.isEditable(e.target);

    // 1. Try to complete an in-progress chord.
    if (this.pendingEvent) {
      const first = this.pendingEvent;
      let completed = false;
      for (const reg of this.registrations) {
        if (reg.steps.length !== 2) continue;
        if (editable && !reg.allowInInput) continue;
        if (mkMatchesHotkey(first, reg.steps[0]) && mkMatchesHotkey(e, reg.steps[1])) {
          this.trigger(reg, e);
          completed = true;
        }
      }
      this.clearPending();
      if (completed) return;
      // Otherwise fall through: this key may fire a single hotkey or open a chord.
    }

    // 2. Single-combo matches.
    let matched = false;
    for (const reg of this.registrations) {
      if (reg.steps.length !== 1) continue;
      if (editable && !reg.allowInInput) continue;
      if (mkMatchesHotkey(e, reg.steps[0])) {
        this.trigger(reg, e);
        matched = true;
      }
    }
    if (matched) return;

    // 3. Open a chord if this key matches the first step of any two-step combo.
    for (const reg of this.registrations) {
      if (reg.steps.length !== 2) continue;
      if (editable && !reg.allowInInput) continue;
      if (mkMatchesHotkey(e, reg.steps[0])) {
        this.pendingEvent = e;
        this.pendingTimer = setTimeout(() => this.clearPending(), SEQUENCE_TIMEOUT);
        return;
      }
    }
  };

  private trigger(reg: Registration, e: KeyboardEvent): void {
    if (reg.preventDefault) e.preventDefault();
    reg.handler(e);
  }

  private clearPending(): void {
    this.pendingEvent = null;
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = undefined;
    }
  }

  private isEditable(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || typeof el.tagName !== 'string') return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return el.isContentEditable === true;
  }
}
