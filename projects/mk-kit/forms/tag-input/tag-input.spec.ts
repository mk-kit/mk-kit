import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkLiveAnnouncer } from '@mkornas/ui/core';
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
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
    // MkTagInput announces via MkLiveAnnouncer, which appends a body-level
    // region; remove it so it can't pollute other specs sharing this jsdom.
    document.querySelectorAll('.mk-visually-hidden').forEach((el) => el.remove());
  });

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

  it('clears the native input element after committing a tag', () => {
    // Drive the real DOM input (as a user would) so the one-way [value] binding
    // is exercised: committing must empty the visible field, not just the signal.
    const input = fixture.nativeElement.querySelector(
      'input.mk-tag-input__input',
    ) as HTMLInputElement;
    input.value = 'example.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(
      Object.assign(new KeyboardEvent('keydown', { key: 'Enter' }), {
        preventDefault: () => {},
      }),
    );
    fixture.detectChanges();

    expect(cmp.value()).toEqual(['example.com']);
    expect(input.value).toBe('');
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

  it('keeps the input focusable at max so Backspace-delete stays reachable', async () => {
    fixture.componentRef.setInput('max', 1);
    typeAndPress('a', 'Enter');
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      '.mk-tag-input__input',
    ) as HTMLInputElement;
    // readonly + aria-disabled instead of disabled: focus survives, typing is
    // blocked, and Backspace can still delete the last chip.
    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-disabled')).toBe('true');
    input.focus();
    expect(document.activeElement).toBe(input);

    typeAndPress('', 'Backspace');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cmp.value()).toEqual([]);
    expect(input.readOnly).toBe(false);
    expect(input.getAttribute('aria-disabled')).toBeNull();
  });

  it('moves focus to the next chip remove button after removing via a chip', async () => {
    cmp.writeValue(['a', 'b', 'c']);
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.mk-chip__remove'),
      ) as HTMLButtonElement[];
    expect(buttons()).toHaveLength(3);

    buttons()[1].focus();
    buttons()[1].click(); // removes 'b'
    fixture.detectChanges();
    await fixture.whenStable();

    expect(cmp.value()).toEqual(['a', 'c']);
    // Focus lands on what is now the chip at the removed index ('c').
    expect(document.activeElement).toBe(buttons()[1]);
  });

  it('falls back to the previous chip, then the input, when removing at the end', async () => {
    cmp.writeValue(['a', 'b']);
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.mk-chip__remove'),
      ) as HTMLButtonElement[];

    buttons()[1].click(); // removes 'b' — no next chip, so previous
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(buttons()[0]);

    buttons()[0].click(); // removes 'a' — no chips left, so the input
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.mk-tag-input__input'),
    );
  });

  it('announces adds and removes through the live announcer', () => {
    const announcer = TestBed.inject(MkLiveAnnouncer);
    const spy = vi.spyOn(announcer, 'announce');

    typeAndPress('angular', 'Enter');
    expect(spy).toHaveBeenLastCalledWith('angular added');

    typeAndPress('', 'Backspace');
    expect(spy).toHaveBeenLastCalledWith('angular removed');
  });
});
