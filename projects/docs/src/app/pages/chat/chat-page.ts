import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  MkButton,
  MkChat,
  MkChatMessageDef,
  MkPromptBox,
  type MkChatMessage,
  type MkChatSend,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

const ANSWERS: Array<{ match: RegExp; text: string; tool?: { name: string; summary: string; output: string } }> = [
  {
    match: /order/i,
    text: 'I found **3 open orders** for Ada Lovelace:\n\n| Order | Total | Status |\n|---|---|---|\n| #1042 | 86,00 zł | Paid |\n| #1041 | 32,50 zł | Packing |\n| #1039 | 120,00 zł | Refund requested |\n\nWant me to open #1039?',
    tool: { name: 'search_orders', summary: '3 results', output: '{ "customer": "ada@example.com", "status": "open" }' },
  },
  {
    match: /code|angular|signal/i,
    text: 'Here is the smallest useful version:\n\n```ts\nreadonly messages = signal<MkChatMessage[]>([]);\n\nask({ text }: MkChatSend) {\n  this.messages.update((m) => [...m, { id: crypto.randomUUID(), role: \'user\', text }]);\n}\n```\n\nReplace the array (or the message object) and the log re-renders — signals compare by reference.',
  },
  {
    match: /.*/,
    text: 'Happy to help. I can look up orders, draft replies or explain any part of the dashboard — try *"show Ada\'s orders"*.',
  },
];

/** Chat & prompt box demo page. */
@Component({
  selector: 'docs-chat-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton, MkChat, MkChatMessageDef, MkPromptBox],
  template: `
    <div class="docs-page docs-container">
      <h1>Chat</h1>
      <p class="docs-lead">
        <code class="docs-inline">&lt;mk-chat&gt;</code> is a conversation:
        a screen-reader-announced log of bubbles that stays pinned to the newest
        message while text streams in, a typing indicator, and a composer that
        turns its send button into <em>stop</em> while a reply is being
        generated. Assistant text renders as Markdown (tables, code, lists),
        tool calls show as collapsible cards, files as previews. The component
        is presentational — hand it <code class="docs-inline">messages</code>
        and wire <code class="docs-inline">(send)</code> to your transport.
      </p>

      <h2>Assistant with streaming and tools</h2>
      <p>
        Ask about <em>orders</em> to see a tool card and a table, or about
        <em>code</em> for a code block. Replies stream in word by word; press
        the stop button to abort. Scroll up while a reply streams to see
        <em>Jump to latest</em>.
      </p>
      <docs-example [code]="chatCode" column>
        <mk-chat
          [messages]="messages()"
          [busy]="busy()"
          [typing]="typing()"
          attachments
          accept="image/*,.pdf"
          [suggestions]="busy() ? [] : suggestions"
          (send)="ask($event)"
          (stop)="abort()"
          (retry)="resend($event)"
          class="demo-chat"
        >
          <div mkChatHeader class="demo-chat__header">
            <strong>Support assistant</strong>
            <span class="demo-chat__status">{{ busy() ? 'Generating…' : 'Online' }}</span>
          </div>
          <span mkChatFooter>Replies are simulated in this demo.</span>
        </mk-chat>
        <div style="display: flex; gap: var(--mk-space-2); margin-top: var(--mk-space-3)">
          <button mkButton size="sm" variant="outline" tone="neutral" (click)="failNext.set(true)">Make the next message fail</button>
          <button mkButton size="sm" variant="outline" tone="neutral" (click)="reset()">Reset</button>
        </div>
      </docs-example>

      <h2>Prompt box on its own</h2>
      <p>
        <code class="docs-inline">&lt;mk-prompt-box&gt;</code> is the composer:
        an auto-growing textarea (Enter sends, Shift+Enter breaks the line),
        attachments by button, drop or paste, quick-reply suggestions, an
        optional character counter and a two-way
        <code class="docs-inline">value</code>.
      </p>
      <docs-example [code]="promptCode" column>
        <mk-prompt-box
          [(value)]="draft"
          attachments
          [maxLength]="280"
          [suggestions]="['Summarise this page', 'Draft a reply']"
          (send)="lastSend.set($event)"
        />
        <p class="echo">
          Draft: {{ draft() || '—' }}
          @if (lastSend(); as s) {
            · Sent: "{{ s.text }}" with {{ s.files.length }} file(s)
          }
        </p>
      </docs-example>

      <h2>Custom message template</h2>
      <p>
        Give <code class="docs-inline">mk-chat</code> an
        <code class="docs-inline">ng-template mkChatMessageDef</code> to render
        each message yourself — a compact transcript here — while keeping the
        log, auto-scroll and composer. The context carries the message,
        <code class="docs-inline">own</code> and
        <code class="docs-inline">index</code>.
      </p>
      <docs-example [code]="templateCode" column>
        <mk-chat [messages]="transcript" readonly class="demo-chat demo-chat--short" showAvatars="false">
          <ng-template mkChatMessageDef let-m let-own="own">
            <p class="transcript-line" [class.transcript-line--own]="own">
              <span class="transcript-who">{{ own ? 'You' : (m.author?.name ?? 'Bot') }}</span>
              {{ m.text }}
            </p>
          </ng-template>
        </mk-chat>
      </docs-example>
    </div>
  `,
  styles: `
    .demo-chat {
      height: 30rem;
      border: var(--mk-border-width) solid var(--mk-border);
      border-radius: var(--mk-radius-lg);
      overflow: hidden;
    }
    .demo-chat--short { height: 14rem; }
    .demo-chat__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .demo-chat__status {
      font-size: var(--mk-font-size-xs);
      color: var(--mk-text-muted);
    }
    .transcript-line {
      margin: 0;
      font-family: var(--mk-font-mono);
      font-size: var(--mk-font-size-sm);
    }
    .transcript-line--own { color: var(--mk-primary); }
    .transcript-who {
      display: inline-block;
      min-width: 4rem;
      color: var(--mk-text-muted);
    }
  `,
})
export class ChatPage {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly suggestions = ["Show Ada's orders", 'Give me the Angular code', 'What can you do?'];
  protected readonly messages = signal<MkChatMessage[]>(this.seed());
  protected readonly busy = signal(false);
  protected readonly typing = signal(false);
  protected readonly failNext = signal(false);
  protected readonly draft = signal('');
  protected readonly lastSend = signal<MkChatSend | null>(null);

  protected readonly transcript: MkChatMessage[] = [
    { id: 't1', role: 'user', text: 'deploy status?' },
    { id: 't2', role: 'assistant', text: 'build #512 green, rollout 40 %', author: { name: 'ops-bot' } },
    { id: 't3', role: 'user', text: 'pause it' },
    { id: 't4', role: 'assistant', text: 'paused at 40 %', author: { name: 'ops-bot' } },
  ];

  private timer: ReturnType<typeof setInterval> | null = null;
  private counter = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.abort());
  }

  protected ask({ text, files }: MkChatSend): void {
    const id = this.nextId();
    const message: MkChatMessage = {
      id,
      role: 'user',
      text,
      timestamp: new Date(),
      attachments: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    };
    if (this.failNext()) {
      this.failNext.set(false);
      this.messages.update((m) => [...m, { ...message, error: 'Could not send — network error' }]);
      return;
    }
    this.messages.update((m) => [...m, message]);
    this.reply(text);
  }

  protected resend(message: MkChatMessage): void {
    this.messages.update((m) => m.map((x) => (x.id === message.id ? { ...x, error: undefined } : x)));
    this.reply(message.text);
  }

  protected abort(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.typing.set(false);
    this.busy.set(false);
    this.messages.update((m) => m.map((x) => (x.streaming ? { ...x, streaming: false } : x)));
  }

  protected reset(): void {
    this.abort();
    this.messages.set(this.seed());
  }

  private reply(prompt: string): void {
    const answer = ANSWERS.find((a) => a.match.test(prompt))!;
    const words = answer.text.split(/(?<=\s)/);
    const id = this.nextId();
    this.busy.set(true);
    this.typing.set(true);
    let i = 0;
    const start = () => {
      this.typing.set(false);
      this.messages.update((m) => [
        ...m,
        {
          id,
          role: 'assistant',
          text: '',
          author: { name: 'Assistant' },
          timestamp: new Date(),
          streaming: true,
          tools: answer.tool ? [{ ...answer.tool, status: 'done' }] : undefined,
        },
      ]);
      this.timer = setInterval(() => {
        i++;
        const done = i >= words.length;
        const text = words.slice(0, i).join('');
        this.messages.update((m) => m.map((x) => (x.id === id ? { ...x, text, streaming: !done } : x)));
        if (done) this.abort();
      }, 45);
    };
    this.timer = setTimeout(start, 700) as unknown as ReturnType<typeof setInterval>;
  }

  private seed(): MkChatMessage[] {
    const t = (h: number, m: number) => new Date(2026, 7, 26, h, m);
    return [
      { id: 'sys', role: 'system', text: 'Today' },
      { id: 'u1', role: 'user', text: 'Hi! Can you help me with a customer?', timestamp: t(9, 12) },
      {
        id: 'a1',
        role: 'assistant',
        author: { name: 'Assistant' },
        text: 'Of course. Tell me who, and what you need — orders, invoices or a reply draft.',
        timestamp: t(9, 12),
      },
    ];
  }

  private nextId(): string {
    return `m${++this.counter}-${Date.now().toString(36)}`;
  }

  protected readonly chatCode = `<mk-chat
  [messages]="messages()"
  [busy]="generating()"
  [typing]="peerTyping()"
  attachments accept="image/*,.pdf"
  [suggestions]="['Show open orders', 'Draft a reply']"
  (send)="ask($event)"
  (stop)="abort()"
  (retry)="resend($event)"
  style="height: 32rem"
>
  <div mkChatHeader>Support assistant</div>
  <span mkChatFooter>Answers may be inaccurate.</span>
</mk-chat>

// Streaming = keep replacing the message object as text arrives
readonly messages = signal<MkChatMessage[]>([]);

async ask({ text, files }: MkChatSend) {
  this.messages.update((m) => [...m, { id: uid(), role: 'user', text, timestamp: new Date() }]);
  const id = uid();
  this.messages.update((m) => [...m, { id, role: 'assistant', text: '', streaming: true }]);
  for await (const chunk of this.llm.stream(text)) {
    this.messages.update((m) => m.map((x) => (x.id === id ? { ...x, text: x.text + chunk } : x)));
  }
  this.messages.update((m) => m.map((x) => (x.id === id ? { ...x, streaming: false } : x)));
}

// Tool calls and files live on the message
{ id, role: 'assistant', text: '3 orders found.',
  tools: [{ name: 'search_orders', status: 'done', summary: '3 results', output: '…' }],
  attachments: [{ name: 'report.pdf', size: 88213, url: '/files/report.pdf' }] }`;

  protected readonly promptCode = `<mk-prompt-box
  [(value)]="draft"
  attachments
  [maxLength]="280"
  [suggestions]="['Summarise this page', 'Draft a reply']"
  (send)="post($event)"     // { text, files }
/>

<!-- Ctrl/Cmd+Enter sends, Enter breaks the line -->
<mk-prompt-box sendOnEnter="false" placeholder="Write a note…" />`;

  protected readonly templateCode = `<mk-chat [messages]="transcript" readonly showAvatars="false">
  <ng-template mkChatMessageDef let-m let-own="own" let-i="index">
    <p [class.own]="own"><span>{{ own ? 'You' : m.author?.name }}</span> {{ m.text }}</p>
  </ng-template>
</mk-chat>`;
}
