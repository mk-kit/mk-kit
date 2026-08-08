import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkRangeSlider } from './range-slider';

describe('MkRangeSlider', () => {
  let fixture: ComponentFixture<MkRangeSlider>;
  let rs: MkRangeSlider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkRangeSlider);
    rs = fixture.componentInstance;
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.componentRef.setInput('step', 10);
    rs.value.set([20, 80]);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture.destroy();
  });

  const key = (thumb: 0 | 1, k: string) =>
    (rs as any).onKeydown(
      thumb,
      new KeyboardEvent('keydown', { key: k, cancelable: true }),
    );

  /**
   * Renders the track right-to-left. jsdom's UA stylesheet resolves
   * `[dir=rtl]` set on the element itself via getComputedStyle; if that ever
   * stops holding, fall back to mocking the resolution for this element.
   */
  function forceRtl() {
    const track = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.mk-range-slider__track',
    )!;
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

  it('moves the low thumb with the keyboard and notifies the form', () => {
    const onChange = vi.fn();
    rs.registerOnChange(onChange);
    key(0, 'ArrowRight');
    expect(rs.value()).toEqual([30, 80]);
    expect(onChange).toHaveBeenCalledWith([30, 80]);
  });

  it('prevents the thumbs from crossing', () => {
    rs.value.set([40, 50]);
    key(0, 'PageUp'); // big step would push low past high
    expect(rs.value()[0]).toBeLessThanOrEqual(rs.value()[1]);
    rs.value.set([40, 50]);
    key(1, 'PageDown'); // push high below low
    expect(rs.value()[1]).toBeGreaterThanOrEqual(rs.value()[0]);
  });

  it('Home/End respect the neighbouring thumb', () => {
    rs.value.set([30, 70]);
    key(0, 'Home');
    expect(rs.value()[0]).toBe(0);
    key(1, 'End');
    expect(rs.value()[1]).toBe(100);
  });

  it('flips ArrowLeft/ArrowRight in RTL, keeping Up/Down as-is', () => {
    forceRtl();

    key(0, 'ArrowRight'); // visually right = towards min
    expect(rs.value()).toEqual([10, 80]);
    key(0, 'ArrowLeft'); // visually left = towards max
    expect(rs.value()).toEqual([20, 80]);

    key(1, 'ArrowLeft');
    expect(rs.value()).toEqual([20, 90]);
    key(1, 'ArrowUp'); // direction-agnostic
    expect(rs.value()).toEqual([20, 100]);
  });

  it('writeValue normalises a reversed pair', () => {
    rs.writeValue([80, 20]);
    expect(rs.value()).toEqual([20, 80]);
  });

  /** Gives the zero-sized jsdom track a usable 0–100px geometry. */
  function mockTrackRect(width = 100) {
    const el = fixture.nativeElement as HTMLElement;
    const wrap = el.querySelector<HTMLElement>('.mk-range-slider__track-wrap')!;
    const track = el.querySelector<HTMLElement>('.mk-range-slider__track')!;
    const rectSpy = vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
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
    return { wrap, rectSpy };
  }

  const pev = (type: string, clientX: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      clientX,
    });

  it('drags the nearest thumb via pointer capture, one geometry read per drag', async () => {
    const { wrap, rectSpy } = mockTrackRect();

    // 30 is closer to low (20) than high (80) — the low thumb is grabbed.
    wrap.dispatchEvent(pev('pointerdown', 30));
    await fixture.whenStable();
    expect(rs.value()).toEqual([30, 80]);

    // Moves are handled by listeners on the capturing element, drag-only.
    wrap.dispatchEvent(pev('pointermove', 52));
    await fixture.whenStable();
    expect(rs.value()).toEqual([50, 80]);

    wrap.dispatchEvent(pev('pointerup', 52));
    await fixture.whenStable();

    // Listeners are gone: a move after release must not change the value.
    wrap.dispatchEvent(pev('pointermove', 70));
    await fixture.whenStable();
    expect(rs.value()).toEqual([50, 80]);

    expect(rectSpy).toHaveBeenCalledTimes(1);
  });

  it('grabs the high thumb when the pointer lands closer to it', async () => {
    const { wrap } = mockTrackRect();

    wrap.dispatchEvent(pev('pointerdown', 90));
    await fixture.whenStable();
    expect(rs.value()).toEqual([20, 90]);
    wrap.dispatchEvent(pev('pointerup', 90));
  });

  it('keeps the thumbs from crossing during a pointer drag', async () => {
    const { wrap } = mockTrackRect();

    wrap.dispatchEvent(pev('pointerdown', 30)); // low thumb
    wrap.dispatchEvent(pev('pointermove', 95)); // past the high thumb
    await fixture.whenStable();
    expect(rs.value()).toEqual([80, 80]);
    wrap.dispatchEvent(pev('pointerup', 95));
  });

  it('stops the drag on pointercancel', async () => {
    const { wrap } = mockTrackRect();

    wrap.dispatchEvent(pev('pointerdown', 30));
    wrap.dispatchEvent(pev('pointercancel', 30));
    wrap.dispatchEvent(pev('pointermove', 70));
    await fixture.whenStable();
    expect(rs.value()).toEqual([30, 80]);
  });
});
