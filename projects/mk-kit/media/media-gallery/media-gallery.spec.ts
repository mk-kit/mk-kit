import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MkMediaActions,
  MkMediaGallery,
  type MkMediaItem,
  type MkMediaReorderEvent,
} from './media-gallery';

const assets = (): MkMediaItem[] => [
  { id: '1', src: '/a.jpg', thumb: '/a-thumb.jpg', name: 'Alpha.jpg', meta: '1.2 MB · JPG' },
  { id: '2', src: '/b.jpg', name: 'Beta.png', alt: 'Beta hero shot' },
  { id: '3', src: '/c.jpg', name: 'Gamma.webp' },
];

describe('MkMediaGallery', () => {
  let fixture: ComponentFixture<MkMediaGallery>;
  let gallery: MkMediaGallery;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkMediaGallery);
    gallery = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders a labelled group with one tile per item', () => {
    gallery.items.set(assets());
    fixture.detectChanges();

    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-label')).toBe('Media library');

    const tiles = host.querySelectorAll('.mk-media-gallery__tile');
    expect(tiles).toHaveLength(3);

    const names = Array.from(host.querySelectorAll('.mk-media-gallery__name')).map(
      (n) => n.textContent?.trim(),
    );
    expect(names).toEqual(['Alpha.jpg', 'Beta.png', 'Gamma.webp']);

    // Thumb wins over src when present; meta renders only when provided.
    const imgs = host.querySelectorAll<HTMLImageElement>('.mk-media-gallery__img');
    expect(imgs[0].getAttribute('src')).toBe('/a-thumb.jpg');
    expect(imgs[1].getAttribute('src')).toBe('/b.jpg');
    expect(host.querySelectorAll('.mk-media-gallery__meta')).toHaveLength(1);

    // Preview buttons are named from alt ?? name.
    const buttons = host.querySelectorAll('.mk-media-gallery__preview');
    expect(buttons[0].getAttribute('aria-label')).toBe('View Alpha.jpg');
    expect(buttons[1].getAttribute('aria-label')).toBe('View Beta hero shot');
  });

  it('renders the empty state when there are no items', () => {
    const empty = host.querySelector('.mk-media-gallery__empty');
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toContain('No data to display');
    expect(host.querySelectorAll('.mk-media-gallery__tile')).toHaveLength(0);
  });

  it('hides checkboxes unless selectable', () => {
    gallery.items.set(assets());
    fixture.detectChanges();
    expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
  });

  it('checking a checkbox updates the selection model (and unchecking removes it)', () => {
    fixture.componentRef.setInput('selectable', true);
    gallery.items.set(assets());
    fixture.detectChanges();

    const boxes = host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(boxes).toHaveLength(3);
    expect(boxes[0].getAttribute('aria-label')).toBe('Select row Alpha.jpg');

    boxes[1].checked = true;
    boxes[1].dispatchEvent(new Event('change'));
    expect(gallery.selection()).toEqual(['2']);

    boxes[0].checked = true;
    boxes[0].dispatchEvent(new Event('change'));
    expect(gallery.selection()).toEqual(['2', '1']);

    boxes[1].checked = false;
    boxes[1].dispatchEvent(new Event('change'));
    expect(gallery.selection()).toEqual(['1']);
  });

  it('setting the selection model checks the matching checkboxes and marks the tiles', () => {
    fixture.componentRef.setInput('selectable', true);
    gallery.items.set(assets());
    gallery.selection.set(['1', '3']);
    fixture.detectChanges();

    const boxes = host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(boxes[0].checked).toBe(true);
    expect(boxes[1].checked).toBe(false);
    expect(boxes[2].checked).toBe(true);

    const tiles = host.querySelectorAll('.mk-media-gallery__tile');
    expect(tiles[0].classList.contains('mk-media-gallery__tile--selected')).toBe(true);
    expect(tiles[1].classList.contains('mk-media-gallery__tile--selected')).toBe(false);
  });

  it('emits itemClick when a preview button is activated', () => {
    gallery.items.set(assets());
    fixture.detectChanges();

    const clicked: MkMediaItem[] = [];
    gallery.itemClick.subscribe((item) => clicked.push(item));

    const buttons = host.querySelectorAll<HTMLButtonElement>('.mk-media-gallery__preview');
    buttons[1].click();

    expect(clicked).toHaveLength(1);
    expect(clicked[0].id).toBe('2');
  });

  it('hosts the drag directives on tiles when reorderable', () => {
    fixture.componentRef.setInput('reorderable', true);
    gallery.items.set(assets());
    fixture.detectChanges();

    const grid = host.querySelector('.mk-media-gallery__grid');
    expect(grid?.classList.contains('mk-drop-list')).toBe(true);

    const tile = host.querySelector('.mk-media-gallery__tile');
    expect(tile?.classList.contains('mk-drag')).toBe(true);
    expect(tile?.getAttribute('role')).toBe('button');
    expect(tile?.getAttribute('tabindex')).toBe('0');
  });

  it('applies a drop immutably to the items model and emits reordered', () => {
    fixture.componentRef.setInput('reorderable', true);
    const original = assets();
    gallery.items.set(original);
    fixture.detectChanges();

    const events: MkMediaReorderEvent[] = [];
    gallery.reordered.subscribe((e) => events.push(e));

    // dnd interactions are not unit-testable in jsdom — invoke the handler
    // directly with the only fields it consumes.
    (gallery as any).onDrop({ previousIndex: 0, currentIndex: 2 });

    const next = gallery.items();
    expect(next.map((i) => i.id)).toEqual(['2', '3', '1']);
    // Model was replaced, not mutated in place.
    expect(next).not.toBe(original);
    expect(original.map((i) => i.id)).toEqual(['1', '2', '3']);

    expect(events).toHaveLength(1);
    expect(events[0].from).toBe(0);
    expect(events[0].to).toBe(2);
    expect(events[0].items).toBe(next);
  });

  it('ignores no-op drops (same index)', () => {
    const original = assets();
    gallery.items.set(original);
    const emitted = vi.fn();
    gallery.reordered.subscribe(emitted);

    (gallery as any).onDrop({ previousIndex: 1, currentIndex: 1 });

    expect(gallery.items()).toBe(original);
    expect(emitted).not.toHaveBeenCalled();
  });
});

describe('MkMediaGallery with a projected mkMediaActions template', () => {
  @Component({
    imports: [MkMediaGallery, MkMediaActions],
    template: `
      <mk-media-gallery [(items)]="items">
        <ng-template mkMediaActions let-item>
          <button type="button" class="test-delete" (click)="deleted.push(item.id)">
            Delete {{ item.name }}
          </button>
        </ng-template>
      </mk-media-gallery>
    `,
  })
  class Host {
    readonly items = signal<MkMediaItem[]>(assets());
    readonly deleted: string[] = [];
  }

  it('renders the consumer template into every tile action bar with the item as context', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const bars = host.querySelectorAll('.mk-media-gallery__actions');
    expect(bars).toHaveLength(3);

    const buttons = host.querySelectorAll<HTMLButtonElement>('.test-delete');
    expect(buttons[2].textContent).toContain('Delete Gamma.webp');

    buttons[0].click();
    expect(fixture.componentInstance.deleted).toEqual(['1']);
    fixture.destroy();
  });
});
