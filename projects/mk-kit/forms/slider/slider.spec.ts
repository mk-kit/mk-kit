import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkSlider } from './slider';

@Component({
  imports: [MkSlider],
  template: `<mk-slider
    [(value)]="value"
    [min]="min()"
    [max]="max()"
    [step]="step()"
    [disabled]="disabled()"
    aria-label="Volume"
  />`,
})
class Host {
  value = signal(50);
  min = signal(0);
  max = signal(100);
  step = signal(1);
  disabled = signal(false);
}

describe('MkSlider', () => {
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
      thumb: el.querySelector<HTMLElement>('[role=slider]')!,
      host: fixture.componentInstance,
    };
  }

  function press(fixture: ReturnType<typeof mount>['fixture'], thumb: HTMLElement, key: string) {
    const e = new KeyboardEvent('keydown', { key, cancelable: true });
    thumb.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('implements the ARIA slider pattern', () => {
    const { thumb } = mount();
    expect(thumb.getAttribute('role')).toBe('slider');
    expect(thumb.getAttribute('aria-valuemin')).toBe('0');
    expect(thumb.getAttribute('aria-valuemax')).toBe('100');
    expect(thumb.getAttribute('aria-valuenow')).toBe('50');
    expect(thumb.getAttribute('aria-orientation')).toBe('horizontal');
    expect(thumb.getAttribute('aria-label')).toBe('Volume');
    expect(thumb.getAttribute('tabindex')).toBe('0');
  });

  it('steps by [step] on the arrow keys', () => {
    const { fixture, thumb, host } = mount();
    press(fixture, thumb, 'ArrowRight');
    expect(host.value()).toBe(51);
    press(fixture, thumb, 'ArrowUp');
    expect(host.value()).toBe(52);
    press(fixture, thumb, 'ArrowLeft');
    expect(host.value()).toBe(51);
    press(fixture, thumb, 'ArrowDown');
    expect(host.value()).toBe(50);
  });

  it('honours a non-unit step and snaps to the grid', () => {
    const { fixture, thumb, host } = mount();
    host.step.set(10);
    host.value.set(20);
    fixture.detectChanges();

    press(fixture, thumb, 'ArrowRight');
    expect(host.value()).toBe(30);
  });

  it('jumps by a tenth of the range on PageUp/PageDown', () => {
    const { fixture, thumb, host } = mount();
    press(fixture, thumb, 'PageUp');
    expect(host.value()).toBe(60);
    press(fixture, thumb, 'PageDown');
    expect(host.value()).toBe(50);
  });

  it('jumps to the bounds on Home/End', () => {
    const { fixture, thumb, host } = mount();
    press(fixture, thumb, 'End');
    expect(host.value()).toBe(100);
    press(fixture, thumb, 'Home');
    expect(host.value()).toBe(0);
  });

  it('clamps at the bounds instead of wrapping', () => {
    const { fixture, thumb, host } = mount();
    host.value.set(100);
    fixture.detectChanges();
    press(fixture, thumb, 'ArrowRight');
    expect(host.value()).toBe(100);

    host.value.set(0);
    fixture.detectChanges();
    press(fixture, thumb, 'ArrowLeft');
    expect(host.value()).toBe(0);
  });

  it('preventDefaults handled keys so the page does not scroll', () => {
    const { fixture, thumb } = mount();
    expect(press(fixture, thumb, 'ArrowRight').defaultPrevented).toBe(true);
    expect(press(fixture, thumb, 'Home').defaultPrevented).toBe(true);
    expect(press(fixture, thumb, 'a').defaultPrevented).toBe(false);
  });

  it('tracks the fill percentage against the range', () => {
    const { fixture, el, host } = mount();
    const fill = el.querySelector<HTMLElement>('.mk-slider__fill')!;
    expect(fill.style.width).toBe('50%');

    host.min.set(0);
    host.max.set(200);
    host.value.set(50);
    fixture.detectChanges();
    expect(fill.style.width).toBe('25%');
  });

  it('ignores keys and drops out of the tab order while disabled', () => {
    const { fixture, thumb, host } = mount();
    host.disabled.set(true);
    fixture.detectChanges();

    expect(thumb.getAttribute('tabindex')).toBe('-1');
    expect(thumb.getAttribute('aria-disabled')).toBe('true');

    press(fixture, thumb, 'ArrowRight');
    expect(host.value()).toBe(50);
  });
});
