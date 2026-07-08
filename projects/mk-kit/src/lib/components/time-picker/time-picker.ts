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
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkFormField } from '../form-field/form-field';

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
 * scrollable list of times generated from `step`. The model is a `HH:mm`
 * string (24h) regardless of the `hour12` display. Implements
 * `ControlValueAccessor` and a two-way `value` model.
 *
 * Type a time (`14:30`, `2:30 pm`) or pick from the ARIA listbox
 * (Up/Down/Home/End/Enter/Esc; the active option scrolls into view). When
 * nested in an `mk-form-field` it adopts the field's id and aria wiring.
 *
 * ```html
 * <mk-time-picker [(value)]="time" [step]="15" hour12 clearable />
 * ```
 */
@Component({
  selector: 'mk-time-picker',
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-time-picker',
    '[class.mk-time-picker--sm]': "effectiveSize() === 'sm'",
    '[class.mk-time-picker--md]': "effectiveSize() === 'md'",
    '[class.mk-time-picker--lg]': "effectiveSize() === 'lg'",
    '[class.mk-time-picker--open]': 'open()',
    '[class.mk-time-picker--invalid]': 'isInvalid()',
    '[class.mk-time-picker--disabled]': 'isDisabled()',
    '(document:pointerdown)': 'onDocumentPointerdown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkTimePicker),
      multi: true,
    },
  ],
})
export class MkTimePicker implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement>>('textInput');

  /** Two-way selected time as canonical `HH:mm` (24h), or `null`. */
  readonly value = model<string | null>(null);
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
  readonly placeholder = input<string>('Select time…');
  /** Show a clear button when a time is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling + `aria-invalid`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly inputText = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-time-picker');
  readonly listId = mkUniqueId('mk-time-picker-list');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.required() ?? false);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  protected readonly showClear = computed(
    () => this.clearable() && !!this.value() && !this.isDisabled(),
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
    this.options().findIndex((o) => o.value === this.value()),
  );

  constructor() {
    effect(() => {
      const v = this.value();
      // hour12 is read so the label follows the display mode.
      this.inputText.set(v ? this.display(v) : '');
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
      const v = this.value();
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

  private setValue(value: string | null): void {
    this.value.set(value);
    this.onChange(value);
  }

  private scrollActiveIntoView(): void {
    afterNextRender(
      {
        write: () => {
          const el = this.host.nativeElement.querySelector<HTMLElement>(
            '.mk-time-picker__option--active',
          );
          el?.scrollIntoView({ block: 'nearest' });
        },
      },
      { injector: this.injector },
    );
  }

  protected onDocumentPointerdown(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  protected onFocusOut(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) return;
    this.commitInput();
    this.onTouched();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
