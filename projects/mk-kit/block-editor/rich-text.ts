import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
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
 * Rich-text — an accessible contenteditable surface with a floating inline
 * formatting toolbar (Bold, Italic, Underline, Strikethrough, Inline code,
 * Link, Clear). Built on the native Selection API + `document.execCommand`
 * (deprecated but universally supported and dependency-free — the only
 * practical way to do inline formatting without a heavyweight editor engine).
 *
 * Emits sanitising HTML via `contentChange`, and structural intents
 * (`splitAt`, `removeEmpty`, `arrowOut`) so the host list can create, merge or
 * navigate blocks. Used by the paragraph, heading, quote and list blocks.
 */
@Component({
  selector: 'mk-rich-text',
  templateUrl: './rich-text.html',
  styleUrl: './rich-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mk-rich-text' },
})
export class MkRichText {
  private readonly document = inject(DOCUMENT);
  private readonly editableRef = viewChild.required<ElementRef<HTMLElement>>('editable');
  protected readonly i18n = inject(MK_I18N);

  /** Current HTML content. */
  readonly html = input<string>('');
  /** Placeholder shown when empty. */
  readonly placeholder = input<string>('');
  /** Disable editing. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Allow soft line breaks (Shift+Enter). Plain Enter always splits. */
  readonly multiline = input(true, { transform: booleanAttribute });
  /** Accessible label for the editable region. */
  readonly ariaLabel = input<string>(this.i18n.blockEditor.editableText);

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

  protected onBlur(): void {
    this.focusChange.emit(false);
    // Hide the toolbar on the next tick so toolbar clicks still register.
    setTimeout(() => this.toolbar.update((t) => ({ ...t, visible: false })), 150);
  }

  protected onSelectionChange(): void {
    this.updateToolbar();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const el = this.editableRef().nativeElement;

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.emitSplit(el);
      return;
    }
    // Shift+Enter in single-line mode is a hard split too.
    if (event.key === 'Enter' && event.shiftKey && !this.multiline()) {
      event.preventDefault();
      this.emitSplit(el);
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

  /** Runs a toolbar command, keeping the model + toolbar state in sync. */
  protected runTool(id: string, event?: Event): void {
    event?.preventDefault();
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
