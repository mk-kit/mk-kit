import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MkJsonViewer, mkBuildJsonTree } from './json-viewer';

describe('mkBuildJsonTree', () => {
  it('types and paths nodes', () => {
    const tree = mkBuildJsonTree({ a: 1, b: 'x', c: [true, null] });
    expect(tree.type).toBe('object');
    expect(tree.children.map((c) => c.key)).toEqual(['a', 'b', 'c']);
    expect(tree.children[0].type).toBe('number');
    expect(tree.children[1].display).toBe('"x"');
    const arr = tree.children[2];
    expect(arr.type).toBe('array');
    expect(arr.children[0].type).toBe('boolean');
    expect(arr.children[1].type).toBe('null');
    expect(arr.children[1].path).toBe('$.c[1]');
  });

  it('marks circular references instead of recursing', () => {
    const obj: Record<string, unknown> = { name: 'loop' };
    obj['self'] = obj;
    const tree = mkBuildJsonTree(obj);
    expect(tree.children[1].type).toBe('circular');
    expect(tree.children[1].display).toBe('[Circular]');
  });

  it('allows repeated (non-circular) references', () => {
    const shared = { id: 1 };
    const tree = mkBuildJsonTree({ a: shared, b: shared });
    expect(tree.children[0].type).toBe('object');
    expect(tree.children[1].type).toBe('object');
  });
});

describe('MkJsonViewer', () => {
  let fixture: ComponentFixture<MkJsonViewer>;
  let cmp: MkJsonViewer;

  const DATA = {
    user: { name: 'Ada', roles: ['admin', 'editor'] },
    active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkJsonViewer);
    cmp = fixture.componentInstance;
    fixture.componentRef.setInput('data', DATA);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('renders the root expanded to expandDepth (default 1)', () => {
    expect(text()).toContain('user');
    expect(text()).toContain('active');
    // Depth-2 content stays behind the collapsed preview.
    expect(text()).not.toContain('Ada');
    expect(text()).toContain('{…}');
  });

  it('expands a node on toggle', () => {
    (cmp as any).toggle('$.user');
    fixture.detectChanges();
    expect(text()).toContain('"Ada"');
  });

  it('expandAll / collapseAll', () => {
    cmp.expandAll();
    fixture.detectChanges();
    expect(text()).toContain('"admin"');
    cmp.collapseAll();
    fixture.detectChanges();
    expect(text()).not.toContain('user');
  });

  it('resets expansion when the data changes', () => {
    cmp.expandAll();
    fixture.detectChanges();
    fixture.componentRef.setInput('data', { fresh: { x: 1 } });
    fixture.detectChanges();
    expect(text()).toContain('fresh');
    expect(text()).not.toContain('x');
  });
});
