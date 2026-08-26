import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkFlex } from './flex';
import { MkFlexItem } from './flex-item';
import { MkGrid } from './grid';
import { MkGridItem } from './grid-item';
import { MkStack } from './stack';
import { mkSpaceToCss } from './space';

/** Fake matchMedia: min-width queries answer against a settable width. */
function installMatchMedia(initial: number) {
  let width = initial;
  const listeners: Array<{ min: number; fn: (e: MediaQueryListEvent) => void }> = [];
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => {
      const min = Number(/min-width: (\d+)px/.exec(query)?.[1] ?? 0);
      return {
        get matches() {
          return width >= min;
        },
        addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => listeners.push({ min, fn }),
        removeEventListener: () => {},
      } as unknown as MediaQueryList;
    },
  });
  return (w: number) => {
    width = w;
    for (const l of listeners) l.fn({ matches: width >= l.min } as MediaQueryListEvent);
  };
}

@Component({
  imports: [MkStack, MkFlex, MkFlexItem, MkGrid, MkGridItem],
  template: `
    <mk-stack id="stack" [gap]="{ xs: 2, md: 6 }" [direction]="{ xs: 'column', md: 'row' }" align="center" justify="between" wrap>
      <span mkFlexItem grow [order]="{ xs: 2, md: 1 }" id="grow">a</span>
      <span mkFlexItem [shrink]="0" basis="10rem" alignSelf="end" id="fixed">b</span>
    </mk-stack>
    <mk-flex id="flex" inline gap="1rem"></mk-flex>
    <mk-grid id="grid" [columns]="columns()" gap="4" rowGap="2" justify="center" flow="dense">
      <div mkGridItem [colSpan]="{ xs: 'all', md: 2 }" [rowSpan]="2" id="hero"></div>
      <div mkGridItem colStart="3" rowSpan="3" id="pinned"></div>
    </mk-grid>
    <mk-grid id="auto" minColumnWidth="16rem" autoFit></mk-grid>
    <mk-grid id="tracks" columns="240px 1fr" rows="2"></mk-grid>
  `,
})
class Host {
  readonly columns = signal<number | string | Record<string, number>>({ xs: 1, md: 2, xl: 4 });
}

describe('layout primitives', () => {
  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  function setup(width: number) {
    const setWidth = installMatchMedia(width);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`#${id}`)!;
    return { fixture, el, setWidth };
  }

  it('mk-stack / mk-flex map inputs to flex styles, responsive to the viewport', () => {
    const { fixture, el, setWidth } = setup(500);
    const stack = el('stack').style;
    expect(stack.display).toBe('flex');
    expect(stack.flexDirection).toBe('column');
    expect(stack.gap).toBe('var(--mk-space-2)');
    expect(stack.alignItems).toBe('center');
    expect(stack.justifyContent).toBe('space-between');
    expect(stack.flexWrap).toBe('wrap');
    expect(el('grow').style.order).toBe('2');

    setWidth(900);
    fixture.detectChanges();
    expect(stack.flexDirection).toBe('row');
    expect(stack.gap).toBe('var(--mk-space-6)');
    expect(el('grow').style.order).toBe('1');

    const flex = el('flex').style;
    expect(flex.display).toBe('inline-flex');
    expect(flex.flexDirection).toBe('row');
    expect(flex.gap).toBe('1rem');
  });

  it('mkFlexItem sets grow / shrink / basis / align-self', () => {
    const { el } = setup(500);
    expect(el('grow').style.flexGrow).toBe('1');
    const fixed = el('fixed').style;
    expect(fixed.flexShrink).toBe('0');
    expect(fixed.flexBasis).toBe('10rem');
    expect(fixed.alignSelf).toBe('flex-end');
  });

  it('mk-grid builds track lists from counts, strings and minColumnWidth', () => {
    const { fixture, el, setWidth } = setup(500);
    const grid = el('grid').style;
    expect(grid.display).toBe('grid');
    expect(grid.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
    expect(grid.columnGap).toBe('var(--mk-space-4)');
    expect(grid.rowGap).toBe('var(--mk-space-2)');
    expect(grid.justifyItems).toBe('center');
    expect(grid.gridAutoFlow).toBe('dense');

    setWidth(1300);
    fixture.detectChanges();
    expect(grid.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');

    fixture.componentInstance.columns.set('1fr 2fr');
    fixture.detectChanges();
    expect(grid.gridTemplateColumns).toBe('1fr 2fr');

    expect(el('auto').style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(16rem, 100%), 1fr))');
    const tracks = el('tracks').style;
    expect(tracks.gridTemplateColumns).toBe('240px 1fr');
    expect(tracks.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');
  });

  it('mkGridItem spans and pins cells, responsive', () => {
    const { fixture, el, setWidth } = setup(500);
    const hero = el('hero').style;
    expect(hero.gridColumn).toBe('1 / -1');
    expect(hero.gridRow).toBe('auto / span 2');
    expect(el('pinned').style.gridColumn).toBe('3');
    expect(el('pinned').style.gridRow).toBe('auto / span 3');

    setWidth(900);
    fixture.detectChanges();
    expect(hero.gridColumn).toBe('auto / span 2');
  });

  it('mkSpaceToCss maps scale steps and passes lengths through', () => {
    expect(mkSpaceToCss(0)).toBe('0');
    expect(mkSpaceToCss(4)).toBe('var(--mk-space-4)');
    expect(mkSpaceToCss('2rem')).toBe('2rem');
    expect(mkSpaceToCss('4')).toBe('var(--mk-space-4)');
    expect(mkSpaceToCss(null)).toBeNull();
    expect(mkSpaceToCss('')).toBeNull();
  });
});
