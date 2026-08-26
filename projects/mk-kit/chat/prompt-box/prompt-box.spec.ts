import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkPromptBox } from './prompt-box';
import type { MkChatSend } from '../chat.types';

@Component({
  imports: [MkPromptBox],
  template: `
    <mk-prompt-box
      [(value)]="draft"
      [busy]="busy()"
      [attachments]="attachments()"
      [accept]="accept()"
      [maxFiles]="maxFiles()"
      [maxLength]="maxLength()"
      [suggestions]="suggestions()"
      [sendOnEnter]="sendOnEnter()"
      (send)="sent.push($event)"
      (stop)="stops = stops + 1"
    />
  `,
})
class Host {
  readonly draft = signal('');
  readonly busy = signal(false);
  readonly attachments = signal(true);
  readonly accept = signal('');
  readonly maxFiles = signal(0);
  readonly maxLength = signal(0);
  readonly suggestions = signal<string[]>([]);
  readonly sendOnEnter = signal(true);
  sent: MkChatSend[] = [];
  stops = 0;
}

describe('MkPromptBox', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const textarea = () => root().querySelector<HTMLTextAreaElement>('textarea')!;
  const sendButton = () => root().querySelector<HTMLButtonElement>('.mk-prompt-box__send')!;
  const box = () => fixture.debugElement.children[0].componentInstance as MkPromptBox;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function type(text: string) {
    textarea().value = text;
    textarea().dispatchEvent(new Event('input', { bubbles: true }));
  }

  function key(el: HTMLElement, init: KeyboardEventInit) {
    const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(e);
    return e;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('disables send until there is text, then sends on Enter and clears', async () => {
    expect(sendButton().disabled).toBe(true);
    type('  hello  ');
    await settle();
    expect(host.draft()).toBe('  hello  ');
    expect(sendButton().disabled).toBe(false);
    const e = key(textarea(), { key: 'Enter' });
    expect(e.defaultPrevented).toBe(true);
    await settle();
    expect(host.sent).toEqual([{ text: 'hello', files: [] }]);
    expect(host.draft()).toBe('');
    expect(textarea().value).toBe('');
  });

  it('Shift+Enter does not send; with sendOnEnter=false only Ctrl/Cmd+Enter sends', async () => {
    type('line');
    await settle();
    expect(key(textarea(), { key: 'Enter', shiftKey: true }).defaultPrevented).toBe(false);
    expect(host.sent).toEqual([]);
    host.sendOnEnter.set(false);
    await settle();
    expect(key(textarea(), { key: 'Enter' }).defaultPrevented).toBe(false);
    expect(host.sent).toEqual([]);
    key(textarea(), { key: 'Enter', ctrlKey: true });
    expect(host.sent).toEqual([{ text: 'line', files: [] }]);
  });

  it('shows stop while busy and emits stop instead of send', async () => {
    host.busy.set(true);
    await settle();
    expect(sendButton().getAttribute('aria-label')).toBe('Stop generating');
    expect(sendButton().disabled).toBe(false);
    sendButton().click();
    expect(host.stops).toBe(1);
    type('queued');
    await settle();
    key(textarea(), { key: 'Enter' });
    expect(host.sent).toEqual([]);
  });

  it('collects attachments (picker, paste, drop) honouring accept and maxFiles, and sends them', async () => {
    host.accept.set('image/*,.pdf');
    host.maxFiles.set(2);
    await settle();
    const png = new File(['x'], 'a.png', { type: 'image/png' });
    const pdf = new File(['x'], 'b.pdf', { type: 'application/pdf' });
    const txt = new File(['x'], 'c.txt', { type: 'text/plain' });
    box().addFiles([png, txt]);
    await settle();
    expect(box().files().map((f) => f.name)).toEqual(['a.png']);
    expect(root().querySelectorAll('.mk-prompt-box__files mk-chip')).toHaveLength(1);

    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { files: [pdf, png] } });
    textarea().dispatchEvent(paste);
    await settle();
    expect(box().files().map((f) => f.name)).toEqual(['a.png', 'b.pdf']); // capped at 2

    root().querySelector<HTMLButtonElement>('.mk-prompt-box__files mk-chip button')!.click();
    await settle();
    expect(box().files().map((f) => f.name)).toEqual(['b.pdf']);

    sendButton().click();
    await settle();
    expect(host.sent).toEqual([{ text: '', files: [pdf] }]);
    expect(box().files()).toEqual([]);
  });

  it('ignores files when attachments are off and shows no attach button', async () => {
    host.attachments.set(false);
    await settle();
    expect(root().querySelector('.mk-prompt-box__attach')).toBeNull();
    box().addFiles([new File(['x'], 'a.png', { type: 'image/png' })]);
    expect(box().files()).toEqual([]);
  });

  it('sends a suggestion on click and shows the remaining-characters counter', async () => {
    host.suggestions.set(['Summarise', 'Translate']);
    host.maxLength.set(10);
    await settle();
    type('1234567');
    await settle();
    expect(root().querySelector('.mk-prompt-box__counter')!.textContent!.trim()).toBe('3');
    root().querySelectorAll<HTMLButtonElement>('.mk-prompt-box__suggestion')[1].click();
    expect(host.sent).toEqual([{ text: 'Translate', files: [] }]);
  });
});
