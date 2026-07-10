import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  type MkChartSeries,
  type MkScatterSeries,
  MkBarChart,
  MkHeatmap,
  MkLineChart,
  MkScatterChart,
  MkSparkline,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the trend & comparison chart components
 * of `@mkornas/ui`: sparkline, bar, line, scatter/bubble and heatmap.
 */
@Component({
  selector: 'docs-charts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkSparkline,
    MkBarChart,
    MkLineChart,
    MkScatterChart,
    MkHeatmap,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Trend charts</h1>
      <p class="docs-lead">
        Charts for change over time and comparison across categories —
        sparklines, bars, lines, scatter plots and heatmaps. Dependency-free,
        SVG dashboard charts themed by a validated, colorblind-safe categorical
        palette (<code class="docs-inline">--mk-chart-1…8</code>). Every
        multi-series chart carries a legend (identity is never color-alone), a
        hover tooltip, and a screen-reader data table; dark mode uses its own
        validated palette, not an auto-flip.
      </p>

      <!-- ============================================================ -->
      <h2>Sparkline</h2>
      <p>
        A tiny, axis-less trend mark for tables, stat cards and list rows.
        Line, area or bar.
      </p>
      <docs-example [code]="sparklineCode">
        <div style="display: flex; align-items: center; gap: var(--mk-space-6); flex-wrap: wrap;">
          <mk-sparkline [data]="trend" type="line" showDot />
          <mk-sparkline [data]="trend" type="area" color="var(--mk-success)" />
          <mk-sparkline [data]="trend" type="bar" color="var(--mk-chart-5)" />
          <span style="display:inline-flex; align-items:center; gap:var(--mk-space-2);">
            <strong style="font-size: var(--mk-font-size-xl);">$48.2k</strong>
            <mk-sparkline [data]="trend" type="area" [width]="72" [height]="28" />
          </span>
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>number[]</code></td><td><code>[]</code></td><td>The values to plot (left → right). Single series only.</td></tr>
          <tr><td><code>type</code></td><td><code>'line' | 'area' | 'bar'</code></td><td><code>'line'</code></td><td>Visual form.</td></tr>
          <tr><td><code>color</code></td><td><code>string</code></td><td><code>'var(--mk-chart-1)'</code></td><td>Any CSS colour.</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td><code>120</code></td><td>Intrinsic width in px (the SVG scales with its box).</td></tr>
          <tr><td><code>height</code></td><td><code>number</code></td><td><code>32</code></td><td>Intrinsic height in px.</td></tr>
          <tr><td><code>strokeWidth</code></td><td><code>number</code></td><td><code>2</code></td><td>Line/area stroke width.</td></tr>
          <tr><td><code>showDot</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Draw a dot on the last point (line/area only).</td></tr>
          <tr><td><code>min</code> / <code>max</code></td><td><code>number | undefined</code></td><td><code>undefined</code></td><td>Fixed domain bounds (default to the data min/max).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Bar chart</h2>
      <p>Compare a measure across categories; group or stack multiple series.</p>
      <docs-example [code]="barCode" column>
        <div style="width: 100%; max-width: 40rem;">
          <mk-bar-chart [categories]="quarters" [series]="revenue" />
        </div>
      </docs-example>

      <h3>Grouped &amp; stacked</h3>
      <docs-example [code]="stackedCode" column>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: var(--mk-space-5); width: 100%;">
          <mk-bar-chart [categories]="quarters" [series]="twoSeries" [height]="220" />
          <mk-bar-chart [categories]="quarters" [series]="twoSeries" stacked [height]="220" />
        </div>
      </docs-example>

      <h3>Horizontal</h3>
      <p>Set <code class="docs-inline">orientation="horizontal"</code> — ideal when category names are long.</p>
      <docs-example [code]="horizontalCode" column>
        <div style="width: 100%; max-width: 40rem;">
          <mk-bar-chart orientation="horizontal" [categories]="channels" [series]="channelSeries" [height]="220" />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>categories</code></td><td><code>string[]</code></td><td><code>[]</code></td><td>Category labels along the category axis.</td></tr>
          <tr><td><code>series</code></td><td><code>MkChartSeries[]</code></td><td><code>[]</code></td><td>One or more data series (values align to <code>categories</code>).</td></tr>
          <tr><td><code>orientation</code></td><td><code>'vertical' | 'horizontal'</code></td><td><code>'vertical'</code></td><td>Bar direction.</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td><code>480</code></td><td>Intrinsic width (viewBox units; scales to its container).</td></tr>
          <tr><td><code>height</code></td><td><code>number</code></td><td><code>260</code></td><td>Intrinsic height.</td></tr>
          <tr><td><code>stacked</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Stack series into one bar per category instead of grouping.</td></tr>
          <tr><td><code>showGrid</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show gridlines behind the bars.</td></tr>
          <tr><td><code>showLegend</code></td><td><code>boolean | undefined</code></td><td><code>undefined</code></td><td>Force the legend on/off (defaults to on when there are ≥ 2 series).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Line chart</h2>
      <p>Change over ordered categories; single or multi-series, optional area.</p>
      <docs-example [code]="lineCode" column>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: var(--mk-space-5); width: 100%;">
          <mk-line-chart [categories]="months" [series]="sessions" area [height]="220" />
          <mk-line-chart [categories]="months" [series]="twoLines" showDots [height]="220" />
        </div>
      </docs-example>

      <h3>Stacked area</h3>
      <p>Add <code class="docs-inline">stacked</code> to fill cumulative bands (composition over time).</p>
      <docs-example [code]="stackedAreaCode" column>
        <div style="width: 100%; max-width: 40rem;">
          <mk-line-chart [categories]="months" [series]="twoLines" stacked [height]="220" />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>categories</code></td><td><code>string[]</code></td><td><code>[]</code></td><td>Ordered category labels along the x axis.</td></tr>
          <tr><td><code>series</code></td><td><code>MkChartSeries[]</code></td><td><code>[]</code></td><td>One or more data series (values align to <code>categories</code>).</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td><code>480</code></td><td>Intrinsic width (viewBox units; scales to its container).</td></tr>
          <tr><td><code>height</code></td><td><code>number</code></td><td><code>260</code></td><td>Intrinsic height.</td></tr>
          <tr><td><code>area</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Fill the area under each line.</td></tr>
          <tr><td><code>stacked</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Stack the series (cumulative bands) — implies filled areas.</td></tr>
          <tr><td><code>showDots</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Draw a dot at every data point.</td></tr>
          <tr><td><code>showGrid</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show gridlines.</td></tr>
          <tr><td><code>showLegend</code></td><td><code>boolean | undefined</code></td><td><code>undefined</code></td><td>Force the legend on/off (defaults to on when there are ≥ 2 series).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Scatter &amp; bubble chart</h2>
      <p>
        Plot <code class="docs-inline">(x, y)</code> points across two numeric
        axes to reveal correlation and clusters. Give each point a
        <code class="docs-inline">size</code> and set
        <code class="docs-inline">bubble</code> for a bubble chart. Hover a point
        for its values.
      </p>
      <docs-example [code]="scatterCode" column>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: var(--mk-space-6); width: 100%; align-items: start;">
          <mk-scatter-chart
            xLabel="Spend ($)"
            yLabel="Revenue ($)"
            [series]="spendRevenue"
          />
          <mk-scatter-chart
            bubble
            xLabel="Reach"
            yLabel="Engagement"
            [series]="bubbleData"
          />
        </div>
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>series</code></td><td><code>MkScatterSeries[]</code></td><td><code>[]</code></td><td>One or more point series (<code>points</code> of <code>x</code>, <code>y</code>, optional <code>size</code>/<code>label</code>).</td></tr>
          <tr><td><code>width</code></td><td><code>number</code></td><td><code>480</code></td><td>Intrinsic width (viewBox units; scales to its container).</td></tr>
          <tr><td><code>height</code></td><td><code>number</code></td><td><code>300</code></td><td>Intrinsic height.</td></tr>
          <tr><td><code>bubble</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Size points by their <code>size</code> value (bubble chart).</td></tr>
          <tr><td><code>pointRadius</code></td><td><code>number</code></td><td><code>4</code></td><td>Radius of each point when not sizing by <code>size</code>.</td></tr>
          <tr><td><code>maxRadius</code></td><td><code>number</code></td><td><code>20</code></td><td>Largest bubble radius when <code>bubble</code> is on.</td></tr>
          <tr><td><code>xLabel</code> / <code>yLabel</code></td><td><code>string</code></td><td><code>''</code></td><td>Axis titles.</td></tr>
          <tr><td><code>showGrid</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show gridlines.</td></tr>
          <tr><td><code>showLegend</code></td><td><code>boolean | undefined</code></td><td><code>undefined</code></td><td>Force the legend on/off (defaults to on when there are ≥ 2 series).</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <h2>Heatmap</h2>
      <p>
        A matrix of cells shaded by value intensity — for activity-by-time
        grids, correlation matrices and cohort tables. Rendered as a semantic
        table; cell colours are mixed from the accent over the surface, so they
        track the theme.
      </p>
      <docs-example [code]="heatmapCode" column>
        <mk-heatmap
          [xLabels]="hours"
          [yLabels]="days"
          [data]="activity"
          showValues
        />
      </docs-example>
      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>xLabels</code></td><td><code>string[]</code></td><td><code>[]</code></td><td>Column labels (x axis).</td></tr>
          <tr><td><code>yLabels</code></td><td><code>string[]</code></td><td><code>[]</code></td><td>Row labels (y axis).</td></tr>
          <tr><td><code>data</code></td><td><code>(number | null)[][]</code></td><td><code>[]</code></td><td>Row-major matrix: <code>data[row][col]</code>. Use <code>null</code> for a blank cell.</td></tr>
          <tr><td><code>min</code> / <code>max</code></td><td><code>number | null</code></td><td><code>null</code></td><td>Override the colour-domain bounds (default to the data min/max).</td></tr>
          <tr><td><code>accent</code></td><td><code>string</code></td><td><code>'var(--mk-primary)'</code></td><td>Base colour mixed over the surface for intensity.</td></tr>
          <tr><td><code>showValues</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Print each cell's value inside it.</td></tr>
          <tr><td><code>showScale</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Show the min → max colour scale legend.</td></tr>
          <tr><td><code>format</code></td><td><code>(value: number) => string</code></td><td>compact</td><td>Formatter for cell + legend values.</td></tr>
        </tbody>
      </table>
    </div>
  `,
})
export class ChartsPage {
  protected readonly trend = [4, 6, 5, 8, 7, 10, 9, 12, 11, 14];
  protected readonly quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  protected readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  protected readonly revenue: MkChartSeries[] = [
    { name: 'Revenue', data: [12, 19, 15, 22] },
  ];
  protected readonly twoSeries: MkChartSeries[] = [
    { name: 'New', data: [8, 12, 10, 15] },
    { name: 'Returning', data: [5, 7, 9, 8] },
  ];
  protected readonly sessions: MkChartSeries[] = [
    { name: 'Sessions', data: [1200, 1900, 1500, 2200, 2000, 2600] },
  ];
  protected readonly twoLines: MkChartSeries[] = [
    { name: 'Desktop', data: [820, 932, 901, 934, 1290, 1330] },
    { name: 'Mobile', data: [620, 732, 791, 934, 1090, 1520] },
  ];
  protected readonly channels = ['Organic search', 'Paid ads', 'Email', 'Social'];
  protected readonly channelSeries: MkChartSeries[] = [
    { name: 'Conversions', data: [540, 320, 260, 180] },
  ];

  protected readonly spendRevenue: MkScatterSeries[] = [
    {
      name: 'Search',
      points: [
        { x: 120, y: 480 }, { x: 200, y: 620 }, { x: 260, y: 700 },
        { x: 340, y: 910 }, { x: 410, y: 980 }, { x: 500, y: 1240 },
      ],
    },
    {
      name: 'Social',
      points: [
        { x: 90, y: 260 }, { x: 180, y: 340 }, { x: 250, y: 300 },
        { x: 330, y: 520 }, { x: 420, y: 610 },
      ],
    },
  ];
  protected readonly bubbleData: MkScatterSeries[] = [
    {
      name: 'Campaigns',
      points: [
        { x: 1200, y: 4.2, size: 60, label: 'Launch' },
        { x: 2600, y: 6.1, size: 140, label: 'Spring sale' },
        { x: 1800, y: 3.4, size: 40, label: 'Newsletter' },
        { x: 3400, y: 7.8, size: 220, label: 'Black Friday' },
        { x: 900, y: 2.1, size: 25, label: 'Teaser' },
      ],
    },
  ];

  protected readonly hours = ['9a', '12p', '3p', '6p', '9p'];
  protected readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  protected readonly activity: (number | null)[][] = [
    [2, 8, 12, 6, 3],
    [4, 10, 14, 9, 5],
    [3, 9, 16, 11, 4],
    [5, 12, 18, 13, 7],
    [6, 15, 20, 10, 8],
  ];

  protected readonly sparklineCode = `<mk-sparkline [data]="trend" type="line" showDot />
<mk-sparkline [data]="trend" type="area" color="var(--mk-success)" />
<mk-sparkline [data]="trend" type="bar" />`;

  protected readonly barCode = `<mk-bar-chart
  [categories]="['Q1','Q2','Q3','Q4']"
  [series]="[{ name: 'Revenue', data: [12,19,15,22] }]" />`;

  protected readonly stackedCode = `<mk-bar-chart [categories]="quarters" [series]="twoSeries" />
<mk-bar-chart [categories]="quarters" [series]="twoSeries" stacked />`;

  protected readonly horizontalCode = `<mk-bar-chart orientation="horizontal"
  [categories]="channels" [series]="channelSeries" />`;

  protected readonly lineCode = `<mk-line-chart [categories]="months" [series]="sessions" area />
<mk-line-chart [categories]="months" [series]="twoLines" showDots />`;

  protected readonly stackedAreaCode = `<mk-line-chart [categories]="months" [series]="twoLines" stacked />`;

  protected readonly scatterCode = `<mk-scatter-chart xLabel="Spend ($)" yLabel="Revenue ($)"
  [series]="spendRevenue" />

<!-- bubble: size each point -->
<mk-scatter-chart bubble xLabel="Reach" yLabel="Engagement"
  [series]="bubbleData" />`;

  protected readonly heatmapCode = `<mk-heatmap [xLabels]="hours" [yLabels]="days"
  [data]="activity" showValues />`;
}
