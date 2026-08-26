import {
  type ComponentRef,
  DOCUMENT,
  Directive,
  ElementRef,
  type OnDestroy,
  ViewContainerRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MkMentionPanel } from './mention-panel';

/** How mention suggestions are narrowed against the typed query. */
export type MkMentionFilterMode = 'contains' | 'startsWith' | 'none';

/** A single suggestion offered by {@link MkMention}. */
export interface MkMentionOption {
  /** Machine identifier (username, tag slug) — also matched when filtering. */
  value: string;
  /** Text shown in the panel; the default insertion writes `trigger + label`. */
  label: string;
  /** Muted, single-line disambiguator shown after the label (e-mail, count…). */
  hint?: string;
  /**
   * Offer this option for one trigger character only (e.g. `'#'` for tags).
   * Options without a `trigger` are offered for every trigger.
   */
  trigger?: string;
}

/** Payload of {@link MkMention.mentionSearch}. */
export interface MkMentionSearchEvent {
  /** The trigger character that opened the session (`'@'`, `'#'`, …). */
  trigger: string;
  /** Text typed between the trigger and the caret. */
  query: string;
}

/** Payload of {@link MkMention.mentionSelect}. */
export interface MkMentionSelectEvent {
  option: MkMentionOption;
  trigger: string;
}

/** An active mention context inside the control's value. */
interface MentionSession {
  trigger: string;
  /** Index of the trigger character in the control's value. */
  start: number;
  /** Text between the trigger and the caret. */
  query: string;
}

/** Queries longer than this stop being treated as an active mention. */
const MAX_QUERY = 60;

/**
 * CSS properties cloned from the control onto the offscreen mirror `<div>`
 * used to measure the caret's pixel position. Together they reproduce the
 * control's text layout closely enough that a marker span placed at the
 * caret's character index lands on the caret's on-screen coordinates.
 */
const MIRROR_PROPS = [
  'box-sizing',
  'width',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'font-stretch',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'text-transform',
  'text-indent',
  'text-align',
  'direction',
  'tab-size',
  'overflow-wrap',
  'word-break',
] as const;

/**
 * Mention / hashtag autocomplete for a **native** `<textarea>` or text
 * `<input>`. Typing a trigger character (`@`, `#`, …) at the start of a word
 * opens a top-layer suggestion panel anchored at the caret; picking an option
 * replaces the trigger-plus-query with the completed mention and dispatches an
 * `input` event so `ngModel`/reactive-forms bindings stay in sync.
 *
 * The element keeps its native textbox semantics — no `role="combobox"` — and
 * follows the ARIA activedescendant pattern while the panel is open
 * (`aria-autocomplete="list"`, `aria-controls`, `aria-expanded`,
 * `aria-activedescendant`).
 *
 * Filtering is built in (`contains` / `startsWith` over label + value); set
 * `mentionFilter="none"` and drive `mentionOptions` from the `mentionSearch`
 * output for async/server-side suggestions (`mentionLoading` keeps the panel
 * open with a spinner while results are in flight).
 *
 * ```html
 * <textarea mkMention
 *   [mentionTriggers]="['@', '#']"
 *   [mentionOptions]="users"
 *   (mentionSelect)="onPick($event)"
 * ></textarea>
 * ```
 */
@Directive({
  selector: 'textarea[mkMention], input[mkMention]',
  exportAs: 'mkMention',
  host: {
    'aria-haspopup': 'listbox',
    'aria-autocomplete': 'list',
    '[attr.aria-expanded]': 'panelOpen()',
    '[attr.aria-controls]': 'panelOpen() ? listId : null',
    '[attr.aria-activedescendant]': 'activeOptionId()',
    '(input)': 'update()',
    '(click)': 'update()',
    '(keydown)': 'onKeydown($event)',
    '(keyup)': 'onKeyup($event)',
    '(blur)': 'onBlur($event)',
  },
})
export class MkMention implements OnDestroy {
  private readonly host =
    inject<ElementRef<HTMLTextAreaElement | HTMLInputElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly vcr = inject(ViewContainerRef);

  /** Single characters that start a mention session. */
  readonly mentionTriggers = input<readonly string[]>(['@']);
  /** The suggestion pool. Update it from `mentionSearch` for async sources. */
  readonly mentionOptions = input<readonly MkMentionOption[]>([]);
  /** How suggestions are filtered against the typed query. */
  readonly mentionFilter = input<MkMentionFilterMode>('contains');
  /** Keep the panel open with a loading row while async results are pending. */
  readonly mentionLoading = input(false, { transform: booleanAttribute });
  /**
   * Builds the text inserted for a picked option. Defaults to
   * `` `${trigger}${option.label} ` `` (note the trailing space).
   */
  readonly mentionInsert = input<
    ((option: MkMentionOption, trigger: string) => string) | null
  >(null);

  /** Emits `{trigger, query}` whenever the active query changes — drive async loading. */
  readonly mentionSearch = output<MkMentionSearchEvent>();
  /** Emits after an option has been inserted into the control. */
  readonly mentionSelect = output<MkMentionSelectEvent>();

  /** Id of the listbox panel, wired to `aria-controls` while open. */
  readonly listId = mkUniqueId('mk-mention-list');

  private readonly session = signal<MentionSession | null>(null);
  private readonly activeIndex = signal(0);
  /** Caret anchor point (viewport px) the panel is positioned against. */
  private readonly caretAnchor = signal({ x: 0, y: 0 });
  /**
   * Trigger index dismissed via Escape. The session stays closed while the
   * caret remains in a mention context at this index — i.e. until a new
   * trigger is typed elsewhere (or this one is deleted).
   */
  private dismissedStart: number | null = null;

  private panelRef: ComponentRef<MkMentionPanel> | null = null;

  /** Options for the active session, after trigger scoping + filtering. */
  private readonly filtered = computed<readonly MkMentionOption[]>(() => {
    const s = this.session();
    if (!s) return [];
    const pool = this.mentionOptions().filter(
      (o) => !o.trigger || o.trigger === s.trigger,
    );
    const mode = this.mentionFilter();
    const q = s.query.toLowerCase();
    if (mode === 'none' || !q) return pool;
    return pool.filter((o) => {
      const label = o.label.toLowerCase();
      const value = o.value.toLowerCase();
      return mode === 'startsWith'
        ? label.startsWith(q) || value.startsWith(q)
        : label.includes(q) || value.includes(q);
    });
  });

  /**
   * The panel shows while a session is active and there is something to show:
   * matching options, or a pending async fetch (`mentionLoading`). Zero
   * options with nothing pending closes the panel (the session itself stays
   * active, so async results arriving later reopen it).
   */
  protected readonly panelOpen = computed(
    () =>
      this.session() !== null &&
      (this.filtered().length > 0 || this.mentionLoading()),
  );

  protected readonly activeOptionId = computed(() => {
    if (!this.panelOpen()) return null;
    const i = this.activeIndex();
    return i >= 0 && i < this.filtered().length
      ? `${this.listId}-opt-${i}`
      : null;
  });

  constructor() {
    // Create/tear down the caret-anchored panel as the session opens and
    // closes — including async `mentionOptions` arriving (or emptying) while
    // a session is active.
    effect(() => {
      const open = this.panelOpen();
      untracked(() => (open ? this.createPanel() : this.destroyPanel()));
    });
    // Keep the active option inside the (re-)filtered list.
    effect(() => {
      const count = this.filtered().length;
      if (count > 0 && untracked(this.activeIndex) >= count) {
        this.activeIndex.set(0);
      }
    });
  }

  // --- session detection ----------------------------------------------------

  /**
   * Looks backwards from the caret for a trigger character that starts a
   * mention context: the trigger must sit at the start of the text or be
   * preceded by whitespace, and the text between it and the caret (the query)
   * must contain no whitespace and stay under {@link MAX_QUERY} characters.
   */
  private detect(): MentionSession | null {
    const el = this.host.nativeElement;
    const caret = el.selectionStart;
    if (caret == null) return null;
    const value = el.value;
    const triggers = this.mentionTriggers();
    const min = Math.max(0, caret - MAX_QUERY - 1);
    for (let i = caret - 1; i >= min; i--) {
      const ch = value[i];
      if (/\s/.test(ch)) return null;
      if (triggers.includes(ch)) {
        if (i > 0 && !/\s/.test(value[i - 1])) return null;
        return { trigger: ch, start: i, query: value.slice(i + 1, caret) };
      }
    }
    return null;
  }

  /** Re-evaluates the mention context after typing or caret movement. */
  protected update(): void {
    const s = this.detect();
    if (!s) {
      this.dismissedStart = null;
      if (untracked(this.session)) this.session.set(null);
      return;
    }
    if (this.dismissedStart != null) {
      // Escaped session: same trigger position stays closed.
      if (s.start === this.dismissedStart) return;
      this.dismissedStart = null;
    }
    this.caretAnchor.set(this.caretPoint());
    const prev = untracked(this.session);
    if (
      prev &&
      prev.start === s.start &&
      prev.trigger === s.trigger &&
      prev.query === s.query
    ) {
      return;
    }
    this.session.set(s);
    this.activeIndex.set(0);
    this.mentionSearch.emit({ trigger: s.trigger, query: s.query });
  }

  private closeSession(viaEscape = false): void {
    const s = untracked(this.session);
    if (!s) return;
    if (viaEscape) this.dismissedStart = s.start;
    this.session.set(null);
  }

  // --- keyboard -------------------------------------------------------------

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (!untracked(this.panelOpen)) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.move(-1);
        break;
      case 'Enter':
      case 'Tab':
        if (untracked(this.filtered).length > 0) {
          e.preventDefault();
          this.commit(untracked(this.activeIndex));
        }
        break;
      case 'Escape':
        // Swallow the key entirely so an enclosing dialog/drawer stays open —
        // Escape dismisses only the topmost layer (the mention panel).
        e.preventDefault();
        e.stopPropagation();
        this.closeSession(true);
        break;
    }
  }

  /** Caret-only movements never fire `input`; re-detect on their keyup. */
  protected onKeyup(event: Event): void {
    switch ((event as KeyboardEvent).key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'Home':
      case 'End':
      case 'PageUp':
      case 'PageDown':
        this.update();
    }
  }

  private move(delta: number): void {
    const count = untracked(this.filtered).length;
    if (!count) return;
    this.activeIndex.set(
      (untracked(this.activeIndex) + delta + count) % count,
    );
  }

  // --- focus ----------------------------------------------------------------

  protected onBlur(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    // Focus moving into the panel (e.g. a screen-reader virtual cursor)
    // must not tear the panel down mid-interaction.
    if (
      related &&
      this.panelRef?.instance.list()?.nativeElement.contains(related)
    ) {
      return;
    }
    this.closeSession();
  }

  // --- insertion ------------------------------------------------------------

  private commit(index: number): void {
    const s = untracked(this.session);
    const opt = untracked(this.filtered)[index];
    if (!s || !opt) return;
    const el = this.host.nativeElement;
    const end = s.start + 1 + s.query.length;
    const insert = this.mentionInsert();
    const text = insert ? insert(opt, s.trigger) : `${s.trigger}${opt.label} `;
    const value = el.value;
    el.value = value.slice(0, s.start) + text + value.slice(end);
    this.session.set(null);
    this.dismissedStart = null;
    const caret = s.start + text.length;
    try {
      el.setSelectionRange(caret, caret);
    } catch {
      // Some input types refuse selection APIs — the value still updated.
    }
    // Let ngModel / reactive-forms CVAs (which listen for `input`) see the
    // programmatic edit.
    el.dispatchEvent(new Event('input', { bubbles: true }));
    this.mentionSelect.emit({ option: opt, trigger: s.trigger });
    el.focus();
  }

  // --- panel lifecycle ------------------------------------------------------

  private createPanel(): void {
    if (this.panelRef) return;
    const ref = this.vcr.createComponent(MkMentionPanel);
    const panel = ref.instance;
    panel.listId = this.listId;
    panel.anchorEl = this.host.nativeElement;
    panel.options = this.filtered;
    panel.activeIndex = this.activeIndex.asReadonly();
    panel.anchorPoint = this.caretAnchor.asReadonly();
    panel.loading = this.mentionLoading;
    panel.onPick = (i) => this.commit(i);
    panel.onHover = (i) => this.activeIndex.set(i);
    panel.onDismiss = () => this.closeSession();
    this.panelRef = ref;
  }

  private destroyPanel(): void {
    this.panelRef?.destroy();
    this.panelRef = null;
  }

  ngOnDestroy(): void {
    this.destroyPanel();
  }

  // --- caret measurement ----------------------------------------------------

  /**
   * Caret pixel position via the mirror-div technique: an offscreen `<div>`
   * cloning the control's text layout gets the value up to the caret plus a
   * marker span; the marker's rect, offset by the control's own rect and
   * scroll position, is the caret's viewport coordinate. Returns the point
   * just **below** the caret's line so the panel opens under it.
   *
   * Environments without layout (SSR, jsdom) safely yield `{0, 0}`.
   */
  private caretPoint(): { x: number; y: number } {
    try {
      const el = this.host.nativeElement;
      const view = this.document.defaultView;
      if (!view) return { x: 0, y: 0 };
      const caret = el.selectionStart ?? el.value.length;
      const style = view.getComputedStyle(el);

      const mirror = this.document.createElement('div');
      for (const prop of MIRROR_PROPS) {
        mirror.style.setProperty(prop, style.getPropertyValue(prop));
      }
      const isInput = el.tagName === 'INPUT';
      // Single-line inputs never wrap; textareas wrap like `pre-wrap`.
      mirror.style.setProperty('white-space', isInput ? 'pre' : 'pre-wrap');
      if (!isInput) mirror.style.setProperty('overflow-wrap', 'break-word');
      mirror.style.position = 'fixed';
      mirror.style.top = '0';
      mirror.style.left = '0';
      mirror.style.visibility = 'hidden';
      mirror.style.pointerEvents = 'none';

      mirror.textContent = el.value.slice(0, caret);
      const marker = this.document.createElement('span');
      // Give the marker the caret's character (or a zero-width space) so it
      // owns a rect on the caret's line instead of collapsing.
      marker.textContent = el.value.slice(caret, caret + 1) || '\u200b';
      mirror.appendChild(marker);
      this.document.body.appendChild(mirror);

      const hostRect = el.getBoundingClientRect();
      const mirrorRect = mirror.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      const lineHeight =
        markerRect.height || parseFloat(style.lineHeight) || 0;
      const x = hostRect.left + (markerRect.left - mirrorRect.left) - el.scrollLeft;
      const y =
        hostRect.top +
        (markerRect.top - mirrorRect.top) -
        el.scrollTop +
        lineHeight;
      mirror.remove();

      if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 };
      return { x, y };
    } catch {
      return { x: 0, y: 0 };
    }
  }
}
