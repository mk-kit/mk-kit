import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkCalendar,
  MkDatePicker,
  MkDateRangePicker,
  MkMonthPicker,
  MkTimePicker,
  MkWeekPicker,
  type MkDateRange,
  type MkWeek,
  formatDate,
} from '@mkornas/ui';
import { DocsExample } from '../../shared/docs-example';

/**
 * Documentation + live demo page for the DATE & TIME components of `@mkornas/ui`:
 * Calendar, DatePicker, TimePicker and DateRangePicker. Every control is
 * signal-driven and implements a two-way `value` model (the pickers are also
 * `ControlValueAccessor`s, so they work with `[(ngModel)]` and reactive forms).
 */
@Component({
  selector: 'docs-date-time-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsExample, MkCalendar, MkDatePicker, MkTimePicker, MkDateRangePicker, MkMonthPicker, MkWeekPicker],
  template: `
    <div class="docs-page docs-container">
      <h1>Date &amp; time</h1>
      <p class="docs-lead">
        Accessible, signal-driven date and time controls built on a shared
        <code class="docs-inline">mk-calendar</code> core. Each exposes a two-way
        <code class="docs-inline">[(value)]</code> model; the three pickers also
        implement <code class="docs-inline">ControlValueAccessor</code>, so they
        drop into <code class="docs-inline">[(ngModel)]</code> and reactive forms.
        Dates are formatted with the exported
        <code class="docs-inline">formatDate(date, pattern)</code> helper.
      </p>

      <!-- ============================================================ -->
      <!-- CALENDAR -->
      <!-- ============================================================ -->
      <h2>Calendar</h2>
      <p>
        <code class="docs-inline">&lt;mk-calendar&gt;</code> is an accessible
        month-grid following the WAI-ARIA grid pattern. With a day focused: Arrow
        keys move by day/week, Home/End jump to the week edges, PageUp/PageDown
        change month (add Shift for year) and Enter/Space selects. A roving
        tabindex keeps a single tab stop and month changes are announced. It holds
        a two-way <code class="docs-inline">[(value)]</code> and also emits
        <code class="docs-inline">dateSelected</code>.
      </p>

      <docs-example [code]="calendarCode" [column]="true">
        <mk-calendar [(value)]="calDate" [firstDayOfWeek]="1" />
        <p class="echo">Selected: {{ calDate() ? formatDate(calDate()!, 'ddd, MMMM d, yyyy') : '—' }}</p>
      </docs-example>

      <p>
        A <code class="docs-inline">disabledDate</code> predicate greys out
        individual days — here, weekends — while <code class="docs-inline">min</code>
        and <code class="docs-inline">max</code> bound the selectable window.
      </p>

      <docs-example [code]="calendarDisabledCode" [column]="true">
        <mk-calendar [(value)]="calDate2" [disabledDate]="isWeekend" />
        <p class="echo">Weekdays only: {{ calDate2() ? formatDate(calDate2()!, 'ddd, MMM d yyyy') : '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;Date | null&gt;</td><td>null</td><td>Two-way selected date.</td></tr>
          <tr><td>min</td><td>Date | null</td><td>null</td><td>Earliest selectable date (inclusive, day granularity).</td></tr>
          <tr><td>max</td><td>Date | null</td><td>null</td><td>Latest selectable date (inclusive, day granularity).</td></tr>
          <tr><td>firstDayOfWeek</td><td>number (0–6)</td><td>0</td><td>First column of the week; 0 = Sunday … 6 = Saturday.</td></tr>
          <tr><td>disabledDate</td><td>((d: Date) =&gt; boolean) | null</td><td>null</td><td>Predicate marking individual days disabled.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size.</td></tr>
          <tr><td>dateSelected</td><td>output&lt;Date&gt;</td><td>—</td><td>Emitted whenever a non-disabled day is activated.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- DATE PICKER -->
      <!-- ============================================================ -->
      <h2>Date picker</h2>
      <p>
        <code class="docs-inline">&lt;mk-date-picker&gt;</code> pairs a text field
        with the calendar popover: type a date (parsed on blur/Enter) or pick one.
        The panel opens below the field, closes on Escape / outside click / after a
        selection, and wires <code class="docs-inline">aria-expanded</code> /
        <code class="docs-inline">aria-haspopup</code>. Below it is bounded to a
        30-day window with <code class="docs-inline">min</code>/<code class="docs-inline">max</code>
        and made <code class="docs-inline">clearable</code>.
      </p>

      <docs-example [code]="datePickerCode" [column]="true">
        <mk-date-picker
          [(value)]="picked"
          [min]="today"
          [max]="inThirtyDays"
          clearable
          placeholder="Pick a date…"
        />
        <p class="echo">Picked: {{ picked() ? formatDate(picked()!, 'MMMM d, yyyy') : '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;Date | null&gt;</td><td>null</td><td>Two-way selected date ([(value)] / [(ngModel)]).</td></tr>
          <tr><td>min</td><td>Date | null</td><td>null</td><td>Earliest selectable date (inclusive).</td></tr>
          <tr><td>max</td><td>Date | null</td><td>null</td><td>Latest selectable date (inclusive).</td></tr>
          <tr><td>placeholder</td><td>string</td><td>'Select date…'</td><td>Shown when empty.</td></tr>
          <tr><td>displayFormat</td><td>string</td><td>'MMM d, yyyy'</td><td>Pattern used to render the selected date in the field.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>clearable</td><td>boolean</td><td>false</td><td>Show a clear button when a date is selected.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling + aria-invalid.</td></tr>
          <tr><td>firstDayOfWeek</td><td>number (0–6)</td><td>0</td><td>First column of the calendar week.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- TIME PICKER -->
      <!-- ============================================================ -->
      <h2>Time picker</h2>
      <p>
        <code class="docs-inline">&lt;mk-time-picker&gt;</code> is a 24-hour-canonical
        time field: the model is always an <code class="docs-inline">'HH:mm'</code>
        string regardless of display. Type a time (<code class="docs-inline">14:30</code>,
        <code class="docs-inline">2:30 pm</code>) or pick from an ARIA listbox
        (Up/Down/Home/End/Enter/Esc). The list is generated from
        <code class="docs-inline">step</code> (minutes). First example: 15-minute
        steps, 24h. Second: 30-minute steps rendered as 12-hour with AM/PM.
      </p>

      <docs-example [code]="timePickerCode" [column]="true">
        <mk-time-picker [(value)]="time" [step]="15" clearable placeholder="HH:mm" />
        <p class="echo">Time (HH:mm): {{ time() ?? '—' }}</p>
      </docs-example>

      <docs-example [code]="timePicker12Code" [column]="true">
        <mk-time-picker [(value)]="time12" [step]="30" hour12 clearable />
        <p class="echo">Canonical value: {{ time12() ?? '—' }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string | null&gt;</td><td>null</td><td>Two-way time as canonical 'HH:mm' (24h).</td></tr>
          <tr><td>min</td><td>string | null</td><td>null</td><td>Earliest selectable time 'HH:mm' (inclusive).</td></tr>
          <tr><td>max</td><td>string | null</td><td>null</td><td>Latest selectable time 'HH:mm' (inclusive).</td></tr>
          <tr><td>step</td><td>number</td><td>30</td><td>Interval between generated options, in minutes.</td></tr>
          <tr><td>hour12</td><td>boolean</td><td>false</td><td>Display 12-hour time with AM/PM (the model stays 24h).</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>placeholder</td><td>string</td><td>'Select time…'</td><td>Shown when empty.</td></tr>
          <tr><td>clearable</td><td>boolean</td><td>false</td><td>Show a clear button when a time is selected.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling + aria-invalid.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- DATE RANGE PICKER -->
      <!-- ============================================================ -->
      <h2>Date range picker</h2>
      <p>
        <code class="docs-inline">&lt;mk-date-range-picker&gt;</code> selects a start
        and end date from one calendar popover. The first click sets the start, the
        second the end (endpoints swap if picked in reverse), and the hovered range
        is previewed live. Its model is a
        <code class="docs-inline">MkDateRange</code> —
        <code class="docs-inline">&#123; start: Date | null; end: Date | null &#125;</code>.
      </p>

      <docs-example [code]="rangePickerCode" [column]="true">
        <mk-date-range-picker [(value)]="range" [firstDayOfWeek]="1" clearable />
        <p class="echo">Range: {{ rangeLabel() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;MkDateRange&gt;</td><td>&#123; start: null, end: null &#125;</td><td>Two-way selected range.</td></tr>
          <tr><td>min</td><td>Date | null</td><td>null</td><td>Earliest selectable date (inclusive).</td></tr>
          <tr><td>max</td><td>Date | null</td><td>null</td><td>Latest selectable date (inclusive).</td></tr>
          <tr><td>disabledDate</td><td>((d: Date) =&gt; boolean) | null</td><td>null</td><td>Predicate marking individual days disabled.</td></tr>
          <tr><td>placeholder</td><td>string</td><td>'Select range…'</td><td>Shown when no range is selected.</td></tr>
          <tr><td>displayFormat</td><td>string</td><td>'MMM d, yyyy'</td><td>Pattern used to render each endpoint.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>clearable</td><td>boolean</td><td>false</td><td>Show a clear button when a range is selected.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling + aria-invalid.</td></tr>
          <tr><td>firstDayOfWeek</td><td>number (0–6)</td><td>0</td><td>First column of the calendar week.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- MONTH / YEAR PICKER -->
      <!-- ============================================================ -->
      <h2>Month &amp; year picker</h2>
      <p>
        <code class="docs-inline">&lt;mk-month-picker&gt;</code> is a compact field
        for picking a <strong>month</strong> (<code class="docs-inline">MMM yyyy</code>)
        or, with <code class="docs-inline">mode="year"</code>, a whole
        <strong>year</strong>. The popover shows a 12-month grid (year nav) or a
        12-year decade grid, with arrow-key roving focus. Its model is a
        <code class="docs-inline">Date</code> at the first day of the selection.
      </p>

      <docs-example [code]="monthPickerCode" [column]="true">
        <div class="row">
          <mk-month-picker [(value)]="month" clearable placeholder="Pick a month…" />
          <mk-month-picker mode="year" [(value)]="year" clearable placeholder="Pick a year…" />
        </div>
        <p class="echo">
          Month: {{ month() ? formatDate(month()!, 'MMMM yyyy') : '—' }} ·
          Year: {{ year() ? year()!.getFullYear() : '—' }}
        </p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;Date | null&gt;</td><td>null</td><td>Two-way selected date (first of the month / year).</td></tr>
          <tr><td>mode</td><td>'month' | 'year'</td><td>'month'</td><td>Pick a month or a whole year.</td></tr>
          <tr><td>min</td><td>Date | null</td><td>null</td><td>Earliest selectable date (inclusive).</td></tr>
          <tr><td>max</td><td>Date | null</td><td>null</td><td>Latest selectable date (inclusive).</td></tr>
          <tr><td>displayFormat</td><td>string</td><td>'MMM yyyy' / 'yyyy'</td><td>Pattern used to render the trigger label.</td></tr>
          <tr><td>placeholder</td><td>string</td><td>'Select month…'</td><td>Shown when empty.</td></tr>
          <tr><td>disabled</td><td>boolean</td><td>false</td><td>Disable the control.</td></tr>
          <tr><td>clearable</td><td>boolean</td><td>false</td><td>Show a clear button when a value is selected.</td></tr>
          <tr><td>invalid</td><td>boolean</td><td>false</td><td>Force invalid styling + aria-invalid.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- WEEK PICKER -->
      <!-- ============================================================ -->
      <h2>Week picker</h2>
      <p>
        <code class="docs-inline">&lt;mk-week-picker&gt;</code> selects a whole
        calendar week from the popover calendar — hover a day to preview its week,
        click to select. Its model is an
        <code class="docs-inline">MkWeek</code> —
        <code class="docs-inline">&#123; start: Date; end: Date &#125;</code>,
        aligned to <code class="docs-inline">firstDayOfWeek</code>. Set
        <code class="docs-inline">showWeekNumber</code> to prefix the ISO week.
      </p>

      <docs-example [code]="weekPickerCode" [column]="true">
        <mk-week-picker
          [(value)]="week"
          [firstDayOfWeek]="1"
          showWeekNumber
          clearable
        />
        <p class="echo">Week: {{ weekLabel() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;MkWeek | null&gt;</td><td>null</td><td>Two-way selected week (start/end, aligned to firstDayOfWeek).</td></tr>
          <tr><td>min</td><td>Date | null</td><td>null</td><td>Earliest selectable date (inclusive).</td></tr>
          <tr><td>max</td><td>Date | null</td><td>null</td><td>Latest selectable date (inclusive).</td></tr>
          <tr><td>firstDayOfWeek</td><td>number (0–6)</td><td>0</td><td>First column of the week; also anchors the selected week.</td></tr>
          <tr><td>displayFormat</td><td>string</td><td>'MMM d'</td><td>Pattern used to render each endpoint.</td></tr>
          <tr><td>showWeekNumber</td><td>boolean</td><td>false</td><td>Prefix the label with the ISO week number.</td></tr>
          <tr><td>placeholder</td><td>string</td><td>'Select week…'</td><td>Shown when empty.</td></tr>
          <tr><td>clearable</td><td>boolean</td><td>false</td><td>Show a clear button when a week is selected.</td></tr>
          <tr><td>disabled / invalid</td><td>boolean</td><td>false</td><td>Disable / force invalid styling.</td></tr>
          <tr><td>size</td><td>'sm' | 'md' | 'lg'</td><td>'md'</td><td>Control size. Ignored inside an mk-form-field.</td></tr>
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
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mk-space-4);
      }
      .row > * {
        flex: 1 1 12rem;
      }
    `,
  ],
})
export class DateTimePage {
  /** Exposed to the template for live-value echo lines. */
  protected readonly formatDate = formatDate;

  // --- Calendar -------------------------------------------------------------
  protected readonly calDate = signal<Date | null>(new Date());
  protected readonly calDate2 = signal<Date | null>(null);
  protected readonly isWeekend = (d: Date): boolean => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  // --- Date picker ----------------------------------------------------------
  protected readonly today = startOfToday();
  protected readonly inThirtyDays = new Date(this.today.getTime() + 30 * 24 * 60 * 60 * 1000);
  protected readonly picked = signal<Date | null>(null);

  // --- Time picker ----------------------------------------------------------
  protected readonly time = signal<string | null>('09:15');
  protected readonly time12 = signal<string | null>('14:30');

  // --- Month / year picker --------------------------------------------------
  protected readonly month = signal<Date | null>(null);
  protected readonly year = signal<Date | null>(null);

  // --- Week picker ----------------------------------------------------------
  protected readonly week = signal<MkWeek | null>(null);
  protected readonly weekLabel = computed(() => {
    const w = this.week();
    if (!w) return '—';
    return `${formatDate(w.start, 'MMM d')} → ${formatDate(w.end, 'MMM d, yyyy')}`;
  });

  // --- Date range picker ----------------------------------------------------
  protected readonly range = signal<MkDateRange>({ start: null, end: null });
  protected readonly rangeLabel = computed(() => {
    const { start, end } = this.range();
    if (!start && !end) return '—';
    const s = start ? formatDate(start, 'MMM d, yyyy') : '…';
    const e = end ? formatDate(end, 'MMM d, yyyy') : '…';
    return `${s} → ${e}`;
  });

  // --- Code snippets (plain strings shown in the code blocks) ---------------
  protected readonly calendarCode = `calDate = signal<Date | null>(new Date());

<mk-calendar [(value)]="calDate" [firstDayOfWeek]="1" />`;

  protected readonly calendarDisabledCode = `isWeekend = (d: Date) => {
  const day = d.getDay();
  return day === 0 || day === 6;
};

<mk-calendar [(value)]="calDate2" [disabledDate]="isWeekend" />`;

  protected readonly datePickerCode = `picked = signal<Date | null>(null);
today = startOfToday();
inThirtyDays = new Date(this.today.getTime() + 30 * 864e5);

<mk-date-picker
  [(value)]="picked"
  [min]="today"
  [max]="inThirtyDays"
  clearable
  placeholder="Pick a date…"
/>`;

  protected readonly timePickerCode = `time = signal<string | null>('09:15');

<mk-time-picker [(value)]="time" [step]="15" clearable placeholder="HH:mm" />`;

  protected readonly timePicker12Code = `time12 = signal<string | null>('14:30');

<!-- Displayed as 12-hour AM/PM; the model stays canonical 24h 'HH:mm'. -->
<mk-time-picker [(value)]="time12" [step]="30" hour12 clearable />`;

  protected readonly rangePickerCode = `range = signal<MkDateRange>({ start: null, end: null });

<mk-date-range-picker [(value)]="range" [firstDayOfWeek]="1" clearable />`;

  protected readonly monthPickerCode = `month = signal<Date | null>(null);
year = signal<Date | null>(null);

<mk-month-picker [(value)]="month" clearable placeholder="Pick a month…" />
<mk-month-picker mode="year" [(value)]="year" clearable placeholder="Pick a year…" />`;

  protected readonly weekPickerCode = `week = signal<MkWeek | null>(null);

<mk-week-picker [(value)]="week" [firstDayOfWeek]="1" showWeekNumber clearable />`;
}

/** Local midnight for today. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
