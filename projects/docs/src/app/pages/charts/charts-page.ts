import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  type MkChartSeries,
  type MkChartSlice,
  type MkScatterSeries,
  MkBarChart,
  MkDonutChart,
  MkGauge,
  MkHeatmap,
  MkLineChart,
  MkProgressRing,
  MkScatterChart,
  MkSparkline,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the chart & progress components of
 * `@mkornas/ui`: sparkline, bar/line/donut charts and the circular progress ring.
 */
@Component({
  selector: 'docs-charts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsExample,
    MkSparkline,
    MkProgressRing,
    MkBarChart,
    MkLineChart,
    MkDonutChart,
    MkGauge,
    MkScatterChart,
    MkHeatmap,
  ],
  template: `
    <div class="docs-page docs-container">
      <h1>Charts</h1>
      <p class="docs-lead">
        Dependency-free, SVG dashboard charts themed by a validated,
        colorblind-safe categorical palette (<code class="docs-inline"
          >--mk-chart-1…8</code
        >). Every multi-series chart carries a legend (identity is never
        color-alone), a hover tooltip, and a screen-reader data table; dark mode
        uses its own validated palette, not an auto-flip.
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

      <!-- ============================================================ -->
      <h2>Donut chart</h2>
      <p>Proportions of a whole, with an optional centre total.</p>
      <docs-example [code]="donutCode" column>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: var(--mk-space-6); width: 100%; align-items: start;">
          <mk-donut-chart [slices]="traffic" centerLabel="1,240" centerSublabel="Sessions" />
          <mk-donut-chart [slices]="traffic" [thickness]="0" [size]="200" />
        </div>
      </docs-example>

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
  protected readonly traffic: MkChartSlice[] = [
    { name: 'Search', value: 540 },
    { name: 'Direct', value: 380 },
    { name: 'Social', value: 210 },
    { name: 'Referral', value: 110 },
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

  protected readonly ringCode = `<mk-progress-ring [value]="72" showLabel />
<mk-progress-ring [value]="88" tone="warning" [size]="64" showLabel />
<mk-progress-ring indeterminate tone="neutral" [size]="28" label="Loading" />`;

  protected readonly barCode = `<mk-bar-chart
  [categories]="['Q1','Q2','Q3','Q4']"
  [series]="[{ name: 'Revenue', data: [12,19,15,22] }]" />`;

  protected readonly stackedCode = `<mk-bar-chart [categories]="quarters" [series]="twoSeries" />
<mk-bar-chart [categories]="quarters" [series]="twoSeries" stacked />`;

  protected readonly horizontalCode = `<mk-bar-chart orientation="horizontal"
  [categories]="channels" [series]="channelSeries" />`;

  protected readonly stackedAreaCode = `<mk-line-chart [categories]="months" [series]="twoLines" stacked />`;

  protected readonly gaugeCode = `<mk-gauge [value]="68" unit="%" label="of quota" />
<mk-gauge [value]="4.2" [max]="5" valueText="4.2" label="rating" color="var(--mk-warning)" />
<mk-gauge [value]="82" [arc]="180" unit="%" label="uptime" color="var(--mk-success)" />`;

  protected readonly lineCode = `<mk-line-chart [categories]="months" [series]="sessions" area />
<mk-line-chart [categories]="months" [series]="twoLines" showDots />`;

  protected readonly donutCode = `<mk-donut-chart [slices]="traffic"
  centerLabel="1,240" centerSublabel="Sessions" />

<!-- full pie: thickness 0 -->
<mk-donut-chart [slices]="traffic" [thickness]="0" />`;

  protected readonly scatterCode = `<mk-scatter-chart xLabel="Spend ($)" yLabel="Revenue ($)"
  [series]="spendRevenue" />

<!-- bubble: size each point -->
<mk-scatter-chart bubble xLabel="Reach" yLabel="Engagement"
  [series]="bubbleData" />`;

  protected readonly heatmapCode = `<mk-heatmap [xLabels]="hours" [yLabels]="days"
  [data]="activity" showValues />`;
}
