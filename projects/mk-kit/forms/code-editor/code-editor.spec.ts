import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCodeEditor, MkCodeValidity } from './code-editor';
import { mkHighlightJson } from '@mk-kit/ui/core';
// Not exported from the core barrel (name collides with the block-editor's).
import { mkEscapeHtml } from '../../core/highlight/code-highlight';

describe('mkHighlightJson', () => {
  it('escapes HTML-significant characters', () => {
    expect(mkEscapeHtml('<a> & </a>')).toBe('&lt;a&gt; &amp; &lt;/a&gt;');
  });

  it('wraps keys, strings, numbers, keywords and punctuation', () => {
    const html = mkHighlightJson('{"a": 1, "b": true, "c": "x"}');
    expect(html).toContain('<span class="mk-tok-key">"a"</span>');
    expect(html).toContain('<span class="mk-tok-num">1</span>');
    expect(html).toContain('<span class="mk-tok-kw">true</span>');
    expect(html).toContain('<span class="mk-tok-str">"x"</span>');
    expect(html).toContain('<span class="mk-tok-punc">{</span>');
  });

  it('does not treat a value string as a key', () => {
    const html = mkHighlightJson('["x"]');
    expect(html).toContain('<span class="mk-tok-str">"x"</span>');
    expect(html).not.toContain('mk-tok-key');
  });
});

describe('MkCodeEditor', () => {
  let fixture: ComponentFixture<MkCodeEditor>;
  let ed: MkCodeEditor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkCodeEditor);
    ed = fixture.componentInstance;
    fixture.componentRef.setInput('language', 'json');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('reports a JSON parse error for invalid content', () => {
    ed.writeValue('{ bad json ');
    expect((ed as any).jsonError()).toBeTruthy();
    expect((ed as any).isInvalid()).toBe(true);
  });

  it('is valid for well-formed JSON', () => {
    ed.writeValue('{"ok": true}');
    expect((ed as any).jsonError()).toBeNull();
    expect((ed as any).isInvalid()).toBe(false);
  });

  it('treats empty content as valid', () => {
    ed.writeValue('');
    expect((ed as any).jsonError()).toBeNull();
  });

  it('parsed() returns the JSON value or undefined', () => {
    ed.writeValue('{"n": 3}');
    expect(ed.parsed()).toEqual({ n: 3 });
    ed.writeValue('nope');
    expect(ed.parsed()).toBeUndefined();
  });

  it('format() pretty-prints valid JSON with tabSize', () => {
    fixture.componentRef.setInput('tabSize', 2);
    ed.writeValue('{"a":1,"b":[2,3]}');
    ed.format();
    expect(ed.value()).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it('format() leaves invalid JSON untouched', () => {
    ed.writeValue('{oops');
    ed.format();
    expect(ed.value()).toBe('{oops');
  });

  it('emits validity through the validate output', () => {
    const events: MkCodeValidity[] = [];
    ed.validate.subscribe((v) => events.push(v));
    ed.writeValue('{"ok": true}');
    fixture.detectChanges();
    ed.writeValue('{bad');
    fixture.detectChanges();
    expect(events.at(-1)).toEqual({ valid: false, error: expect.any(String) });
  });

  it('plaintext language never reports a JSON error', () => {
    fixture.componentRef.setInput('language', 'plaintext');
    ed.writeValue('{ not : json');
    expect((ed as any).jsonError()).toBeNull();
  });
});

describe('MkCodeEditor debounced derivations', () => {
  let fixture: ComponentFixture<MkCodeEditor>;
  let ed: MkCodeEditor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkCodeEditor);
    ed = fixture.componentInstance;
    fixture.componentRef.setInput('language', 'json');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  const textarea = () =>
    fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  /** Simulates a keystroke: the textarea fires `input` with its new value. */
  const type = (text: string) => {
    const ta = textarea();
    ta.value = text;
    ta.dispatchEvent(new Event('input'));
  };

  it('keeps the value live while typing but debounces the highlight', () => {
    vi.useFakeTimers();
    type('{"a": 1}');
    // The textarea text itself is never delayed…
    expect(ed.value()).toBe('{"a": 1}');
    // …but the overlay still shows the previous (settled) content.
    expect((ed as any).highlightedHtml()).toBe('');
    vi.advanceTimersByTime(200);
    // After the debounce settles, overlay and textarea are identical again.
    expect((ed as any).highlightedHtml()).toBe(mkHighlightJson('{"a": 1}'));
  });

  it('reports a JSON error only after the debounce settles', () => {
    vi.useFakeTimers();
    type('{bad');
    expect((ed as any).jsonError()).toBeNull();
    vi.advanceTimersByTime(200);
    expect((ed as any).jsonError()).toBeTruthy();
  });

  it('emits a single validate event for a burst of keystrokes', () => {
    vi.useFakeTimers();
    const events: MkCodeValidity[] = [];
    ed.validate.subscribe((v) => events.push(v));
    type('{');
    vi.advanceTimersByTime(50);
    type('{b');
    vi.advanceTimersByTime(50);
    type('{bad');
    fixture.detectChanges();
    expect(events).toEqual([]); // still within the debounce window
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(events).toEqual([{ valid: false, error: expect.any(String) }]);
  });

  it('writeValue flushes highlight and validation immediately', () => {
    vi.useFakeTimers();
    ed.writeValue('{"a": 1}');
    expect((ed as any).highlightedHtml()).toBe(mkHighlightJson('{"a": 1}'));
    ed.writeValue('{bad');
    expect((ed as any).jsonError()).toBeTruthy(); // no timers advanced
  });

  it('writeValue cancels a pending typing debounce', () => {
    vi.useFakeTimers();
    type('{typing');
    ed.writeValue('{"set": true}');
    expect((ed as any).jsonError()).toBeNull();
    vi.advanceTimersByTime(500); // the stale typing timer must not fire
    expect((ed as any).highlightedHtml()).toBe(mkHighlightJson('{"set": true}'));
  });

  it('format() re-highlights synchronously', () => {
    vi.useFakeTimers();
    ed.writeValue('{"a":1}');
    ed.format();
    expect(ed.value()).toBe('{\n  "a": 1\n}');
    expect((ed as any).highlightedHtml()).toBe(mkHighlightJson(ed.value()));
  });

  it('gutter lines track the live value and reuse the array while the count is unchanged', () => {
    vi.useFakeTimers();
    type('a\nb');
    const first = (ed as any).lines();
    expect(first).toEqual([1, 2]); // live — never behind the textarea
    type('a\nbc');
    expect((ed as any).lines()).toBe(first); // same instance → @for does not re-diff
    type('a\nb\nc');
    expect((ed as any).lines()).toEqual([1, 2, 3]);
  });
});
