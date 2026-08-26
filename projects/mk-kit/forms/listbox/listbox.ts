import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { MK_I18N, mkUniqueId, type MkSize } from '@mk-kit/ui/core';
import { MkFormField } from '../form-field/form-field';

/** One row of an `mk-listbox`. */
export interface MkListboxOption {
  /** Text shown (and matched by typeahead / the filter). */
  label: string;
  /** Value committed to the model when selected. */
  value: unknown;
  /** Secondary line under the label. */
  description?: string;
  /** Skipped by keyboard, not selectable. */
  disabled?: boolean;
  /** Options sharing a `group` render under one heading (keep them adjacent). */
  group?: string;
}

/** A rendered row: either a group heading or an option with its index in the visible list. */
type Row = { kind: 'group'; label: string; id: string } | { kind: 'option'; option: MkListboxOption; index: number };

/**
 * Listbox — a standalone, always-visible selection list (the ARIA `listbox`
 * pattern) for one or many values: settings panes, "choose a template"
 * pickers, side-by-side assignments, any place a dropdown would hide choices
 * the user should see at once.
 *
 * Keyboard: Up / Down move, Home / End jump, PageUp / PageDown skip ten,
 * type to jump to a label, Enter / Space select (toggle when `multiple`),
 * Shift+Arrow / Shift+click extend a range, Ctrl/Cmd+A selects all. Focus
 * stays on the list (`aria-activedescendant`). With `filterable`, a search
 * box above the list narrows it by label or description.
 *
 * Implements `ControlValueAccessor` and a two-way `value` model — a single
 * value, or an array when `multiple`.
 *
 * ```html
 * <mk-listbox [options]="plans" [(value)]="plan" ariaLabel="Plan" />
 * <mk-listbox multiple filterable [options]="people" [(ngModel)]="reviewers" />
 * ```
 */
@Component({
  selector: 'mk-listbox',
  templateUrl: './listbox.html',
  styleUrl: './listbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-listbox',
    '[class.mk-listbox--sm]': "effectiveSize() === 'sm'",
    '[class.mk-listbox--md]': "effectiveSize() === 'md'",
    '[class.mk-listbox--lg]': "effectiveSize() === 'lg'",
    '[class.mk-listbox--multiple]': 'multiple()',
    '[class.mk-listbox--invalid]': 'isInvalid()',
    '[class.mk-listbox--disabled]': 'isDisabled()',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MkListbox), multi: true }],
})
export class MkListbox implements ControlValueAccessor, OnDestroy {
  private readonly field = inject(MkFormField, { optional: true });
  protected readonly i18n = inject(MK_I18N);
  private readonly listRef = viewChild.required<ElementRef<HTMLElement>>('list');

  /** The rows to choose from. */
  readonly options = input<readonly MkListboxOption[]>([]);
  /** Allow several values; the model becomes an array. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Show a search box that narrows the list by label / description. */
  readonly filterable = input(false, { transform: booleanAttribute });
  readonly filterPlaceholder = input<string | undefined>(undefined);
  /**
   * Single-select only: moving with the arrow keys selects immediately
   * (default `true`); `false` requires Enter / Space to commit.
   */
  readonly selectionFollowsFocus = input(true, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name when there is no visible label / form field. */
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledby = input<string | undefined>(undefined);
  /** Text shown when no option matches the filter. */
  readonly emptyText = input<string | undefined>(undefined);
  /** Two-way value: one value, or an array when `multiple`. */
  readonly value = model<unknown>(null);

  /** Emitted after the user changes the selection (not on programmatic writes). */
  readonly change = output<unknown>();

  readonly listId = this.field?.controlId ?? mkUniqueId('mk-listbox');
  protected readonly filterId = mkUniqueId('mk-listbox-filter');
  protected readonly query = signal('');
  protected readonly activeIndex = signal(-1);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;
  /** Range anchor for Shift selection (index in the visible list). */
  private anchor = -1;

  protected readonly effectiveSize = computed<MkSize>(() => (this.field ? this.field.size() : this.size()));
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly isInvalid = computed(() => this.invalid() || (this.field?.hasError() ?? false));
  protected readonly labelledBy = computed(() => this.ariaLabelledby() ?? this.field?.labelId ?? null);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);

  /** Options that match the filter, in source order. */
  protected readonly visible = computed<MkListboxOption[]>(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const all = this.options();
    if (!q) return [...all];
    return all.filter(
      (o) => o.label.toLocaleLowerCase().includes(q) || (o.description?.toLocaleLowerCase().includes(q) ?? false),
    );
  });

  /** Visible options with group headings interleaved. */
  protected readonly rows = computed<Row[]>(() => {
    const out: Row[] = [];
    let lastGroup: string | undefined;
    this.visible().forEach((option, index) => {
      if (option.group && option.group !== lastGroup) {
        out.push({ kind: 'group', label: option.group, id: `${this.listId}-grp-${out.length}` });
      }
      lastGroup = option.group;
      out.push({ kind: 'option', option, index });
    });
    return out;
  });

  protected readonly selectedValues = computed<unknown[]>(() => {
    const v = this.value();
    if (this.multiple()) return Array.isArray(v) ? v : v == null ? [] : [v];
    return v == null ? [] : [v];
  });

  protected readonly activeId = computed(() => (this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null));

  constructor() {
    // Keep the active row in view as it changes.
    afterRenderEffect(() => {
      const i = this.activeIndex();
      if (i < 0) return;
      const el = this.listRef().nativeElement.ownerDocument.getElementById(this.optionId(i));
      el?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  protected isSelected(option: MkListboxOption): boolean {
    return this.selectedValues().includes(option.value);
  }

  /** Focus the list. */
  focus(): void {
    this.listRef().nativeElement.focus();
  }

  // --- Pointer -----------------------------------------------------------------

  protected onOptionClick(index: number, event: MouseEvent): void {
    if (this.isDisabled()) return;
    const option = this.visible()[index];
    if (!option || option.disabled) return;
    this.activeIndex.set(index);
    if (this.multiple() && event.shiftKey && this.anchor >= 0) {
      this.selectRange(this.anchor, index, !(event.ctrlKey || event.metaKey));
    } else {
      this.commit(index, this.multiple() ? 'toggle' : 'select');
      this.anchor = index;
    }
  }

  protected onFilterInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(-1);
    this.anchor = -1;
  }

  protected onFilterKeydown(event: KeyboardEvent): void {
    // Arrow keys from the search box hand over to the list.
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focus();
      this.jump(event.key === 'ArrowDown' ? this.firstEnabled() : this.lastEnabled(), false);
    }
  }

  // --- Keyboard ----------------------------------------------------------------

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const key = event.key;
    const multi = this.multiple();
    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        this.step(key === 'ArrowDown' ? 1 : -1, event.shiftKey);
        break;
      case 'Home':
      case 'End':
        event.preventDefault();
        this.jump(key === 'Home' ? this.firstEnabled() : this.lastEnabled(), event.shiftKey);
        break;
      case 'PageDown':
      case 'PageUp':
        event.preventDefault();
        this.step(key === 'PageDown' ? 10 : -10, event.shiftKey, false);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.activeIndex() >= 0) {
          this.commit(this.activeIndex(), multi ? 'toggle' : 'select');
          this.anchor = this.activeIndex();
        }
        break;
      case 'a':
      case 'A':
        if (multi && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          this.selectAll();
        } else if (key.length === 1) this.typeaheadSearch(key);
        break;
      default:
        if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) this.typeaheadSearch(key);
    }
  }

  protected onBlur(): void {
    this.onTouched();
  }

  /** Move the active row by `delta` (wrapping for ±1), extending the selection with Shift. */
  private step(delta: number, extend: boolean, wrap = true): void {
    const opts = this.visible();
    if (!opts.length) return;
    let i = this.activeIndex();
    if (i < 0) {
      this.jump(delta > 0 ? this.firstEnabled() : this.lastEnabled(), extend);
      return;
    }
    if (Math.abs(delta) === 1) {
      for (let s = 0; s < opts.length; s++) {
        i = wrap ? (i + delta + opts.length) % opts.length : Math.min(Math.max(i + delta, 0), opts.length - 1);
        if (!opts[i].disabled) break;
      }
    } else {
      i = Math.min(Math.max(i + delta, 0), opts.length - 1);
      // Land on an enabled row, searching in the direction of travel then back.
      let j = i;
      while (j >= 0 && j < opts.length && opts[j].disabled) j += Math.sign(delta);
      if (j < 0 || j >= opts.length) {
        j = i;
        while (j >= 0 && j < opts.length && opts[j].disabled) j -= Math.sign(delta);
      }
      i = j;
    }
    this.jump(i, extend);
  }

  private jump(index: number, extend: boolean): void {
    if (index < 0) return;
    this.activeIndex.set(index);
    if (this.multiple()) {
      if (extend) {
        if (this.anchor < 0) this.anchor = index;
        this.selectRange(this.anchor, index, true);
      } else {
        // Plain navigation moves the range anchor along with the cursor.
        this.anchor = index;
      }
    } else if (this.selectionFollowsFocus()) {
      this.commit(index, 'select');
    }
  }

  private firstEnabled(): number {
    return this.visible().findIndex((o) => !o.disabled);
  }

  private lastEnabled(): number {
    const opts = this.visible();
    for (let i = opts.length - 1; i >= 0; i--) if (!opts[i].disabled) return i;
    return -1;
  }

  private typeaheadSearch(char: string): void {
    this.typeahead += char.toLocaleLowerCase();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), 500);
    const opts = this.visible();
    const start = this.activeIndex() + 1;
    for (let s = 0; s < opts.length; s++) {
      const i = (start + s) % opts.length;
      if (!opts[i].disabled && opts[i].label.toLocaleLowerCase().startsWith(this.typeahead)) {
        this.jump(i, false);
        return;
      }
    }
  }

  // --- Selection ---------------------------------------------------------------

  private commit(index: number, mode: 'select' | 'toggle'): void {
    const option = this.visible()[index];
    if (!option || option.disabled) return;
    if (!this.multiple()) {
      if (this.value() === option.value) return;
      this.emit(option.value);
      return;
    }
    const current = this.selectedValues();
    const next =
      mode === 'toggle' && current.includes(option.value)
        ? current.filter((v) => v !== option.value)
        : current.includes(option.value)
          ? current
          : [...current, option.value];
    this.emit(next);
  }

  /** Select every enabled option between two visible indexes (replacing, or adding to, the selection). */
  private selectRange(from: number, to: number, replace: boolean): void {
    const opts = this.visible();
    const [lo, hi] = from < to ? [from, to] : [to, from];
    const range = opts.slice(lo, hi + 1).filter((o) => !o.disabled).map((o) => o.value);
    const base = replace ? [] : this.selectedValues();
    this.emit([...base, ...range.filter((v) => !base.includes(v))]);
  }

  private selectAll(): void {
    const all = this.visible().filter((o) => !o.disabled).map((o) => o.value);
    const current = this.selectedValues();
    // Ctrl+A toggles: everything selected → clear, else select all.
    this.emit(all.every((v) => current.includes(v)) ? [] : all);
  }

  private emit(value: unknown): void {
    this.value.set(value);
    this.onChange(value);
    this.change.emit(value);
  }

  ngOnDestroy(): void {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
  }

  // --- ControlValueAccessor ----------------------------------------------------
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
