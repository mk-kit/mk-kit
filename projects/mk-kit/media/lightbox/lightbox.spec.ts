import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkLightboxService, type MkLightboxItem } from './lightbox.service';

describe('MkLightboxService / MkLightbox', () => {
  let service: MkLightboxService;
  let appRef: ApplicationRef;

  const items: MkLightboxItem[] = [
    { src: '/img/a.jpg', alt: 'Alpha', caption: 'First image' },
    { src: '/img/b.jpg', alt: 'Beta' },
    { src: '/img/c.jpg', alt: 'Gamma', caption: 'Third image' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(MkLightboxService);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => {
    // Tear down any overlay left open by a test.
    document
      .querySelectorAll('.mk-overlay-container')
      .forEach((n) => n.remove());
    document.body.style.removeProperty('overflow');
  });

  function open(list: readonly MkLightboxItem[] = items, start = 0): void {
    service.open(list, start);
    appRef.tick();
  }
  function container(): HTMLElement | null {
    return document.querySelector('.mk-overlay-container');
  }
  function panel(): HTMLElement | null {
    return document.querySelector('.mk-overlay-panel');
  }
  function counterText(): string | undefined {
    return document
      .querySelector('.mk-lightbox__counter')
      ?.textContent?.trim();
  }
  function buttonByLabel(label: string): HTMLButtonElement | undefined {
    return Array.from(
      document.querySelectorAll<HTMLButtonElement>('.mk-overlay-panel button'),
    ).find((b) => b.getAttribute('aria-label') === label);
  }
  function pressKey(key: string): void {
    panel()!.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true }),
    );
    appRef.tick();
  }

  it('open() renders the lightbox into the body', () => {
    open();
    const p = panel();
    expect(p).not.toBeNull();
    expect(p!.classList.contains('mk-lightbox-panel')).toBe(true);
    expect(p!.getAttribute('role')).toBe('dialog');
    expect(p!.getAttribute('aria-modal')).toBe('true');
    expect(p!.getAttribute('aria-label')).toBe('Image 1 of 3');

    const img = document.querySelector<HTMLImageElement>(
      '.mk-lightbox__image',
    );
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('/img/a.jpg');
    expect(img!.getAttribute('alt')).toBe('Alpha');
  });

  it('ignores open() with an empty items array', () => {
    service.open([]);
    appRef.tick();
    expect(container()).toBeNull();
  });

  it('shows the localised counter and clamps startIndex into range', () => {
    open(items, 1);
    expect(counterText()).toBe('Image 2 of 3');
    buttonByLabel('Close')!.click();

    open(items, 99);
    expect(counterText()).toBe('Image 3 of 3');
    buttonByLabel('Close')!.click();

    open(items, -5);
    expect(counterText()).toBe('Image 1 of 3');
  });

  it('next/previous navigate and wrap around', () => {
    open();
    const next = buttonByLabel('Next image')!;
    const prev = buttonByLabel('Previous image')!;

    next.click();
    appRef.tick();
    expect(counterText()).toBe('Image 2 of 3');

    next.click();
    appRef.tick();
    expect(counterText()).toBe('Image 3 of 3');

    next.click();
    appRef.tick();
    expect(counterText()).toBe('Image 1 of 3'); // wrapped forward

    prev.click();
    appRef.tick();
    expect(counterText()).toBe('Image 3 of 3'); // wrapped backward
  });

  it('navigates with ArrowLeft/ArrowRight and jumps with Home/End', () => {
    open();
    pressKey('ArrowRight');
    expect(counterText()).toBe('Image 2 of 3');

    pressKey('ArrowLeft');
    expect(counterText()).toBe('Image 1 of 3');

    pressKey('ArrowLeft');
    expect(counterText()).toBe('Image 3 of 3'); // wraps

    pressKey('Home');
    expect(counterText()).toBe('Image 1 of 3');

    pressKey('End');
    expect(counterText()).toBe('Image 3 of 3');
  });

  it('shows the caption only when the current item has one', () => {
    open();
    expect(
      document.querySelector('.mk-lightbox__caption')?.textContent?.trim(),
    ).toBe('First image');

    buttonByLabel('Next image')!.click();
    appRef.tick();
    expect(document.querySelector('.mk-lightbox__caption')).toBeNull();
  });

  it('hides prev/next when there is only one item', () => {
    open([items[0]]);
    expect(buttonByLabel('Previous image')).toBeUndefined();
    expect(buttonByLabel('Next image')).toBeUndefined();
    expect(counterText()).toBe('Image 1 of 1');
  });

  it('closes on Escape', () => {
    open();
    expect(container()).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(container()).toBeNull();
  });

  it('closes on backdrop click', () => {
    open();
    const backdrop = document.querySelector<HTMLElement>(
      '.mk-overlay-backdrop',
    );
    expect(backdrop).not.toBeNull();
    backdrop!.click();
    expect(container()).toBeNull();
  });

  it('closes via the close button', () => {
    open();
    buttonByLabel('Close')!.click();
    expect(container()).toBeNull();
  });

  it('shows the failure message instead of the image on error', () => {
    open();
    const img = document.querySelector<HTMLImageElement>(
      '.mk-lightbox__image',
    )!;
    img.dispatchEvent(new Event('error'));
    appRef.tick();

    expect(document.querySelector('.mk-lightbox__image')).toBeNull();
    expect(
      document.querySelector('.mk-lightbox__error')?.textContent?.trim(),
    ).toBe('Image failed to load');

    // Navigating away resets the error state and renders an <img> again.
    buttonByLabel('Next image')!.click();
    appRef.tick();
    expect(document.querySelector('.mk-lightbox__error')).toBeNull();
    expect(
      document
        .querySelector<HTMLImageElement>('.mk-lightbox__image')!
        .getAttribute('src'),
    ).toBe('/img/b.jpg');
  });
});
