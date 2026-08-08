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

  /**
   * Renders the track right-to-left. jsdom's UA stylesheet resolves
   * `[dir=rtl]` set on the element itself via getComputedStyle; if that ever
   * stops holding, fall back to mocking the resolution for this element.
   */
  function forceRtl(track: HTMLElement) {
    track.setAttribute('dir', 'rtl');
    if (getComputedStyle(track).direction !== 'rtl') {
      const orig = window.getComputedStyle.bind(window);
      vi.spyOn(window, 'getComputedStyle').mockImplementation(
        ((el: Element) =>
          el === track
            ? ({ direction: 'rtl' } as CSSStyleDeclaration)
            : orig(el)) as typeof window.getComputedStyle,
      );
    }
  }

  /** Gives the zero-sized jsdom track a usable 0–100px geometry. */
  function mockRect(track: HTMLElement, width = 100) {
    return vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 10,
      width,
      height: 10,
      toJSON: () => ({}),
    } as DOMRect);
  }

  const pev = (type: string, clientX: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      clientX,
    });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

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

  it('flips ArrowLeft/ArrowRight in RTL to follow the visual direction', () => {
    const { fixture, el, thumb, host } = mount();
    forceRtl(el.querySelector<HTMLElement>('.mk-slider__track')!);

    press(fixture, thumb, 'ArrowRight'); // visually right = towards min
    expect(host.value()).toBe(49);
    press(fixture, thumb, 'ArrowLeft'); // visually left = towards max
    expect(host.value()).toBe(50);
  });

  it('keeps Up/Down and Home/End direction-agnostic in RTL', () => {
    const { fixture, el, thumb, host } = mount();
    forceRtl(el.querySelector<HTMLElement>('.mk-slider__track')!);

    press(fixture, thumb, 'ArrowUp');
    expect(host.value()).toBe(51);
    press(fixture, thumb, 'ArrowDown');
    expect(host.value()).toBe(50);
    press(fixture, thumb, 'End');
    expect(host.value()).toBe(100);
    press(fixture, thumb, 'Home');
    expect(host.value()).toBe(0);
  });

  it('drags via pointer capture and stops listening after pointerup', async () => {
    const { fixture, el, host } = mount();
    const track = el.querySelector<HTMLElement>('.mk-slider__track')!;
    mockRect(track);

    track.dispatchEvent(pev('pointerdown', 30));
    await fixture.whenStable();
    expect(host.value()).toBe(30);

    // Moves are handled by listeners on the capturing element, drag-only.
    track.dispatchEvent(pev('pointermove', 70));
    await fixture.whenStable();
    expect(host.value()).toBe(70);

    track.dispatchEvent(pev('pointerup', 70));
    await fixture.whenStable();

    // Listeners are gone: a move after release must not change the value.
    track.dispatchEvent(pev('pointermove', 90));
    await fixture.whenStable();
    expect(host.value()).toBe(70);
  });

  it('stops the drag on pointercancel', async () => {
    const { fixture, el, host } = mount();
    const track = el.querySelector<HTMLElement>('.mk-slider__track')!;
    mockRect(track);

    track.dispatchEvent(pev('pointerdown', 30));
    track.dispatchEvent(pev('pointercancel', 30));
    track.dispatchEvent(pev('pointermove', 90));
    await fixture.whenStable();
    expect(host.value()).toBe(30);
  });

  it('reads the track geometry once per drag', async () => {
    const { fixture, el } = mount();
    const track = el.querySelector<HTMLElement>('.mk-slider__track')!;
    const rectSpy = mockRect(track);

    track.dispatchEvent(pev('pointerdown', 30));
    track.dispatchEvent(pev('pointermove', 40));
    track.dispatchEvent(pev('pointermove', 60));
    track.dispatchEvent(pev('pointerup', 60));
    await fixture.whenStable();
    expect(rectSpy).toHaveBeenCalledTimes(1);
  });

  it('mirrors the drag geometry in RTL (cached at pointerdown)', async () => {
    const { fixture, el, host } = mount();
    const track = el.querySelector<HTMLElement>('.mk-slider__track')!;
    forceRtl(track);
    mockRect(track);

    // In RTL the value grows from the right edge: offset = right(100) - 30.
    track.dispatchEvent(pev('pointerdown', 30));
    await fixture.whenStable();
    expect(host.value()).toBe(70);
    track.dispatchEvent(pev('pointerup', 30));
    await fixture.whenStable();
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
