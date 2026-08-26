import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  MkColorPicker,
  MkRangeSlider,
  type MkRange,
  MkRating,
  MkSlider,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the SLIDER-style components of `@mk-kit/ui`:
 * Slider, Range slider, Rating and Color picker.
 */
@Component({
  selector: 'docs-sliders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkSlider, MkRangeSlider, MkRating, MkColorPicker],
  template: `
    <div class="docs-page docs-container">
      <h1>Sliders &amp; rating</h1>
      <p class="docs-lead">
        Continuous-value controls built on the ARIA slider pattern: a single-value
        slider, a two-thumb range slider, a star rating and a compact color picker.
        Every control implements
        <code class="docs-inline">ControlValueAccessor</code> and exposes a two-way
        <code class="docs-inline">[(value)]</code> model, so it works with
        <code class="docs-inline">[(ngModel)]</code> and reactive forms too — all
        fully keyboard operable.
      </p>

      <!-- ============================================================ -->
      <!-- SLIDER -->
      <!-- ============================================================ -->
      <h2>Slider</h2>
      <p>
        <code class="docs-inline">&lt;mk-slider&gt;</code> is a single-value range
        slider with <code class="docs-inline">role="slider"</code>, a filled track and
        a draggable thumb. Keyboard: Arrows step, Page Up/Down take larger steps,
        Home/End jump to the bounds. Two-way via
        <code class="docs-inline">[(value)]</code>.
      </p>

      <docs-example [code]="sliderCode" [column]="true">
        <mk-slider [min]="0" [max]="100" [step]="5" [(value)]="volume" aria-label="Volume" />
        <p class="echo">Volume: {{ volume() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>min</td><td>number</td><td>0</td><td>Minimum value.</td></tr>
          <tr><td>max</td><td>number</td><td>100</td><td>Maximum value.</td></tr>
          <tr><td>step</td><td>number</td><td>1</td><td>Step increment (must be &gt; 0).</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Track/thumb thickness.</td></tr>
          <tr><td>tone</td><td>MkTone</td><td>'primary'</td><td>Semantic color of the filled track + thumb.</td></tr>
          <tr><td>aria-label</td><td>string</td><td>''</td><td>Accessible label for the thumb.</td></tr>
          <tr><td>value</td><td>model&lt;number&gt;</td><td>0</td><td>Two-way current value.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- RANGE SLIDER -->
      <!-- ============================================================ -->
      <h2>Range slider</h2>
      <p>
        <code class="docs-inline">&lt;mk-range-slider&gt;</code> selects a
        <code class="docs-inline">[low, high]</code> range with two thumbs (each a
        <code class="docs-inline">role="slider"</code>); the thumbs can't cross.
      </p>
      <docs-example [code]="rangeCode" [column]="true">
        <div style="max-width: 26rem; width: 100%;">
          <mk-range-slider [min]="0" [max]="1000" [step]="10" [(value)]="priceRange" />
          <p class="echo">Range: {{ priceRange()[0] }} – {{ priceRange()[1] }}</p>
        </div>
      </docs-example>

      <!-- ============================================================ -->
      <!-- RATING -->
      <!-- ============================================================ -->
      <h2>Rating</h2>
      <p>
        <code class="docs-inline">&lt;mk-rating&gt;</code> is a star rating input
        (and read-only display) following the ARIA slider pattern — click/hover a
        star, or focus and use Arrow keys.
      </p>
      <docs-example [code]="ratingCode" [column]="true">
        <mk-rating [(value)]="score" />
        <p class="echo">Score: {{ score() }} / 5 · <mk-rating [value]="4" readonly size="sm" /> (read-only)</p>
      </docs-example>

      <!-- ============================================================ -->
      <!-- COLOR PICKER -->
      <!-- ============================================================ -->
      <h2>Color picker</h2>
      <p>
        <code class="docs-inline">&lt;mk-color-picker&gt;</code> is a compact color
        control: a live swatch that opens the native OS picker, an editable hex
        field and an optional row of preset swatches.
      </p>
      <docs-example [code]="colorCode" [column]="true">
        <mk-color-picker [(value)]="brand" [swatches]="palette" />
        <p class="echo">Value: <code class="docs-inline">{{ brand() }}</code></p>
      </docs-example>
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
export class SlidersPage {
  // --- Slider -----------------------------------------------------------------
  protected readonly volume = signal(40);

  // --- Range slider -----------------------------------------------------------
  protected readonly priceRange = signal<MkRange>([200, 750]);

  // --- Rating -----------------------------------------------------------------
  protected readonly score = signal(3);

  // --- Color picker -----------------------------------------------------------
  protected readonly brand = signal('#4f46e5');
  protected readonly palette = [
    '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#111827',
  ];

  // --- Code snippets (plain strings shown in the code blocks) -----------------
  protected readonly sliderCode = `<mk-slider [min]="0" [max]="100" [step]="5" [(value)]="volume" aria-label="Volume" />`;
  protected readonly rangeCode = `<mk-range-slider [min]="0" [max]="1000" [step]="10" [(value)]="priceRange" />`;
  protected readonly ratingCode = `<mk-rating [(value)]="score" />`;
  protected readonly colorCode = `<mk-color-picker [(value)]="brand" [swatches]="palette" />`;
}
