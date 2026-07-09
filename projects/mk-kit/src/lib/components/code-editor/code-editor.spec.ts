import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCodeEditor, MkCodeValidity } from './code-editor';
import { mkHighlightJson, mkEscapeHtml } from './code-highlight';

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
