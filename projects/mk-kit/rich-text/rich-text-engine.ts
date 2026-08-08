import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';

/** Payload for a split (Enter) event: text before/after the caret. */
export interface MkRichTextSplit {
  before: string;
  after: string;
}

/** A formatting command exposed by the floating toolbar. */
interface MkInlineTool {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
}

/**
 * Rich-text engine — an accessible contenteditable surface with a floating
 * inline formatting toolbar (Bold, Italic, Underline, Strikethrough, Inline
 * code, Link, Clear). Built on the native Selection API +
 * `document.execCommand` (deprecated but universally supported and
 * dependency-free — the only practical way to do inline formatting without a
 * heavyweight editor engine).
 *
 * This is the low-level building block: it emits HTML via `contentChange`, and
 * structural intents (`splitAt`, `removeEmpty`, `arrowOut`) so a block-editor
 * host can create, merge or navigate blocks. For a standalone form control use
 * {@link MkRichText} (`<mk-rich-text>`), which wraps this engine in a CVA over
 * a sanitised HTML string.
 */
@Component({
  selector: 'mk-rich-text-engine',
  templateUrl: './rich-text-engine.html',
  styleUrl: './rich-text-engine.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-rich-text' },
})
export class MkRichTextEngine implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly editableRef = viewChild.required<ElementRef<HTMLElement>>('editable');
  protected readonly i18n = inject(MK_I18N);
  /** Pending toolbar-hide delay from `onBlur`; cleared on destroy. */
  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  /** Current HTML content. */
  readonly html = input<string>('');
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('');
  /** Disable editing. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Allow soft line breaks (Shift+Enter). Plain Enter always splits. */
  readonly multiline = input(true, { transform: booleanAttribute });
  /**
   * Emit `splitAt` on Enter (block-editor hosts). When `false` — standalone
   * field usage — Enter inserts a line break inside this surface instead.
   */
  readonly splitOnEnter = input(true, { transform: booleanAttribute });
  /** Minimum height of the editable surface (any CSS length). */
  readonly minHeight = input<string | null>(null);
  /** Accessible label for the editable region. */
  readonly ariaLabel = input<string>(this.i18n.blockEditor.editableText);
  /** Id of an external label element, for `aria-labelledby`. */
  readonly labelledBy = input<string | null>(null);
  /** Space-separated id list for `aria-describedby`. */
  readonly describedBy = input<string | null>(null);
  /** Reflect an invalid state via `aria-invalid`. */
  readonly invalid = input(false, { transform: booleanAttribute });

  /** Fired on every edit with the sanitised-by-construction HTML. */
  readonly contentChange = output<string>();
  /** Enter pressed: `before` stays in this block, `after` starts a new one. */
  readonly splitAt = output<MkRichTextSplit>();
  /** Backspace at the very start of an empty block. */
  readonly removeEmpty = output<void>();
  /** Caret tried to leave the top/bottom edge with an arrow key. */
  readonly arrowOut = output<'up' | 'down'>();
  /** Focus/blur bubbled so the wrapper can show selection chrome. */
  readonly focusChange = output<boolean>();

  protected readonly isEmpty = signal(true);
  protected readonly toolbar = signal<{ visible: boolean; top: number; left: number }>({
    visible: false,
    top: 0,
    left: 0,
  });
  protected readonly activeFormats = signal<Set<string>>(new Set());

  protected readonly tools: MkInlineTool[] = [
    { id: 'bold', label: this.i18n.blockEditor.bold, icon: 'B', shortcut: 'Ctrl+B' },
    { id: 'italic', label: this.i18n.blockEditor.italic, icon: 'I', shortcut: 'Ctrl+I' },
    { id: 'underline', label: this.i18n.blockEditor.underline, icon: 'U', shortcut: 'Ctrl+U' },
    { id: 'strikeThrough', label: this.i18n.blockEditor.strikethrough, icon: 'S' },
    { id: 'code', label: this.i18n.blockEditor.inlineCode, icon: '</>' },
    { id: 'link', label: this.i18n.blockEditor.link, icon: '🔗' },
    { id: 'clear', label: this.i18n.blockEditor.clearFormatting, icon: '⌫' },
  ];

  protected readonly showPlaceholder = computed(() => this.isEmpty());

  constructor() {
    // Sync the DOM from the `html` input only when the user is not actively
    // editing this element — otherwise setting innerHTML would reset the caret.
    afterRenderEffect(() => {
      const value = this.html() ?? '';
      const el = this.editableRef().nativeElement;
      if (this.document.activeElement === el) return;
      if (el.innerHTML !== value) el.innerHTML = value;
      this.isEmpty.set(this.computeEmpty(el));
    });
  }

  /** Places the caret and focuses (called by the host for navigation). */
  focus(position: 'start' | 'end' = 'end'): void {
    const el = this.editableRef().nativeElement;
    el.focus();
    this.setCaret(el, position);
  }

  protected onInput(): void {
    const el = this.editableRef().nativeElement;
    this.isEmpty.set(this.computeEmpty(el));
    this.contentChange.emit(el.innerHTML);
  }

  protected onFocus(): void {
    this.focusChange.emit(true);
  }

  ngOnDestroy(): void {
    if (this.blurTimer !== null) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
  }

  protected onBlur(): void {
    this.focusChange.emit(false);
    // Hide the toolbar on a delay, but only if focus really left the
    // component — Tabbing into the toolbar itself must not dismiss it.
    if (this.blurTimer !== null) clearTimeout(this.blurTimer);
    this.blurTimer = setTimeout(() => {
      this.blurTimer = null;
      const active = this.document.activeElement;
      if (active && this.host.nativeElement.contains(active)) return;
      this.toolbar.update((t) => (t.visible ? { ...t, visible: false } : t));
    }, 150);
  }

  protected onSelectionChange(): void {
    this.updateToolbar();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const el = this.editableRef().nativeElement;

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.splitOnEnter()) this.emitSplit(el);
      else this.insertLineBreak();
      return;
    }
    // Shift+Enter in single-line mode is a hard split too.
    if (event.key === 'Enter' && event.shiftKey && !this.multiline()) {
      event.preventDefault();
      if (this.splitOnEnter()) this.emitSplit(el);
      else this.insertLineBreak();
      return;
    }
    if (event.key === 'Backspace' && this.isCaretAtStart(el) && this.isSelectionCollapsed()) {
      if (this.computeEmpty(el)) {
        event.preventDefault();
        this.removeEmpty.emit();
      }
      return;
    }
    if (event.key === 'ArrowUp' && this.isCaretAtStart(el) && this.isSelectionCollapsed()) {
      event.preventDefault();
      this.arrowOut.emit('up');
      return;
    }
    if (event.key === 'ArrowDown' && this.isCaretAtEnd(el) && this.isSelectionCollapsed()) {
      event.preventDefault();
      this.arrowOut.emit('down');
      return;
    }
  }

  /** Escape inside the toolbar returns focus to the text; arrows move tools. */
  protected onToolbarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.toolbar.update((t) => ({ ...t, visible: false }));
      this.editableRef().nativeElement.focus();
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const bar = event.currentTarget as HTMLElement;
      const buttons = Array.from(bar.querySelectorAll<HTMLButtonElement>('.mk-rich-text__tool'));
      const current = buttons.indexOf(this.document.activeElement as HTMLButtonElement);
      if (current === -1 || buttons.length === 0) return;
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      buttons[(current + delta + buttons.length) % buttons.length].focus();
    }
  }

  /** Runs a toolbar command, keeping the model + toolbar state in sync. */
  protected runTool(id: string): void {
    const el = this.editableRef().nativeElement;
    el.focus();
    switch (id) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikeThrough':
        this.document.execCommand(id);
        break;
      case 'code':
        this.wrapInlineCode();
        break;
      case 'link':
        this.applyLink();
        break;
      case 'clear':
        this.document.execCommand('removeFormat');
        this.document.execCommand('unlink');
        break;
    }
    this.onInput();
    this.updateToolbar();
  }

  protected isActive(id: string): boolean {
    return this.activeFormats().has(id);
  }

  // --- internals ------------------------------------------------------------

  private emitSplit(el: HTMLElement): void {
    const { before, after } = this.splitHtmlAtCaret(el);
    this.splitAt.emit({ before, after });
  }

  /** Inserts a `<br>` at the caret (Enter in `splitOnEnter=false` mode). */
  private insertLineBreak(): void {
    // insertHTML keeps the markup to the sanitiser's allow-list (`<br>`),
    // unlike the browser's default Enter handling which wraps lines in divs.
    this.document.execCommand('insertHTML', false, '<br>');
    this.onInput();
  }

  /** Extracts markup after the caret so the host can start a new block with it. */
  private splitHtmlAtCaret(el: HTMLElement): MkRichTextSplit {
    const selection = this.document.defaultView?.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { before: el.innerHTML, after: '' };
    }
    const range = selection.getRangeAt(0);
    const tail = range.cloneRange();
    tail.selectNodeContents(el);
    tail.setStart(range.endContainer, range.endOffset);
    const fragment = tail.cloneContents();
    const holder = this.document.createElement('div');
    holder.appendChild(fragment);
    const after = holder.innerHTML;

    const head = range.cloneRange();
    head.selectNodeContents(el);
    head.setEnd(range.startContainer, range.startOffset);
    const headHolder = this.document.createElement('div');
    headHolder.appendChild(head.cloneContents());
    const before = headHolder.innerHTML;
    return { before, after };
  }

  private wrapInlineCode(): void {
    const selection = this.document.defaultView?.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const code = this.document.createElement('code');
    try {
      range.surroundContents(code);
    } catch {
      // Selection crosses element boundaries — fall back to insertHTML.
      const html = range.toString();
      this.document.execCommand('insertHTML', false, `<code>${escapeText(html)}</code>`);
    }
  }

  private applyLink(): void {
    const selection = this.document.defaultView?.getSelection();
    if (!selection || selection.isCollapsed) return;
    const url = this.document.defaultView?.prompt(
      this.i18n.blockEditor.linkUrlPrompt,
      'https://',
    );
    if (url == null) return;
    const trimmed = url.trim();
    if (trimmed === '') {
      this.document.execCommand('unlink');
      return;
    }
    if (!/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return; // block javascript: etc.
    this.document.execCommand('createLink', false, trimmed);
  }

  private updateToolbar(): void {
    const el = this.editableRef().nativeElement;
    const selection = this.document.defaultView?.getSelection();
    if (
      this.disabled() ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed ||
      !el.contains(selection.anchorNode)
    ) {
      this.toolbar.update((t) => (t.visible ? { ...t, visible: false } : t));
      return;
    }
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const host = el.getBoundingClientRect();
    this.toolbar.set({
      visible: true,
      top: rect.top - host.top - 8,
      left: rect.left - host.left + rect.width / 2,
    });
    const active = new Set<string>();
    for (const id of ['bold', 'italic', 'underline', 'strikeThrough']) {
      try {
        if (this.document.queryCommandState(id)) active.add(id);
      } catch {
        /* queryCommandState can throw in some engines */
      }
    }
    this.activeFormats.set(active);
  }

  private computeEmpty(el: HTMLElement): boolean {
    const text = el.textContent?.trim() ?? '';
    return text === '' && !el.querySelector('img, hr, iframe');
  }

  private setCaret(el: HTMLElement, position: 'start' | 'end'): void {
    const selection = this.document.defaultView?.getSelection();
    if (!selection) return;
    const range = this.document.createRange();
    range.selectNodeContents(el);
    range.collapse(position === 'start');
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private isSelectionCollapsed(): boolean {
    return this.document.defaultView?.getSelection()?.isCollapsed ?? true;
  }

  private isCaretAtStart(el: HTMLElement): boolean {
    const selection = this.document.defaultView?.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(el);
    range.setEnd(selection.anchorNode!, selection.anchorOffset);
    return range.toString().length === 0;
  }

  private isCaretAtEnd(el: HTMLElement): boolean {
    const selection = this.document.defaultView?.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0).cloneRange();
    range.selectNodeContents(el);
    range.setStart(selection.anchorNode!, selection.anchorOffset);
    return range.toString().length === 0;
  }
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
