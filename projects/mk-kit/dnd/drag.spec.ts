import {
  Component,
  provideZonelessChangeDetection,
  viewChildren,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkDrag } from './drag';
import { MkDragHandle } from './drag-handle';
import { MkDropList } from './drop-list';

/**
 * A draggable category whose body contains a nested drop list of draggable
 * products — the menu-builder shape. Each level has its own drag handle.
 */
@Component({
  imports: [MkDrag, MkDragHandle, MkDropList],
  template: `
    <div mkDropList [mkDropListData]="cats">
      <div mkDrag [mkDragData]="cats[0]">
        <span class="outer-handle" mkDragHandle>::</span>
        <div mkDropList [mkDropListData]="prods">
          <div mkDrag [mkDragData]="prods[0]">
            <span class="inner-handle" mkDragHandle>::</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
class NestedHost {
  cats = [{ id: 'c1' }];
  prods = [{ id: 'p1' }];
  readonly drags = viewChildren(MkDrag);
}

describe('MkDrag nested handles', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('scopes handles to the nearest mkDrag ancestor so inner handles do not arm the outer item', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(NestedHost);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const outerHandle = el.querySelector('.outer-handle')!;
    const innerHandle = el.querySelector('.inner-handle')!;

    const drags = fixture.componentInstance.drags();
    // Outer = the one whose host is NOT inside the other's host.
    const outer = drags.find((d) => !drags.some((o) => o !== d && o.element.contains(d.element)))!;
    const inner = drags.find((d) => d !== outer)!;

    const own = (d: MkDrag) =>
      (d as unknown as { ownHandles: () => { element: Element }[] })
        .ownHandles()
        .map((h) => h.element);

    // The outer item owns only its own handle — never the nested product handle.
    expect(own(outer)).toContain(outerHandle);
    expect(own(outer)).not.toContain(innerHandle);
    // The inner item owns its own handle.
    expect(own(inner)).toEqual([innerHandle]);
  });
});
