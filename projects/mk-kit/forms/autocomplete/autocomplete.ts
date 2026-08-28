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
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkLiveAnnouncer } from '@mk-kit/ui/core';
import { MkAnchoredPanel } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core';
import { MkFormField } from '../form-field/form-field';

/** A single suggestion for {@link MkAutocomplete}. */
export interface MkAutocompleteOption {
  /** Text shown to the user and used as the input display value when chosen. */
  label: string;
  /** The value bound to the form control when this option is selected. */
  value: unknown;
  /** Disable the option (skipped by keyboard + not selectable). */
  disabled?: boolean;
  /**
   * Muted second line under the label — the disambiguator when labels can
   * collide (two customers named Jan Kowalski, telling accounts apart by
   * email, an id under a product name).
   */
  description?: string;
}

/** How the option list is narrowed against the typed text. */
export type MkAutocompleteFilterMode = 'contains' | 'startsWith' | 'none';

/**
 * Autocomplete — an accessible text input that suggests options as the user
 * types, implementing the ARIA combobox (`aria-autocomplete="list"`) pattern
 * with a popup listbox.
 *
 * Filtering is built in (`contains` / `startsWith`); set `filterMode="none"`
 * and drive `options` yourself from the `search` output for async/server-side
 * suggestions. Typing arbitrary text is allowed unless `requireSelection` is
 * set, in which case the field clears on blur if it doesn't match an option.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so it
 * works with `[(ngModel)]`, reactive forms and `[(value)]`. When nested in an
 * `mk-form-field` it inherits size, label, hint/error and required wiring.
 *
 * ```html
 * <mk-autocomplete placeholder="Search users"
 *   [options]="filtered()"
 *   filterMode="none"
 *   (search)="query.set($event)"
 *   [(value)]="userId" />
 * ```
 */
@Component({
  selector: 'mk-autocomplete',
  templateUrl: './autocomplete.html',
  styleUrl: './autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-autocomplete',
    '[class.mk-autocomplete--sm]': "effectiveSize() === 'sm'",
    '[class.mk-autocomplete--md]': "effectiveSize() === 'md'",
    '[class.mk-autocomplete--lg]': "effectiveSize() === 'lg'",
    '[class.mk-autocomplete--open]': 'open()',
    '[class.mk-autocomplete--invalid]': 'isInvalid()',
    '[class.mk-autocomplete--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkAutocomplete),
      multi: true,
    },
  ],
})
export class MkAutocomplete implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  /** Last announced result count (guards repeat announcements). */
  private lastAnnouncedCount = -1;

  constructor() {
    // Announce the suggestion count while the list is open (WCAG 4.1.3):
    // covers both built-in filtering and async `options` arriving via
    // `(search)`. Only a changed count is announced, so keystrokes that don't
    // narrow the list stay quiet.
    effect(() => {
      const open = this.open();
      const loading = this.loading();
      const count = this.filtered().length;
      if (!open || loading) {
        this.lastAnnouncedCount = -1;
        return;
      }
      if (count === this.lastAnnouncedCount) return;
      this.lastAnnouncedCount = count;
      this.announcer.announce(this.i18n.resultsCount(count));
    });
  }

  /** The list of suggestions. Update it from `search` for async sources. */
  /** Accessible name when the control is used without an `mk-form-field` label. */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
  readonly options = input<readonly MkAutocompleteOption[]>([]);
  /** Placeholder shown when the input is empty. */
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
  readonly filterMode = input<MkAutocompleteFilterMode>('contains');
  /** Only open the list once this many characters have been typed. */
  readonly minChars = input(0, { transform: numberAttribute });
  /** Show a loading row instead of "no results" (for async fetches). */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Clear the input on blur unless the text matches a selectable option. */
  readonly requireSelection = input(false, { transform: booleanAttribute });
  /** Message shown when there are no matching options. */
  readonly emptyMessage = input(this.i18n.noResults);

  /** Two-way selected value (the `value` of the chosen option, or `null`). */
  readonly value = model<unknown>(null);

  /** Emits the current input text on every keystroke — drive async loading. */
  readonly search = output<string>();
  /** Emits the option whenever one is committed by click or Enter. */
  readonly optionSelected = output<MkAutocompleteOption>();

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly query = signal('');
  private readonly cvaDisabled = signal(false);
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  readonly listId = mkUniqueId('mk-ac-list');
  readonly inputId = this.field?.controlId ?? mkUniqueId('mk-ac');

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

  /** Options after applying the built-in filter (or all, when `none`). */
  protected readonly filtered = computed<readonly MkAutocompleteOption[]>(() => {
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

  /** The option matching the current value, if any. */
  private optionForValue(value: unknown): MkAutocompleteOption | undefined {
    return this.options().find((o) => o.value === value);
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.search.emit(text);
    // Typing frees the field from a previously committed value.
    if (this.value() !== null) {
      this.value.set(null);
      this.onChange(null);
    }
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

  protected selectOption(index: number): void {
    const opt = this.filtered()[index];
    if (!opt || opt.disabled) return;
    this.query.set(opt.label);
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.optionSelected.emit(opt);
    this.close();
    this.focusInput();
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    const key = e.key;

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
        if (this.open()) {
          e.preventDefault();
          this.activeIndex.set(this.firstEnabled());
        }
        break;
      case 'End':
        if (this.open()) {
          e.preventDefault();
          this.activeIndex.set(this.lastEnabled());
        }
        break;
      case 'Enter':
        if (this.activeIndex() >= 0) {
          e.preventDefault();
          this.selectOption(this.activeIndex());
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

  protected onBlur(): void {
    this.onTouched();
    if (this.open()) this.close();
    this.reconcileOnBlur();
  }

  /**
   * When `requireSelection` is set, drop free text that doesn't map to an
   * option; otherwise restore the committed option's label if one exists.
   */
  private reconcileOnBlur(): void {
    const committed = this.optionForValue(this.value());
    if (committed) {
      if (this.query() !== committed.label) this.query.set(committed.label);
      return;
    }
    if (this.requireSelection() && this.query()) {
      this.query.set('');
      this.search.emit('');
    }
  }

  protected onOutsideDismiss(): void {
    if (!this.open()) return;
    this.close();
    this.reconcileOnBlur();
  }

  protected clear(): void {
    this.query.set('');
    this.value.set(null);
    this.onChange(null);
    this.search.emit('');
    this.focusInput();
    this.openIfEligible();
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

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown): void {
    this.value.set(value);
    const opt = this.optionForValue(value);
    this.query.set(opt?.label ?? (value == null ? '' : this.query()));
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
