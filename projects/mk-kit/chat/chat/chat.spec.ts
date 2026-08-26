import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkChat, MkChatMessageDef } from './chat';
import type { MkChatMessage } from '../chat.types';

const seed = (): MkChatMessage[] => [
  { id: 's', role: 'system', text: 'Today' },
  { id: '1', role: 'user', text: 'Hi <b>there</b>', timestamp: new Date(2026, 7, 26, 9, 5), attachments: [{ name: 'spec.pdf', size: 2048 }] },
  {
    id: '2',
    role: 'assistant',
    text: '**Hello!** How can I help?',
    author: { name: 'Bot' },
    tools: [{ name: 'lookup', status: 'done', summary: '1 hit', output: '{"ok":true}' }],
  },
];

@Component({
  imports: [MkChat, MkChatMessageDef],
  template: `
    <mk-chat
      [messages]="messages()"
      [typing]="typing()"
      [readonly]="readonly()"
      [suggestions]="['Ask me']"
      (send)="sent.push($event.text)"
      (retry)="retried.push($event.id)"
      style="height: 200px"
    >
      <div mkChatHeader>Support</div>
      @if (custom()) {
        <ng-template mkChatMessageDef let-m let-own="own">
          <p class="custom" [class.own]="own">{{ m.text }}</p>
        </ng-template>
      }
    </mk-chat>
  `,
})
class Host {
  readonly messages = signal<MkChatMessage[]>(seed());
  readonly typing = signal(false);
  readonly readonly = signal(false);
  readonly custom = signal(false);
  sent: string[] = [];
  retried: string[] = [];
}

describe('MkChat', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const chat = () => fixture.debugElement.children[0].componentInstance as MkChat;
  const log = () => root().querySelector<HTMLElement>('.mk-chat__log')!;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('renders an accessible log with bubbles on the right sides, markdown for assistants only', () => {
    expect(log().getAttribute('role')).toBe('log');
    expect(log().getAttribute('aria-live')).toBe('polite');
    const items = root().querySelectorAll<HTMLElement>('mk-chat-message');
    expect(items).toHaveLength(3);
    expect(items[0].classList.contains('mk-chat-message--system')).toBe(true);
    expect(items[1].classList.contains('mk-chat-message--own')).toBe(true);
    expect(items[1].getAttribute('aria-label')).toMatch(/^You, /);
    // User text is plain — the <b> is shown literally, not rendered.
    expect(items[1].querySelector('.mk-chat-message__plain')!.textContent).toBe('Hi <b>there</b>');
    expect(items[1].querySelector('.mk-chat-message__file')!.textContent).toContain('2 kB');
    expect(items[2].querySelector('mk-markdown strong')!.textContent).toBe('Hello!');
    expect(items[2].getAttribute('aria-label')).toBe('Bot');
    const tool = items[2].querySelector('details')!;
    expect(tool.querySelector('summary code')!.textContent).toBe('lookup');
    expect(tool.querySelector('.mk-chat-message__tool-io')!.textContent).toBe('{"ok":true}');
    expect(root().querySelector('.mk-chat__header')!.textContent).toContain('Support');
  });

  it('shows empty state, typing indicator and streaming cursor', async () => {
    host.messages.set([]);
    await settle();
    expect(root().querySelector('.mk-chat__empty')!.textContent).toContain('No messages yet');
    host.typing.set(true);
    await settle();
    expect(root().querySelector('.mk-chat__typing')).toBeTruthy();
    host.messages.set([{ id: 'x', role: 'assistant', text: 'Thinking', streaming: true }]);
    await settle();
    expect(root().querySelector('.mk-chat-message__cursor')).toBeTruthy();
    expect(root().querySelector('.mk-chat-message__actions')).toBeNull(); // no copy while streaming
  });

  it('forwards send from the composer and retry from a failed message', async () => {
    const ta = root().querySelector<HTMLTextAreaElement>('textarea')!;
    ta.value = 'ping';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(host.sent).toEqual(['ping']);

    host.messages.update((m) => [...m, { id: 'e', role: 'user', text: 'lost', error: 'Not delivered' }]);
    await settle();
    const err = root().querySelector<HTMLElement>('.mk-chat-message__error')!;
    expect(err.textContent).toContain('Not delivered');
    err.querySelector('button')!.click();
    expect(host.retried).toEqual(['e']);
  });

  it('hides the composer when readonly and uses a custom message template when given', async () => {
    host.readonly.set(true);
    host.custom.set(true);
    await settle();
    expect(root().querySelector('mk-prompt-box')).toBeNull();
    expect(root().querySelectorAll('mk-chat-message')).toHaveLength(0);
    const custom = root().querySelectorAll<HTMLElement>('.custom');
    expect(custom).toHaveLength(3);
    expect(custom[1].classList.contains('own')).toBe(true);
  });

  it('pins to the bottom on new messages and offers jump-to-latest once scrolled up', async () => {
    const el = log();
    // jsdom has no layout: emulate a scrollable log.
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: 200 });
    chat().scrollToBottom();
    expect(el.scrollTop).toBe(1000);

    el.scrollTop = 100;
    el.dispatchEvent(new Event('scroll'));
    await settle();
    expect(root().querySelector('.mk-chat__jump')).toBeTruthy();
    host.messages.update((m) => [...m, { id: 'n', role: 'assistant', text: 'new' }]);
    await settle();
    expect(el.scrollTop).toBe(100); // not yanked down
    expect(root().querySelector('.mk-chat__badge')!.textContent!.trim()).toBe('1');

    root().querySelector<HTMLButtonElement>('.mk-chat__jump')!.click();
    await settle();
    expect(el.scrollTop).toBe(1000);
    expect(root().querySelector('.mk-chat__jump')).toBeNull();
  });
});
