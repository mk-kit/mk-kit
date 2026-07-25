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

/**
 * The LCP path. `priority` exists because the default (lazy) is exactly wrong
 * for a hero: deferring the largest above-the-fold image is what pushes LCP
 * past 2.5s. It has to beat `lazy` when both are set, or a component that
 * defaults `lazy` on would silently defeat it.
 */
describe('MkImage priority', () => {
  function mount(inputs: Record<string, unknown> = {}) {
    // Each mount is its own module: the suite calls this more than once per
    // test, and reconfiguring a live TestBed throws.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const f = TestBed.createComponent(MkImage);
    f.componentRef.setInput('src', '/a.jpg');
    for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
    f.detectChanges();
    return (f.nativeElement as HTMLElement).querySelector('img')!;
  }

  it('defaults to lazy with no priority hints', () => {
    const img = mount();
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('fetchpriority')).toBeNull();
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('fetches eagerly at high priority when marked', () => {
    const img = mount({ priority: true });
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect(img.getAttribute('decoding')).toBe('sync');
  });

  it('wins over lazy, so a lazy default cannot defeat the hero', () => {
    const img = mount({ priority: true, lazy: true });
    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('passes srcset/sizes through, and omits them when unset', () => {
    expect(mount().getAttribute('srcset')).toBeNull();
    expect(mount().getAttribute('sizes')).toBeNull();

    const responsive = mount({
      srcset: '/a-800.jpg 800w, /a-1600.jpg 1600w',
      sizes: '100vw',
    });
    expect(responsive.getAttribute('srcset')).toContain('800w');
    expect(responsive.getAttribute('sizes')).toBe('100vw');
  });
});
