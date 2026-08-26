import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MK_I18N, mkUniqueId } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkChip } from '@mk-kit/ui/chip';
import { MkIcon } from '@mk-kit/ui/icon';
import type { MkChatSend } from '../chat.types';

/**
 * PromptBox — the composer of a chat: an auto-growing textarea, attachments
 * (button, drop, paste), quick-reply suggestions and a send button that turns
 * into *stop* while a reply is being generated.
 *
 * Enter sends, Shift+Enter breaks the line (`sendOnEnter="false"` to swap).
 *
 * ```html
 * <mk-prompt-box
 *   [(value)]="draft"
 *   [busy]="generating()"
 *   attachments
 *   [suggestions]="['Summarise this page', 'Draft a reply']"
 *   (send)="ask($event)"
 *   (stop)="abort()"
 * />
 * ```
 */
@Component({
  selector: 'mk-prompt-box',
  templateUrl: './prompt-box.html',
  styleUrl: './prompt-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkButton, MkChip, MkIcon],
  host: {
    class: 'mk-prompt-box',
    '[class.mk-prompt-box--disabled]': 'disabled()',
    '[class.mk-prompt-box--dragging]': 'dragging()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'dragging.set(false)',
    '(drop)': 'onDrop($event)',
  },
})
export class MkPromptBox {
  protected readonly i18n = inject(MK_I18N);
  protected readonly id = mkUniqueId('mk-prompt');

  /** The draft text (two-way). */
  readonly value = model('');
  /** Placeholder of the textarea. */
  readonly placeholder = input(this.i18n.chatPlaceholder);
  /** Disable everything (e.g. while offline). */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** A reply is being generated: the send button becomes *stop*, sending is paused. */
  readonly busy = input(false, { transform: booleanAttribute });
  /** Allow attaching files (button, drag & drop, paste). */
  readonly attachments = input(false, { transform: booleanAttribute });
  /** Accepted file types for the picker (`accept` attribute syntax). */
  readonly accept = input('');
  /** Maximum number of attached files (0 = unlimited). */
  readonly maxFiles = input(0, { transform: numberAttribute });
  /** Maximum draft length; shows a counter when set. */
  readonly maxLength = input(0, { transform: numberAttribute });
  /** Minimum visible rows. */
  readonly rows = input(1, { transform: numberAttribute });
  /** Rows the textarea grows to before scrolling. */
  readonly maxRows = input(8, { transform: numberAttribute });
  /** Enter sends and Shift+Enter breaks the line (default); `false` swaps them. */
  readonly sendOnEnter = input(true, { transform: booleanAttribute });
  /** Quick replies shown above the box; clicking one sends it. */
  readonly suggestions = input<readonly string[]>([]);
  /** Focus the textarea on render. */
  readonly autofocus = input(false, { transform: booleanAttribute });

  /** The user submitted the draft (and any files). */
  readonly send = output<MkChatSend>();
  /** The user pressed *stop* while `busy`. */
  readonly stop = output<void>();

  /** Files waiting to be sent. */
  readonly files = signal<File[]>([]);
  protected readonly dragging = signal(false);

  private readonly textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('textarea');
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly canSend = computed(
    () => !this.disabled() && !this.busy() && (this.value().trim().length > 0 || this.files().length > 0),
  );
  protected readonly remaining = computed(() => (this.maxLength() > 0 ? this.maxLength() - this.value().length : null));

  constructor() {
    afterRenderEffect(() => {
      this.value();
      this.rows();
      this.maxRows();
      this.autosize();
    });
    afterRenderEffect(() => {
      if (this.autofocus()) this.textarea().nativeElement.focus();
    });
  }

  /** Focus the textarea. */
  focus(): void {
    this.textarea().nativeElement.focus();
  }

  /** Empty the draft and the attachment list. */
  clear(): void {
    this.value.set('');
    this.files.set([]);
  }

  /** Submit the current draft (no-op when there is nothing to send or while busy). */
  submit(): void {
    if (!this.canSend()) return;
    this.send.emit({ text: this.value().trim(), files: this.files() });
    this.clear();
  }

  /** Add files, honouring `maxFiles` and `accept`. */
  addFiles(list: ArrayLike<File> | null | undefined): void {
    if (!list || !this.attachments() || this.disabled()) return;
    const accepted = Array.from(list).filter((f) => this.accepts(f));
    if (!accepted.length) return;
    this.files.update((current) => {
      const next = [...current, ...accepted];
      const max = this.maxFiles();
      return max > 0 ? next.slice(0, max) : next;
    });
  }

  removeFile(index: number): void {
    this.files.update((current) => current.filter((_, i) => i !== index));
    this.focus();
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    const plain = !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
    const sends = this.sendOnEnter() ? plain : event.ctrlKey || event.metaKey;
    if (!sends) return;
    event.preventDefault();
    if (this.busy()) return;
    this.submit();
  }

  protected onPaste(event: ClipboardEvent): void {
    const files = event.clipboardData?.files;
    if (files?.length && this.attachments()) {
      event.preventDefault();
      this.addFiles(files);
    }
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.attachments() || this.disabled()) return;
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    this.dragging.set(false);
    if (!this.attachments() || this.disabled()) return;
    event.preventDefault();
    this.addFiles(event.dataTransfer?.files);
  }

  protected openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFilesPicked(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.addFiles(el.files);
    el.value = '';
  }

  protected onSuggestion(text: string): void {
    if (this.disabled() || this.busy()) return;
    this.send.emit({ text, files: [] });
  }

  protected onPrimary(): void {
    if (this.busy()) this.stop.emit();
    else this.submit();
  }

  /** Human-readable size, e.g. `1.2 MB`. */
  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private accepts(file: File): boolean {
    const accept = this.accept().trim();
    if (!accept) return true;
    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '';
    return accept.split(',').some((rule) => {
      const r = rule.trim().toLowerCase();
      if (!r) return false;
      if (r.startsWith('.')) return ext === r;
      if (r.endsWith('/*')) return file.type.toLowerCase().startsWith(r.slice(0, -1));
      return file.type.toLowerCase() === r;
    });
  }

  private autosize(): void {
    const el = this.textarea().nativeElement;
    const view = el.ownerDocument.defaultView;
    if (!view) return;
    const style = view.getComputedStyle(el);
    const line = parseFloat(style.lineHeight) || 20;
    const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const min = this.rows() * line + pad;
    const max = this.maxRows() * line + pad;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }
}
