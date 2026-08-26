import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  type MkChartSeries,
  type MkChartSlice,
  MkDonutChart,
  MkGauge,
  MkProgressRing,
  MkFunnelChart,
  type MkFunnelSegment,
  MkRadarChart,
  MkTreemap,
  type MkTreemapItem,
} from '@mk-kit/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the part-to-whole and KPI chart
 * components of `@mk-kit/ui`: progress ring, gauge, donut, radar, funnel
 * and treemap.
 */
@Component({
  selector: 'docs-proportion-charts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkProgressRing,
    MkGauge,
    MkDonutChart,
    MkRadarChart,
    MkFunnelChart,
    MkTreemap,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Proportion &amp; KPI charts</h1>
      <p class="docs-lead">
        Part-to-whole and single-metric (KPI) visualizations — rings, gauges,
        donuts, radars, funnels and treemaps. Dependency-free, SVG charts
        themed by a validated, colorblind-safe categorical palette
        (<code class="docs-inline">--mk-chart-1…8</code>). Every multi-series
        chart carries a legend (identity is never color-alone), a hover
        tooltip, and a screen-reader data table; dark mode uses its own
        validated palette, not an auto-flip.
      </p>

      <!-- ============================================================ -->
      <h2>Progress ring</h2>
      <p>
        Circular progress — determinate by value, or
        <code class="docs-inline">indeterminate</code> as a preloader when
        duration is unknown.
      </p>
      <docs-example [code]="ringCode">
        <div style="display: flex; align-items: center; gap: var(--mk-space-5); flex-wrap: wrap;">
          <mk-progress-ring [value]="72" showLabel />
          <mk-progress-ring [value]="40" tone="success" showLabel />
          <mk-progress-ring [value]="88" tone="warning" [size]="64" showLabel />
          <mk-progress-ring [value]="25" tone="danger" />
          <mk-progress-ring indeterminate tone="neutral" [size]="28" label="Loading" />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>value</code></td><td><code>number</code></td><td><code>0</code></td><td>Current progress, clamped to <code>[0, max]</code>. Ignored when indeterminate.</td></tr>
          <tr><td><code>max</code></td><td><code>number</code></td><td><code>100</code></td><td>Maximum value.</td></tr>
          <tr><td><code>size</code></td><td><code>number</code></td><td><code>48</code></td><td>Diameter in px.</td></tr>
          <tr><td><code>thickness</code></td><td><code>number</code></td><td><code>4</code></td><td>Ring thickness in px.</td></tr>
          <tr><td><code>tone</code></td><td><code>MkTone</code></td><td><code>'primary'</code></td><td>Semantic colour of the progress arc.</td></tr>
          <tr><td><code>indeterminate</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Rotating arc for unknown-duration work.</td></tr>
          <tr><td><code>showLabel</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Show the percentage in the centre.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Gauge</h2>
      <p>A single-metric radial dial (KPI). Configurable sweep, unit and label.</p>
      <docs-example [code]="gaugeCode" column>
        <div style="display: flex; gap: var(--mk-space-6); flex-wrap: wrap; align-items: center;">
          <mk-gauge [value]="68" unit="%" label="of quota" [size]="160" />
          <mk-gauge [value]="4.2" [max]="5" valueText="4.2" label="rating" color="var(--mk-warning)" [size]="160" />
          <mk-gauge [value]="82" [arc]="180" unit="%" label="uptime" color="var(--mk-success)" [size]="160" />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>value</code></td><td><code>number</code></td><td><code>0</code></td><td>The current value.</td></tr>
          <tr><td><code>min</code></td><td><code>number</code></td><td><code>0</code></td><td>Scale minimum.</td></tr>
          <tr><td><code>max</code></td><td><code>number</code></td><td><code>100</code></td><td>Scale maximum.</td></tr>
          <tr><td><code>arc</code></td><td><code>number</code></td><td><code>270</code></td><td>Sweep of the arc in degrees (30–360).</td></tr>
          <tr><td><code>size</code></td><td><code>number</code></td><td><code>180</code></td><td>Intrinsic size (viewBox units; scales to its container).</td></tr>
          <tr><td><code>thickness</code></td><td><code>number</code></td><td><code>14</code></td><td>Arc thickness.</td></tr>
          <tr><td><code>color</code></td><td><code>string</code></td><td><code>'var(--mk-primary)'</code></td><td>Value-arc colour.</td></tr>
          <tr><td><code>trackColor</code></td><td><code>string</code></td><td><code>'var(--mk-border-subtle)'</code></td><td>Track (background arc) colour.</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td><code>''</code></td><td>Label under the value.</td></tr>
          <tr><td><code>unit</code></td><td><code>string</code></td><td><code>''</code></td><td>Unit appended to the value (e.g. <code>%</code>).</td></tr>
          <tr><td><code>valueText</code></td><td><code>string</code></td><td><code>''</code></td><td>Override the centred value text.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Donut chart</h2>
      <p>Proportions of a whole, with an optional centre total.</p>
      <docs-example [code]="donutCode" column>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: var(--mk-space-6); width: 100%; align-items: start;">
          <mk-donut-chart [slices]="traffic" centerLabel="1,240" centerSublabel="Sessions" />
          <mk-donut-chart [slices]="traffic" [thickness]="0" [size]="200" />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>slices</code></td><td><code>MkChartSlice[]</code></td><td><code>[]</code></td><td>The slices; each <code>value</code> contributes to the whole.</td></tr>
          <tr><td><code>size</code></td><td><code>number</code></td><td><code>220</code></td><td>Diameter in viewBox units (scales to its container).</td></tr>
          <tr><td><code>thickness</code></td><td><code>number</code></td><td><code>34</code></td><td>Ring thickness. Set <code>0</code> (or ≥ radius) for a full pie.</td></tr>
          <tr><td><code>showLegend</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the legend with values + percentages.</td></tr>
          <tr><td><code>centerLabel</code></td><td><code>string</code></td><td><code>''</code></td><td>Big centre label (e.g. a total). Donut only.</td></tr>
          <tr><td><code>centerSublabel</code></td><td><code>string</code></td><td><code>''</code></td><td>Small centre caption under the label.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Radar chart</h2>
      <p>
        Compare several series across the same axes — product profiles, skill
        sets, survey dimensions. Each series is a polygon over the shared spokes.
      </p>
      <docs-example [code]="radarCode" column>
        <div style="max-width: 26rem;">
          <mk-radar-chart [axes]="radarAxes" [series]="radarSeries" [max]="10" />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>axes</code></td><td><code>string[]</code></td><td><code>[]</code></td><td>Axis labels (one spoke each). Series data align to this order.</td></tr>
          <tr><td><code>series</code></td><td><code>MkChartSeries[]</code></td><td><code>[]</code></td><td>One or more series (values align to <code>axes</code>).</td></tr>
          <tr><td><code>max</code></td><td><code>number | null</code></td><td><code>null</code></td><td>Domain maximum (defaults to a nice value above the data max).</td></tr>
          <tr><td><code>levels</code></td><td><code>number</code></td><td><code>4</code></td><td>Number of concentric grid rings.</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td><code>360</code></td><td>Intrinsic width (viewBox units; scales to its container).</td></tr>
          <tr><td><code>height</code></td><td><code>number</code></td><td><code>360</code></td><td>Intrinsic height.</td></tr>
          <tr><td><code>showDots</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Draw a dot at each vertex.</td></tr>
          <tr><td><code>showLegend</code></td><td><code>boolean | undefined</code></td><td><code>undefined</code></td><td>Force the legend on/off (defaults to on when there are ≥ 2 series).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Funnel chart</h2>
      <p>
        Show drop-off through a sequence of stages — each band's width is
        proportional to its value, with the conversion rate relative to the top.
      </p>
      <docs-example [code]="funnelCode" column>
        <div style="max-width: 30rem;">
          <mk-funnel-chart [segments]="funnel" />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>segments</code></td><td><code>MkFunnelSegment[]</code></td><td><code>[]</code></td><td>The funnel stages, ordered largest → smallest conceptually.</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td><code>420</code></td><td>Intrinsic width (viewBox units; scales to its container).</td></tr>
          <tr><td><code>height</code></td><td><code>number</code></td><td><code>300</code></td><td>Intrinsic height.</td></tr>
          <tr><td><code>showValues</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Render the value + conversion text on each band.</td></tr>
          <tr><td><code>showLegend</code></td><td><code>boolean | undefined</code></td><td><code>undefined</code></td><td>Force the legend on/off (bands are labelled, so off by default).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Treemap</h2>
      <p>
        Nested rectangles sized by value (squarified layout) — good for
        part-to-whole breakdowns like spend by channel or storage by folder.
      </p>
      <docs-example [code]="treemapCode" column>
        <mk-treemap [items]="treemap" [width]="520" [height]="300" />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>items</code></td><td><code>MkTreemapItem[]</code></td><td><code>[]</code></td><td>The tiles to pack (order-independent — sorted internally).</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td><code>480</code></td><td>Intrinsic width (viewBox units; scales to its container).</td></tr>
          <tr><td><code>height</code></td><td><code>number</code></td><td><code>320</code></td><td>Intrinsic height.</td></tr>
          <tr><td><code>showValues</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Draw each tile's value beneath its label when the tile is tall enough.</td></tr>
        </tbody>
      </table>
    </div>
  `,
})
export class ProportionChartsPage {
  protected readonly traffic: MkChartSlice[] = [
    { name: 'Search', value: 540 },
    { name: 'Direct', value: 380 },
    { name: 'Social', value: 210 },
    { name: 'Referral', value: 110 },
  ];

  protected readonly radarAxes = ['Speed', 'Power', 'Range', 'Comfort', 'Price', 'Safety'];
  protected readonly radarSeries: MkChartSeries[] = [
    { name: 'Model S', data: [9, 8, 7, 8, 5, 9] },
    { name: 'Model E', data: [6, 5, 9, 7, 8, 8] },
  ];

  protected readonly funnel: MkFunnelSegment[] = [
    { label: 'Visits', value: 12400 },
    { label: 'Signups', value: 4200 },
    { label: 'Trials', value: 1800 },
    { label: 'Paid', value: 640 },
  ];
  protected readonly treemap: MkTreemapItem[] = [
    { label: 'Organic', value: 42 },
    { label: 'Paid ads', value: 28 },
    { label: 'Email', value: 16 },
    { label: 'Social', value: 10 },
    { label: 'Referral', value: 6 },
  ];

  protected readonly ringCode = `<mk-progress-ring [value]="72" showLabel />
<mk-progress-ring [value]="88" tone="warning" [size]="64" showLabel />
<mk-progress-ring indeterminate tone="neutral" [size]="28" label="Loading" />`;

  protected readonly gaugeCode = `<mk-gauge [value]="68" unit="%" label="of quota" />
<mk-gauge [value]="4.2" [max]="5" valueText="4.2" label="rating" color="var(--mk-warning)" />
<mk-gauge [value]="82" [arc]="180" unit="%" label="uptime" color="var(--mk-success)" />`;

  protected readonly donutCode = `<mk-donut-chart [slices]="traffic"
  centerLabel="1,240" centerSublabel="Sessions" />

<!-- full pie: thickness 0 -->
<mk-donut-chart [slices]="traffic" [thickness]="0" />`;

  protected readonly radarCode = `<mk-radar-chart
  [axes]="['Speed','Power','Range','Comfort','Price','Safety']"
  [series]="[
    { name: 'Model S', data: [9,8,7,8,5,9] },
    { name: 'Model E', data: [6,5,9,7,8,8] },
  ]"
  [max]="10" />`;

  protected readonly funnelCode = `<mk-funnel-chart [segments]="[
  { label: 'Visits',  value: 12400 },
  { label: 'Signups', value: 4200 },
  { label: 'Trials',  value: 1800 },
  { label: 'Paid',    value: 640 },
]" />`;

  protected readonly treemapCode = `<mk-treemap [items]="[
  { label: 'Organic', value: 42 }, { label: 'Paid ads', value: 28 },
  { label: 'Email', value: 16 }, { label: 'Social', value: 10 },
]" />`;
}
