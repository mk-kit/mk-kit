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

/**
 * Rendering + expansion-state performance semantics.
 *
 * Rows are tracked by their underlying node object (not `$index`), so
 * expanding a node INSERTS child rows instead of rewriting every row below
 * the insertion point. Expansion state lives in a `linkedSignal` keyed by
 * node references, so it survives the consumer rebuilding the `nodes` array;
 * a node's `expanded` flag only seeds nodes that were not in the previous
 * array.
 */
describe('MkTree row identity & expansion persistence', () => {
  let fixture: ComponentFixture<MkTree>;

  const makeNodes = (): MkTreeNode[] => [
    { label: 'Alpha', value: 'alpha' },
    {
      label: 'Branch',
      value: 'branch',
      children: [{ label: 'Child', value: 'child' }],
    },
    { label: 'Omega', value: 'omega' },
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
  });

  afterEach(() => fixture.destroy());

  it('expanding a middle node does not recreate the row elements below it', () => {
    fixture.componentRef.setInput('nodes', makeNodes());
    fixture.detectChanges();

    const before = rows();
    expect(before.length).toBe(3); // Alpha, Branch, Omega

    toggleOf(before[1]).click(); // expand Branch
    fixture.detectChanges();

    const after = rows();
    expect(after.length).toBe(4); // Alpha, Branch, Child, Omega
    // Rows before AND after the insertion point keep their DOM identity —
    // the child row is a pure insert, not a rewrite of everything below.
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
    expect(after[3]).toBe(before[2]);
    expect(after[2].textContent).toContain('Child');
  });

  it('expansion survives the consumer rebuilding the array (same node objects)', () => {
    const nodes = makeNodes();
    fixture.componentRef.setInput('nodes', nodes);
    fixture.detectChanges();

    toggleOf(rows()[1]).click(); // expand Branch
    fixture.detectChanges();
    expect(rows().length).toBe(4);

    // New array identity, same node objects — e.g. `[...items]` in an
    // immutable-update flow. The user's expansion must not be lost.
    fixture.componentRef.setInput('nodes', [...nodes]);
    fixture.detectChanges();

    expect(rows().length).toBe(4);
    expect(rows()[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('seeds `expanded` for new nodes only — a user collapse is not reverted', () => {
    const branch: MkTreeNode = {
      label: 'Branch',
      value: 'branch',
      expanded: true,
      children: [{ label: 'Child', value: 'child' }],
    };
    fixture.componentRef.setInput('nodes', [branch]);
    fixture.detectChanges();
    expect(rows().length).toBe(2); // seeded open on first render

    toggleOf(rows()[0]).click(); // user collapses despite `expanded: true`
    fixture.detectChanges();
    expect(rows().length).toBe(1);

    // Rebuild with the SAME branch object plus a NEW pre-expanded node:
    // the old node stays collapsed (user state wins), the new one opens.
    const added: MkTreeNode = {
      label: 'Added',
      value: 'added',
      expanded: true,
      children: [{ label: 'Fresh', value: 'fresh' }],
    };
    fixture.componentRef.setInput('nodes', [branch, added]);
    fixture.detectChanges();

    const after = rows();
    expect(after.length).toBe(3); // Branch (collapsed), Added, Fresh
    expect(after[0].getAttribute('aria-expanded')).toBe('false');
    expect(after[1].getAttribute('aria-expanded')).toBe('true');
    expect(after[2].textContent).toContain('Fresh');
  });
});
