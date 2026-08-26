import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import type { MkSize } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { mkValidatorChange } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkAnchoredPanel } from '@mk-kit/ui/core';
import { MkFormField } from '@mk-kit/ui/forms';

/** A selectable time option. */
interface MkTimeOption {
  /** Canonical `HH:mm` (24h) value. */
  value: string;
  /** Display label (respects `hour12`). */
  label: string;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * TimePicker — a 24-hour-canonical time field with an editable input plus a
 * scrollable list of times generated from `step`. The time itself is always
 * 24h canonical regardless of the `hour12` display. Implements
 * `ControlValueAccessor` and a two-way `value` model.
 *
 * The form value is either a `HH:mm` string (`"14:30"`, default) or a `Date`
 * carrying the time in its **local** hours/minutes (`valueFormat="date"`, for
 * hosts whose model is a datetime — e.g. migrating off Material's
 * `mat-timepicker`); both modes read back either shape and `null` when empty.
 * Only the *emitted* value depends on `valueFormat` — internally the time is
 * always normalised to `HH:mm`, which is also what `min` / `max` compare.
 *
 * In `date` mode seconds and milliseconds are zeroed, and the **date part** is
 * taken from the current model value when that is already a `Date` (so editing
 * the time repeatedly never drifts the day); otherwise today's local date is
 * used. Assign a `Date` first if the day matters.
 *
 * Type a time (`14:30`, `2:30 pm`) or pick from the ARIA listbox
 * (Up/Down/Home/End/Enter/Esc; the active option scrolls into view). When
 * nested in an `mk-form-field` it adopts the field's id and aria wiring.
 *
 * ```html
 * <mk-time-picker [(value)]="time" [step]="15" hour12 clearable />
 * <mk-time-picker valueFormat="date" [(value)]="pickupAt" [step]="15" />
 * ```
 */
@Component({
  selector: 'mk-time-picker',
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-time-picker',
    '[class.mk-time-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-time-picker--md]': "effectiveSize() === 'md'",
    '[class.mk-time-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-time-picker--open]': 'open()',
    '[class.mk-time-picker--invalid]': 'isInvalid()',
    '[class.mk-time-picker--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkTimePicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkTimePicker),
      multi: true,
    },
  ],
})
export class MkTimePicker implements ControlValueAccessor, Validator {
  protected readonly i18n = inject(MK_I18N);
  private readonly field = inject(MkFormField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('textInput');
  /** The listbox panel — lives in the top layer once opened. */
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');

  /**
   * Two-way selected time: a canonical `HH:mm` (24h) string, a `Date` when
   * `valueFormat="date"`, or `null`. Either shape may be assigned in either
   * mode; it is normalised to the configured format.
   */
  readonly value = model<string | Date | null>(null);
  /** Shape of the form value: a `HH:mm` string or a `Date`. */
  readonly valueFormat = input<'string' | 'date'>('string');
  /** Earliest selectable time `HH:mm` (inclusive). */
  readonly min = input<string | null>(null);
  /** Latest selectable time `HH:mm` (inclusive). */
  readonly max = input<string | null>(null);
  /** Interval between generated options, in minutes. */
  readonly step = input(30, { transform: numberAttribute });
  /** Display 12-hour time with AM/PM (the model stays 24h). */
  readonly hour12 = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Placeholder shown when empty. */
  readonly placeholder = input(this.i18n.selectTime);
  /** Show a clear button when a time is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling + `aria-invalid`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly inputText = signal('');
  /** The canonical `HH:mm` time behind whatever shape `value` carries. */
  private readonly time = signal<string | null>(null);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string | Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  /** The last value this component itself wrote into the `value` model. */
  private lastDerived: string | Date | null = null;
  /** The day `date`-mode values land on — see {@link toDate}. */
  private datePart: Date | null = null;

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-time-picker');
  readonly listId = mkUniqueId('mk-time-picker-list');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);
  protected readonly showClear = computed(
    () => this.clearable() && !!this.time() && !this.isDisabled(),
  );

  /** Generated, min/max-filtered list of selectable times. */
  protected readonly options = computed<MkTimeOption[]>(() => {
    const step = Math.max(1, Math.floor(this.step()));
    const min = this.min();
    const max = this.max();
    const out: MkTimeOption[] = [];
    for (let mins = 0; mins < 24 * 60; mins += step) {
      const value = `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
      if (min && value < min) continue;
      if (max && value > max) continue;
      out.push({ value, label: this.display(value) });
    }
    return out;
  });

  protected readonly selectedIndex = computed(() =>
    this.options().findIndex((o) => o.value === this.time()),
  );

  constructor() {
    effect(() => {
      const v = this.time();
      // hour12 is read so the label follows the display mode.
      this.inputText.set(v ? this.display(v) : '');
    });
    // Parse values assigned from outside ([(value)] writes we didn't derive),
    // and re-shape the model when `valueFormat` changes.
    effect(() => {
      const v = this.value();
      const external = v !== this.lastDerived;
      this.valueFormat();
      untracked(() => {
        if (external) this.applyExternal(v);
        this.deriveValue(false);
      });
    });
  }

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  private display(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    if (this.hour12()) {
      const ap = h < 12 ? 'AM' : 'PM';
      const hh = h % 12 || 12;
      return `${hh}:${pad2(m)} ${ap}`;
    }
    return `${pad2(h)}:${pad2(m)}`;
  }

  private parse(text: string): string | null {
    const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(text);
    if (!m) return null;
    let h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    const ap = m[3]?.toLowerCase();
    if (ap) {
      if (h < 1 || h > 12) return null;
      if (ap === 'pm' && h !== 12) h += 12;
      if (ap === 'am' && h === 12) h = 0;
    }
    if (h > 23 || min > 59) return null;
    return `${pad2(h)}:${pad2(min)}`;
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openList();
  }

  protected openList(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
    const sel = this.selectedIndex();
    this.activeIndex.set(sel >= 0 ? sel : 0);
    this.scrollActiveIntoView();
  }

  protected close(): void {
    if (this.open()) {
      this.open.set(false);
      this.activeIndex.set(-1);
    }
  }

  protected selectOption(index: number): void {
    const opt = this.options()[index];
    if (!opt) return;
    this.setValue(opt.value);
    this.close();
    this.inputRef()?.nativeElement.focus();
  }

  protected clear(): void {
    this.setValue(null);
    this.inputRef()?.nativeElement.focus();
  }

  protected onInput(event: Event): void {
    this.inputText.set((event.target as HTMLInputElement).value);
  }

  protected onInputKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;

    if (!this.open()) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.openList();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.commitInput();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.activeIndex.set(0);
        this.scrollActiveIntoView();
        break;
      case 'End':
        e.preventDefault();
        this.activeIndex.set(this.options().length - 1);
        this.scrollActiveIntoView();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.activeIndex() >= 0) this.selectOption(this.activeIndex());
        else this.commitInput();
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  private moveActive(delta: number): void {
    const len = this.options().length;
    if (!len) return;
    const next = (this.activeIndex() + delta + len) % len;
    this.activeIndex.set(next);
    this.scrollActiveIntoView();
  }

  private commitInput(): void {
    const text = this.inputText().trim();
    if (!text) {
      this.setValue(null);
      this.close();
      return;
    }
    const parsed = this.parse(text);
    if (parsed && this.withinBounds(parsed)) {
      this.setValue(parsed);
    } else {
      const v = this.time();
      this.inputText.set(v ? this.display(v) : '');
    }
    this.close();
  }

  private withinBounds(value: string): boolean {
    const min = this.min();
    const max = this.max();
    if (min && value < min) return false;
    if (max && value > max) return false;
    return true;
  }

  // --- Value plumbing -------------------------------------------------------

  private setValue(value: string | null): void {
    this.time.set(value);
    this.deriveValue(true);
  }

  /** Compute the outward value and push it to the model (+ form when `emit`). */
  private deriveValue(emit: boolean): void {
    const hhmm = this.time();
    const next = hhmm === null ? null : this.valueFormat() === 'date' ? this.toDate(hhmm) : hhmm;
    // Keep the previous instance when it means the same time, so repeated
    // edits don't churn `Date` identities (nor the date part they carry).
    if (!this.sameValue(next, this.lastDerived) || this.value() !== this.lastDerived) {
      this.lastDerived = next;
      this.value.set(next);
    }
    if (emit) this.onChange(this.lastDerived);
  }

  private sameValue(a: string | Date | null, b: string | Date | null): boolean {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    return false;
  }

  /**
   * Interpret an externally-assigned value (`writeValue` or `[value]`): it
   * seeds the canonical time and, when it is a `Date`, the day that `date`-mode
   * values land on.
   */
  private applyExternal(v: unknown): void {
    this.datePart = v instanceof Date && !Number.isNaN(v.getTime()) ? new Date(v) : null;
    this.time.set(this.toHhmm(v));
  }

  /** Normalise any accepted shape to canonical `HH:mm`, or `null`. */
  private toHhmm(v: unknown): string | null {
    if (v instanceof Date) {
      return Number.isNaN(v.getTime()) ? null : `${pad2(v.getHours())}:${pad2(v.getMinutes())}`;
    }
    if (typeof v !== 'string' || !v.trim()) return null;
    return this.parse(v);
  }

  /**
   * Put `hh:mm` on a `Date`. The date part comes from the current value when
   * that is already a `Date` (so repeated edits never drift the day),
   * otherwise from today — always via the local accessors, never the UTC ones.
   */
  private toDate(hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    const base = this.datePart ? new Date(this.datePart) : new Date();
    base.setHours(h, m, 0, 0);
    this.datePart = base;
    return base;
  }

  private scrollActiveIntoView(): void {
    afterNextRender(
      {
        write: () => {
          const el = this.listRef()?.nativeElement.querySelector<HTMLElement>(
            '.mk-time-picker__option--active',
          );
          el?.scrollIntoView({ block: 'nearest' });
        },
      },
      { injector: this.injector },
    );
  }

  protected onFocusOut(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) return;
    if (related && this.listRef()?.nativeElement.contains(related)) return;
    this.commitInput();
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | Date | null): void {
    this.applyExternal(value);
    this.deriveValue(false);
  }
  registerOnChange(fn: (value: string | Date | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  // --- Validator ------------------------------------------------------------
  private readonly validatorChange = mkValidatorChange(() => {
    this.min();
    this.max();
  });

  /**
   * Reports `mkMinTime` / `mkMaxTime` against the `[min]` and `[max]` inputs.
   * The control value is normalised to `HH:mm` first (so a `Date` model
   * validates too); both sides are then zero-padded `HH:mm`, so a
   * lexicographic compare is a chronological one.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const v = this.toHhmm(control.value);
    if (!v) return null;
    const min = this.min();
    if (min && v < min) return { mkMinTime: { min, actual: v } };
    const max = this.max();
    if (max && v > max) return { mkMaxTime: { max, actual: v } };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
