import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkIcon } from '@mk-kit/ui/icon';
import { MkAvatar, MkMarkdown } from '@mk-kit/ui/data';
import { MkCopyToClipboard } from '@mk-kit/ui/directives';
import type { MkChatAttachment, MkChatMessage, MkChatToolCall } from '../chat.types';

/**
 * ChatMessage — one bubble: avatar, author and time, attachment previews,
 * tool-call cards, the text (Markdown for assistants) with a streaming
 * cursor, and copy / retry actions. `mk-chat` renders these for you; use it
 * directly to build your own list.
 */
@Component({
  selector: 'mk-chat-message',
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAvatar, MkButton, MkCopyToClipboard, MkIcon, MkMarkdown],
  host: {
    class: 'mk-chat-message',
    role: 'article',
    '[class.mk-chat-message--own]': 'own()',
    '[class.mk-chat-message--system]': 'message().role === "system"',
    '[class.mk-chat-message--streaming]': 'message().streaming',
    '[class.mk-chat-message--error]': '!!message().error',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class MkChatMessageComponent {
  protected readonly i18n = inject(MK_I18N);

  /** The message to render. */
  readonly message = input.required<MkChatMessage>();
  /** Render on the "own" (end) side — `mk-chat` sets this from `ownRole`. */
  readonly own = input(false, { transform: booleanAttribute });
  /** Render `text` as Markdown (assistants only; user text is always plain). */
  readonly markdown = input(true, { transform: booleanAttribute });
  readonly showAvatar = input(true, { transform: booleanAttribute });
  readonly showTimestamp = input(true, { transform: booleanAttribute });
  /** Offer a copy button on hover / focus. */
  readonly copyable = input(true, { transform: booleanAttribute });

  /** The retry button of a failed message was pressed. */
  readonly retry = output<MkChatMessage>();

  protected readonly authorName = computed(() => {
    const m = this.message();
    if (m.author?.name) return m.author.name;
    return m.role === 'user' ? this.i18n.chatYou : m.role === 'assistant' ? this.i18n.chatAssistant : '';
  });

  protected readonly time = computed(() => {
    const ts = this.message().timestamp;
    if (ts == null) return '';
    const d = ts instanceof Date ? ts : new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d);
  });

  protected readonly ariaLabel = computed(() => {
    const parts = [this.authorName(), this.time()].filter(Boolean);
    return parts.join(', ') || null;
  });

  protected readonly useMarkdown = computed(() => this.markdown() && this.message().role === 'assistant');

  protected isImage(a: MkChatAttachment): boolean {
    return !!a.url && !!a.type?.startsWith('image/');
  }

  protected formatSize(bytes: number | undefined): string {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  protected toolIcon(tool: MkChatToolCall): string {
    return tool.status === 'done' ? 'check' : tool.status === 'error' ? 'circle-alert' : 'loader';
  }

  protected toolStatus(tool: MkChatToolCall): string {
    return tool.status === 'done'
      ? this.i18n.chatToolDone
      : tool.status === 'error'
        ? this.i18n.chatToolError
        : this.i18n.chatToolRunning;
  }
}
