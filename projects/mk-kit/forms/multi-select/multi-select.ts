import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
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
import { MkLiveAnnouncer } from '@mk-kit/ui/core';
import { MkAnchoredPanel } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core';
import { MkChip } from '@mk-kit/ui/chip';
import { MkFormField } from '../form-field/form-field';

/** A single selectable option for {@link MkMultiSelect}. */
export interface MkMultiSelectOption {
  /** Text shown to the user (and used for the chip + typeahead). */
  label: string;
  /** The value committed to the form control when chosen. */
  value: unknown;
  /** Disable the option (skipped by keyboard + not selectable). */
  disabled?: boolean;
}

/** How the option list is narrowed against the typed text. */
export type MkMultiSelectFilterMode = 'contains' | 'startsWith' | 'none';

/**
 * MultiSelect — an accessible combobox that commits **multiple** values,
 * rendering each selection as a removable chip inside the control. Implements
 * the ARIA combobox + multiselectable listbox pattern.
 *
 * Filtering is built in (`contains` / `startsWith`); set `filterMode="none"`
 * and drive `options` from the `search` output for async / server-side sources.
 * Selected options are remembered even after they leave the `options` list, so
 * chips keep their labels across async pages.
 *
 * Implements `ControlValueAccessor` over an **array** value and exposes a
 * two-way `value` model, so it works with `[(ngModel)]`, reactive forms and
 * `[(value)]`. When nested in an `mk-form-field` it inherits size, label,
 * hint/error and required wiring.
 *
 * Keyboard: type to filter, Up/Down to move, Home/End to jump, Enter/Space to
 * toggle the active option, Backspace on an empty query removes the last chip,
 * Escape closes. The dropdown renders in the top layer via
 * {@link MkAnchoredPanel} so it is never clipped by a container.
 *
 * ```html
 * <mk-multi-select placeholder="Add tags"
 *   [options]="tagOptions()"
 *   [(value)]="tags" />
 * ```
 */
@Component({
  selector: 'mk-multi-select',
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel, MkChip],
  host: {
    class: 'mk-multi-select',
    '[class.mk-multi-select--sm]': "effectiveSize() === 'sm'",
    '[class.mk-multi-select--md]': "effectiveSize() === 'md'",
    '[class.mk-multi-select--lg]': "effectiveSize() === 'lg'",
    '[class.mk-multi-select--open]': 'open()',
    '[class.mk-multi-select--invalid]': 'isInvalid()',
    '[class.mk-multi-select--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkMultiSelect),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MkMultiSelect),
      multi: true,
    },
  ],
})
export class MkMultiSelect implements ControlValueAccessor, Validator {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** The list of options to choose from. Update from `search` for async. */
  /** Accessible name when the control is used without an `mk-form-field` label. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
  readonly options = input<readonly MkMultiSelectOption[]>([]);
  /** Placeholder shown when no value is selected. */
  readonly placeholder = input<string>('');
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Mark required (adds `aria-required`). Set by Signal Forms' `[formField]` from the schema. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** How the option list is filtered against the typed text. */
  readonly filterMode = input<MkMultiSelectFilterMode>('contains');
  /** Only open the list once this many characters have been typed. */
  readonly minChars = input(0, { transform: numberAttribute });
  /** Show a loading row instead of "no results" (for async fetches). */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Maximum number of selections (0 = unlimited). */
  readonly max = input(0, { transform: numberAttribute });
  /** Close the dropdown after each selection. Default keeps it open. */
  readonly closeOnSelect = input(false, { transform: booleanAttribute });
  /** Message shown when there are no matching options. */
  readonly emptyMessage = input(this.i18n.noResults);

  /** Two-way selected values. */
  readonly value = model<unknown[]>([]);

  /** Emits the current query text on every keystroke — drive async loading. */
  readonly search = output<string>();
  /** Emits the option whenever one is added. */
  readonly optionAdded = output<MkMultiSelectOption>();
  /** Emits the value whenever a selection is removed. */
  readonly optionRemoved = output<unknown>();

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly query = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: unknown[]) => void = () => {};
  private onTouched: () => void = () => {};

  readonly listId = mkUniqueId('mk-ms-list');
  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-ms');

  /**
   * Every option ever seen, keyed by value — so chips keep their labels even
   * after the option leaves the (async, filtered) `options` list.
   */
  private readonly seen = signal(new Map<unknown, MkMultiSelectOption>());

  /** Last announced result count (guards repeat announcements). */
  private lastAnnouncedCount = -1;
  /**
   * Skips the next results-count announcement — set when a selection resets
   * the query, so "x added" is not immediately clobbered by "n results".
   */
  private suppressCountAnnouncement = false;

  constructor() {
    // Accumulate seen options as `options` changes (untracked read → no loop).
    effect(() => {
      const opts = this.options();
      if (!opts.length) return;
      const next = new Map(untracked(this.seen));
      let changed = false;
      for (const o of opts) {
        if (next.get(o.value) !== o) {
          next.set(o.value, o);
          changed = true;
        }
      }
      if (changed) this.seen.set(next);
    });

    // Announce the filtered result count while the list is open (WCAG 4.1.3):
    // covers both built-in filtering and async `options` arriving. Only a
    // changed count is announced, so keystrokes that don't narrow the list
    // stay quiet.
    effect(() => {
      const open = this.open();
      const loading = this.loading();
      const count = this.filtered().length;
      const suppress = this.suppressCountAnnouncement;
      this.suppressCountAnnouncement = false;
      if (!open || loading) {
        this.lastAnnouncedCount = -1;
        return;
      }
      if (count === this.lastAnnouncedCount) return;
      this.lastAnnouncedCount = count;
      if (!suppress) this.announcer.announce(this.i18n.resultsCount(count));
    });
  }

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(
    () => this.required() || (this.field?.isRequired() ?? false),
  );
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** Whether the selection cap has been reached. */
  protected readonly atMax = computed(
    () => this.max() > 0 && this.value().length >= this.max(),
  );

  /** Why unselected options are unavailable once the cap is reached. */
  protected readonly atMaxHint = computed(() =>
    this.i18n.validation.mkMaxItems({
      max: this.max(),
      actual: this.value().length,
    }),
  );

  /** The selected values resolved to option objects (for the chips). */
  protected readonly chips = computed<MkMultiSelectOption[]>(() => {
    const seen = this.seen();
    return this.value().map(
      (v) => seen.get(v) ?? { label: String(v), value: v },
    );
  });

  /** Options after the built-in filter (or all, when `none`). */
  protected readonly filtered = computed<readonly MkMultiSelectOption[]>(() => {
    const mode = this.filterMode();
    const q = this.query().trim().toLowerCase();
    if (mode === 'none' || !q) return this.options();
    return this.options().filter((o) => {
      const label = o.label.toLowerCase();
      return mode === 'startsWith' ? label.startsWith(q) : label.includes(q);
    });
  });

  protected readonly hasResults = computed(() => this.filtered().length > 0);

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  protected isSelected(value: unknown): boolean {
    return this.value().includes(value);
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.search.emit(text);
    this.openIfEligible();
    this.activeIndex.set(this.hasResults() ? this.firstEnabled() : -1);
  }

  protected onFocus(): void {
    this.openIfEligible();
  }

  private openIfEligible(): void {
    if (this.isDisabled()) return;
    const eligible = this.query().length >= this.minChars();
    this.open.set(eligible);
    if (eligible && this.activeIndex() < 0) {
      this.activeIndex.set(this.firstEnabled());
    }
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  /** Add or remove the option at `index` in the filtered list. */
  protected toggleOption(index: number): void {
    const opt = this.filtered()[index];
    if (!opt || opt.disabled) return;
    // Options blocked by the cap stay focusable (APG); say why nothing happens.
    if (!this.isSelected(opt.value) && this.atMax()) {
      this.announcer.announce(this.atMaxHint());
      return;
    }
    this.isSelected(opt.value) ? this.remove(opt.value) : this.add(opt);
    this.focusInput();
  }

  private add(opt: MkMultiSelectOption): void {
    if (this.atMax() || this.isSelected(opt.value)) return;
    // Remember the option so its chip keeps a label if `options` changes.
    const seen = new Map(this.seen());
    seen.set(opt.value, opt);
    this.seen.set(seen);
    this.setValue([...this.value(), opt.value]);
    this.optionAdded.emit(opt);
    this.announcer.announce(this.i18n.itemAdded(opt.label));
    // Reset the query so the full list is available for the next pick.
    if (this.query()) {
      // The reset re-expands the filtered list; don't let "n results"
      // immediately overwrite the "added" announcement.
      this.suppressCountAnnouncement = true;
      this.query.set('');
      this.search.emit('');
    }
    if (this.closeOnSelect()) this.close();
  }

  private remove(value: unknown): void {
    const label = this.seen().get(value)?.label ?? String(value);
    this.setValue(this.value().filter((v) => v !== value));
    this.optionRemoved.emit(value);
    this.announcer.announce(this.i18n.itemRemoved(label));
  }

  /** Remove a chip from its remove button. */
  protected removeChip(value: unknown): void {
    if (this.isDisabled()) return;
    this.remove(value);
    this.focusInput();
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    const key = e.key;

    // Backspace on an empty query removes the last chip.
    if (key === 'Backspace' && !this.query() && this.value().length) {
      e.preventDefault();
      this.remove(this.value()[this.value().length - 1]);
      return;
    }

    if (!this.open()) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault();
        this.openIfEligible();
      }
      return;
    }

    switch (key) {
      case 'ArrowDown':
        e.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.move(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.activeIndex.set(this.firstEnabled());
        break;
      case 'End':
        e.preventDefault();
        this.activeIndex.set(this.lastEnabled());
        break;
      case 'Enter':
      case ' ':
        if (this.query() && key === ' ') break; // let the space type into the query
        if (this.activeIndex() >= 0) {
          e.preventDefault();
          this.toggleOption(this.activeIndex());
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  protected onBlur(event: Event): void {
    const related = (event as FocusEvent).relatedTarget as Node | null;
    // Keep focus/selection when moving to a chip's remove button inside the host.
    if (related && this.host.nativeElement.contains(related)) return;
    this.onTouched();
    this.close();
  }

  protected onOutsideDismiss(): void {
    if (this.open()) this.close();
  }

  /** Clicking anywhere in the control focuses the input. */
  protected onControlPointerdown(event: Event): void {
    if (this.isDisabled()) return;
    const target = event.target as HTMLElement;
    // Don't steal clicks aimed at a chip's remove button.
    if (target.closest('.mk-chip__remove')) return;
    if (target !== this.inputRef()?.nativeElement) {
      event.preventDefault();
      this.focusInput();
      this.openIfEligible();
    }
  }

  private move(delta: number): void {
    const opts = this.filtered();
    if (!opts.length) return;
    let i = this.activeIndex();
    for (let step = 0; step < opts.length; step++) {
      i = (i + delta + opts.length) % opts.length;
      if (!opts[i].disabled) {
        this.activeIndex.set(i);
        return;
      }
    }
  }

  private firstEnabled(): number {
    return this.filtered().findIndex((o) => !o.disabled);
  }

  private lastEnabled(): number {
    const opts = this.filtered();
    for (let i = opts.length - 1; i >= 0; i--) {
      if (!opts[i].disabled) return i;
    }
    return -1;
  }

  private focusInput(): void {
    this.inputRef()?.nativeElement.focus();
  }

  private setValue(next: unknown[]): void {
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown[] | null): void {
    this.value.set(Array.isArray(value) ? value : []);
  }
  registerOnChange(fn: (value: unknown[]) => void): void {
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
    this.max();
  });

  /**
   * Reports `mkMaxItems` when more options are selected than `[max]` allows.
   */
  validate(control: AbstractControl): ValidationErrors | null {
    const max = this.max();
    const v = control.value;
    if (max <= 0 || !Array.isArray(v) || v.length <= max) return null;
    return { mkMaxItems: { max, actual: v.length } };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange.register(fn);
  }
}
