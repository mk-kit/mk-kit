import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkRichText } from './rich-text';

describe('MkRichText toolbar accessibility', () => {
  let fixture: ComponentFixture<MkRichText>;
  let cmp: MkRichText;
  let execCommand: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // jsdom has no execCommand; the toolbar tools call it.
    execCommand = vi.fn();
    (document as any).execCommand = execCommand;
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkRichText);
    fixture.detectChanges();
    cmp = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    delete (document as any).execCommand;
    vi.useRealTimers();
  });

  const showToolbar = async () => {
    (cmp as any).toolbar.set({ visible: true, top: 0, left: 0 });
    await fixture.whenStable();
  };
  const toolbarEl = () =>
    fixture.nativeElement.querySelector('.mk-rich-text__toolbar') as HTMLElement | null;
  const editable = () =>
    fixture.nativeElement.querySelector('.mk-rich-text__editable') as HTMLElement;
  const tool = (index = 0) =>
    toolbarEl()!.querySelectorAll<HTMLButtonElement>('.mk-rich-text__tool')[index];

  it('activates a tool via click (the path Enter/Space on a button takes)', async () => {
    await showToolbar();
    const bold = tool(0);
    // Native buttons fire `click` for Enter/Space, so binding to click makes
    // the tools keyboard-operable; `.click()` exercises that same path.
    bold.click();
    expect(execCommand).toHaveBeenCalledWith('bold');
  });

  it('mousedown alone only preserves the selection — it must not run the tool', async () => {
    await showToolbar();
    const bold = tool(0);
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    bold.dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
    expect(execCommand).not.toHaveBeenCalled();
  });

  it('keeps the toolbar open while focus moves into it', async () => {
    await showToolbar();
    editable().focus();
    vi.useFakeTimers();
    tool(0).focus(); // blurs the editable, focus now inside the toolbar
    vi.advanceTimersByTime(300);
    expect((cmp as any).toolbar().visible).toBe(true);
  });

  it('hides the toolbar when focus leaves the component entirely', async () => {
    await showToolbar();
    editable().focus();
    vi.useFakeTimers();
    editable().blur(); // focus falls back to <body>
    vi.advanceTimersByTime(300);
    expect((cmp as any).toolbar().visible).toBe(false);
  });

  it('Escape in the toolbar hides it and returns focus to the editable', async () => {
    await showToolbar();
    const bold = tool(0);
    bold.focus();
    bold.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect((cmp as any).toolbar().visible).toBe(false);
    expect(document.activeElement).toBe(editable());
  });

  it('ArrowRight / ArrowLeft move focus between tools (wrapping)', async () => {
    await showToolbar();
    const tools = toolbarEl()!.querySelectorAll<HTMLButtonElement>('.mk-rich-text__tool');
    tools[0].focus();
    tools[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(tools[1]);
    tools[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(tools[0]);
    tools[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(tools[tools.length - 1]);
  });
});
