import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDiff, type MkDiffMode } from './diff';
import { mkComputeDiff, mkDiffStats } from './diff-util';

describe('mkComputeDiff', () => {
  it('marks every line equal for identical text', () => {
    const rows = mkComputeDiff('a\nb\nc', 'a\nb\nc');
    expect(rows.map((r) => r.op)).toEqual(['equal', 'equal', 'equal']);
    expect(rows[1]).toMatchObject({ beforeNo: 2, afterNo: 2 });
  });

  it('detects a pure insertion in the middle', () => {
    const rows = mkComputeDiff('a\nc', 'a\nb\nc');
    expect(rows.map((r) => `${r.op}:${r.text}`)).toEqual([
      'equal:a',
      'insert:b',
      'equal:c',
    ]);
    expect(rows[1]).toMatchObject({ beforeNo: null, afterNo: 2 });
  });

  it('detects a pure deletion', () => {
    const rows = mkComputeDiff('a\nb\nc', 'a\nc');
    expect(rows.map((r) => `${r.op}:${r.text}`)).toEqual([
      'equal:a',
      'delete:b',
      'equal:c',
    ]);
  });

  it('word-highlights a changed line', () => {
    const rows = mkComputeDiff('the quick brown fox', 'the slow brown fox');
    const del = rows.find((r) => r.op === 'delete')!;
    const ins = rows.find((r) => r.op === 'insert')!;
    expect(del.segments?.find((s) => s.text === 'quick')?.changed).toBe(true);
    expect(del.segments?.find((s) => s.text === 'brown')?.changed).toBe(false);
    expect(ins.segments?.find((s) => s.text === 'slow')?.changed).toBe(true);
  });

  it('can disable word highlighting', () => {
    const rows = mkComputeDiff('one', 'two', { wordHighlight: false });
    expect(rows.every((r) => r.segments === undefined)).toBe(true);
  });

  it('ignores trailing whitespace when asked', () => {
    const withWs = mkComputeDiff('a  \nb', 'a\nb', {
      ignoreTrailingWhitespace: true,
    });
    expect(withWs.every((r) => r.op === 'equal')).toBe(true);
    const strict = mkComputeDiff('a  \nb', 'a\nb');
    expect(strict.some((r) => r.op !== 'equal')).toBe(true);
  });

  it('summarises add/remove/unchanged counts', () => {
    const rows = mkComputeDiff('a\nb\nc', 'a\nB\nc\nd');
    expect(mkDiffStats(rows)).toEqual({ added: 2, removed: 1, unchanged: 2 });
  });
});

@Component({
  imports: [MkDiff],
  template: `<mk-diff before="a\nb\nc" after="a\nB\nc" [mode]="mode()" />`,
})
class Host {
  mode = signal<MkDiffMode>('unified');
}

describe('MkDiff', () => {
  function mount(mode: MkDiffMode = 'unified') {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.mode.set(mode);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('prefixes changed unified rows with visually-hidden change text', () => {
    const { el } = mount();

    const deleted = el.querySelector('.mk-diff__row--delete')!;
    expect(deleted.querySelector('.mk-visually-hidden')?.textContent).toBe(
      'Removed:',
    );
    const inserted = el.querySelector('.mk-diff__row--insert')!;
    expect(inserted.querySelector('.mk-visually-hidden')?.textContent).toBe(
      'Added:',
    );
    // Unchanged rows carry no prefix; the visible +/- stays aria-hidden.
    const equal = el.querySelector('.mk-diff__row:not(.mk-diff__row--insert):not(.mk-diff__row--delete)')!;
    expect(equal.querySelector('.mk-visually-hidden')).toBeNull();
    expect(
      deleted.querySelector('.mk-diff__marker')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('marks split-view changes with sr text and a visible gutter glyph', () => {
    const { el } = mount('split');

    const deleted = el.querySelector('.mk-diff__cell--delete')!;
    expect(deleted.querySelector('.mk-visually-hidden')?.textContent).toBe(
      'Removed:',
    );
    expect(deleted.querySelector('.mk-diff__marker')?.textContent?.trim()).toBe(
      '-',
    );

    const inserted = el.querySelector('.mk-diff__cell--insert')!;
    expect(inserted.querySelector('.mk-visually-hidden')?.textContent).toBe(
      'Added:',
    );
    expect(inserted.querySelector('.mk-diff__marker')?.textContent?.trim()).toBe(
      '+',
    );
  });

  it('exposes the scrollable body as a focusable labelled region', () => {
    const { fixture, el } = mount();
    const body = el.querySelector('.mk-diff__body')!;
    expect(body.getAttribute('tabindex')).toBe('0');
    expect(body.getAttribute('role')).toBe('region');
    expect(body.getAttribute('aria-label')).toBe('Changes');

    fixture.componentInstance.mode.set('split');
    fixture.detectChanges();
    const split = el.querySelector('.mk-diff__body--split')!;
    expect(split.getAttribute('tabindex')).toBe('0');
    expect(split.getAttribute('role')).toBe('region');
    expect(split.getAttribute('aria-label')).toBe('Changes');
  });
});
