import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkImage } from './image';

describe('MkImage', () => {
  let fixture: ComponentFixture<MkImage>;
  let cmp: MkImage;

  const query = (sel: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(sel);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkImage);
    cmp = fixture.componentInstance;
    fixture.componentRef.setInput('src', '/photos/a.jpg');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('starts in the loading state with a skeleton overlay', () => {
    expect((cmp as any).state()).toBe('loading');
    expect(query('.mk-image__skeleton')).not.toBeNull();
    expect(query('img')).not.toBeNull();
    expect(fixture.nativeElement.getAttribute('data-state')).toBe('loading');
  });

  it('moves to loaded on img load: skeleton removed, `loaded` emitted', () => {
    const onLoaded = vi.fn();
    cmp.loaded.subscribe(onLoaded);
    (cmp as any).onLoad();
    fixture.detectChanges();
    expect((cmp as any).state()).toBe('loaded');
    expect(query('.mk-image__skeleton')).toBeNull();
    expect(query('img')).not.toBeNull();
    expect(fixture.nativeElement.getAttribute('data-state')).toBe('loaded');
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('moves to error on img error: img removed, fallback shown, `errored` emitted', () => {
    const onErrored = vi.fn();
    cmp.errored.subscribe(onErrored);
    (cmp as any).onError();
    fixture.detectChanges();
    expect((cmp as any).state()).toBe('error');
    expect(query('img')).toBeNull();
    expect(query('.mk-image__skeleton')).toBeNull();
    const fallback = query('.mk-image__fallback');
    expect(fallback).not.toBeNull();
    expect(fallback!.textContent).toContain('Image failed to load');
    expect(onErrored).toHaveBeenCalledTimes(1);
  });

  it('resets to loading when src changes after an error', async () => {
    (cmp as any).onError();
    fixture.detectChanges();
    fixture.componentRef.setInput('src', '/photos/b.jpg');
    await fixture.whenStable();
    expect((cmp as any).state()).toBe('loading');
    const img = query('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('/photos/b.jpg');
    expect(query('.mk-image__fallback')).toBeNull();
  });

  it('resets to loading when src changes after a successful load', async () => {
    (cmp as any).onLoad();
    fixture.detectChanges();
    fixture.componentRef.setInput('src', '/photos/c.jpg');
    await fixture.whenStable();
    expect((cmp as any).state()).toBe('loading');
    expect(query('.mk-image__skeleton')).not.toBeNull();
  });

  it('always reflects alt onto the img (empty string by default)', async () => {
    expect(query('img')!.getAttribute('alt')).toBe('');
    fixture.componentRef.setInput('alt', 'Harbour at dawn');
    await fixture.whenStable();
    expect(query('img')!.getAttribute('alt')).toBe('Harbour at dawn');
  });

  it('toggles loading="lazy" / "eager" via the lazy input', async () => {
    expect(query('img')!.getAttribute('loading')).toBe('lazy');
    fixture.componentRef.setInput('lazy', false);
    await fixture.whenStable();
    expect(query('img')!.getAttribute('loading')).toBe('eager');
  });

  it('binds aspectRatio onto the frame', async () => {
    fixture.componentRef.setInput('aspectRatio', '16 / 9');
    await fixture.whenStable();
    const frame = query('.mk-image__frame')!;
    expect(frame.style.getPropertyValue('aspect-ratio')).toBe('16 / 9');
  });

  it('reflects fit and rounded as host data attributes', async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-fit')).toBe('cover');
    expect(host.getAttribute('data-rounded')).toBe('md');
    fixture.componentRef.setInput('fit', 'contain');
    fixture.componentRef.setInput('rounded', 'circle');
    await fixture.whenStable();
    expect(host.getAttribute('data-fit')).toBe('contain');
    expect(host.getAttribute('data-rounded')).toBe('circle');
  });

  it('renders a figcaption only when caption is set', async () => {
    expect(query('figcaption')).toBeNull();
    fixture.componentRef.setInput('caption', 'The old harbour');
    await fixture.whenStable();
    expect(query('figcaption')!.textContent!.trim()).toBe('The old harbour');
  });
});
