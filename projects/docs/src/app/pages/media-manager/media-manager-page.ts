import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  MkButton,
  MkImageCropper,
  MkMediaGallery,
  MkMediaActions,
  type MkMediaItem,
  type MkMediaReorderEvent,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the media MANAGEMENT components of
 * `@mkornas/ui`: Media gallery (select / reorder / actions) and Image cropper.
 */
@Component({
  selector: 'docs-media-manager-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkButton, MkMediaGallery, MkMediaActions, MkImageCropper],
  template: `
    <div class="docs-page docs-container">
      <h1>Media manager</h1>
      <p class="docs-lead">
        Admin-side media handling.
        <code class="docs-inline">&lt;mk-media-gallery&gt;</code> is a management
        grid — multi-select with checkboxes, drag-to-reorder (pointer and
        keyboard, via the dnd module) and a per-item actions slot you fill with
        your own buttons.
        <code class="docs-inline">&lt;mk-image-cropper&gt;</code> pans, zooms and
        crops an image to a data-URL — pair it with the avatar or an upload
        flow.
      </p>

      <!-- ============================================================ -->
      <h2>Media gallery</h2>
      <p>
        Two-way <code class="docs-inline">items</code> and
        <code class="docs-inline">selection</code> models; tile click stays
        "open/preview" (checkbox handles selection), dragging writes the new
        order back and emits
        <code class="docs-inline">(reordered)</code>. The actions bar renders
        your <code class="docs-inline">&lt;ng-template mkMediaActions&gt;</code>
        on hover/focus — delete below is wired for real.
      </p>
      <docs-example [code]="mediaCode" [column]="true">
        <mk-media-gallery
          [(items)]="library"
          [(selection)]="selected"
          selectable
          reorderable
          [columns]="4"
        >
          <ng-template mkMediaActions let-item>
            <button
              mkButton
              size="sm"
              variant="soft"
              tone="danger"
              (click)="remove(item)"
            >
              Delete
            </button>
          </ng-template>
        </mk-media-gallery>
        <p class="echo">
          Selected: {{ selected().length ? selected().join(', ') : '—' }}
          @if (lastReorder(); as r) {
            · moved {{ r.from + 1 }} → {{ r.to + 1 }}
          }
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>items</td><td>model&lt;MkMediaItem[]&gt;</td><td>[]</td><td>{{ '{' }} id, src, thumb?, name, alt?, meta? {{ '}' }} — two-way, reorder writes back.</td></tr>
          <tr><td>selection</td><td>model&lt;string[]&gt;</td><td>[]</td><td>Two-way selected ids.</td></tr>
          <tr><td>selectable / reorderable</td><td>boolean</td><td>false</td><td>Enable checkboxes / drag reorder.</td></tr>
          <tr><td>columns</td><td>number</td><td>4</td><td>Grid columns.</td></tr>
          <tr><td>mkMediaActions</td><td>ng-template</td><td>—</td><td>Per-item action buttons (let-item context).</td></tr>
          <tr><td>(itemClick)</td><td>MkMediaItem</td><td>—</td><td>Tile preview click.</td></tr>
          <tr><td>(reordered)</td><td>{{ '{' }} from, to, items {{ '}' }}</td><td>—</td><td>After a drop.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Image cropper</h2>
      <p>
        Drag to pan, wheel / slider / ± to zoom, arrow keys to nudge
        (Shift = 1px). The image always covers the viewport;
        <code class="docs-inline">aspect</code> fixes the crop shape and
        <code class="docs-inline">round</code> previews a circular mask for
        avatars (output stays rectangular — clip it where you render).
        <code class="docs-inline">crop()</code> returns a PNG data-URL of the
        visible region.
      </p>
      <docs-example [code]="cropperCode" [column]="true">
        <div style="max-width: 22rem; width: 100%;">
          <mk-image-cropper
            #cropper
            src="https://picsum.photos/seed/chef/900/700"
            crossOrigin="anonymous"
            [aspect]="1"
            round
          />
        </div>
        <div style="display: flex; gap: var(--mk-space-3); align-items: center;">
          <button mkButton tone="primary" (click)="cropped.set(cropper.crop())">
            Crop
          </button>
          @if (cropped(); as url) {
            <img
              [src]="url"
              alt="Cropped avatar preview"
              style="width: 64px; height: 64px; border-radius: 50%;
                     border: 1px solid var(--mk-border); object-fit: cover;"
            />
          }
        </div>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / API</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>src</td><td>string</td><td>required</td><td>Image URL or data-URL.</td></tr>
          <tr><td>aspect</td><td>number | null</td><td>1</td><td>Crop viewport aspect (w/h); null fills the container.</td></tr>
          <tr><td>round</td><td>boolean</td><td>false</td><td>Circular mask preview for avatars.</td></tr>
          <tr><td>crossOrigin</td><td>'anonymous' | 'use-credentials' | null</td><td>null</td><td>Set 'anonymous' for CORS-enabled remote images, or crop() returns null (tainted canvas).</td></tr>
          <tr><td>zoom</td><td>model&lt;number&gt;</td><td>1</td><td>Two-way zoom, clamped to min/maxZoom.</td></tr>
          <tr><td>minZoom / maxZoom</td><td>number</td><td>1 / 4</td><td>Zoom bounds.</td></tr>
          <tr><td>crop(options?)</td><td>string | null</td><td>—</td><td>Data-URL of the visible region ({{ '{' }} type, quality, size {{ '}' }}); null before load.</td></tr>
          <tr><td>reset()</td><td>—</td><td>—</td><td>Re-center at zoom 1 (exportAs "mkImageCropper").</td></tr>
          <tr><td>(changed) / (imageError)</td><td>void</td><td>—</td><td>Transform changed / source failed.</td></tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .echo {
        margin: 0;
        font-size: var(--mk-font-size-sm);
        color: var(--mk-text-muted);
      }
    `,
  ],
})
export class MediaManagerPage {
  protected readonly cropper = viewChild<MkImageCropper>('cropper');

  protected readonly library = signal<MkMediaItem[]>(
    ['tapas', 'ramen', 'burger', 'salad', 'steak', 'sushi', 'cake', 'pizza'].map(
      (seed, i) => ({
        id: `m${i + 1}`,
        src: `https://picsum.photos/seed/${seed}/700/700`,
        thumb: `https://picsum.photos/seed/${seed}/300/300`,
        name: `${seed}.jpg`,
        alt: `Photo of ${seed}`,
        meta: `${(0.4 + i * 0.3).toFixed(1)} MB · JPG`,
      }),
    ),
  );
  protected readonly selected = signal<string[]>([]);
  protected readonly lastReorder = signal<MkMediaReorderEvent | null>(null);
  protected readonly cropped = signal<string | null>(null);

  protected remove(item: MkMediaItem): void {
    this.library.update((items) => items.filter((i) => i.id !== item.id));
    this.selected.update((ids) => ids.filter((id) => id !== item.id));
  }

  protected readonly mediaCode = `<mk-media-gallery [(items)]="library" [(selection)]="selected"
  selectable reorderable [columns]="4" (reordered)="onReorder($event)">
  <ng-template mkMediaActions let-item>
    <button mkButton size="sm" variant="soft" tone="danger"
      (click)="remove(item)">Delete</button>
  </ng-template>
</mk-media-gallery>`;

  protected readonly cropperCode = `<mk-image-cropper #cropper src="/chef.jpg" [aspect]="1" round />
<button mkButton (click)="avatar = cropper.crop()">Crop</button>
<!-- avatar === 'data:image/png;base64,…' -->`;
}
