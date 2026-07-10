import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTagInput } from './tag-input';

describe('MkTagInput', () => {
  let fixture: ComponentFixture<MkTagInput>;
  let cmp: MkTagInput;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkTagInput);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  /** Type text then press a key on the entry input. */
  function typeAndPress(text: string, key: string): void {
    (cmp as any).query.set(text);
    (cmp as any).onKeydown(
      Object.assign(new KeyboardEvent('keydown', { key }), {
        preventDefault: () => {},
      }),
    );
  }

  it('adds a tag on Enter and clears the query', () => {
    const onChange = vi.fn();
    cmp.registerOnChange(onChange);
    typeAndPress('angular', 'Enter');
    expect(cmp.value()).toEqual(['angular']);
    expect((cmp as any).query()).toBe('');
    expect(onChange).toHaveBeenCalledWith(['angular']);
  });

  it('adds a tag on a separator key', () => {
    typeAndPress('design', ',');
    expect(cmp.value()).toEqual(['design']);
  });

  it('ignores blank and duplicate tags by default', () => {
    typeAndPress('  ', 'Enter');
    expect(cmp.value()).toEqual([]);
    typeAndPress('ui', 'Enter');
    typeAndPress('ui', 'Enter');
    expect(cmp.value()).toEqual(['ui']);
  });

  it('allows duplicates when enabled', () => {
    fixture.componentRef.setInput('allowDuplicates', true);
    typeAndPress('ui', 'Enter');
    typeAndPress('ui', 'Enter');
    expect(cmp.value()).toEqual(['ui', 'ui']);
  });

  it('Backspace on an empty query removes the last tag', () => {
    cmp.writeValue(['a', 'b', 'c']);
    typeAndPress('', 'Backspace');
    expect(cmp.value()).toEqual(['a', 'b']);
  });

  it('stops adding once max is reached', () => {
    fixture.componentRef.setInput('max', 2);
    typeAndPress('a', 'Enter');
    typeAndPress('b', 'Enter');
    typeAndPress('c', 'Enter');
    expect(cmp.value()).toEqual(['a', 'b']);
    expect((cmp as any).atMax()).toBe(true);
  });

  it('splits a pasted delimited string into multiple tags', () => {
    const event = Object.assign(new Event('paste'), {
      clipboardData: { getData: () => 'red, green, blue' },
      preventDefault: () => {},
    }) as unknown as ClipboardEvent;
    (cmp as any).onPaste(event);
    expect(cmp.value()).toEqual(['red', 'green', 'blue']);
  });

  it('removeAt drops the tag and emits removed', () => {
    const removed = vi.fn();
    cmp.removed.subscribe(removed);
    cmp.writeValue(['x', 'y', 'z']);
    (cmp as any).removeAt(1);
    expect(cmp.value()).toEqual(['x', 'z']);
    expect(removed).toHaveBeenCalledWith('y');
  });
});
