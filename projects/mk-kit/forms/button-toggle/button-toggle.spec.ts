import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkButtonToggleGroup } from './button-toggle-group';
import { MkButtonToggle } from './button-toggle';

@Component({
  imports: [MkButtonToggleGroup, MkButtonToggle],
  template: `<mk-button-toggle-group
    [(value)]="value"
    [multiple]="multiple()"
    [disabled]="groupDisabled()"
    aria-label="View"
  >
    <mk-button-toggle value="grid">Grid</mk-button-toggle>
    <mk-button-toggle value="list" [disabled]="listDisabled()">List</mk-button-toggle>
    <mk-button-toggle value="map">Map</mk-button-toggle>
  </mk-button-toggle-group>`,
})
class Host {
  value = signal<unknown>(null);
  multiple = signal(false);
  groupDisabled = signal(false);
  listDisabled = signal(false);
}

describe('MkButtonToggleGroup', () => {
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
      group: el.querySelector<HTMLElement>('mk-button-toggle-group')!,
      buttons: [...el.querySelectorAll<HTMLButtonElement>('button')],
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

  it('is a radiogroup of radios in single-select mode', () => {
    const { group, buttons } = mount();
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(buttons.map((b) => b.getAttribute('role'))).toEqual([
      'radio',
      'radio',
      'radio',
    ]);
    expect(buttons[0].getAttribute('aria-checked')).toBe('false');
    expect(buttons[0].getAttribute('aria-pressed')).toBeNull();
  });

  it('is a group of toggle buttons in multiple mode', () => {
    const { fixture, group, buttons, host } = mount();
    host.multiple.set(true);
    fixture.detectChanges();

    expect(group.getAttribute('role')).toBe('group');
    expect(buttons[0].getAttribute('role')).toBeNull();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[0].getAttribute('aria-checked')).toBeNull();
  });

  it('selects a single value on click', () => {
    const { fixture, buttons, host } = mount();
    buttons[2].click();
    fixture.detectChanges();

    expect(host.value()).toBe('map');
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
    ]);
  });

  it('does not deselect the current value in single-select mode', () => {
    const { fixture, buttons, host } = mount();
    buttons[0].click();
    fixture.detectChanges();
    buttons[0].click();
    fixture.detectChanges();
    expect(host.value()).toBe('grid');
  });

  it('accumulates and removes values in multiple mode', () => {
    const { fixture, buttons, host } = mount();
    host.multiple.set(true);
    fixture.detectChanges();

    buttons[0].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['grid']);

    buttons[2].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['grid', 'map']);

    // Clicking a selected item removes it.
    buttons[0].click();
    fixture.detectChanges();
    expect(host.value()).toEqual(['map']);
  });

  it('keeps a single tab stop and moves it with the arrow keys', () => {
    const { fixture, buttons, host } = mount();
    expect(buttons.map((b) => b.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    press(fixture, buttons[0], 'ArrowRight');
    // 'list' is enabled here, so it takes the tab stop and (single mode) the value.
    expect(buttons.map((b) => b.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    expect(host.value()).toBe('list');
  });

  it('skips disabled items and wraps when arrowing', () => {
    const { fixture, buttons, host } = mount();
    host.listDisabled.set(true);
    fixture.detectChanges();

    press(fixture, buttons[0], 'ArrowRight');
    expect(host.value()).toBe('map'); // skipped the disabled 'list'

    press(fixture, buttons[2], 'ArrowRight');
    expect(host.value()).toBe('grid'); // wrapped
  });

  it('jumps to the ends with Home and End', () => {
    const { fixture, buttons, host } = mount();
    press(fixture, buttons[0], 'End');
    expect(host.value()).toBe('map');
    press(fixture, buttons[2], 'Home');
    expect(host.value()).toBe('grid');
  });

  it('selects with Space and Enter without moving focus', () => {
    const { fixture, buttons, host } = mount();
    host.multiple.set(true);
    fixture.detectChanges();

    expect(press(fixture, buttons[1], ' ').defaultPrevented).toBe(true);
    expect(host.value()).toEqual(['list']);

    press(fixture, buttons[2], 'Enter');
    expect(host.value()).toEqual(['list', 'map']);
  });

  it('ignores a disabled item and a disabled group', () => {
    const { fixture, buttons, host } = mount();
    host.listDisabled.set(true);
    fixture.detectChanges();
    buttons[1].click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();

    host.listDisabled.set(false);
    host.groupDisabled.set(true);
    fixture.detectChanges();
    buttons[0].click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });
});
