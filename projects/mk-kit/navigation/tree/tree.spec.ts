import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTree, type MkTreeNode } from './tree';

/**
 * Mouse expansion vs. selection (WCAG 2.1.1).
 *
 * A row click both toggles expansion and selects, and hosts like
 * `mk-tree-select` close on any selection — which made children unreachable
 * by mouse there. The chevron is now its own click target that toggles
 * expansion WITHOUT selecting; plain row clicks keep the combined behaviour.
 */
describe('MkTree chevron click', () => {
  let fixture: ComponentFixture<MkTree>;
  let tree: MkTree;

  const nodes: MkTreeNode[] = [
    {
      label: 'Parent',
      value: 'parent',
      children: [{ label: 'Child', value: 'child' }],
    },
    { label: 'Leaf', value: 'leaf' },
  ];

  function rows(): HTMLElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.mk-tree__item'),
    );
  }

  function toggleOf(row: HTMLElement): HTMLElement {
    return row.querySelector<HTMLElement>('.mk-tree__toggle')!;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkTree);
    tree = fixture.componentInstance;
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('clicking the chevron expands without selecting', () => {
    const selectionChange = vi.fn();
    tree.selectionChange.subscribe(selectionChange);
    expect(rows().length).toBe(2);

    toggleOf(rows()[0]).click();
    fixture.detectChanges();

    expect(rows().length).toBe(3); // Parent, Child, Leaf
    expect(rows()[0].getAttribute('aria-expanded')).toBe('true');
    expect(tree.selected()).toBeNull();
    expect(selectionChange).not.toHaveBeenCalled();
  });

  it('clicking the chevron again collapses, still without selecting', () => {
    toggleOf(rows()[0]).click();
    fixture.detectChanges();
    toggleOf(rows()[0]).click();
    fixture.detectChanges();

    expect(rows().length).toBe(2);
    expect(rows()[0].getAttribute('aria-expanded')).toBe('false');
    expect(tree.selected()).toBeNull();
  });

  it('a plain row click on a parent still toggles AND selects', () => {
    rows()[0].click();
    fixture.detectChanges();

    expect(rows().length).toBe(3);
    expect(tree.selected()).toBe('parent');
  });

  it('a click on a leaf row (including its empty chevron gutter) selects it', () => {
    // The gutter of a non-expandable row must not swallow the click.
    toggleOf(rows()[1]).click();
    fixture.detectChanges();

    expect(tree.selected()).toBe('leaf');
  });
});
