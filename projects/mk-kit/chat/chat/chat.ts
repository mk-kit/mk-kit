import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkIcon } from '@mk-kit/ui/icon';
import { NgTemplateOutlet } from '@angular/common';
import { MkChatMessageComponent } from '../chat-message/chat-message';
import { MkPromptBox } from '../prompt-box/prompt-box';
import type { MkChatMessage, MkChatRole, MkChatSend } from '../chat.types';

/** Context handed to an `*mkChatMessageDef` template. */
export interface MkChatMessageContext {
  $implicit: MkChatMessage;
  own: boolean;
  index: number;
}

/**
 * Custom message rendering for `mk-chat`:
 *
 * ```html
 * <mk-chat [messages]="messages()">
 *   <ng-template mkChatMessageDef let-message let-own="own">
 *     <my-bubble [message]="message" [mine]="own" />
 *   </ng-template>
 * </mk-chat>
 * ```
 */
@Directive({ selector: 'ng-template[mkChatMessageDef]' })
export class MkChatMessageDef {
  readonly template = inject(TemplateRef<MkChatMessageContext>);
  static ngTemplateContextGuard(_dir: MkChatMessageDef, ctx: unknown): ctx is MkChatMessageContext {
    return true;
  }
}

/**
 * Chat — a conversation: a scrolling, screen-reader-announced log of
 * `mk-chat-message` bubbles that stays pinned to the newest message while
 * text streams in (with a *jump to latest* button once the reader scrolls
 * up), a typing indicator, and an `mk-prompt-box` composer.
 *
 * The component is presentational: hand it `messages` (replace the array or
 * a message object to update — signals compare by reference) and react to
 * `(send)` / `(stop)` / `(retry)` with your own transport.
 *
 * ```html
 * <mk-chat
 *   [messages]="messages()"
 *   [busy]="generating()"
 *   [typing]="peerTyping()"
 *   attachments
 *   [suggestions]="starters"
 *   (send)="ask($event)"
 *   (stop)="abort()"
 *   (retry)="resend($event)"
 *   style="height: 32rem"
 * >
 *   <div mkChatHeader>…title, model picker…</div>
 *   <div mkChatEmpty>…first-run hint…</div>
 * </mk-chat>
 * ```
 *
 * Slots: `[mkChatHeader]`, `[mkChatEmpty]`, `[mkChatFooter]` (under the composer).
 */
@Component({
  selector: 'mk-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkButton, MkChatMessageComponent, MkIcon, MkPromptBox, NgTemplateOutlet],
  host: { class: 'mk-chat' },
})
export class MkChat {
  protected readonly i18n = inject(MK_I18N);

  /** The conversation, oldest first. */
  readonly messages = input<readonly MkChatMessage[]>([]);
  /** Which role renders on the "own" side (default `user`). */
  readonly ownRole = input<MkChatRole>('user');
  /** Render assistant text as Markdown. */
  readonly markdown = input(true, { transform: booleanAttribute });
  readonly showAvatars = input(true, { transform: booleanAttribute });
  readonly showTimestamps = input(true, { transform: booleanAttribute });
  /** Someone else is typing (shows the dots indicator). */
  readonly typing = input(false, { transform: booleanAttribute });
  /** A reply is being generated: composer shows *stop*. */
  readonly busy = input(false, { transform: booleanAttribute });
  /** Disable the composer. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Hide the composer entirely (read-only transcript). */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string | undefined>(undefined);
  /** Allow attachments in the composer. */
  readonly attachments = input(false, { transform: booleanAttribute });
  readonly accept = input('');
  readonly maxFiles = input(0);
  readonly maxLength = input(0);
  /** Quick replies above the composer; each click sends its text. */
  readonly suggestions = input<readonly string[]>([]);
  /** Text shown when there are no messages (or project `[mkChatEmpty]`). */
  readonly emptyMessage = input<string | undefined>(undefined);
  /** Keep the log pinned to the newest message while the reader is at the bottom. */
  readonly autoScroll = input(true, { transform: booleanAttribute });
  /** Accessible name of the log region. */
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly send = output<MkChatSend>();
  readonly stop = output<void>();
  readonly retry = output<MkChatMessage>();

  protected readonly messageDef = contentChild(MkChatMessageDef);
  private readonly log = viewChild.required<ElementRef<HTMLElement>>('log');
  private readonly composer = viewChild(MkPromptBox);

  /** The reader is (near) the bottom of the log. */
  protected readonly atBottom = signal(true);
  /** Messages that arrived while scrolled up. */
  protected readonly unseen = signal(0);
  private lastCount = 0;

  protected readonly resolvedEmpty = computed(() => this.emptyMessage() ?? this.i18n.chatEmpty);
  protected readonly resolvedPlaceholder = computed(() => this.placeholder() ?? this.i18n.chatPlaceholder);

  constructor() {
    // Pin to the bottom on new content while the reader is there.
    afterRenderEffect(() => {
      const list = this.messages();
      const last = list[list.length - 1];
      // Track text growth of a streaming message as well as new messages.
      void last?.text.length;
      void this.typing();
      const count = list.length;
      untracked(() => {
        const grew = count > this.lastCount;
        this.lastCount = count;
        if (!this.autoScroll()) return;
        if (this.atBottom()) this.scrollToBottom();
        else if (grew) this.unseen.update((n) => n + 1);
      });
    });
  }

  /** Scroll the log to the newest message. */
  scrollToBottom(): void {
    const el = this.log().nativeElement;
    el.scrollTop = el.scrollHeight;
    this.atBottom.set(true);
    this.unseen.set(0);
  }

  /** Focus the composer. */
  focus(): void {
    this.composer()?.focus();
  }

  protected onScroll(): void {
    const el = this.log().nativeElement;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distance < 48;
    this.atBottom.set(near);
    if (near) this.unseen.set(0);
  }

  protected isOwn(m: MkChatMessage): boolean {
    return m.role === this.ownRole();
  }

  protected trackMessage = (_: number, m: MkChatMessage): string => m.id;
}
