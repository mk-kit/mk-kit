import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkImageGallery, type MkGalleryItem } from './image-gallery';

const ITEMS: readonly MkGalleryItem[] = [
  { src: '/full/1.jpg', thumb: '/thumbs/1.jpg', alt: 'One' },
  { src: '/full/2.jpg', alt: 'Two' },
  { src: '/full/3.jpg', alt: 'Three' },
  { src: '/full/4.jpg' },
  { src: '/full/5.jpg', alt: 'Five' },
];

describe('MkImageGallery', () => {
  let fixture: ComponentFixture<MkImageGallery>;
  let cmp: MkImageGallery;

  const tiles = (): NodeListOf<HTMLButtonElement> =>
    (fixture.nativeElement as HTMLElement).querySelectorAll(
      'button.mk-gallery__tile',
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkImageGallery);
    cmp = fixture.componentInstance;
    fixture.componentRef.setInput('items', ITEMS);
    // Keep the shared lightbox out of these tests.
    fixture.componentRef.setInput('lightbox', false);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders one button tile per item', () => {
    const all = tiles();
    expect(all.length).toBe(5);
    all.forEach((tile) => expect(tile.type).toBe('button'));
    expect(fixture.nativeElement.querySelector('.mk-gallery__more')).toBeNull();
  });

  it('tiles show the thumb when present, else the full src', () => {
    const imgs = fixture.nativeElement.querySelectorAll('mk-image img');
    expect(imgs[0].getAttribute('src')).toBe('/thumbs/1.jpg');
    expect(imgs[1].getAttribute('src')).toBe('/full/2.jpg');
  });

  it('labels tiles from alt via viewImage, positionally when alt is missing', () => {
    const all = tiles();
    expect(all[0].getAttribute('aria-label')).toBe('View One');
    expect(all[3].getAttribute('aria-label')).toBe('Image 4 of 5');
  });

  it('max caps the tiles and adds a "+N" scrim to the last one', async () => {
    fixture.componentRef.setInput('max', 3);
    await fixture.whenStable();
    const all = tiles();
    expect(all.length).toBe(3);
    const more = fixture.nativeElement.querySelector('.mk-gallery__more');
    expect(more).not.toBeNull();
    expect(more.textContent.trim()).toBe('+2');
    expect(all[2].contains(more)).toBe(true);
    expect(all[2].getAttribute('aria-label')).toBe('View Three (+2)');
  });

  it('renders no overflow tile when max is not exceeded', async () => {
    fixture.componentRef.setInput('max', 5);
    await fixture.whenStable();
    expect(tiles().length).toBe(5);
    expect(fixture.nativeElement.querySelector('.mk-gallery__more')).toBeNull();
  });

  it('emits itemClick with the item and index on tile click', () => {
    const onItemClick = vi.fn();
    cmp.itemClick.subscribe(onItemClick);
    tiles()[1].click();
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith({ item: ITEMS[1], index: 1 });
  });

  it('clicking the overflow tile emits itemClick at its own index', async () => {
    fixture.componentRef.setInput('max', 3);
    await fixture.whenStable();
    const onItemClick = vi.fn();
    cmp.itemClick.subscribe(onItemClick);
    tiles()[2].click();
    expect(onItemClick).toHaveBeenCalledWith({ item: ITEMS[2], index: 2 });
  });

  it('reflects layout and rounded onto the host, columns as a CSS var', async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-layout')).toBe('grid');
    expect(host.getAttribute('data-rounded')).toBe('md');
    expect(host.style.getPropertyValue('--_cols')).toBe('3');
    fixture.componentRef.setInput('layout', 'strip');
    fixture.componentRef.setInput('rounded', 'lg');
    fixture.componentRef.setInput('columns', 4);
    await fixture.whenStable();
    expect(host.getAttribute('data-layout')).toBe('strip');
    expect(host.getAttribute('data-rounded')).toBe('lg');
    expect(host.style.getPropertyValue('--_cols')).toBe('4');
  });

  it('grid/strip tiles use aspectRatio; masonry keeps natural ratios', async () => {
    expect((cmp as any).tileAspectRatio()).toBe('1 / 1');
    fixture.componentRef.setInput('aspectRatio', '4 / 3');
    await fixture.whenStable();
    expect((cmp as any).tileAspectRatio()).toBe('4 / 3');
    fixture.componentRef.setInput('layout', 'masonry');
    await fixture.whenStable();
    expect((cmp as any).tileAspectRatio()).toBe('auto');
  });
});
