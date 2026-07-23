import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  MkImageCropper,
  mkClampPan,
  mkCoverScale,
  mkCropRect,
} from './image-cropper';

// jsdom has no canvas rasteriser and never loads images, so all crop geometry
// is exercised through the exported pure functions; the component specs below
// only cover state, inputs and aria wiring.

describe('mkCoverScale', () => {
  it('covers a landscape image in a square viewport by height', () => {
    // 2000×1000 into 400×400: width needs 0.2, height needs 0.4 → 0.4.
    expect(mkCoverScale(2000, 1000, 400, 400)).toBe(0.4);
  });

  it('covers a portrait image in a wide viewport by width', () => {
    // 1000×2000 into 800×400: width needs 0.8, height needs 0.2 → 0.8.
    expect(mkCoverScale(1000, 2000, 800, 400)).toBe(0.8);
  });

  it('is 1 when the image exactly matches the viewport', () => {
    expect(mkCoverScale(640, 480, 640, 480)).toBe(1);
  });

  it('falls back to 1 for degenerate dimensions', () => {
    expect(mkCoverScale(0, 0, 400, 300)).toBe(1);
    expect(mkCoverScale(400, 300, 0, 0)).toBe(1);
  });
});

describe('mkClampPan', () => {
  // 2000×1000 at scale 0.4 → 800×400 rendered in a 400×400 viewport:
  // 200px of slack on x, none on y.
  const clamp = (x: number, y: number) =>
    mkClampPan(x, y, 2000, 1000, 400, 400, 0.4);

  it('keeps an in-bounds offset unchanged', () => {
    expect(clamp(-150, 0)).toEqual({ x: -150, y: 0 });
  });

  it('clamps at the edges so the image still covers the viewport', () => {
    expect(clamp(500, 0)).toEqual({ x: 200, y: 0 });
    expect(clamp(-500, -50)).toEqual({ x: -200, y: 0 });
  });

  it('centres an axis with no slack', () => {
    expect(clamp(0, 300)).toEqual({ x: 0, y: 0 });
    // Exactly covering image cannot pan at all.
    expect(mkClampPan(40, -40, 400, 400, 400, 400, 1)).toEqual({ x: 0, y: 0 });
  });
});

describe('mkCropRect', () => {
  it('round-trips the centred cover crop at zoom 1', () => {
    // 2000×1000 in 400×400, cover scale 0.4, no pan → the middle 1000×1000.
    const scale = mkCoverScale(2000, 1000, 400, 400);
    expect(mkCropRect(2000, 1000, 400, 400, scale, 0, 0)).toEqual({
      sx: 500,
      sy: 0,
      sw: 1000,
      sh: 1000,
    });
  });

  it('round-trips at zoom 2 with a clamped pan', () => {
    // 1000×1000 in 500×500: cover 0.5, zoom 2 → scale 1; max pan 250px.
    const scale = mkCoverScale(1000, 1000, 500, 500) * 2;
    expect(scale).toBe(1);
    // Centred: middle 500×500.
    expect(mkCropRect(1000, 1000, 500, 500, scale, 0, 0)).toEqual({
      sx: 250,
      sy: 250,
      sw: 500,
      sh: 500,
    });
    // Panned to the clamp limit: crop rect lands on the image edge.
    const pan = mkClampPan(9999, -9999, 1000, 1000, 500, 500, scale);
    expect(pan).toEqual({ x: 250, y: -250 });
    expect(mkCropRect(1000, 1000, 500, 500, scale, pan.x, pan.y)).toEqual({
      sx: 0,
      sy: 500,
      sw: 500,
      sh: 500,
    });
  });

  it('never exceeds the image bounds', () => {
    const rect = mkCropRect(300, 200, 800, 600, 0.5, 0, 0);
    expect(rect.sw).toBeLessThanOrEqual(300);
    expect(rect.sh).toBeLessThanOrEqual(200);
    expect(rect.sx).toBeGreaterThanOrEqual(0);
    expect(rect.sy).toBeGreaterThanOrEqual(0);
  });
});

describe('MkImageCropper', () => {
  let fixture: ComponentFixture<MkImageCropper>;
  let cmp: MkImageCropper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkImageCropper);
    fixture.componentRef.setInput('src', 'photo.png');
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function fakePointer(x: number, y: number): PointerEvent {
    return {
      clientX: x,
      clientY: y,
      pointerId: 1,
      preventDefault: () => {},
    } as unknown as PointerEvent;
  }

  /** Simulate a measured viewport + loaded image without a real load. */
  function sizeTo(natW: number, natH: number, vpW: number, vpH: number): void {
    (cmp as any).natW.set(natW);
    (cmp as any).natH.set(natH);
    (cmp as any).vpW.set(vpW);
    (cmp as any).vpH.set(vpH);
  }

  it('starts at zoom 1, centred', () => {
    expect(cmp.zoom()).toBe(1);
    expect((cmp as any).panX()).toBe(0);
    expect((cmp as any).panY()).toBe(0);
  });

  it('clamps zoomTo() into [minZoom, maxZoom]', () => {
    const changes: number[] = [];
    cmp.changed.subscribe(() => changes.push(cmp.zoom()));
    (cmp as any).zoomTo(99);
    expect(cmp.zoom()).toBe(4);
    (cmp as any).zoomTo(0);
    expect(cmp.zoom()).toBe(1);
    expect(changes).toEqual([4, 1]);
  });

  it('clamps an externally written zoom model', () => {
    cmp.zoom.set(99);
    fixture.detectChanges();
    expect(cmp.zoom()).toBe(4);
  });

  it('respects custom minZoom/maxZoom (numberAttribute)', () => {
    fixture.componentRef.setInput('minZoom', '2');
    fixture.componentRef.setInput('maxZoom', '3');
    fixture.detectChanges();
    expect(cmp.zoom()).toBe(2);
    (cmp as any).zoomTo(10);
    expect(cmp.zoom()).toBe(3);
  });

  it('pans with pointer drag, clamped to keep cover', () => {
    sizeTo(2000, 1000, 400, 400); // cover 0.4 → 200px x-slack, 0 y-slack
    (cmp as any).onPointerDown(fakePointer(0, 0));
    (cmp as any).onPointerMove(fakePointer(-50, -30));
    expect((cmp as any).panX()).toBe(-50);
    expect((cmp as any).panY()).toBe(0);
    (cmp as any).onPointerMove(fakePointer(-500, 0));
    expect((cmp as any).panX()).toBe(-200);
    (cmp as any).onPointerUp();
    expect((cmp as any).dragging()).toBe(false);
  });

  it('ignores pointer input while disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    sizeTo(2000, 1000, 400, 400);
    (cmp as any).onPointerDown(fakePointer(0, 0));
    expect((cmp as any).dragging()).toBe(false);
    (cmp as any).onPointerMove(fakePointer(-50, 0));
    expect((cmp as any).panX()).toBe(0);
  });

  it('zooms via keyboard and pans via arrows', () => {
    sizeTo(2000, 1000, 400, 400);
    const keydown = (key: string, shiftKey = false) =>
      (cmp as any).onKeydown(new KeyboardEvent('keydown', { key, shiftKey }));
    keydown('+');
    expect(cmp.zoom()).toBeCloseTo(1.1);
    keydown('-');
    expect(cmp.zoom()).toBe(1);
    keydown('ArrowLeft');
    expect((cmp as any).panX()).toBe(-10);
    keydown('ArrowRight', true);
    expect((cmp as any).panX()).toBe(-9);
  });

  it('resets pan and zoom when src changes', () => {
    sizeTo(2000, 1000, 400, 400);
    (cmp as any).zoomTo(3);
    (cmp as any).panTo(-100, 0);
    expect(cmp.zoom()).toBe(3);
    fixture.componentRef.setInput('src', 'other.png');
    fixture.detectChanges();
    expect(cmp.zoom()).toBe(1);
    expect((cmp as any).panX()).toBe(0);
    expect((cmp as any).panY()).toBe(0);
  });

  it('reset() recentres and emits changed only when dirty', () => {
    const changes: void[] = [];
    cmp.changed.subscribe(() => changes.push(undefined));
    cmp.reset();
    expect(changes.length).toBe(0);
    (cmp as any).zoomTo(2);
    cmp.reset();
    expect(cmp.zoom()).toBe(1);
    expect(changes.length).toBe(2); // zoomTo + reset
  });

  it('cropRect() is null until loaded, then exposes the natural-px region', () => {
    expect(cmp.cropRect()).toBeNull();
    sizeTo(2000, 1000, 400, 400);
    (cmp as any).status.set('loaded');
    // cover scale = 0.4; centred viewport shows a 1000×1000 region at (500,0)
    expect(cmp.cropRect()).toEqual({ sx: 500, sy: 0, sw: 1000, sh: 1000 });
    (cmp as any).zoomTo(2);
    const r = cmp.cropRect()!;
    expect(r.sw).toBe(500);
    expect(r.sh).toBe(500);
  });

  it('crop() returns null when the image is not loaded (jsdom)', () => {
    expect(cmp.crop()).toBeNull();
  });

  it('emits imageError and shows the fallback on load failure', () => {
    let errored = false;
    cmp.imageError.subscribe(() => (errored = true));
    (cmp as any).onImageError();
    fixture.detectChanges();
    expect(errored).toBe(true);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.mk-image-cropper__error')?.textContent).toContain(
      'Image failed to load',
    );
    expect(el.querySelector('img')).toBeNull();
  });

  it('wires aria on the viewport and zoom controls', () => {
    const el: HTMLElement = fixture.nativeElement;
    const viewport = el.querySelector('.mk-image-cropper__viewport')!;
    expect(viewport.getAttribute('role')).toBe('application');
    expect(viewport.getAttribute('tabindex')).toBe('0');
    expect(viewport.getAttribute('aria-label')).toBe('Zoom');
    const range = el.querySelector<HTMLInputElement>('input[type="range"]')!;
    expect(range.getAttribute('aria-label')).toBe('Zoom');
    expect(range.min).toBe('1');
    expect(range.max).toBe('4');
    const [minus, plus] = Array.from(el.querySelectorAll('button'));
    expect(minus.getAttribute('aria-label')).toBe('Zoom out');
    expect(plus.getAttribute('aria-label')).toBe('Zoom in');
  });

  it('honours a custom ariaLabel and disabled tabindex', () => {
    fixture.componentRef.setInput('ariaLabel', 'Crop area');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const viewport = fixture.nativeElement.querySelector(
      '.mk-image-cropper__viewport',
    )!;
    expect(viewport.getAttribute('aria-label')).toBe('Crop area');
    expect(viewport.getAttribute('tabindex')).toBe('-1');
    expect(viewport.getAttribute('aria-disabled')).toBe('true');
  });

  it('renders the circular mask only when round', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.mk-image-cropper__mask')).toBeNull();
    fixture.componentRef.setInput('round', true);
    fixture.detectChanges();
    expect(el.querySelector('.mk-image-cropper__mask')).not.toBeNull();
    expect(el.classList.contains('mk-image-cropper--round')).toBe(true);
  });
});
