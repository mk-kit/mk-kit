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

  afterEach(() => fixture.destroy());

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

  it('ignores drawing while disabled', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    canvas.setPointerCapture ??= () => {};
    cmp.setDisabledState(true);
    (cmp as any).onPointerDown(fakePointer(5, 5));
    expect((cmp as any).current).toBeNull();
    expect(cmp.isEmpty()).toBe(true);
  });
});
