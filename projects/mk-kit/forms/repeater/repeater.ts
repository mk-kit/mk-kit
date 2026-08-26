import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MK_I18N, MkLiveAnnouncer } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import {
  MkDrag,
  MkDragHandle,
  MkDropList,
  mkMoveItemInArray,
  type MkDropEvent,
} from '@mk-kit/ui/dnd';

/** Template context for a {@link MkRepeaterRow} row template. */
export interface MkRepeaterRowContext<T> {
  /** The row's item — destructure with `let-item`. */
  $implicit: T;
  /** The row's current index — destructure with `let-i="index"`. */
  index: number;
}

/**
 * Marks an `<ng-template>` as the row template for {@link MkRepeater}. The
 * template receives the item as its implicit context plus its `index`:
 *
 * ```html
 * <ng-template mkRepeaterRow let-item let-i="index">
 *   <input mkInput [(ngModel)]="item.name" />
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[mkRepeaterRow]',
})
export class MkRepeaterRow<T = unknown> {
  /** The projected row template, rendered once per item. */
  readonly template = inject<TemplateRef<MkRepeaterRowContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: MkRepeaterRow<T>,
    _ctx: unknown,
  ): _ctx is MkRepeaterRowContext<T> {
    return true;
  }
}

/**
 * Marks an `<ng-template>` as {@link MkRepeater}'s custom empty state, shown
 * instead of the row list while there are no items.
 */
@Directive({
  selector: '[mkRepeaterEmpty]',
})
export class MkRepeaterEmpty {
  /** The projected empty-state template. */
  readonly template = inject(TemplateRef);
}

/**
 * Repeater — the schema-friendly editable list: renders one instance of a
 * consumer-projected row template per item, with add / remove / (optional)
 * drag-and-drop + keyboard reorder built in.
 *
 * `items` is a two-way model and the component also implements
 * `ControlValueAccessor` over `T[]`, so it drops into template-driven and
 * reactive forms alike. **Every mutation produces a new array** — the
 * consumer's array is never mutated in place.
 *
 * Rows are tracked by **item object identity** (stable across the repeater's
 * immutable array copies), so removing a middle row keeps the following rows'
 * DOM — and any in-progress input state — intact. Consequently, arrays of
 * primitives with duplicate values (e.g. `['a', 'a']`) are not supported
 * directly: wrap each value in an object (`{ value: 'a' }`) so every row has
 * a distinct identity.
 *
 * With `reorderable`, each row gets a drag handle wired through the dnd
 * module's touch-safe handle-based configuration (a swipe on the row body
 * still scrolls the page). Reordering also works by keyboard: focus the
 * handle (or the row) and press Space/Enter to pick up, arrows to move,
 * Space/Enter to drop, Escape to cancel. Each completed reorder is announced
 * via {@link MkLiveAnnouncer}.
 *
 * ```html
 * <mk-repeater [(items)]="rows" [min]="1" [max]="10" reorderable
 *              [factory]="newRow" addLabel="Add row">
 *   <ng-template mkRepeaterRow let-item let-i="index">
 *     <input mkInput [(ngModel)]="item.name" />
 *   </ng-template>
 *   <ng-template mkRepeaterEmpty>No rows yet.</ng-template>
 * </mk-repeater>
 * ```
 *
 * @typeParam T item data type.
 */
@Component({
  selector: 'mk-repeater',
  templateUrl: './repeater.html',
  styleUrl: './repeater.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, MkButton, MkDropList, MkDrag, MkDragHandle],
  host: {
    class: 'mk-repeater',
    '[class.mk-repeater--disabled]': 'isDisabled()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkRepeater),
      multi: true,
    },
  ],
})
export class MkRepeater<T = unknown> implements ControlValueAccessor {
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  private readonly announcer = inject(MkLiveAnnouncer);

  /** The rows (two-way). Every mutation sets a **new** array. */
  readonly items = model<T[]>([]);

  /** Creates the item appended by the add button. Default: `{}` cast to `T`. */
  readonly factory = input<() => T>(() => ({}) as T);

  /** Minimum number of rows — remove buttons disable at (or below) it. */
  readonly min = input(0, { transform: numberAttribute });

  /** Maximum number of rows (0 = unlimited) — the add button disables at it. */
  readonly max = input(0, { transform: numberAttribute });

  /** Enable per-row drag handles (pointer + keyboard reorder). */
  readonly reorderable = input(false, { transform: booleanAttribute });

  /** Disable the whole control (add, remove and reorder). */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Add-button caption. Defaults to the i18n `repeaterAddRow` string. */
  readonly addLabel = input<string>('');

  /** Emitted after the add button appended a factory-made item. */
  readonly added = output<{ item: T; index: number }>();
  /** Emitted after a row was removed. */
  readonly removed = output<{ item: T; index: number }>();
  /** Emitted after a row was reordered (drag or keyboard). */
  readonly moved = output<{ from: number; to: number }>();

  /** The projected `[mkRepeaterRow]` row template (required). */
  protected readonly rowTemplate =
    contentChild.required<MkRepeaterRow<T>>(MkRepeaterRow);
  /** The optional `[mkRepeaterEmpty]` empty-state template. */
  protected readonly emptyTemplate = contentChild(MkRepeaterEmpty);

  private readonly cvaDisabled = signal(false);
  private onChange: (value: T[]) => void = () => {};
  private onTouched: () => void = () => {};

  /** Effective disabled state (input- or form-driven). */
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  /** Whether the row cap has been reached (add disables). */
  protected readonly atMax = computed(
    () => this.max() > 0 && this.items().length >= this.max(),
  );

  /** Whether the row floor has been reached (remove disables). */
  protected readonly atMin = computed(
    () => this.items().length <= Math.max(0, this.min()),
  );

  /** The add button's caption (input, falling back to i18n). */
  protected readonly effectiveAddLabel = computed(
    () => this.addLabel() || this.i18n.repeaterAddRow,
  );

  /** Append a new `factory()` item (no-op when disabled or at `max`). */
  protected add(): void {
    if (this.isDisabled() || this.atMax()) return;
    const item = this.factory()();
    const next = [...this.items(), item];
    this.setItems(next);
    this.onTouched();
    this.added.emit({ item, index: next.length - 1 });
  }

  /** Remove the row at `index` (no-op when disabled or at `min`). */
  protected removeAt(index: number): void {
    if (this.isDisabled() || this.atMin()) return;
    const current = this.items();
    if (index < 0 || index >= current.length) return;
    const item = current[index];
    this.setItems(current.filter((_, i) => i !== index));
    this.onTouched();
    this.removed.emit({ item, index });
  }

  /** Apply a dnd drop (pointer or keyboard) to a **copy** of the array. */
  protected onDrop(event: MkDropEvent<T>): void {
    const from = event.previousIndex;
    const to = event.currentIndex;
    if (from === to) return;
    const next = [...this.items()];
    mkMoveItemInArray(next, from, to);
    this.setItems(next);
    this.onTouched();
    this.moved.emit({ from, to });
    this.announcer.announce(this.i18n.repeaterRowMoved(from + 1, to + 1));
  }

  /**
   * Keep keys typed into the projected row content (and pressed on the remove
   * button) from bubbling to the row's `[mkDrag]` host, where Space/Enter
   * would pick the row up for keyboard dragging. Reordering by keyboard stays
   * available from the drag handle and the row element itself.
   */
  protected onContentKeydown(event: Event): void {
    event.stopPropagation();
  }

  private setItems(next: T[]): void {
    this.items.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: T[] | null): void {
    this.items.set(Array.isArray(value) ? value : []);
  }
  registerOnChange(fn: (value: T[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
