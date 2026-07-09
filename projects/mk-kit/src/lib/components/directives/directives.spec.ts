import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkClickOutside } from './click-outside';
import { MkCopyToClipboard } from './copy-to-clipboard';
import { MkScrollspy } from './scrollspy';

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
