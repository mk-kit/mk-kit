import { Component, provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { MkDrag } from './drag';
import { MkDragHandle } from './drag-handle';
import { MkDropList } from './drop-list';

/**
 * ARIA semantics of drop lists and drag items — every shape the docs show:
 * a `<div>` list of whole-item drags, a `<ul>` of whole-item drags, a `<ul>`
 * whose rows hand the keyboard drag to a `<button mkDragHandle>` (the
 * repeater shape), and a list with a template role of its own.
 */
@Component({
  imports: [MkDrag, MkDragHandle, MkDropList],
  template: `
    <div class="group" mkDropList mkDropListLabel="Cards" [mkDropListData]="rows">
      @for (r of rows; track r.id) {
        <div class="card" mkDrag [mkDragData]="r">{{ r.id }}</div>
      }
    </div>

    <ul class="listbox" mkDropList mkDropListLabel="Tasks" [mkDropListData]="rows">
      @for (r of rows; track r.id) {
        <li class="option" mkDrag [mkDragData]="r">{{ r.id }}</li>
      }
    </ul>

    <ul class="list" mkDropList [mkDropListData]="rows">
      @for (r of rows; track r.id) {
        <li class="row" mkDrag [mkDragData]="r">
          <button type="button" class="handle" mkDragHandle [attr.aria-label]="'Reorder ' + r.id">
            ⠿
          </button>
          <input class="field" aria-label="Name" [value]="r.id" />
        </li>
      }
    </ul>

    <div
      class="toolbar"
      mkDropList
      role="toolbar"
      aria-label="Tools"
      mkDropListOrientation="horizontal"
      [mkDropListData]="rows"
    >
      @for (r of rows; track r.id) {
        <div class="tool" mkDrag [mkDragData]="r">{{ r.id }}</div>
      }
    </div>
  `,
})
class Host {
  rows = [{ id: 'a' }, { id: 'b' }];
}

describe('MkDropList / MkDrag semantics', () => {
  let fixture: ComponentFixture<Host>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => TestBed.resetTestingModule());

  const q = <T extends Element = HTMLElement>(sel: string): T => el.querySelector<T>(sel)!;
  /** Dispatch a key (or any bubbling event) and flush the host bindings. */
  const fire = (target: Element, event: Event): void => {
    target.dispatchEvent(event);
    fixture.detectChanges();
  };
  const key = (target: Element, k: string): void => {
    fire(target, new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  };
  const focusout = (target: Element): void => {
    fire(target, new FocusEvent('focusout', { bubbles: true }));
  };

  it('makes a <div> list a labelled group of button items, without aria-orientation', () => {
    const list = q('.group');
    expect(list.getAttribute('role')).toBe('group');
    expect(list.getAttribute('aria-label')).toBe('Cards');
    // aria-orientation is not permitted on `group` (it used to be written here).
    expect(list.hasAttribute('aria-orientation')).toBe(false);

    const card = q('.card');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.getAttribute('aria-roledescription')).toBe('Draggable item');
    expect(card.getAttribute('aria-grabbed')).toBe('false');
  });

  it('turns a <ul> of whole-item drags into a listbox of options (an <li> may not be a button)', () => {
    const list = q('.listbox');
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-label')).toBe('Tasks');
    // listbox allows aria-orientation, so the axis is exposed here.
    expect(list.getAttribute('aria-orientation')).toBe('vertical');

    const option = q('.option');
    expect(option.getAttribute('role')).toBe('option');
    expect(option.getAttribute('tabindex')).toBe('0');
    expect(option.getAttribute('aria-selected')).toBe('false');
    expect(option.hasAttribute('aria-pressed')).toBe(false);
  });

  it('keeps a <ul> a plain list when every row has a focusable handle; rows are inert containers', () => {
    const list = q('.list');
    expect(list.hasAttribute('role')).toBe(false);
    expect(list.hasAttribute('aria-orientation')).toBe(false);

    const row = q('.row');
    expect(row.hasAttribute('role')).toBe(false);
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('aria-roledescription')).toBe(false);

    const handle = q<HTMLButtonElement>('.handle');
    expect(handle.getAttribute('aria-roledescription')).toBe('Draggable item');
    expect(handle.getAttribute('aria-grabbed')).toBe('false');
    expect(handle.hasAttribute('aria-pressed')).toBe(false);
    // A native button needs no explicit role.
    expect(handle.hasAttribute('role')).toBe(false);
  });

  it('keeps a template role and writes aria-orientation only because that role allows it', () => {
    const list = q('.toolbar');
    expect(list.getAttribute('role')).toBe('toolbar');
    expect(list.getAttribute('aria-orientation')).toBe('horizontal');
    // The static aria-label survives the binding.
    expect(list.getAttribute('aria-label')).toBe('Tools');
    expect(q('.tool').getAttribute('role')).toBe('button');
  });

  it('lifts and drops from the handle: Space picks the row up, Escape puts it back', () => {
    const row = q('.row');
    const handle = q<HTMLButtonElement>('.handle');

    key(handle, ' ');
    expect(row.classList.contains('mk-drag--lifted')).toBe(true);
    expect(handle.getAttribute('aria-pressed')).toBe('true');
    expect(handle.getAttribute('aria-grabbed')).toBe('true');
    // The row itself never gains widget state.
    expect(row.hasAttribute('aria-grabbed')).toBe(false);

    key(handle, 'Escape');
    expect(row.classList.contains('mk-drag--lifted')).toBe(false);
    expect(handle.hasAttribute('aria-pressed')).toBe(false);
    expect(handle.getAttribute('aria-grabbed')).toBe('false');
  });

  it('ignores drag keys typed into a row control and a control losing focus', () => {
    const row = q('.row');
    const handle = q<HTMLButtonElement>('.handle');
    const field = q<HTMLInputElement>('.field');

    // Space in the input is text, not a pick-up.
    key(field, ' ');
    expect(row.classList.contains('mk-drag--lifted')).toBe(false);

    key(handle, ' ');
    expect(row.classList.contains('mk-drag--lifted')).toBe(true);
    // A nested control blurring must not cancel the lift…
    focusout(field);
    expect(row.classList.contains('mk-drag--lifted')).toBe(true);
    // …but the handle itself losing focus does (no stuck state).
    focusout(handle);
    expect(row.classList.contains('mk-drag--lifted')).toBe(false);
  });

  it('lifts a whole-item drag from the item itself', () => {
    const card = q('.card');
    key(card, 'Enter');
    expect(card.classList.contains('mk-drag--lifted')).toBe(true);
    expect(card.getAttribute('aria-pressed')).toBe('true');
    key(card, 'Escape');
    expect(card.classList.contains('mk-drag--lifted')).toBe(false);
  });
});
