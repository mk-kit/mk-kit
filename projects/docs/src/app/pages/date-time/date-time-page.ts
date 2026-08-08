import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  MkCalendar,
  MkDatePicker,
  MkDateRangePicker,
  MkEventCalendar,
  MkMiniDate,
  MkMonthPicker,
  MkTimePicker,
  MkWeekPicker,
  type MkCalendarEvent,
  type MkCalendarEventEdit,
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
  imports: [DocsExample, MkCalendar, MkDatePicker, MkTimePicker, MkDateRangePicker, MkMonthPicker, MkWeekPicker, MkEventCalendar, MkMiniDate],
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

      <p><strong>Keyboard:</strong></p>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd></td><td>Move focus one day back / forward (crossing a month boundary updates the view).</td></tr>
          <tr><td><kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd></td><td>Move focus one week back / forward.</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>Move focus to the first / last day of the focused week.</td></tr>
          <tr><td><kbd>PageUp</kbd> / <kbd>PageDown</kbd></td><td>Move focus to the same day in the previous / next month.</td></tr>
          <tr><td><kbd>Shift</kbd>+<kbd>PageUp</kbd> / <kbd>Shift</kbd>+<kbd>PageDown</kbd></td><td>Move focus to the same day in the previous / next year.</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Select the focused day (ignored when the day is disabled).</td></tr>
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

      <p>
        With <code class="docs-inline">valueFormat="date"</code> the value is a
        <code class="docs-inline">Date</code> whose <em>local</em> hours and
        minutes carry the time (seconds and milliseconds zeroed) — for hosts
        whose model is a datetime. Either shape may be written back in either
        mode; only the emitted value changes. The date part comes from the
        current value when that is already a
        <code class="docs-inline">Date</code> (so repeated edits never drift the
        day), otherwise from today.
      </p>

      <docs-example [code]="timePickerDateCode" [column]="true">
        <mk-time-picker valueFormat="date" [(value)]="timeAsDate" [step]="15" clearable />
        <p class="echo">Date value: {{ timeAsDateLabel() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>value</td><td>model&lt;string | Date | null&gt;</td><td>null</td><td>Two-way time: canonical 'HH:mm' (24h), or a Date in date mode.</td></tr>
          <tr><td>valueFormat</td><td>'string' | 'date'</td><td>'string'</td><td>Shape of the emitted value.</td></tr>
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

      <!-- ============================================================ -->
      <!-- EVENT CALENDAR -->
      <!-- ============================================================ -->
      <h2>Event calendar</h2>
      <p>
        <code class="docs-inline">&lt;mk-event-calendar&gt;</code> is a
        month-grid scheduler (with timed week/day views — see below): it plots
        <code class="docs-inline">MkCalendarEvent</code>s —
        <code class="docs-inline">&#123; date, title, color?, id? &#125;</code> — as
        coloured pills on the day they fall on, capped at
        <code class="docs-inline">maxPerDay</code> with a "+N more" line for the rest.
        It exposes the viewed month as a two-way
        <code class="docs-inline">[(viewDate)]</code> and emits
        <code class="docs-inline">dayClick</code> /
        <code class="docs-inline">eventClick</code>.
      </p>

      <docs-example [code]="eventCalendarCode" [column]="true">
        <mk-event-calendar
          [events]="events()"
          [(viewDate)]="calMonth"
          [firstDayOfWeek]="1"
          (dayClick)="onDayClick($event)"
          (eventClick)="onEventClick($event)"
        />
        <p class="echo">Last activity: {{ lastActivity() }}</p>
      </docs-example>

      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>events</td><td>readonly MkCalendarEvent[]</td><td>[]</td><td>Events to plot onto the grid.</td></tr>
          <tr><td>viewDate</td><td>model&lt;Date&gt;</td><td>new Date()</td><td>Two-way month being viewed (any day within it).</td></tr>
          <tr><td>firstDayOfWeek</td><td>number (0–6)</td><td>0</td><td>First column of the week; 0 = Sunday … 6 = Saturday.</td></tr>
          <tr><td>maxPerDay</td><td>number</td><td>3</td><td>Max event pills per day before collapsing into "+N more".</td></tr>
          <tr><td>dayClick</td><td>output&lt;Date&gt;</td><td>—</td><td>Emitted when a day cell is activated.</td></tr>
          <tr><td>eventClick</td><td>output&lt;MkCalendarEvent&gt;</td><td>—</td><td>Emitted when an event pill is activated (does not also fire dayClick).</td></tr>
          <tr><td>monthChange</td><td>output&lt;Date&gt;</td><td>—</td><td>Emitted when the viewed month changes via prev/next.</td></tr>
        </tbody>
      </table>

      <h3>Editable time grid</h3>
      <p>
        <code class="docs-inline">[view]</code> switches the calendar to a
        timed <code class="docs-inline">week</code> or
        <code class="docs-inline">day</code> grid spanning
        <code class="docs-inline">dayStartHour</code>–<code class="docs-inline">dayEndHour</code>.
        Events with a <code class="docs-inline">start</code> instant (and an
        optional <code class="docs-inline">end</code>, defaulting to 30
        minutes) are positioned on the grid; events without one land in the
        all-day strip. With <code class="docs-inline">editable</code>, pills
        can be rescheduled by pointer <em>and</em> keyboard: drag a pill to
        move it, drag its bottom edge to resize it. The calendar
        <strong>never mutates <code class="docs-inline">events</code></strong>
        — it emits the would-be range via
        <code class="docs-inline">(eventMove)</code> /
        <code class="docs-inline">(eventResize)</code> and the consumer applies
        (or rejects) the change, typically with a map-and-replace on its own
        events signal, as below.
      </p>
      <docs-example [code]="editableCalendarCode" [column]="true">
        <mk-event-calendar
          view="week"
          editable
          [events]="weekEvents()"
          [(viewDate)]="weekDate"
          [firstDayOfWeek]="1"
          [dayStartHour]="8"
          [dayEndHour]="18"
          [snapMinutes]="15"
          (eventMove)="onEventMove($event)"
          (eventResize)="onEventResize($event)"
        />
        <p class="echo">Last change: {{ lastEdit() }}</p>
      </docs-example>

      <p>
        <strong>Snapping:</strong> pointer drags and keyboard steps both snap
        to the <code class="docs-inline">snapMinutes</code> grid (default 15),
        which is also the minimum event duration a resize can reach — the end
        never gets closer than one snap step to the start.
      </p>

      <p><strong>Keyboard:</strong> (on a focused event pill, WCAG 2.5.7 — no drag required)</p>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>Arm "move mode" on the focused pill (also swallows the click, so <code>eventClick</code> does not fire).</td></tr>
          <tr><td><kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd></td><td>Move the event earlier / later by <code>snapMinutes</code>.</td></tr>
          <tr><td><kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd></td><td>Move the event to the previous / next day column (week view).</td></tr>
          <tr><td><kbd>Shift</kbd>+<kbd>ArrowUp</kbd> / <kbd>Shift</kbd>+<kbd>ArrowDown</kbd></td><td>Resize: shrink / grow the end time by <code>snapMinutes</code> (never below one snap step of duration).</td></tr>
          <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd> (again)</td><td>Commit — emits <code>eventMove</code>, or <code>eventResize</code> when only the end changed.</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Cancel — the pill snaps back, nothing is emitted. (Escape also aborts an in-flight pointer drag; losing focus mid-move cancels too.)</td></tr>
        </tbody>
      </table>
      <p>
        Every grab, step, commit and cancel is announced to screen readers via
        the live announcer.
      </p>

      <p><strong>Week/day view additions:</strong></p>
      <table class="docs-props">
        <thead>
          <tr><th>Input / Output</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>view</td><td>model&lt;'month' | 'week' | 'day'&gt;</td><td>'month'</td><td>Two-way presentation: the classic month grid, or a timed week/day grid. Prev/next then steps by 7 days / 1 day.</td></tr>
          <tr><td>dayStartHour / dayEndHour</td><td>number</td><td>8 / 22</td><td>Visible hour range of the time grid (end exclusive).</td></tr>
          <tr><td>editable</td><td>boolean</td><td>false</td><td>Enable drag/keyboard rescheduling on the week/day grids. Off = no handles, no ARIA additions, no drag behaviour.</td></tr>
          <tr><td>snapMinutes</td><td>number</td><td>15</td><td>Snap grid (minutes) for drag/keyboard edits; also the minimum duration.</td></tr>
          <tr><td>slotClick</td><td>output&lt;Date&gt;</td><td>—</td><td>An empty hour slot was clicked — emits the slot's start instant.</td></tr>
          <tr><td>eventMove / eventResize</td><td>output&lt;MkCalendarEventEdit&gt;</td><td>—</td><td>The would-be edit: <code>&#123; event, start, end &#125;</code> — the untouched source event plus the new (snapped) range. Applying it is your job.</td></tr>
          <tr><td>MkCalendarEvent.start / end</td><td>Date (optional)</td><td>—</td><td>Start/end instants positioning the event on the time grid; a missing <code>end</code> reads as 30 minutes, no <code>start</code> puts the event in the all-day strip.</td></tr>
        </tbody>
      </table>

      <!-- ============================================================ -->
      <!-- MINI DATE -->
      <!-- ============================================================ -->
      <h2>Mini date</h2>
      <p>
        <code class="docs-inline">&lt;mk-mini-date&gt;</code> is a compact,
        popover-free date editor: three segmented day / month / year spin fields.
        Type digits, or use Up/Down to step and Left/Right to move between
        segments. Its model is a <code class="docs-inline">Date | null</code>.
      </p>
      <docs-example [code]="miniDateCode" [column]="true">
        <mk-mini-date [(value)]="mini" order="dmy" />
        <p class="echo">Value: {{ mini() ? formatDate(mini()!, 'MMM d, yyyy') : '—' }}</p>
      </docs-example>

      <p><strong>Keyboard:</strong> (per focused segment — each is an ARIA spinbutton)</p>
      <table class="docs-props">
        <thead>
          <tr><th>Key</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>0</kbd>–<kbd>9</kbd></td><td>Type into the segment (OTP-style buffer); auto-advances to the next segment when full or when another digit could only overflow.</td></tr>
          <tr><td><kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd></td><td>Step the segment value up / down (day wraps within the month, month wraps 1–12, year clamps to <code>yearMin</code>/<code>yearMax</code>).</td></tr>
          <tr><td><kbd>ArrowLeft</kbd> / <kbd>ArrowRight</kbd></td><td>Move focus to the previous / next segment.</td></tr>
          <tr><td><kbd>Home</kbd> / <kbd>End</kbd></td><td>Set the segment to its minimum / maximum value.</td></tr>
          <tr><td><kbd>Backspace</kbd></td><td>Clear the segment and move focus to the previous segment.</td></tr>
          <tr><td><kbd>Delete</kbd></td><td>Clear the segment (focus stays).</td></tr>
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
  protected readonly timeAsDate = signal<string | Date | null>(new Date());
  protected readonly timeAsDateLabel = computed(() => {
    const v = this.timeAsDate();
    if (!(v instanceof Date)) return '—';
    const p = (n: number) => `${n}`.padStart(2, '0');
    const time = `${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
    return `${formatDate(v, 'MMM d, yyyy')} ${time}`;
  });

  // --- Month / year picker --------------------------------------------------
  protected readonly month = signal<Date | null>(null);
  protected readonly year = signal<Date | null>(null);

  // --- Week picker ----------------------------------------------------------
  protected readonly week = signal<MkWeek | null>(null);
  protected readonly mini = signal<Date | null>(new Date());
  protected readonly miniDateCode = `<mk-mini-date [(value)]="date" order="dmy" />`;
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

  // --- Event calendar -------------------------------------------------------
  protected readonly calMonth = signal<Date>(new Date());
  protected readonly events = signal<readonly MkCalendarEvent[]>(eventsThisMonth());
  protected readonly lastActivity = signal<string>('—');

  protected onDayClick(d: Date): void {
    this.lastActivity.set(`Day clicked: ${formatDate(d, 'MMM d, yyyy')}`);
  }

  protected onEventClick(event: MkCalendarEvent): void {
    this.lastActivity.set(`Event clicked: ${event.title} (${formatDate(event.date, 'MMM d')})`);
  }

  // --- Editable time grid ---------------------------------------------------
  protected readonly weekDate = signal<Date>(new Date());
  protected readonly weekEvents = signal<readonly MkCalendarEvent[]>(seedWeekEvents());
  protected readonly lastEdit = signal<string>('—');

  protected onEventMove(edit: MkCalendarEventEdit): void {
    this.applyEdit(edit);
    this.lastEdit.set(
      `Moved "${edit.event.title}" to ${formatDate(edit.start, 'ddd')} ${hm(edit.start)} – ${hm(edit.end)}`,
    );
  }

  protected onEventResize(edit: MkCalendarEventEdit): void {
    this.applyEdit(edit);
    this.lastEdit.set(
      `Resized "${edit.event.title}" to ${hm(edit.start)} – ${hm(edit.end)}`,
    );
  }

  /** The documented map-and-replace: swap the edited event for a new object. */
  private applyEdit({ event, start, end }: MkCalendarEventEdit): void {
    this.weekEvents.update((events) =>
      events.map((e) => (e === event ? { ...e, date: start, start, end } : e)),
    );
  }

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

  protected readonly timePickerDateCode = `pickupAt = signal<Date | null>(new Date());

<!-- The value is a Date; its local hours/minutes carry the picked time. -->
<mk-time-picker valueFormat="date" [(value)]="pickupAt" [step]="15" clearable />`;

  protected readonly rangePickerCode = `range = signal<MkDateRange>({ start: null, end: null });

<mk-date-range-picker [(value)]="range" [firstDayOfWeek]="1" clearable />`;

  protected readonly monthPickerCode = `month = signal<Date | null>(null);
year = signal<Date | null>(null);

<mk-month-picker [(value)]="month" clearable placeholder="Pick a month…" />
<mk-month-picker mode="year" [(value)]="year" clearable placeholder="Pick a year…" />`;

  protected readonly weekPickerCode = `week = signal<MkWeek | null>(null);

<mk-week-picker [(value)]="week" [firstDayOfWeek]="1" showWeekNumber clearable />`;

  protected readonly eventCalendarCode = `const now = new Date();
events = signal<MkCalendarEvent[]>([
  { date: new Date(now.getFullYear(), now.getMonth(), 5), title: 'Kickoff' },
  { date: new Date(now.getFullYear(), now.getMonth(), 12), title: 'Design review', color: 'var(--mk-success)' },
  { date: new Date(now.getFullYear(), now.getMonth(), 18), title: 'Sprint demo' },
  { date: new Date(now.getFullYear(), now.getMonth(), 18), title: 'Retro' },
  { date: new Date(now.getFullYear(), now.getMonth(), 24), title: 'Release', color: 'var(--mk-warning)' },
]);
calMonth = signal<Date>(new Date());

<mk-event-calendar
  [events]="events()"
  [(viewDate)]="calMonth"
  [firstDayOfWeek]="1"
  (dayClick)="onDayClick($event)"
  (eventClick)="onEventClick($event)"
/>`;

  protected readonly editableCalendarCode = `events = signal<MkCalendarEvent[]>([
  { date: mon9, start: mon9, end: mon930, title: 'Standup' },
  // …
]);

onEventMove({ event, start, end }: MkCalendarEventEdit): void {
  // The calendar never mutates events — apply the change yourself:
  this.events.update((all) =>
    all.map((e) => (e === event ? { ...e, date: start, start, end } : e)),
  );
}

<mk-event-calendar
  view="week"
  editable
  [events]="events()"
  [snapMinutes]="15"
  [dayStartHour]="8"
  [dayEndHour]="18"
  (eventMove)="onEventMove($event)"
  (eventResize)="onEventMove($event)"
/>`;
}

/** ~5 events scattered across the current month for the event-calendar demo. */
function eventsThisMonth(): MkCalendarEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { date: new Date(y, m, 5), title: 'Kickoff' },
    { date: new Date(y, m, 12), title: 'Design review', color: 'var(--mk-success)' },
    { date: new Date(y, m, 18), title: 'Sprint demo' },
    { date: new Date(y, m, 18), title: 'Retro' },
    { date: new Date(y, m, 24), title: 'Release', color: 'var(--mk-warning)' },
  ];
}

/** `HH:mm` of a Date's local time. */
function hm(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Seed events for the editable week demo: fixed offsets from this week's
 * Monday (deterministic — nothing random, just the current week).
 */
function seedWeekEvents(): MkCalendarEvent[] {
  const today = startOfToday();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const at = (dayOffset: number, hour: number, minute: number, durationMin: number, title: string, color?: string): MkCalendarEvent => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + dayOffset);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + durationMin * 60_000);
    return { date: start, start, end, title, color };
  };
  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2);
  return [
    at(0, 9, 0, 30, 'Standup', 'var(--mk-success)'),
    at(1, 10, 0, 90, 'Design review'),
    at(2, 13, 0, 60, 'Lunch & learn', 'var(--mk-warning)'),
    at(3, 9, 30, 45, 'Sprint planning'),
    at(4, 15, 0, 60, 'Demo', 'var(--mk-info)'),
    // No `start` — renders in the all-day strip.
    { date: wednesday, title: 'Release freeze' },
  ];
}

/** Local midnight for today. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
