import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mkParseAnsi, mkStripAnsi } from './ansi';
import { MkLogViewer } from './log-viewer';

const ESC = '\x1b';

describe('mkParseAnsi', () => {
  it('returns a single plain span for a line without escapes', () => {
    expect(mkParseAnsi('hello world')).toEqual([
      { text: 'hello world', classes: [] },
    ]);
  });

  it('returns no spans for an empty line', () => {
    expect(mkParseAnsi('')).toEqual([]);
  });

  it('maps standard foreground colours to mk-ansi classes', () => {
    expect(mkParseAnsi(`${ESC}[31mError${ESC}[0m ok`)).toEqual([
      { text: 'Error', classes: ['mk-ansi--fg-red'] },
      { text: ' ok', classes: [] },
    ]);
    expect(mkParseAnsi(`${ESC}[32mgreen`)).toEqual([
      { text: 'green', classes: ['mk-ansi--fg-green'] },
    ]);
  });

  it('maps bright foreground colours (90–97)', () => {
    expect(mkParseAnsi(`${ESC}[93mwarn`)).toEqual([
      { text: 'warn', classes: ['mk-ansi--fg-bright-yellow'] },
    ]);
  });

  it('maps background colours, standard and bright', () => {
    expect(mkParseAnsi(`${ESC}[41mbad`)).toEqual([
      { text: 'bad', classes: ['mk-ansi--bg-red'] },
    ]);
    expect(mkParseAnsi(`${ESC}[104mblue`)).toEqual([
      { text: 'blue', classes: ['mk-ansi--bg-bright-blue'] },
    ]);
  });

  it('handles bold / italic / underline and combinations', () => {
    expect(mkParseAnsi(`${ESC}[1;3;4mall`)).toEqual([
      {
        text: 'all',
        classes: ['mk-ansi--bold', 'mk-ansi--italic', 'mk-ansi--underline'],
      },
    ]);
    expect(mkParseAnsi(`${ESC}[1mb${ESC}[22mplain`)).toEqual([
      { text: 'b', classes: ['mk-ansi--bold'] },
      { text: 'plain', classes: [] },
    ]);
  });

  it('resets fg/bg independently via 39 and 49', () => {
    expect(mkParseAnsi(`${ESC}[31;44mx${ESC}[39my${ESC}[49mz`)).toEqual([
      { text: 'x', classes: ['mk-ansi--fg-red', 'mk-ansi--bg-blue'] },
      { text: 'y', classes: ['mk-ansi--bg-blue'] },
      { text: 'z', classes: [] },
    ]);
  });

  it('treats an empty SGR (ESC[m) as a full reset', () => {
    expect(mkParseAnsi(`${ESC}[1;31mx${ESC}[my`)).toEqual([
      { text: 'x', classes: ['mk-ansi--bold', 'mk-ansi--fg-red'] },
      { text: 'y', classes: [] },
    ]);
  });

  it('consumes 256-colour / truecolor arguments without misparsing them', () => {
    // 38;5;196 → the "196" must not be read as another SGR code.
    expect(mkParseAnsi(`${ESC}[38;5;196mx`)).toEqual([{ text: 'x', classes: [] }]);
    // 48;2;r;g;b followed by a real code in the same sequence.
    expect(mkParseAnsi(`${ESC}[48;2;10;20;30;1mx`)).toEqual([
      { text: 'x', classes: ['mk-ansi--bold'] },
    ]);
  });

  it('strips non-SGR escapes (cursor movement, erase, OSC) instead of rendering garbage', () => {
    expect(mkParseAnsi(`${ESC}[2J${ESC}[1;1Hhello`)).toEqual([
      { text: 'hello', classes: [] },
    ]);
    expect(mkParseAnsi(`${ESC}]0;title\x07hi`)).toEqual([
      { text: 'hi', classes: [] },
    ]);
    expect(mkParseAnsi(`a${ESC}[3Ab`)).toEqual([{ text: 'ab', classes: [] }]);
  });

  it('merges adjacent runs with identical styling', () => {
    expect(mkParseAnsi(`${ESC}[31ma${ESC}[31mb`)).toEqual([
      { text: 'ab', classes: ['mk-ansi--fg-red'] },
    ]);
  });
});

describe('mkStripAnsi', () => {
  it('removes every escape sequence', () => {
    expect(mkStripAnsi(`${ESC}[31mred${ESC}[0m ${ESC}[2Jok`)).toBe('red ok');
    expect(mkStripAnsi('plain')).toBe('plain');
  });
});

describe('MkLogViewer', () => {
  let fixture: ComponentFixture<MkLogViewer>;
  let lv: MkLogViewer;

  const makeLines = (n: number): string[] =>
    Array.from({ length: n }, (_, i) => `line ${i}`);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkLogViewer);
    lv = fixture.componentInstance;
    fixture.componentRef.setInput('lines', makeLines(100));
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const viewport = (): HTMLElement =>
    fixture.nativeElement.querySelector('.mk-log-viewer__viewport');

  /** Simulate a scroll event with the given fake metrics. */
  const scrollTo = (scrollTop: number, scrollHeight = 2000, clientHeight = 200) =>
    (lv as any).onScroll({ target: { scrollTop, scrollHeight, clientHeight } });

  it('exposes the scroll region as a labelled, focusable log', () => {
    const view = viewport();
    expect(view.getAttribute('role')).toBe('log');
    expect(view.getAttribute('tabindex')).toBe('0');
    expect(view.getAttribute('aria-label')).toBe('Log output');
  });

  it('honours a custom aria-label', () => {
    fixture.componentRef.setInput('aria-label', 'Build output');
    fixture.detectChanges();
    expect(viewport().getAttribute('aria-label')).toBe('Build output');
  });

  it('caps the buffer at maxLines, dropping the oldest lines', () => {
    fixture.componentRef.setInput('lines', makeLines(50));
    fixture.componentRef.setInput('maxLines', 10);
    fixture.detectChanges();
    const buffered = (lv as any).buffered() as string[];
    expect(buffered.length).toBe(10);
    expect(buffered[0]).toBe('line 40');
    expect(buffered[9]).toBe('line 49');
  });

  it('renders only a virtual window of lines when not wrapping', () => {
    fixture.componentRef.setInput('lines', makeLines(1000));
    (lv as any).viewportHeight.set(200); // 10 rows at itemHeight 20
    (lv as any).scrollTop.set(0);
    fixture.detectChanges();
    const rendered = fixture.nativeElement.querySelectorAll('.mk-log-viewer__line');
    expect(rendered.length).toBeLessThan(30);
    expect((lv as any).totalHeight()).toBe(1000 * 20);
  });

  it('windows around the scroll position with the correct offset', () => {
    fixture.componentRef.setInput('lines', makeLines(1000));
    (lv as any).viewportHeight.set(200);
    (lv as any).scrollTop.set(2000); // 100 rows down
    fixture.detectChanges();
    const visible = (lv as any).visibleLines() as { index: number }[];
    expect(visible[0].index).toBe(100 - 6); // start - overscan
    expect((lv as any).offset()).toBe((100 - 6) * 20);
  });

  it('wrap mode renders every buffered line without virtualization', () => {
    fixture.componentRef.setInput('lines', makeLines(50));
    fixture.componentRef.setInput('wrap', true);
    fixture.detectChanges();
    const rendered = fixture.nativeElement.querySelectorAll('.mk-log-viewer__line');
    expect(rendered.length).toBe(50);
    expect(
      fixture.nativeElement.querySelector('.mk-log-viewer__spacer'),
    ).toBeNull();
  });

  it('detaches follow when scrolling up beyond the threshold', () => {
    expect(lv.follow()).toBe(true);
    scrollTo(500); // 1300px above the bottom
    expect(lv.follow()).toBe(false);
  });

  it('keeps follow while at (or near) the bottom', () => {
    scrollTo(1790); // 10px above the bottom — inside the threshold
    expect(lv.follow()).toBe(true);
  });

  it('re-sticks when the user scrolls back to the bottom', () => {
    scrollTo(500);
    expect(lv.follow()).toBe(false);
    scrollTo(1800); // exactly at the bottom
    expect(lv.follow()).toBe(true);
  });

  it('ignores its own programmatic scrolls when deciding to detach', () => {
    (lv as any).programmaticScroll = true;
    scrollTo(500);
    expect(lv.follow()).toBe(true);
  });

  it('shows a follow button when detached and resumes on click', () => {
    expect(
      fixture.nativeElement.querySelector('.mk-log-viewer__follow'),
    ).toBeNull();
    scrollTo(500);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector(
      '.mk-log-viewer__follow',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Follow');
    btn.click();
    fixture.detectChanges();
    expect(lv.follow()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.mk-log-viewer__follow'),
    ).toBeNull();
  });

  it('counts case-insensitive plain-string matches and emits them', () => {
    const emitted: number[] = [];
    lv.matches.subscribe((n) => emitted.push(n));
    fixture.componentRef.setInput('lines', ['foo bar foo', 'FOO', 'nope']);
    fixture.componentRef.setInput('query', 'foo');
    fixture.detectChanges();
    expect(lv.matchCount()).toBe(3);
    expect(emitted).toContain(3);
  });

  it('matches against ANSI-stripped text', () => {
    fixture.componentRef.setInput('lines', [`${ESC}[31mError:${ESC}[0m boom`]);
    fixture.componentRef.setInput('query', 'error');
    fixture.detectChanges();
    expect(lv.matchCount()).toBe(1);
  });

  it('highlights matches with <mark> while preserving ANSI styling', () => {
    fixture.componentRef.setInput('lines', [`${ESC}[31mError${ESC}[0m done`]);
    fixture.componentRef.setInput('query', 'ror do');
    (lv as any).viewportHeight.set(200);
    fixture.detectChanges();
    const marks = Array.from(
      fixture.nativeElement.querySelectorAll('mark.mk-log-viewer__match'),
    ) as HTMLElement[];
    // The match crosses a span boundary → one mark per styled run.
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe('ror');
    expect(marks[0].classList.contains('mk-ansi--fg-red')).toBe(true);
    expect(marks[1].textContent).toBe(' do');
    expect(marks[1].classList.contains('mk-ansi--fg-red')).toBe(false);
  });

  it('renders ANSI colours as themed spans in the DOM', () => {
    fixture.componentRef.setInput('lines', [`${ESC}[32mok${ESC}[0m rest`]);
    (lv as any).viewportHeight.set(200);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.mk-ansi--fg-green');
    expect(span?.textContent).toBe('ok');
  });

  it('renders lines verbatim when [ansi] is false', () => {
    fixture.componentRef.setInput('lines', ['<one>']);
    fixture.componentRef.setInput('ansi', false);
    (lv as any).viewportHeight.set(200);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mk-ansi--fg-green')).toBeNull();
    const line = fixture.nativeElement.querySelector('.mk-log-viewer__line');
    expect(line?.textContent).toBe('<one>');
  });

  it('shows the toolbar with wrap toggle and copy-all, and hides it on demand', () => {
    let toolbar = fixture.nativeElement.querySelector('.mk-log-viewer__toolbar');
    expect(toolbar).toBeTruthy();
    const wrapBtn = toolbar.querySelectorAll('.mk-log-viewer__tool')[0];
    expect(wrapBtn.getAttribute('aria-pressed')).toBe('false');
    (wrapBtn as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(lv.wrap()).toBe(true);
    expect(wrapBtn.getAttribute('aria-pressed')).toBe('true');

    fixture.componentRef.setInput('hideToolbar', true);
    fixture.detectChanges();
    toolbar = fixture.nativeElement.querySelector('.mk-log-viewer__toolbar');
    expect(toolbar).toBeNull();
  });

  it('exposes the whole buffer, ANSI-stripped, for copy-all', () => {
    fixture.componentRef.setInput('lines', [`${ESC}[31ma${ESC}[0m`, 'b']);
    fixture.detectChanges();
    expect((lv as any).allText()).toBe('a\nb');
  });
});
