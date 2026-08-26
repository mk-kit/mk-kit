import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize, MkTone } from '@mk-kit/ui/core';
import { MkFormField } from '../form-field/form-field';
import { MkButtonToggle } from './button-toggle';

/**
 * ButtonToggleGroup — a segmented control grouping one or more
 * `mk-button-toggle` items into a single, keyboard-operable selection.
 *
 * In single-select mode (default) the group is an ARIA `radiogroup`: exactly
 * one item is selected, Arrow keys move and select, and the selected item is
 * the tab stop. Set `multiple` to allow any number of items — the group
 * becomes a toolbar of independent `aria-pressed` buttons.
 *
 * Implements `ControlValueAccessor` and exposes a two-way `value` model. In
 * single mode `value` is the chosen item's `value`; in multiple mode it is an
 * array of the selected values.
 *
 * ```html
 * <mk-button-toggle-group [(value)]="view" aria-label="View">
 *   <mk-button-toggle value="grid">Grid</mk-button-toggle>
 *   <mk-button-toggle value="list">List</mk-button-toggle>
 * </mk-button-toggle-group>
 * ```
 */
@Component({
  selector: 'mk-button-toggle-group',
  templateUrl: './button-toggle-group.html',
  styleUrl: './button-toggle-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-button-toggle-group',
    '[attr.role]': "multiple() ? 'group' : 'radiogroup'",
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.data-tone]': 'tone()',
    '[class.mk-button-toggle-group--sm]': "size() === 'sm'",
    '[class.mk-button-toggle-group--md]': "size() === 'md'",
    '[class.mk-button-toggle-group--lg]': "size() === 'lg'",
    '[class.mk-button-toggle-group--disabled]': 'isDisabled()',
    '[class.mk-button-toggle-group--invalid]': 'isInvalid()',
    '[attr.aria-invalid]': 'isInvalid() || null',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkButtonToggleGroup),
      multi: true,
    },
  ],
})
export class MkButtonToggleGroup implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** Optional surrounding form field — supplies label/hint/error wiring. */
  private readonly field = inject(MkFormField, { optional: true });

  /** Live list of projected toggle items, in DOM order. */
  readonly toggles = contentChildren(MkButtonToggle);

  /** Allow selecting any number of items (toolbar of `aria-pressed` buttons). */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Control size, applied to every item. Ignored inside an `mk-form-field`. */
  readonly size = input<MkSize>('md');
  /** The size actually applied (the form field's when nested). */
  readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  /** Label / description ids inherited from a surrounding form field. */
  protected readonly labelledBy = computed(() =>
    this.ariaLabel() ? null : (this.field?.labelId ?? null),
  );
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );
  /** Semantic color tone used for the selected fill. */
  readonly tone = input<MkTone>('primary');
  /** Disable the whole group. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Force the invalid visual + `aria-invalid` when used standalone. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Accessible name for the group (recommended). */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });

  /**
   * Two-way selected value. Single mode: the chosen item's `value` (or `null`).
   * Multiple mode: an array of selected values.
   */
  readonly value = model<unknown>(null);

  private readonly cvaDisabled = signal(false);
  private readonly roving = signal(-1);
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly isInvalid = computed(
    () => this.invalid() || (this.field?.hasError() ?? false),
  );

  /** The single item that currently owns the tab stop (roving tabindex). */
  private readonly rovingTarget = computed<MkButtonToggle | null>(() => {
    const list = this.toggles();
    if (!list.length || this.isDisabled()) return null;
    const idx = this.roving();
    if (idx >= 0 && idx < list.length && !list[idx].disabled()) return list[idx];
    const selected = list.find((t) => this.isSelected(t) && !t.disabled());
    return selected ?? list.find((t) => !t.disabled()) ?? null;
  });

  /** Whether a given item is part of the current selection. */
  isSelected(toggle: MkButtonToggle): boolean {
    const v = this.value();
    if (this.multiple()) {
      return Array.isArray(v) && v.includes(toggle.value());
    }
    return v === toggle.value();
  }

  /** `0` for the item that owns the tab stop, `-1` for the rest. */
  tabIndexFor(toggle: MkButtonToggle): number {
    return this.rovingTarget() === toggle ? 0 : -1;
  }

  /** Toggle (multiple) or set (single) the selection for an item. */
  select(toggle: MkButtonToggle): void {
    if (this.isDisabled() || toggle.disabled()) return;
    if (this.multiple()) {
      const current = Array.isArray(this.value())
        ? [...(this.value() as unknown[])]
        : [];
      const at = current.indexOf(toggle.value());
      if (at >= 0) current.splice(at, 1);
      else current.push(toggle.value());
      this.commit(current);
    } else {
      if (this.value() === toggle.value()) return;
      this.commit(toggle.value());
    }
  }

  onKeydown(event: KeyboardEvent, toggle: MkButtonToggle): void {
    const list = this.toggles();
    const from = list.indexOf(toggle);
    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = this.nextEnabled(from, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = this.nextEnabled(from, -1);
        break;
      case 'Home':
        next = this.nextEnabled(-1, 1);
        break;
      case 'End':
        next = this.nextEnabled(list.length, -1);
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.select(toggle);
        return;
      default:
        return;
    }
    if (next >= 0) {
      event.preventDefault();
      this.roving.set(next);
      list[next].focus();
      // In single-select mode focus moves selection (radiogroup semantics).
      if (!this.multiple()) this.select(list[next]);
    }
  }

  private nextEnabled(from: number, step: number): number {
    const list = this.toggles();
    const count = list.length;
    if (!count) return -1;
    for (let i = 1; i <= count; i++) {
      const idx = (((from + step * i) % count) + count) % count;
      if (!list[idx].disabled()) return idx;
    }
    return -1;
  }

  private commit(value: unknown): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  /**
   * Marks the control touched once focus leaves it entirely, so a form that
   * gates its errors on `touched` behaves the same here as on a native input.
   */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    this.onTouched();
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
