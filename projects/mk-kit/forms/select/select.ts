import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnDestroy,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '@mkornas/ui/core';
import { mkUniqueId } from '@mkornas/ui/core';
import { MK_I18N } from '@mkornas/ui/core';
import { MkAnchoredPanel } from '@mkornas/ui/core';
import { MkFormField } from '../form-field/form-field';

/** A single selectable option for {@link MkSelect}. */
export interface MkSelectOption {
  /** Text shown to the user (and used for typeahead). */
  label: string;
  /** The value bound to the form control when chosen. */
  value: unknown;
  /** Disable the option (skipped by keyboard + not selectable). */
  disabled?: boolean;
}

/**
 * Select — a fully custom, accessible single-select implementing the ARIA
 * listbox/combobox pattern. Options are supplied via the `options` input.
 *
 * Keyboard: Up/Down to move, Home/End to jump, Enter/Space to select, Esc to
 * close, and typeahead by typing option text. Focus stays on the trigger
 * (`aria-activedescendant` pattern) for robust screen-reader behaviour.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model, so it
 * works with `[(ngModel)]`, reactive forms and `[(value)]`.
 *
 * ```html
 * <mk-select placeholder="Pick a role"
 *   [options]="[{label:'Admin', value:'admin'}, {label:'Editor', value:'editor'}]"
 *   [(ngModel)]="role" />
 * ```
 */
@Component({
  selector: 'mk-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-select',
    '[class.mk-select--sm]': "effectiveSize() === 'sm'",
    '[class.mk-select--md]': "effectiveSize() === 'md'",
    '[class.mk-select--lg]': "effectiveSize() === 'lg'",
    '[class.mk-select--open]': 'open()',
    '[class.mk-select--invalid]': 'isInvalid()',
    '[class.mk-select--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkSelect),
      multi: true,
    },
  ],
})
export class MkSelect implements ControlValueAccessor, OnDestroy {
  private readonly field = inject(MkFormField, { optional: true });
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');

  /** The list of options to choose from. */
  readonly options = input<readonly MkSelectOption[]>([]);
  /** Placeholder shown when nothing is selected. */
  readonly placeholder = input<string>(this.i18n.selectPlaceholder);
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** Force invalid styling + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Two-way selected value. */
  readonly value = model<unknown>(null);

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  readonly listId = mkUniqueId('mk-select-list');
  readonly triggerId = this.field?.controlId ?? mkUniqueId('mk-select');

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
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  protected readonly selectedIndex = computed(() =>
    this.options().findIndex((o) => o.value === this.value()),
  );
  protected readonly displayLabel = computed(
    () => this.options()[this.selectedIndex()]?.label ?? '',
  );

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openList();
  }

  private openList(): void {
    if (this.isDisabled()) return;
    this.open.set(true);
    const sel = this.selectedIndex();
    this.activeIndex.set(sel >= 0 ? sel : this.firstEnabled());
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.activeIndex.set(-1);
    this.onTouched();
  }

  protected selectOption(index: number): void {
    const opt = this.options()[index];
    if (!opt || opt.disabled) return;
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.close();
    this.focusTrigger();
  }

  protected onKeydown(event: Event): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled()) return;
    const key = e.key;

    if (!this.open()) {
      if (
        key === 'ArrowDown' ||
        key === 'ArrowUp' ||
        key === 'Enter' ||
        key === ' '
      ) {
        e.preventDefault();
        this.openList();
      } else if (key.length === 1) {
        this.openList();
        this.typeaheadSearch(key);
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
        e.preventDefault();
        if (this.activeIndex() >= 0) this.selectOption(this.activeIndex());
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        this.focusTrigger();
        break;
      case 'Tab':
        this.close();
        break;
      default:
        if (key.length === 1) this.typeaheadSearch(key);
    }
  }

  protected onBlur(): void {
    // Closing on blur also fires onTouched via close().
    if (this.open()) this.close();
    else this.onTouched();
  }

  private move(delta: number): void {
    const opts = this.options();
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
    return this.options().findIndex((o) => !o.disabled);
  }

  private lastEnabled(): number {
    const opts = this.options();
    for (let i = opts.length - 1; i >= 0; i--) {
      if (!opts[i].disabled) return i;
    }
    return -1;
  }

  private typeaheadSearch(char: string): void {
    this.typeahead += char.toLowerCase();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), 500);

    const opts = this.options();
    const match = opts.findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(this.typeahead),
    );
    if (match >= 0) this.activeIndex.set(match);
  }

  private focusTrigger(): void {
    this.triggerRef()?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown): void {
    this.value.set(value);
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
