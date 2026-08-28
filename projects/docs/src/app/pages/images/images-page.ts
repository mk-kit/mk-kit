import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MkButton,
  MkCarousel,
  MkCarouselSlide,
  MkImage,
  MkImageGallery,
  type MkGalleryItem,
  MkLightboxService,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the media display components of
 * `@mk-kit/ui`: Image block, Image gallery (grid/masonry/strip), the Lightbox
 * service and the Carousel.
 */
@Component({
  selector: 'docs-images-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton, MkCarousel, MkCarouselSlide, MkImage, MkImageGallery],
  template: `
    <div class="docs-page docs-container">
      <h1>Images &amp; lightbox</h1>
      <p class="docs-lead">
        The media group's display components.
        <code class="docs-inline">&lt;mk-image&gt;</code> is an image block with
        aspect-ratio, skeleton loading and an error fallback;
        <code class="docs-inline">&lt;mk-image-gallery&gt;</code> lays image sets
        out as a grid, masonry or scroll strip and opens them in the
        <code class="docs-inline">MkLightboxService</code> — a fullscreen,
        keyboard-navigable viewer you can also drive yourself. For sequential
        slides there is <code class="docs-inline">&lt;mk-carousel&gt;</code>,
        with swipe, keyboard navigation and accessible autoplay.
      </p>

      <!-- ============================================================ -->
      <h2>Image</h2>
      <p>
        A <code class="docs-inline">&lt;figure&gt;</code>-based image block:
        skeleton shimmer while loading, a labelled fallback panel when the
        source fails, optional caption,
        <code class="docs-inline">aspectRatio</code> /
        <code class="docs-inline">fit</code> /
        <code class="docs-inline">rounded</code> presentation controls and
        native lazy loading.
      </p>
      <docs-example [code]="imageCode">
        <mk-image
          [src]="img('salmon', 600, 450)"
          alt="Grilled salmon with vegetables"
          aspectRatio="4 / 3"
          caption="Today's special"
          style="max-width: 18rem; width: 100%;"
        />
        <mk-image
          [src]="img('pasta', 500, 500)"
          alt="Fresh pasta"
          aspectRatio="1 / 1"
          rounded="circle"
          style="max-width: 10rem; width: 100%;"
        />
        <mk-image
          src="/definitely-missing.jpg"
          alt="Broken source"
          aspectRatio="4 / 3"
          style="max-width: 12rem; width: 100%;"
        />
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>src</td><td>string</td><td>required</td><td>Image source URL.</td></tr>
          <tr><td>alt</td><td>string</td><td>''</td><td>Alt text (always reflected on the img).</td></tr>
          <tr><td>aspectRatio</td><td>string</td><td>'auto'</td><td>Any CSS aspect-ratio value, e.g. "4 / 3".</td></tr>
          <tr><td>fit</td><td>'cover' | 'contain'</td><td>'cover'</td><td>object-fit inside the frame.</td></tr>
          <tr><td>rounded</td><td>'none' | 'md' | 'lg' | 'circle'</td><td>'md'</td><td>Corner radius preset.</td></tr>
          <tr><td>caption</td><td>string</td><td>''</td><td>Rendered as a figcaption.</td></tr>
          <tr><td>lazy</td><td>boolean</td><td>true</td><td>Native loading="lazy".</td></tr>
          <tr><td>(loaded) / (errored)</td><td>void</td><td>—</td><td>Load state events.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Image gallery</h2>
      <p>
        Feed it <code class="docs-inline">items</code> and pick a layout:
        <code class="docs-inline">grid</code> (uniform tiles),
        <code class="docs-inline">masonry</code> (natural heights in columns) or
        <code class="docs-inline">strip</code> (horizontal scroll with snap).
        Clicking a tile opens the lightbox (arrow keys, Esc, looping) —
        <code class="docs-inline">max</code> collapses long sets behind a
        "+N" overflow tile.
      </p>
      <docs-example [code]="galleryCode" [column]="true">
        <mk-image-gallery [items]="dishes" [columns]="4" [max]="7" />
        <mk-image-gallery
          [items]="dishes.slice(0, 6)"
          layout="strip"
          [columns]="4"
          aspectRatio="3 / 2"
        />
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>items</td><td>MkGalleryItem[]</td><td>required</td><td>{{ '{' }} src, thumb?, alt?, caption? {{ '}' }} per image.</td></tr>
          <tr><td>layout</td><td>'grid' | 'masonry' | 'strip'</td><td>'grid'</td><td>Layout variant.</td></tr>
          <tr><td>columns</td><td>number</td><td>3</td><td>Grid/masonry columns; strip tile width basis.</td></tr>
          <tr><td>max</td><td>number | null</td><td>null</td><td>Show only the first N tiles + a "+N" overflow tile.</td></tr>
          <tr><td>lightbox</td><td>boolean</td><td>true</td><td>Open the lightbox on click.</td></tr>
          <tr><td>aspectRatio / rounded</td><td>—</td><td>'1 / 1' / 'md'</td><td>Tile presentation (masonry keeps natural ratios).</td></tr>
          <tr><td>(itemClick)</td><td>{{ '{' }} item, index {{ '}' }}</td><td>—</td><td>Every tile click, lightbox or not.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Lightbox</h2>
      <p>
        <code class="docs-inline">MkLightboxService.open(items, startIndex)</code>
        shows a fullscreen dialog over the overlay scrim: arrow keys /
        Home / End navigate (looping), Esc or the backdrop closes, focus is
        trapped, the counter is announced politely. The gallery uses it
        internally; call it yourself for custom triggers.
      </p>
      <docs-example [code]="lightboxCode">
        <button mkButton tone="primary" (click)="openLightbox()">
          Open lightbox
        </button>
      </docs-example>

      <h3>Keyboard</h3>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td>← / →</td><td>Previous / next image (loops).</td></tr>
          <tr><td>Home / End</td><td>First / last image.</td></tr>
          <tr><td>Esc</td><td>Close (also backdrop click).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Carousel</h2>
      <p>
        <code class="docs-inline">&lt;mk-carousel&gt;</code> is an accessible
        slides/gallery — prev/next arrows, dot indicators, Arrow-key navigation
        and pointer swipe (touch or mouse drag; vertical page scrolling stays
        native). Mark each slide with
        <code class="docs-inline">mkCarouselSlide</code>; the current slide is
        a two-way <code class="docs-inline">index</code> model.
      </p>
      <docs-example [code]="carouselCode" [column]="true">
        <div style="max-width: 30rem; width: 100%;">
          <mk-carousel ariaLabel="Highlights" autoplay [interval]="6000">
            @for (c of slides; track c.title) {
              <div mkCarouselSlide [style.background]="c.bg" style="padding: var(--mk-space-8) var(--mk-space-4); text-align: center; color: var(--mk-primary-contrast);">
                <h3 style="margin: 0 0 var(--mk-space-1); color: inherit;">{{ c.title }}</h3>
                <p style="margin: 0; opacity: 0.85; color: inherit;">{{ c.body }}</p>
              </div>
            }
          </mk-carousel>
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>[(index)]</code></td><td><code>number</code></td><td><code>0</code></td><td>Two-way current slide index.</td></tr>
          <tr><td><code>loop</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Wrap around at the ends.</td></tr>
          <tr><td><code>showDots</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the dot indicators.</td></tr>
          <tr><td><code>showArrows</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the prev/next arrows.</td></tr>
          <tr><td><code>autoplay</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Advance automatically; also renders a persistent pause/play toggle.</td></tr>
          <tr><td><code>interval</code></td><td><code>number</code></td><td><code>5000</code></td><td>Autoplay interval in ms.</td></tr>
          <tr><td><code>[(userPaused)]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>The pause/play toggle's latched state (two-way, WCAG 2.2.2).</td></tr>
          <tr><td><code>ariaLabel</code></td><td><code>string</code></td><td>i18n</td><td>Accessible label for the carousel region.</td></tr>
          <tr><td><code>mkCarouselSlide</code></td><td>slot</td><td>—</td><td>Marks each projected slide element (ARIA + visibility are wired for you).</td></tr>
        </tbody>
      </table>
      <p>
        Autoplay is deliberately conservative: it pauses transiently on
        hover, focus and while a pointer is held down; the on-carousel
        pause/play button latches a persistent pause
        (<code class="docs-inline">userPaused</code>) that hover never
        overrides; and it <strong>never runs</strong> under
        <code class="docs-inline">prefers-reduced-motion</code>, while the
        browser tab is hidden or while the carousel is scrolled fully
        offscreen. Swiping past a quarter of the width (or flicking fast)
        changes slide; the click that would follow a drag is swallowed so links
        inside slides don't activate from a swipe.
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ImagesPage {
  private readonly lightbox = inject(MkLightboxService);

  /** Deterministic placeholder photos. */
  protected img(seed: string, w: number, h: number): string {
    return `https://picsum.photos/seed/${seed}/${w}/${h}`;
  }

  protected readonly dishes: MkGalleryItem[] = [
    'tapas', 'ramen', 'burger', 'salad', 'steak', 'sushi', 'cake', 'coffee',
    'pizza', 'curry',
  ].map((seed, i) => ({
    src: this.img(seed, 900, 700),
    thumb: this.img(seed, 400, 400),
    alt: `Dish ${i + 1} (${seed})`,
    caption: `Dish ${i + 1} — ${seed}`,
  }));

  protected openLightbox(): void {
    this.lightbox.open(
      this.dishes.map(({ src, alt, caption }) => ({ src, alt, caption })),
      0,
    );
  }

  protected readonly imageCode = `<mk-image src="/dishes/salmon.jpg" alt="Grilled salmon"
  aspectRatio="4 / 3" caption="Today's special" />
<mk-image src="/chef.jpg" alt="Chef" aspectRatio="1 / 1" rounded="circle" />`;

  protected readonly galleryCode = `<mk-image-gallery [items]="dishes" [columns]="4" [max]="7" />
<mk-image-gallery [items]="dishes" layout="strip" aspectRatio="3 / 2" />
<!-- items: { src, thumb?, alt?, caption? }[] — click opens the lightbox -->`;

  protected readonly lightboxCode = `private readonly lightbox = inject(MkLightboxService);

open(): void {
  this.lightbox.open(this.items, 0); // { src, alt?, caption? }[]
}`;

  // ----- Carousel ------------------------------------------------------
  protected readonly slides = [
    { title: 'Fast', body: 'Signals + OnPush everywhere.', bg: 'var(--mk-primary)' },
    { title: 'Accessible', body: 'WCAG 2.1 AA out of the box.', bg: 'var(--mk-success)' },
    { title: 'Themeable', body: 'Every colour is a CSS variable.', bg: 'var(--mk-info)' },
  ];

  protected readonly carouselCode = `<mk-carousel ariaLabel="Highlights" autoplay [interval]="6000">
  @for (c of slides; track c.title) {
    <div mkCarouselSlide [style.background]="c.bg">
      <h3>{{ c.title }}</h3>
      <p>{{ c.body }}</p>
    </div>
  }
</mk-carousel>`;
}
