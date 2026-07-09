import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkCode } from './code';

describe('MkCode', () => {
  let fixture: ComponentFixture<MkCode>;
  let code: MkCode;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkCode);
    code = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('highlights JSON tokens', () => {
    fixture.componentRef.setInput('language', 'json');
    fixture.componentRef.setInput('code', '{"a": 1}');
    expect((code as any).highlighted()).toContain('mk-tok-key');
    expect((code as any).highlighted()).toContain('mk-tok-num');
  });

  it('escapes HTML in plaintext', () => {
    fixture.componentRef.setInput('code', '<script>');
    expect((code as any).highlighted()).toBe('&lt;script&gt;');
  });

  it('counts lines for the gutter', () => {
    fixture.componentRef.setInput('code', 'a\nb\nc');
    expect((code as any).lines()).toEqual([1, 2, 3]);
  });

  it('shows a header when a filename or copy button is present', () => {
    fixture.componentRef.setInput('copyable', false);
    fixture.componentRef.setInput('filename', '');
    expect((code as any).hasHeader()).toBe(false);
    fixture.componentRef.setInput('filename', 'x.json');
    expect((code as any).hasHeader()).toBe(true);
  });
});
