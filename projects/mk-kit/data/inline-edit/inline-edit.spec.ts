import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkInlineEdit } from './inline-edit';

describe('MkInlineEdit', () => {
  let fixture: ComponentFixture<MkInlineEdit>;
  let cmp: MkInlineEdit;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkInlineEdit);
    cmp = fixture.componentInstance;
    cmp.value.set('Hello');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('shows the display button until editing starts', () => {
    expect(fixture.nativeElement.querySelector('.mk-inline-edit__display')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();

    (cmp as any).startEdit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
    expect((cmp as any).draft()).toBe('Hello');
  });

  it('saves the draft and emits saved on save', () => {
    const onChange = vi.fn();
    const saved = vi.fn();
    cmp.registerOnChange(onChange);
    cmp.saved.subscribe(saved);

    (cmp as any).startEdit();
    (cmp as any).draft.set('World');
    (cmp as any).save();

    expect(cmp.value()).toBe('World');
    expect(onChange).toHaveBeenCalledWith('World');
    expect(saved).toHaveBeenCalledWith('World');
    expect((cmp as any).editing()).toBe(false);
  });

  it('reverts the value on cancel', () => {
    const cancelled = vi.fn();
    cmp.cancelled.subscribe(cancelled);
    (cmp as any).startEdit();
    (cmp as any).draft.set('changed');
    (cmp as any).cancel();

    expect(cmp.value()).toBe('Hello');
    expect(cancelled).toHaveBeenCalled();
    expect((cmp as any).editing()).toBe(false);
  });

  it('Enter saves and Escape cancels (single line)', () => {
    (cmp as any).startEdit();
    (cmp as any).draft.set('via enter');
    (cmp as any).onKeydown(
      Object.assign(new KeyboardEvent('keydown', { key: 'Enter' }), {
        preventDefault: () => {},
      }),
    );
    expect(cmp.value()).toBe('via enter');

    (cmp as any).startEdit();
    (cmp as any).draft.set('discarded');
    (cmp as any).onKeydown(
      Object.assign(new KeyboardEvent('keydown', { key: 'Escape' }), {
        preventDefault: () => {},
      }),
    );
    expect(cmp.value()).toBe('via enter');
  });

  it('blur saves or cancels per saveOnBlur', () => {
    fixture.componentRef.setInput('saveOnBlur', false);
    (cmp as any).startEdit();
    (cmp as any).draft.set('nope');
    (cmp as any).onBlur();
    expect(cmp.value()).toBe('Hello');

    fixture.componentRef.setInput('saveOnBlur', true);
    (cmp as any).startEdit();
    (cmp as any).draft.set('yep');
    (cmp as any).onBlur();
    expect(cmp.value()).toBe('yep');
  });
});
