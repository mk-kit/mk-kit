import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { MkSize } from '../../core/types';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkButton } from '../button/button';
import { MkFormField } from '../form-field/form-field';

/** A single transferable item for {@link MkTransferList}. */
export interface MkTransferItem {
  /** The value committed to the form control when the item is in the selected list. */
  value: unknown;
  /** Text shown to the user. */
  label: string;
  /** Disable the item (cannot be checked or moved). */
  disabled?: boolean;
}

/** Which of the two lists a row belongs to. */
type MkTransferSide = 'available' | 'selected';

/**
 * TransferList — a dual list box (a.k.a. pick list) for moving items between an
 * **available** list and a **selected** list, e.g. assigning roles or
 * permissions. The user checks rows in one list then clicks the middle move
 * buttons (or presses Enter on a row) to shuttle them across.
 *
 * Implements `ControlValueAccessor` over an **array** value (the values in the
 * selected list) and exposes a two-way `value` model, so it works with
 * `[(ngModel)]`, reactive forms and `[(value)]`. When nested in an
 * `mk-form-field` it inherits size and label wiring.
 *
 * Keyboard: each row is focusable; Space toggles its check, Enter moves it to
 * the opposite list.
 *
 * ```html
 * <mk-transfer-list filterable
 *   [items]="allRoles()"
 *   [(value)]="assignedRoles"
 *   availableLabel="All roles"
 *   selectedLabel="Assigned" />
 * ```
 */
@Component({
  selector: 'mk-transfer-list',
  templateUrl: './transfer-list.html',
  styleUrl: './transfer-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkButton],
  host: {
    class: 'mk-transfer-list',
    '[class.mk-transfer-list--sm]': "effectiveSize() === 'sm'",
    '[class.mk-transfer-list--md]': "effectiveSize() === 'md'",
    '[class.mk-transfer-list--lg]': "effectiveSize() === 'lg'",
    '[class.mk-transfer-list--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkTransferList),
      multi: true,
    },
  ],
})
export class MkTransferList implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });

  /** The full set of items to shuttle between the two lists. */
  readonly items = input<readonly MkTransferItem[]>([]);
  /** Heading for the left (available) list. */
  readonly availableLabel = input<string>('Available');
  /** Heading for the right (selected) list. */
  readonly selectedLabel = input<string>('Selected');
  /** Show a search box over each list. */
  readonly filterable = input(false, { transform: booleanAttribute });
  /** Disable the whole control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  /** Two-way values currently in the selected (right) list. */
  readonly value = model<unknown[]>([]);

  /** Emits the new selected values whenever items are moved. */
  readonly change = output<unknown[]>();

  private readonly cvaDisabled = signal(false);
  /** Values checked in each list, awaiting a move. */
  private readonly checkedAvailable = signal(new Set<unknown>());
  private readonly checkedSelected = signal(new Set<unknown>());
  /** Per-list search queries (only used when `filterable`). */
  protected readonly availableQuery = signal('');
  protected readonly selectedQuery = signal('');

  private onChange: (value: unknown[]) => void = () => {};
  private onTouched: () => void = () => {};

  readonly baseId = mkUniqueId('mk-transfer');
  readonly availableListId = `${this.baseId}-available`;
  readonly selectedListId = `${this.baseId}-selected`;
  readonly availableLabelId = `${this.baseId}-available-label`;
  readonly selectedLabelId = `${this.baseId}-selected-label`;

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  /** Items keyed by value, for resolving the selected order. */
  private readonly byValue = computed(() => {
    const map = new Map<unknown, MkTransferItem>();
    for (const it of this.items()) map.set(it.value, it);
    return map;
  });

  /** Items not currently in the value (in `items` order). */
  protected readonly available = computed<readonly MkTransferItem[]>(() => {
    const chosen = new Set(this.value());
    return this.items().filter((it) => !chosen.has(it.value));
  });

  /** Items currently in the value, preserving the value array order. */
  protected readonly selected = computed<readonly MkTransferItem[]>(() => {
    const map = this.byValue();
    const out: MkTransferItem[] = [];
    for (const v of this.value()) {
      const it = map.get(v);
      if (it) out.push(it);
    }
    return out;
  });

  protected readonly filteredAvailable = computed<readonly MkTransferItem[]>(() =>
    this.applyFilter(this.available(), this.availableQuery()),
  );
  protected readonly filteredSelected = computed<readonly MkTransferItem[]>(() =>
    this.applyFilter(this.selected(), this.selectedQuery()),
  );

  private applyFilter(
    list: readonly MkTransferItem[],
    query: string,
  ): readonly MkTransferItem[] {
    if (!this.filterable()) return list;
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => it.label.toLowerCase().includes(q));
  }

  /** Whether the "move right" controls are actionable. */
  protected readonly canMoveRight = computed(() =>
    this.available().some(
      (it) => !it.disabled && this.checkedAvailable().has(it.value),
    ),
  );
  /** Whether the "move left" controls are actionable. */
  protected readonly canMoveLeft = computed(() =>
    this.selected().some(
      (it) => !it.disabled && this.checkedSelected().has(it.value),
    ),
  );
  protected readonly canMoveAllRight = computed(() =>
    this.available().some((it) => !it.disabled),
  );
  protected readonly canMoveAllLeft = computed(() =>
    this.selected().some((it) => !it.disabled),
  );

  protected isChecked(side: MkTransferSide, value: unknown): boolean {
    return this.checkedFor(side)().has(value);
  }

  private checkedFor(side: MkTransferSide) {
    return side === 'available' ? this.checkedAvailable : this.checkedSelected;
  }

  /** Toggle a row's checked state (Space / click on the row). */
  protected toggleCheck(side: MkTransferSide, item: MkTransferItem): void {
    if (this.isDisabled() || item.disabled) return;
    const sig = this.checkedFor(side);
    const next = new Set(sig());
    next.has(item.value) ? next.delete(item.value) : next.add(item.value);
    sig.set(next);
  }

  protected onQueryInput(side: MkTransferSide, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    (side === 'available' ? this.availableQuery : this.selectedQuery).set(text);
  }

  protected onRowKeydown(
    side: MkTransferSide,
    item: MkTransferItem,
    event: Event,
  ): void {
    const e = event as KeyboardEvent;
    if (this.isDisabled() || item.disabled) return;
    if (e.key === ' ') {
      e.preventDefault();
      this.toggleCheck(side, item);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.moveOne(side, item);
    }
  }

  /** Move a single item to the opposite list (Enter on a row). */
  private moveOne(side: MkTransferSide, item: MkTransferItem): void {
    if (side === 'available') {
      this.commit([...this.value(), item.value]);
    } else {
      this.commit(this.value().filter((v) => v !== item.value));
    }
    this.uncheck(side, [item.value]);
  }

  /** Move all checked available items into the selected list. */
  protected moveRight(): void {
    if (this.isDisabled()) return;
    const checked = this.checkedAvailable();
    const moving = this.available()
      .filter((it) => !it.disabled && checked.has(it.value))
      .map((it) => it.value);
    if (!moving.length) return;
    this.commit([...this.value(), ...moving]);
    this.uncheck('available', moving);
  }

  /** Move all checked selected items back to the available list. */
  protected moveLeft(): void {
    if (this.isDisabled()) return;
    const checked = this.checkedSelected();
    const moving = new Set(
      this.selected()
        .filter((it) => !it.disabled && checked.has(it.value))
        .map((it) => it.value),
    );
    if (!moving.size) return;
    this.commit(this.value().filter((v) => !moving.has(v)));
    this.uncheck('selected', [...moving]);
  }

  /** Move every movable available item into the selected list. */
  protected moveAllRight(): void {
    if (this.isDisabled()) return;
    const moving = this.available()
      .filter((it) => !it.disabled)
      .map((it) => it.value);
    if (!moving.length) return;
    this.commit([...this.value(), ...moving]);
    this.checkedAvailable.set(new Set());
  }

  /** Move every movable selected item back to the available list. */
  protected moveAllLeft(): void {
    if (this.isDisabled()) return;
    const moving = new Set(
      this.selected()
        .filter((it) => !it.disabled)
        .map((it) => it.value),
    );
    if (!moving.size) return;
    this.commit(this.value().filter((v) => !moving.has(v)));
    this.checkedSelected.set(new Set());
  }

  private uncheck(side: MkTransferSide, values: readonly unknown[]): void {
    const sig = this.checkedFor(side);
    const next = new Set(sig());
    for (const v of values) next.delete(v);
    sig.set(next);
  }

  private commit(next: unknown[]): void {
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
    this.change.emit(next);
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
}
