import {
  DOCUMENT,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  type OnDestroy,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Named viewport ranges, mobile-first: each starts at its min-width. */
export type MkBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Min-widths (px) at which each named breakpoint begins; `xs` is everything below `sm`. */
export type MkBreakpoints = Record<Exclude<MkBreakpoint, 'xs'>, number>;

/** The default scale (same numbers as Tailwind, so mental models transfer). */
export const MK_DEFAULT_BREAKPOINTS: MkBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/** Override the breakpoint scale app-wide: `{ provide: MK_BREAKPOINTS, useValue: { …, lg: 1100 } }`. */
export const MK_BREAKPOINTS = new InjectionToken<MkBreakpoints>('MK_BREAKPOINTS', {
  providedIn: 'root',
  factory: () => MK_DEFAULT_BREAKPOINTS,
});

/**
 * A value that may differ per breakpoint: either the plain value or a
 * mobile-first map, `{ xs: 1, md: 2, xl: 4 }`, where each key applies from
 * that breakpoint up until the next key given.
 */
export type MkResponsive<T> = T | Partial<Record<MkBreakpoint, T>>;

const ORDER: readonly MkBreakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

/** True when `value` is a per-breakpoint map rather than a plain value. */
export function mkIsResponsive<T>(value: MkResponsive<T>): value is Partial<Record<MkBreakpoint, T>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).every((k) => (ORDER as readonly string[]).includes(k))
  );
}

/**
 * Reactive viewport breakpoints, one `matchMedia` listener per step.
 *
 * ```ts
 * private readonly bp = inject(MkBreakpointService);
 * readonly compact = this.bp.down('md');          // Signal<boolean>
 * readonly columns = computed(() => this.bp.resolve({ xs: 1, md: 2, xl: 4 }));
 * ```
 *
 * On the server (no `window`) everything reports `xs`.
 */
@Injectable({ providedIn: 'root' })
export class MkBreakpointService implements OnDestroy {
  /** The breakpoint scale in effect (see {@link MK_BREAKPOINTS}). */
  readonly breakpoints = inject(MK_BREAKPOINTS);

  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** `matches` per step, in scale order (`sm` first). */
  private readonly steps = new Map<MkBreakpoint, ReturnType<typeof signal<boolean>>>();
  private readonly cleanup: Array<() => void> = [];
  private readonly queries = new Map<string, Signal<boolean>>();
  private readonly ups = new Map<MkBreakpoint, Signal<boolean>>();
  private readonly downs = new Map<MkBreakpoint, Signal<boolean>>();

  /** The widest breakpoint the viewport currently satisfies. */
  readonly current: Signal<MkBreakpoint>;

  constructor() {
    for (const name of ORDER.slice(1)) {
      const min = this.breakpoints[name as Exclude<MkBreakpoint, 'xs'>];
      this.steps.set(name, this.watch(`(min-width: ${min}px)`));
    }
    this.current = computed(() => {
      let current: MkBreakpoint = 'xs';
      for (const name of ORDER.slice(1)) if (this.steps.get(name)!()) current = name;
      return current;
    });
  }

  /** True while the viewport is at least `bp` wide (`up('md')` = md, lg, xl, 2xl). */
  up(bp: MkBreakpoint): Signal<boolean> {
    let s = this.ups.get(bp);
    if (!s) {
      s = bp === 'xs' ? signal(true).asReadonly() : this.steps.get(bp)!.asReadonly();
      this.ups.set(bp, s);
    }
    return s;
  }

  /** True while the viewport is narrower than `bp` (`down('md')` = xs, sm). */
  down(bp: MkBreakpoint): Signal<boolean> {
    let s = this.downs.get(bp);
    if (!s) {
      const up = this.up(bp);
      s = computed(() => !up());
      this.downs.set(bp, s);
    }
    return s;
  }

  /** True while the viewport is at least `from` and narrower than `to`. */
  between(from: MkBreakpoint, to: MkBreakpoint): Signal<boolean> {
    const lo = this.up(from);
    const hi = this.down(to);
    return computed(() => lo() && hi());
  }

  /** Any media query as a signal, e.g. `observe('(orientation: portrait)')`. */
  observe(query: string): Signal<boolean> {
    let s = this.queries.get(query);
    if (!s) {
      s = this.watch(query).asReadonly();
      this.queries.set(query, s);
    }
    return s;
  }

  /**
   * Pick the entry of a responsive value for the current viewport —
   * mobile-first, so `{ xs: 1, md: 2 }` gives 1 on `sm` and 2 on `xl`.
   * A plain value is returned as is. Read inside a `computed` to track it.
   */
  resolve<T>(value: MkResponsive<T>): T | undefined {
    if (!mkIsResponsive(value)) return value as T;
    const idx = ORDER.indexOf(this.current());
    for (let i = idx; i >= 0; i--) {
      const v = value[ORDER[i]];
      if (v !== undefined) return v;
    }
    return undefined;
  }

  ngOnDestroy(): void {
    for (const off of this.cleanup) off();
    this.cleanup.length = 0;
  }

  private watch(query: string) {
    const s = signal(false);
    if (!this.isBrowser) return s;
    const mql = this.document.defaultView?.matchMedia?.(query);
    if (!mql) return s;
    s.set(mql.matches);
    const onChange = (e: MediaQueryListEvent) => s.set(e.matches);
    mql.addEventListener('change', onChange);
    this.cleanup.push(() => mql.removeEventListener('change', onChange));
    return s;
  }
}
