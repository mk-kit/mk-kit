import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkAutofocus } from './autofocus';
import { MkClickOutside } from './click-outside';
import { MkCopyToClipboard } from './copy-to-clipboard';
import { MkScrollspy } from './scrollspy';
import { MkIntersect } from './intersect';
import { MkInfiniteScroll } from './infinite-scroll';
import { MkRipple } from './ripple';
import { MkMask, mkApplyMask } from './mask';

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

@Component({
  imports: [MkClickOutside],
  template: `<div
    mkClickOutside
    [mkClickOutsideEnabled]="enabled()"
    (mkClickOutside)="hits.set(hits() + 1)"
  ></div>`,
})
class ToggleClickOutsideHost {
  readonly enabled = signal(false);
  readonly hits = signal(0);
}

describe('MkClickOutside enabled toggling', () => {
  it('keeps the document listener attached only while enabled', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const added = () =>
      addSpy.mock.calls.filter((c) => c[0] === 'pointerdown').length;
    const removed = () =>
      removeSpy.mock.calls.filter((c) => c[0] === 'pointerdown').length;

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ToggleClickOutsideHost);
    fixture.detectChanges();

    // Disabled from the start — no listener at all.
    expect(added()).toBe(0);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.hits()).toBe(0);

    // Enabled → attaches and emits.
    fixture.componentInstance.enabled.set(true);
    fixture.detectChanges();
    expect(added()).toBe(1);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.hits()).toBe(1);

    // Disabled again → detaches; outside presses no longer run the handler.
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    expect(removed()).toBe(1);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(fixture.componentInstance.hits()).toBe(1);

    // Re-enabled → re-attaches; destroy detaches via the effect cleanup.
    fixture.componentInstance.enabled.set(true);
    fixture.detectChanges();
    expect(added()).toBe(2);
    fixture.destroy();
    expect(removed()).toBe(2);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

// --- MkAutofocus ------------------------------------------------------------
@Component({
  imports: [MkAutofocus],
  template: `<input mkAutofocus [mkAutofocusDelay]="100" />`,
})
class AutofocusHost {}

describe('MkAutofocus', () => {
  let fixture: ComponentFixture<AutofocusHost>;
  let input: HTMLInputElement;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(AutofocusHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
    vi.useRealTimers();
  });

  it('focuses the host after the configured delay', () => {
    expect(document.activeElement).not.toBe(input);
    vi.advanceTimersByTime(100);
    expect(document.activeElement).toBe(input);
  });

  it('clears the pending delayed focus on destroy', () => {
    const focusSpy = vi.spyOn(input, 'focus');
    fixture.destroy(); // before the 100ms delay elapses
    vi.advanceTimersByTime(1000);
    expect(focusSpy).not.toHaveBeenCalled();
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

  /** Scroll computation is rAF-coalesced — wait one frame for it to land. */
  function frame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

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

  it('activates the last section whose top has crossed the offset line', async () => {
    // line = 0 + offset(10). a and b are above/at it, c is below.
    setTops({ 's-a': -100, 's-b': 5, 's-c': 300 });
    body.dispatchEvent(new Event('scroll'));
    await frame();
    expect(fixture.componentInstance.active()).toBe('s-b');
  });

  it('updates as the container scrolls further down', async () => {
    setTops({ 's-a': -400, 's-b': -200, 's-c': -5 });
    body.dispatchEvent(new Event('scroll'));
    await frame();
    expect(fixture.componentInstance.active()).toBe('s-c');
  });

  it('falls back to the first section when none has crossed yet', async () => {
    setTops({ 's-a': 100, 's-b': 300, 's-c': 500 });
    body.dispatchEvent(new Event('scroll'));
    await frame();
    expect(fixture.componentInstance.active()).toBe('s-a');
  });

  it('activates the last section when scrolled to the bottom', async () => {
    // The last section is too short to reach the line, but we are at the bottom.
    setTops({ 's-a': -400, 's-b': -300, 's-c': 60 });
    setRootMetrics(800); // 800 + 200 >= 1000 → at bottom
    body.dispatchEvent(new Event('scroll'));
    await frame();
    expect(fixture.componentInstance.active()).toBe('s-c');
  });

  it('exposes the active id as a signal and emits only on change', async () => {
    const dir = fixture.debugElement
      .query((n) => n.name === 'nav')
      .injector.get(MkScrollspy);
    const emits: (string | null)[] = [];
    dir.activeChange.subscribe((id) => emits.push(id));

    setTops({ 's-a': -50, 's-b': 5, 's-c': 300 });
    body.dispatchEvent(new Event('scroll'));
    body.dispatchEvent(new Event('scroll')); // coalesced → single compute
    await frame();
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

// --- MkMask -----------------------------------------------------------------
@Component({
  imports: [MkMask],
  template: `<input
    #input
    [mkMask]="pattern()"
    (unmaskedChange)="raw.set($event)"
    (maskedChange)="masked.set($event)"
  />`,
})
class MaskHost {
  readonly pattern = signal('(000) 000-0000');
  readonly raw = signal('');
  readonly masked = signal('');
}

describe('mkApplyMask', () => {
  it('inserts literals and keeps only token characters as unmasked', () => {
    expect(mkApplyMask('5551234567', '(000) 000-0000')).toEqual({
      masked: '(555) 123-4567',
      unmasked: '5551234567',
    });
  });

  it('skips characters that do not fit the current token', () => {
    // Letters rejected in a digit mask.
    expect(mkApplyMask('12ab34', '00-00').unmasked).toBe('1234');
    // Digits rejected in a letter mask.
    expect(mkApplyMask('a1b2', 'AAAA').unmasked).toBe('ab');
  });

  it('stops at the first unfilled token (no dangling literal)', () => {
    expect(mkApplyMask('12', '00/00/0000').masked).toBe('12');
    expect(mkApplyMask('123', '00/00/0000').masked).toBe('12/3');
  });

  it('supports alphanumeric tokens', () => {
    expect(mkApplyMask('ab12cd', '**-**-**').masked).toBe('ab-12-cd');
  });
});

describe('MkMask', () => {
  let fixture: ComponentFixture<MaskHost>;
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MaskHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('formats the input and emits masked + unmasked values', () => {
    input.value = '5551234567';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('(555) 123-4567');
    expect(fixture.componentInstance.masked()).toBe('(555) 123-4567');
    expect(fixture.componentInstance.raw()).toBe('5551234567');
  });

  it('reformats correctly after a partial edit', () => {
    input.value = '555';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('(555');
    expect(fixture.componentInstance.raw()).toBe('555');
  });
});
