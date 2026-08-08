import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkTabs } from './tabs';
import { MkTab } from './tab';

@Component({
  imports: [MkTabs, MkTab],
  template: `<mk-tabs [(selectedIndex)]="index">
    <mk-tab label="One">First panel</mk-tab>
    <mk-tab label="Two" [disabled]="twoDisabled()">Second panel</mk-tab>
    <mk-tab label="Three">Third panel</mk-tab>
  </mk-tabs>`,
})
class Host {
  index = signal(0);
  twoDisabled = signal(false);
}

describe('MkTabs', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      tablist: el.querySelector<HTMLElement>('[role=tablist]')!,
      buttons: [...el.querySelectorAll<HTMLButtonElement>('[role=tab]')],
      panels: [...el.querySelectorAll<HTMLElement>('[role=tabpanel]')],
      host: fixture.componentInstance,
    };
  }

  function press(
    fixture: ReturnType<typeof mount>['fixture'],
    btn: HTMLElement,
    key: string,
  ) {
    const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    btn.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('wires the tablist/tab/tabpanel relationships', () => {
    const { tablist, buttons, panels } = mount();
    expect(tablist.getAttribute('role')).toBe('tablist');
    expect(buttons.length).toBe(3);
    expect(panels.length).toBe(3);

    buttons.forEach((btn, i) => {
      // Each tab points at its panel, and the panel points back.
      expect(btn.getAttribute('aria-controls')).toBe(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).toBe(btn.id);
    });
  });

  it('renders the tab labels', () => {
    const { buttons } = mount();
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['One', 'Two', 'Three']);
  });

  it('shows only the selected panel and marks only that tab selected', () => {
    const { buttons, panels } = mount();
    expect(buttons.map((b) => b.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(panels.map((p) => p.hasAttribute('hidden'))).toEqual([false, true, true]);
  });

  it('keeps a single tab stop on the selected tab', () => {
    const { fixture, buttons, host } = mount();
    expect(buttons.map((b) => b.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    host.index.set(2);
    fixture.detectChanges();
    expect(buttons.map((b) => b.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('selects on click and swaps the visible panel', () => {
    const { fixture, buttons, panels, host } = mount();
    buttons[2].click();
    fixture.detectChanges();

    expect(host.index()).toBe(2);
    expect(panels.map((p) => p.hasAttribute('hidden'))).toEqual([true, true, false]);
  });

  it('moves selection with the arrow keys and wraps around', () => {
    const { fixture, buttons, host } = mount();
    press(fixture, buttons[0], 'ArrowRight');
    expect(host.index()).toBe(1);

    press(fixture, buttons[1], 'ArrowRight');
    expect(host.index()).toBe(2);

    press(fixture, buttons[2], 'ArrowRight');
    expect(host.index()).toBe(0); // wrapped

    press(fixture, buttons[0], 'ArrowLeft');
    expect(host.index()).toBe(2); // wrapped backwards
  });

  it('jumps to the first and last tab with Home and End', () => {
    const { fixture, buttons, host } = mount();
    press(fixture, buttons[0], 'End');
    expect(host.index()).toBe(2);
    press(fixture, buttons[2], 'Home');
    expect(host.index()).toBe(0);
  });

  it('skips a disabled tab when arrowing and refuses to select it', () => {
    const { fixture, buttons, host } = mount();
    host.twoDisabled.set(true);
    fixture.detectChanges();

    press(fixture, buttons[0], 'ArrowRight');
    expect(host.index()).toBe(2); // skipped the disabled middle tab

    host.index.set(0);
    fixture.detectChanges();
    buttons[1].click();
    fixture.detectChanges();
    expect(host.index()).toBe(0);
  });

  it('preventDefaults handled keys and ignores the rest', () => {
    const { fixture, buttons } = mount();
    expect(press(fixture, buttons[0], 'ArrowRight').defaultPrevented).toBe(true);
    expect(press(fixture, buttons[0], 'x').defaultPrevented).toBe(false);
  });

  it('scrolls the newly active tab into view on click and on arrow keys', () => {
    // jsdom has no scrollIntoView — install a prototype spy for the test.
    const original = HTMLElement.prototype.scrollIntoView;
    const spy = vi.fn();
    HTMLElement.prototype.scrollIntoView = spy;
    try {
      const { fixture, buttons } = mount();
      buttons[2].click();
      fixture.detectChanges();
      expect(spy).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
      expect(spy.mock.contexts.at(-1)).toBe(buttons[2]);

      press(fixture, buttons[2], 'ArrowLeft');
      expect(spy.mock.contexts.at(-1)).toBe(buttons[1]);
    } finally {
      // jsdom has no native scrollIntoView, so `original` is undefined —
      // assigning it back would CREATE an own `scrollIntoView: undefined`
      // on the prototype, shadowing any spy later spec files (sharing this
      // worker) install on Element.prototype. Delete instead.
      if (original) HTMLElement.prototype.scrollIntoView = original;
      else
        delete (HTMLElement.prototype as { scrollIntoView?: unknown })
          .scrollIntoView;
    }
  });

  it('clamps an out-of-range selectedIndex onto a real tab', () => {
    const { fixture, panels, host } = mount();
    host.index.set(99);
    fixture.detectChanges();
    // The last tab is shown rather than nothing at all.
    expect(panels.map((p) => p.hasAttribute('hidden'))).toEqual([true, true, false]);

    host.index.set(-5);
    fixture.detectChanges();
    expect(panels.map((p) => p.hasAttribute('hidden'))).toEqual([false, true, true]);
  });
});
