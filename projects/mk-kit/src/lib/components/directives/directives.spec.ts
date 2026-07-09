import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkClickOutside } from './click-outside';
import { MkCopyToClipboard } from './copy-to-clipboard';
import { MkScrollspy } from './scrollspy';
import { MkIntersect } from './intersect';
import { MkInfiniteScroll } from './infinite-scroll';
import { MkRipple } from './ripple';

@Component({
  imports: [MkClickOutside],
  template: `<div mkClickOutside (mkClickOutside)="hits.set(hits() + 1)">
    <button id="inside">in</button>
  </div>`,
})
class ClickOutsideHost {
  readonly hits = signal(0);
}

@Component({
  imports: [MkCopyToClipboard],
  template: `<button [mkCopyToClipboard]="text" (copiedText)="last.set($event)">
    copy
  </button>`,
})
class CopyHost {
  readonly text = 'secret-token';
  readonly last = signal('');
}

describe('MkClickOutside', () => {
  let fixture: ComponentFixture<ClickOutsideHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ClickOutsideHost);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('emits when a pointerdown lands outside the host', () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.hits()).toBe(1);
    outside.remove();
  });

  it('does not emit for a pointerdown inside the host', () => {
    const inside = fixture.nativeElement.querySelector('#inside') as HTMLElement;
    inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.hits()).toBe(0);
  });
});

describe('MkCopyToClipboard', () => {
  let fixture: ComponentFixture<CopyHost>;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    // The directive reads document.defaultView.navigator.clipboard.
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(CopyHost);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('copies the text on click and emits copiedText', async () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLElement;
    button.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('secret-token');
    expect(fixture.componentInstance.last()).toBe('secret-token');
  });

  it('sets justCopied true after a successful copy', async () => {
    const dir = fixture.debugElement
      .query((n) => n.name === 'button')
      .injector.get(MkCopyToClipboard);
    await dir.copy();
    expect(dir.justCopied()).toBe(true);
  });
});

@Component({
  imports: [MkScrollspy],
  template: `
    <nav
      mkScrollspy="section[id]"
      [root]="body"
      [offset]="10"
      (activeChange)="active.set($event)"
    ></nav>
    <div #body>
      <section id="s-a"></section>
      <section id="s-b"></section>
      <section id="s-c"></section>
    </div>
  `,
})
class ScrollspyHost {
  readonly active = signal<string | null>(null);
}

describe('MkScrollspy', () => {
  let fixture: ComponentFixture<ScrollspyHost>;
  let body: HTMLElement;

  /** Stub each section's top edge (jsdom has no layout). */
  function setTops(tops: Record<string, number>): void {
    for (const [id, top] of Object.entries(tops)) {
      const el = fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
      el.getBoundingClientRect = () => ({ top }) as DOMRect;
    }
  }

  /** Fake the scroll root's viewport metrics. */
  function setRootMetrics(scrollTop: number, clientH = 200, scrollH = 1000): void {
    body.scrollTop = scrollTop;
    Object.defineProperty(body, 'clientHeight', { value: clientH, configurable: true });
    Object.defineProperty(body, 'scrollHeight', { value: scrollH, configurable: true });
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ScrollspyHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    body = fixture.nativeElement.querySelector('div') as HTMLElement;
    body.getBoundingClientRect = () => ({ top: 0 }) as DOMRect; // line = offset
    setRootMetrics(0); // not at bottom
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('activates the last section whose top has crossed the offset line', () => {
    // line = 0 + offset(10). a and b are above/at it, c is below.
    setTops({ 's-a': -100, 's-b': 5, 's-c': 300 });
    body.dispatchEvent(new Event('scroll'));
    expect(fixture.componentInstance.active()).toBe('s-b');
  });

  it('updates as the container scrolls further down', () => {
    setTops({ 's-a': -400, 's-b': -200, 's-c': -5 });
    body.dispatchEvent(new Event('scroll'));
    expect(fixture.componentInstance.active()).toBe('s-c');
  });

  it('falls back to the first section when none has crossed yet', () => {
    setTops({ 's-a': 100, 's-b': 300, 's-c': 500 });
    body.dispatchEvent(new Event('scroll'));
    expect(fixture.componentInstance.active()).toBe('s-a');
  });

  it('activates the last section when scrolled to the bottom', () => {
    // The last section is too short to reach the line, but we are at the bottom.
    setTops({ 's-a': -400, 's-b': -300, 's-c': 60 });
    setRootMetrics(800); // 800 + 200 >= 1000 → at bottom
    body.dispatchEvent(new Event('scroll'));
    expect(fixture.componentInstance.active()).toBe('s-c');
  });

  it('exposes the active id as a signal and emits only on change', () => {
    const dir = fixture.debugElement
      .query((n) => n.name === 'nav')
      .injector.get(MkScrollspy);
    const emits: (string | null)[] = [];
    dir.activeChange.subscribe((id) => emits.push(id));

    setTops({ 's-a': -50, 's-b': 5, 's-c': 300 });
    body.dispatchEvent(new Event('scroll'));
    body.dispatchEvent(new Event('scroll')); // no change → no second emit
    expect(dir.activeId()).toBe('s-b');
    expect(emits).toEqual(['s-b']);
  });
});

// --- MkIntersect ------------------------------------------------------------
type IoCb = (entries: Array<{ isIntersecting: boolean }>) => void;

@Component({
  imports: [MkIntersect],
  template: `<div
    mkIntersect
    [once]="once()"
    (mkIntersect)="events.set([...events(), $event])"
  ></div>`,
})
class IntersectHost {
  readonly once = signal(false);
  readonly events = signal<boolean[]>([]);
}

describe('MkIntersect', () => {
  let fixture: ComponentFixture<IntersectHost>;
  let lastCb: IoCb;
  let observed: number;
  let disconnected: number;
  let originalIO: typeof IntersectionObserver;

  beforeEach(async () => {
    observed = 0;
    disconnected = 0;
    originalIO = globalThis.IntersectionObserver;
    class MockIO {
      constructor(cb: IoCb) {
        lastCb = cb;
      }
      observe() {
        observed++;
      }
      disconnect() {
        disconnected++;
      }
      unobserve() {}
    }
    globalThis.IntersectionObserver = MockIO as unknown as typeof IntersectionObserver;

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(IntersectHost);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIO;
    fixture.destroy();
  });

  it('observes the host and emits on visibility changes', () => {
    expect(observed).toBe(1);
    lastCb([{ isIntersecting: true }]);
    lastCb([{ isIntersecting: false }]);
    expect(fixture.componentInstance.events()).toEqual([true, false]);
  });

  it('does not re-emit the same visibility state', () => {
    lastCb([{ isIntersecting: true }]);
    lastCb([{ isIntersecting: true }]);
    expect(fixture.componentInstance.events()).toEqual([true]);
  });

  it('disconnects after the first hit when once is set', async () => {
    fixture.componentInstance.once.set(true);
    fixture.detectChanges();
    lastCb([{ isIntersecting: true }]);
    expect(disconnected).toBe(1);
    // A later callback is ignored (observer gone in real usage).
    lastCb([{ isIntersecting: false }]);
    expect(fixture.componentInstance.events()).toEqual([true]);
  });
});

// --- MkInfiniteScroll -------------------------------------------------------
@Component({
  imports: [MkInfiniteScroll],
  template: `<div
    mkInfiniteScroll
    [distance]="50"
    [disabled]="disabled()"
    (mkInfiniteScroll)="hits.set(hits() + 1)"
  ></div>`,
})
class InfiniteHost {
  readonly disabled = signal(false);
  readonly hits = signal(0);
}

describe('MkInfiniteScroll', () => {
  let fixture: ComponentFixture<InfiniteHost>;
  let el: HTMLElement;

  function setScroll(scrollTop: number, clientH = 200, scrollH = 1000): void {
    Object.defineProperty(el, 'clientHeight', { value: clientH, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: scrollH, configurable: true });
    el.scrollTop = scrollTop;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(InfiniteHost);
    el = fixture.nativeElement.querySelector('div') as HTMLElement;
    // Not near the bottom when the initial check runs on afterNextRender.
    setScroll(0);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  it('fires once when scrolled within distance of the bottom', () => {
    setScroll(760); // remaining = 1000 - 760 - 200 = 40 <= 50
    el.dispatchEvent(new Event('scroll'));
    el.dispatchEvent(new Event('scroll')); // still near bottom → armed=false, no re-fire
    expect(fixture.componentInstance.hits()).toBe(1);
  });

  it('re-arms after scrolling back up past the threshold', () => {
    setScroll(760);
    el.dispatchEvent(new Event('scroll'));
    setScroll(100); // remaining = 700 > 50 → re-arm
    el.dispatchEvent(new Event('scroll'));
    setScroll(760);
    el.dispatchEvent(new Event('scroll'));
    expect(fixture.componentInstance.hits()).toBe(2);
  });

  it('does not fire while disabled', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    setScroll(760);
    el.dispatchEvent(new Event('scroll'));
    expect(fixture.componentInstance.hits()).toBe(0);
  });
});

// --- MkRipple ---------------------------------------------------------------
@Component({
  imports: [MkRipple],
  template: `<button mkRipple [mkRippleDisabled]="disabled()" mkRippleCentered>
    press
  </button>`,
})
class RippleHost {
  readonly disabled = signal(false);
}

describe('MkRipple', () => {
  let fixture: ComponentFixture<RippleHost>;
  let btn: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(RippleHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    btn = fixture.nativeElement.querySelector('button') as HTMLElement;
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('appends a wave element on pointerdown and clips the host', () => {
    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 5, clientY: 5 }));
    expect(btn.querySelectorAll('.mk-ripple__wave')).toHaveLength(1);
    expect(btn.style.overflow).toBe('hidden');
  });

  it('does not spawn a wave when disabled', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 5, clientY: 5 }));
    expect(btn.querySelectorAll('.mk-ripple__wave')).toHaveLength(0);
  });

  it('removes the wave after the fallback timer', () => {
    vi.useFakeTimers();
    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 5, clientY: 5 }));
    expect(btn.querySelectorAll('.mk-ripple__wave')).toHaveLength(1);
    vi.advanceTimersByTime(700);
    expect(btn.querySelectorAll('.mk-ripple__wave')).toHaveLength(0);
    vi.useRealTimers();
  });
});
