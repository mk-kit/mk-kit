import { TestBed } from '@angular/core/testing';
import { MK_BREAKPOINTS, MkBreakpointService, mkIsResponsive } from './breakpoint.service';

/** A fake `matchMedia` driven by a settable viewport width. */
function installMatchMedia(initialWidth: number) {
  let width = initialWidth;
  const lists: Array<{ query: string; min: number | null; listeners: Set<(e: MediaQueryListEvent) => void>; matches: boolean }> = [];
  const evaluate = (query: string, min: number | null) =>
    min == null ? query === '(orientation: portrait)' && width < 600 : width >= min;
  const matchMedia = vi.fn((query: string) => {
    const m = /min-width: (\d+)px/.exec(query);
    const min = m ? Number(m[1]) : null;
    const entry = {
      query,
      min,
      listeners: new Set<(e: MediaQueryListEvent) => void>(),
      get matches() {
        return evaluate(query, min);
      },
      addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => entry.listeners.add(fn),
      removeEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => entry.listeners.delete(fn),
    };
    lists.push(entry);
    return entry as unknown as MediaQueryList;
  });
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });
  return {
    lists,
    setWidth(w: number) {
      width = w;
      for (const l of lists) {
        const matches = evaluate(l.query, l.min);
        for (const fn of l.listeners) fn({ matches } as MediaQueryListEvent);
      }
    },
  };
}

describe('MkBreakpointService', () => {
  afterEach(() => {
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  });

  it('reports the widest satisfied breakpoint and tracks changes', () => {
    const media = installMatchMedia(800);
    const bp = TestBed.inject(MkBreakpointService);
    expect(bp.current()).toBe('md');
    expect(bp.up('md')()).toBe(true);
    expect(bp.up('lg')()).toBe(false);
    expect(bp.down('lg')()).toBe(true);
    expect(bp.down('md')()).toBe(false);
    expect(bp.between('sm', 'lg')()).toBe(true);

    media.setWidth(1600);
    expect(bp.current()).toBe('2xl');
    expect(bp.between('sm', 'lg')()).toBe(false);

    media.setWidth(320);
    expect(bp.current()).toBe('xs');
    expect(bp.up('xs')()).toBe(true);
    expect(bp.down('sm')()).toBe(true);
  });

  it('resolves responsive values mobile-first and passes plain values through', () => {
    const media = installMatchMedia(1100);
    const bp = TestBed.inject(MkBreakpointService);
    const cols = { xs: 1, md: 2, xl: 4 };
    expect(bp.resolve(cols)).toBe(2); // lg falls back to md
    media.setWidth(1300);
    expect(bp.resolve(cols)).toBe(4);
    media.setWidth(700);
    expect(bp.resolve(cols)).toBe(1);
    expect(bp.resolve({ md: 2 })).toBeUndefined(); // nothing defined at/below sm
    expect(bp.resolve(3)).toBe(3);
    expect(bp.resolve('1fr 2fr')).toBe('1fr 2fr');
    expect(bp.resolve(null)).toBeNull();
  });

  it('observes arbitrary media queries, caching by query string', () => {
    const media = installMatchMedia(500);
    const bp = TestBed.inject(MkBreakpointService);
    const portrait = bp.observe('(orientation: portrait)');
    expect(portrait()).toBe(true);
    expect(bp.observe('(orientation: portrait)')).toBe(portrait);
    media.setWidth(900);
    expect(portrait()).toBe(false);
    expect(media.lists.filter((l) => l.query === '(orientation: portrait)')).toHaveLength(1);
  });

  it('honours a custom scale from MK_BREAKPOINTS', () => {
    installMatchMedia(1100);
    TestBed.configureTestingModule({
      providers: [{ provide: MK_BREAKPOINTS, useValue: { sm: 500, md: 700, lg: 1200, xl: 1400, '2xl': 1800 } }],
    });
    const bp = TestBed.inject(MkBreakpointService);
    expect(bp.current()).toBe('md');
    expect(bp.breakpoints.lg).toBe(1200);
  });

  it('reports xs without matchMedia and removes listeners on destroy', () => {
    const bp = TestBed.inject(MkBreakpointService);
    expect(bp.current()).toBe('xs');
    expect(bp.observe('(hover: hover)')()).toBe(false);

    TestBed.resetTestingModule();
    const media = installMatchMedia(1000);
    const bp2 = TestBed.inject(MkBreakpointService);
    expect(bp2.current()).toBe('md');
    bp2.ngOnDestroy();
    expect(media.lists.every((l) => l.listeners.size === 0)).toBe(true);
  });

  it('mkIsResponsive only accepts breakpoint-keyed maps', () => {
    expect(mkIsResponsive({ xs: 1, lg: 2 })).toBe(true);
    expect(mkIsResponsive({ foo: 1 } as never)).toBe(false);
    expect(mkIsResponsive([1, 2] as never)).toBe(false);
    expect(mkIsResponsive(null as never)).toBe(false);
    expect(mkIsResponsive('1fr')).toBe(false);
  });
});
