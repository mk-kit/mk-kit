import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkAnchoredPanel, mkComputeAnchoredPosition } from './anchored-overlay';

/** Build a rect-like object from top/left/width/height. */
function rect(top: number, left: number, width: number, height: number) {
  return { top, left, right: left + width, bottom: top + height, width, height };
}

const VIEWPORT = { width: 1000, height: 800 };
const OPTS = { gap: 4, flip: true, clamp: true } as const;

describe('mkComputeAnchoredPosition', () => {
  it('places a bottom-start panel below and left-aligned to the anchor', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 50, 100, 30),
      { width: 200, height: 80 },
      VIEWPORT,
      { ...OPTS, placement: 'bottom-start' },
    );
    expect(pos).toEqual({ top: 134, left: 50, placement: 'bottom-start' });
  });

  it('flips above the anchor when the panel would overflow the bottom edge', () => {
    const pos = mkComputeAnchoredPosition(
      rect(750, 50, 100, 30),
      { width: 200, height: 80 },
      VIEWPORT,
      { ...OPTS, placement: 'bottom-start' },
    );
    // 750 - 80 - 4 = 666, placement flips to top-start.
    expect(pos).toEqual({ top: 666, left: 50, placement: 'top-start' });
  });

  it('clamps the panel back inside the right viewport edge', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 950, 100, 30),
      { width: 200, height: 80 },
      VIEWPORT,
      { ...OPTS, placement: 'bottom-start' },
    );
    // Preferred left 950 → clamped to 1000 - 200 - 4 = 796.
    expect(pos.left).toBe(796);
  });

  it('centres a left-placed panel on the anchor’s vertical axis', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 400, 100, 40),
      { width: 60, height: 20 },
      VIEWPORT,
      { ...OPTS, gap: 8, placement: 'left' },
    );
    // left = 400 - 60 - 8 = 332; top = 100 + 40/2 - 20/2 = 110.
    expect(pos).toEqual({ top: 110, left: 332, placement: 'left' });
  });

  it('tops a right-start panel with the anchor (submenu beside its item)', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 400, 100, 40),
      { width: 60, height: 200 },
      VIEWPORT,
      { ...OPTS, placement: 'right-start' },
    );
    // left = 400 + 100 + 4 = 504; top = anchor top.
    expect(pos).toEqual({ top: 100, left: 504, placement: 'right-start' });
  });

  it('flips a right-start panel to left-start when it would overflow the right edge', () => {
    const pos = mkComputeAnchoredPosition(
      rect(100, 900, 80, 40),
      { width: 60, height: 200 },
      VIEWPORT,
      { ...OPTS, placement: 'right-start' },
    );
    // 900 + 80 + 4 + 60 > 1000 → left side: 900 - 60 - 4 = 836, still top-aligned.
    expect(pos).toEqual({ top: 100, left: 836, placement: 'left-start' });
  });

  it('does not flip when flip is disabled, only clamps (tooltip behaviour)', () => {
    const pos = mkComputeAnchoredPosition(
      rect(10, 50, 100, 30),
      { width: 120, height: 40 },
      VIEWPORT,
      { gap: 8, flip: false, clamp: true, placement: 'top' },
    );
    // Preferred top = 10 - 40 - 8 = -38 → clamped to gap (8). Stays 'top'.
    expect(pos.top).toBe(8);
    expect(pos.placement).toBe('top');
  });
});

@Component({
  selector: 'mk-anchored-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  template: `
    <button #trigger>trigger</button>
    @if (open()) {
      <div
        class="panel"
        mkAnchoredPanel
        [mkAnchoredPanelFor]="trigger"
        (dismiss)="dismissed.set(dismissed() + 1)"
      >
        panel
      </div>
    }
  `,
})
class AnchoredHost {
  readonly open = signal(false);
  readonly dismissed = signal(0);
}

describe('MkAnchoredPanel (directive lifecycle)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    // jsdom reports a 0x0 viewport; the scroll-tracking logic treats that as
    // "unmeasurable" and skips its out-of-view check, so give it a real one.
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });
  });

  afterEach(() => {
    delete (document.documentElement as any).clientWidth;
    delete (document.documentElement as any).clientHeight;
  });

  function panelCount(): number {
    return document.querySelectorAll('.panel').length;
  }

  it('teleports the panel into a document.body top-layer portal when open', async () => {
    const fixture = TestBed.createComponent(AnchoredHost);
    fixture.detectChanges();
    expect(panelCount()).toBe(0);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = document.querySelector('.panel') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.parentElement).toBe(document.body);
    expect(panel.style.position).toBe('fixed');

    fixture.destroy();
    expect(panelCount()).toBe(0);
  });

  it('drops the popover attribute when showPopover() throws, so the UA sheet cannot hide the panel', async () => {
    // jsdom has no Popover API; install a throwing showPopover to drive the
    // directive down its catch path in a "supporting" browser.
    (HTMLElement.prototype as any).showPopover = () => {
      throw new DOMException('InvalidStateError');
    };
    try {
      const fixture = TestBed.createComponent(AnchoredHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const panel = document.querySelector('.panel') as HTMLElement;
      expect(panel).toBeTruthy();
      // With the attribute left behind, `[popover]:not(:popover-open)` would
      // compute to display:none — the panel must fall back to a plain portal.
      expect(panel.hasAttribute('popover')).toBe(false);

      fixture.destroy();
    } finally {
      delete (HTMLElement.prototype as any).showPopover;
    }
  });

  it('leaves no orphaned panel behind across repeated open/close cycles', async () => {
    const fixture = TestBed.createComponent(AnchoredHost);
    fixture.detectChanges();

    for (let i = 0; i < 4; i++) {
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      // The teleported node must be fully removed — not moved back into the
      // component view — so nothing accumulates in the DOM.
      expect(panelCount()).toBe(0);
    }

    fixture.destroy();
  });

  it('tracks the anchor unclamped on scroll, without dismissing while visible', async () => {
    const fixture = TestBed.createComponent(AnchoredHost);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('button');
    // On-screen anchor near the left edge; a clamped reposition would pull the
    // panel to x >= gap, a tracking one must honour the anchor exactly.
    trigger.getBoundingClientRect = () =>
      ({ top: 40, left: -2, right: 38, bottom: 70, width: 40, height: 30 }) as DOMRect;

    window.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 50));

    const panel = document.querySelector('.panel') as HTMLElement;
    expect(panel.style.left).toBe('-2px');
    expect(panel.style.top).toBe('74px');
    expect(fixture.componentInstance.dismissed()).toBe(0);

    fixture.destroy();
  });

  it('dismisses when the anchor scrolls fully out of the viewport', async () => {
    const fixture = TestBed.createComponent(AnchoredHost);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('button');
    trigger.getBoundingClientRect = () =>
      ({ top: -60, left: 10, right: 50, bottom: -30, width: 40, height: 30 }) as DOMRect;

    window.dispatchEvent(new Event('scroll'));
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    expect(fixture.componentInstance.dismissed()).toBe(1);

    fixture.destroy();
  });

  describe('viewport size cap', () => {
    it('caps max-width/max-height when the panel is larger than the viewport', async () => {
      const fixture = TestBed.createComponent(AnchoredHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const panel = document.querySelector('.panel') as HTMLElement;
      // A panel measuring larger than the mocked 1000×800 viewport.
      panel.getBoundingClientRect = () =>
        rect(0, 0, 1400, 900) as DOMRect;

      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => setTimeout(r, 50));

      // cap = viewport - 2 * gap (default gap 4).
      expect(panel.style.maxWidth).toBe('992px');
      expect(panel.style.maxHeight).toBe('792px');

      fixture.destroy();
    });

    it('leaves max-* alone when the panel fits — a panel with its own smaller CSS max keeps it', async () => {
      const fixture = TestBed.createComponent(AnchoredHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const panel = document.querySelector('.panel') as HTMLElement;
      // A panel already limited below the cap (e.g. a select list whose
      // stylesheet max-height of 16rem keeps its measured height at 256px).
      // An inline max-* would OVERRIDE that stylesheet max, so none may be set.
      panel.getBoundingClientRect = () =>
        rect(0, 0, 300, 256) as DOMRect;

      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => setTimeout(r, 50));

      expect(panel.style.maxWidth).toBe('');
      expect(panel.style.maxHeight).toBe('');

      fixture.destroy();
    });
  });

  describe('visualViewport', () => {
    it('attaches resize/scroll listeners to visualViewport, prefers its size for the cap, and detaches on destroy', async () => {
      // jsdom has no visualViewport — install a feature-detectable mock.
      const vv = Object.assign(new EventTarget(), { width: 360, height: 500 });
      const addSpy = vi.spyOn(vv, 'addEventListener');
      const removeSpy = vi.spyOn(vv, 'removeEventListener');
      Object.defineProperty(window, 'visualViewport', {
        value: vv,
        configurable: true,
      });

      try {
        const fixture = TestBed.createComponent(AnchoredHost);
        fixture.detectChanges();
        fixture.componentInstance.open.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

        const panel = document.querySelector('.panel') as HTMLElement;
        panel.getBoundingClientRect = () =>
          rect(0, 0, 600, 600) as DOMRect;

        // A visualViewport resize (iOS keyboard) must reach the reposition
        // path even though `window` itself never fires.
        vv.dispatchEvent(new Event('resize'));
        await new Promise((r) => setTimeout(r, 50));

        // Cap derives from the 360×500 visual viewport, not the 1000×800
        // layout viewport mocked on documentElement.
        expect(panel.style.maxWidth).toBe('352px');
        expect(panel.style.maxHeight).toBe('492px');

        fixture.destroy();
        expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      } finally {
        delete (window as any).visualViewport;
      }
    });
  });
});
