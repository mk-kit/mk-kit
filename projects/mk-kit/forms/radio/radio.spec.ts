import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkRadioGroup } from './radio-group';
import { MkRadio } from './radio';

@Component({
  imports: [MkRadioGroup, MkRadio],
  template: `<mk-radio-group [(value)]="value" [disabled]="groupDisabled()">
    <mk-radio value="a">A</mk-radio>
    <mk-radio value="b" [disabled]="bDisabled()">B</mk-radio>
    <mk-radio value="c">C</mk-radio>
  </mk-radio-group>`,
})
class Host {
  value = signal<unknown>(null);
  groupDisabled = signal(false);
  bDisabled = signal(false);
}

describe('MkRadioGroup', () => {
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
      group: el.querySelector<HTMLElement>('mk-radio-group')!,
      radios: [...el.querySelectorAll<HTMLElement>('mk-radio')],
      host: fixture.componentInstance,
    };
  }

  const key = (el: HTMLElement, k: string) => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    el.dispatchEvent(e);
    return e;
  };

  afterEach(() => TestBed.resetTestingModule());

  it('exposes the radiogroup role and per-radio radio roles', () => {
    const { group, radios } = mount();
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(radios.map((r) => r.getAttribute('role'))).toEqual([
      'radio',
      'radio',
      'radio',
    ]);
  });

  it('selects on click and reflects aria-checked', () => {
    const { fixture, radios, host } = mount();
    radios[2].click();
    fixture.detectChanges();

    expect(host.value()).toBe('c');
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
      'true',
    ]);
  });

  it('keeps a single tab stop (roving tabindex)', () => {
    const { fixture, radios, host } = mount();
    // Nothing selected: only the first enabled radio is tabbable.
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    host.value.set('c');
    fixture.detectChanges();
    // Selection owns the tab stop once there is one.
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('moves selection with the arrow keys and wraps around', () => {
    const { fixture, group, radios, host } = mount();
    radios[0].click();
    fixture.detectChanges();

    key(group, 'ArrowDown');
    fixture.detectChanges();
    expect(host.value()).toBe('b');

    key(group, 'ArrowRight');
    fixture.detectChanges();
    expect(host.value()).toBe('c');

    // Past the end, wrap to the first.
    key(group, 'ArrowDown');
    fixture.detectChanges();
    expect(host.value()).toBe('a');

    // And backwards off the start wraps to the last.
    key(group, 'ArrowUp');
    fixture.detectChanges();
    expect(host.value()).toBe('c');
  });

  it('skips disabled radios when arrowing', () => {
    const { fixture, group, radios, host } = mount();
    fixture.componentInstance.bDisabled.set(true);
    fixture.detectChanges();

    radios[0].click();
    fixture.detectChanges();
    expect(host.value()).toBe('a');

    key(group, 'ArrowDown');
    fixture.detectChanges();
    expect(host.value()).toBe('c'); // 'b' is disabled
  });

  it('preventDefaults handled keys and ignores the rest', () => {
    const { fixture, group } = mount();
    expect(key(group, 'ArrowDown').defaultPrevented).toBe(true);
    fixture.detectChanges();
    expect(key(group, 'Tab').defaultPrevented).toBe(false);
  });

  it('does not select a disabled radio', () => {
    const { fixture, radios, host } = mount();
    fixture.componentInstance.bDisabled.set(true);
    fixture.detectChanges();

    radios[1].click();
    fixture.detectChanges();
    expect(host.value()).toBeNull();
  });

  it('ignores interaction while the whole group is disabled', () => {
    const { fixture, group, radios, host } = mount();
    fixture.componentInstance.groupDisabled.set(true);
    fixture.detectChanges();

    radios[0].click();
    key(group, 'ArrowDown');
    fixture.detectChanges();

    expect(host.value()).toBeNull();
    expect(group.getAttribute('aria-disabled')).toBe('true');
  });
});
