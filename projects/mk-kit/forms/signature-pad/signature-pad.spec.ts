import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MkSignaturePad } from './signature-pad';

// jsdom has no canvas rasteriser: getContext() returns null and toDataURL is
// unavailable, so these specs cover state/CVA plumbing; the drawing itself is
// exercised in the browser.
describe('MkSignaturePad', () => {
  let fixture: ComponentFixture<MkSignaturePad>;
  let cmp: MkSignaturePad;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkSignaturePad);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture.destroy();
  });

  it('starts empty with a null value', () => {
    expect(cmp.isEmpty()).toBe(true);
    expect(cmp.value()).toBeNull();
  });

  function fakePointer(x: number, y: number): PointerEvent {
    return {
      clientX: x,
      clientY: y,
      pointerId: 1,
      preventDefault: () => {},
    } as unknown as PointerEvent;
  }

  it('tracks strokes through the pointer flow', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    canvas.setPointerCapture ??= () => {};
    (cmp as any).onPointerDown(fakePointer(10, 10));
    (cmp as any).onPointerMove(fakePointer(20, 22));
    (cmp as any).onPointerUp();
    expect(cmp.isEmpty()).toBe(false);
  });

  it('clear() resets the pad and notifies the form', () => {
    const changes: unknown[] = [];
    cmp.registerOnChange((v) => changes.push(v));
    (cmp as any).current = [{ x: 1, y: 1 }];
    (cmp as any).onPointerUp();
    cmp.clear();
    expect(cmp.isEmpty()).toBe(true);
    expect(cmp.value()).toBeNull();
    expect(changes[changes.length - 1]).toBeNull();
  });

  it('writeValue(null) clears without notifying', () => {
    const changes: unknown[] = [];
    cmp.registerOnChange((v) => changes.push(v));
    cmp.writeValue(null);
    expect(cmp.isEmpty()).toBe(true);
    expect(changes).toEqual([]);
  });

  it('does not run the full redraw or re-read styles/layout per pointermove', async () => {
    await fixture.whenStable();
    const canvas = fixture.nativeElement.querySelector('canvas');
    canvas.setPointerCapture ??= () => {};
    const redraw = vi.spyOn(cmp as any, 'redraw');
    const styleReads = vi.spyOn(window, 'getComputedStyle');
    const rectReads = vi.spyOn(canvas, 'getBoundingClientRect');

    (cmp as any).onPointerDown(fakePointer(10, 10));
    (cmp as any).onPointerMove(fakePointer(20, 20));
    (cmp as any).onPointerMove(fakePointer(30, 26));
    (cmp as any).onPointerMove(fakePointer(40, 30));

    // The per-gesture cache is filled once at pointerdown; moves draw
    // incrementally without the full redraw or any layout/style reads.
    expect(redraw).not.toHaveBeenCalled();
    expect(styleReads).toHaveBeenCalledTimes(1);
    expect(rectReads).toHaveBeenCalledTimes(1);

    (cmp as any).onPointerUp();
    expect(redraw).toHaveBeenCalledTimes(1); // final full redraw
    expect((cmp as any).strokes.length).toBe(1);
    expect((cmp as any).strokes[0].length).toBe(4);
    expect(cmp.isEmpty()).toBe(false);

    // The gesture is over — a stray move must not extend the stroke.
    (cmp as any).onPointerMove(fakePointer(50, 50));
    expect((cmp as any).strokes[0].length).toBe(4);
    expect((cmp as any).strokes.length).toBe(1);
  });

  it('keeps full input fidelity via coalesced events', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    canvas.setPointerCapture ??= () => {};
    (cmp as any).onPointerDown(fakePointer(0, 0));
    const move = {
      clientX: 20,
      clientY: 20,
      getCoalescedEvents: () => [
        { clientX: 10, clientY: 10 },
        { clientX: 20, clientY: 20 },
      ],
    } as unknown as PointerEvent;
    (cmp as any).onPointerMove(move);
    expect((cmp as any).current.length).toBe(3);
    (cmp as any).onPointerUp();
    expect((cmp as any).strokes[0].length).toBe(3);
  });

  it('ignores drawing while disabled', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    canvas.setPointerCapture ??= () => {};
    cmp.setDisabledState(true);
    (cmp as any).onPointerDown(fakePointer(5, 5));
    expect((cmp as any).current).toBeNull();
    expect(cmp.isEmpty()).toBe(true);
  });
});
