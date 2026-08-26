import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
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
import { MK_I18N, MkAnchoredPanel, mkUniqueId, type MkSize } from '@mk-kit/ui/core';
import { MkFormField } from '../form-field/form-field';

/** One node of a cascader: a leaf, or a parent with `children`. */
export interface MkCascaderOption {
  label: string;
  value: unknown;
  children?: readonly MkCascaderOption[];
  disabled?: boolean;
}

/**
 * Cascader — a select whose choices are a hierarchy shown as side-by-side
 * columns (region → country → city, category → subcategory, org unit → team).
 * Each pick opens the next column; picking a leaf commits the whole path.
 *
 * The value is the **path** of option values (`['eu', 'pl', 'krk']`) by
 * default, or just the leaf's value with `valueMode="leaf"`. Parents are only
 * selectable with `selectParents` (a click on one then commits, and its
 * children stay reachable).
 *
 * Keyboard: Up / Down move within a column, Right opens the children, Left
 * goes back, Enter / Space selects, typing jumps to a label, Escape closes.
 * `expandTrigger="hover"` opens columns on pointer hover as well as click.
 *
 * Implements `ControlValueAccessor` and a two-way `value` model.
 *
 * ```html
 * <mk-cascader [options]="regions" [(value)]="location" placeholder="Where?" clearable />
 * ```
 */
@Component({
  selector: 'mk-cascader',
  templateUrl: './cascader.html',
  styleUrl: './cascader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-cascader',
    '[class.mk-cascader--sm]': "effectiveSize() === 'sm'",
    '[class.mk-cascader--lg]': "effectiveSize() === 'lg'",
    '[class.mk-cascader--open]': 'open()',
    '[class.mk-cascader--invalid]': 'isInvalid()',
    '[class.mk-cascader--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MkCascader), multi: true }],
})
export class MkCascader implements ControlValueAccessor, OnDestroy {
  private readonly field = inject(MkFormField, { optional: true });
  protected readonly i18n = inject(MK_I18N);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** The hierarchy to choose from. */
  readonly options = input<readonly MkCascaderOption[]>([]);
  /** Two-way value: the path of values (default) or the leaf value (`valueMode="leaf"`). */
  readonly value = model<unknown>(null);
  /** Bind the full path of values (default) or only the chosen option's value. */
  readonly valueMode = input<'path' | 'leaf'>('path');
  /** Allow committing a parent option (click / Enter on it) instead of leaves only. */
  readonly selectParents = input(false, { transform: booleanAttribute });
  /** Open the next column on click (default) or also on pointer hover. */
  readonly expandTrigger = input<'click' | 'hover'>('click');
  readonly placeholder = input(this.i18n.selectPlaceholder);
  /** Text between the labels of the chosen path. */
  readonly separator = input(' / ');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  /** Emitted after the user commits or clears a value. */
  readonly change = output<unknown>();

  readonly triggerId = this.field?.controlId ?? mkUniqueId('mk-cascader');
  readonly panelId = mkUniqueId('mk-cascader-panel');
  readonly valueId = mkUniqueId('mk-cascader-value');

  protected readonly open = signal(false);
  /** Row index highlighted in each open column, left to right. */
  protected readonly activePath = signal<number[]>([]);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

  protected readonly effectiveSize = computed<MkSize>(() => (this.field ? this.field.size() : this.size()));
  protected readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());
  protected readonly isInvalid = computed(() => this.invalid() || (this.field?.hasError() ?? false));
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(() => this.field?.describedBy() ?? null);

  /** The options along the committed value, or `[]`. */
  protected readonly selectedPath = computed<MkCascaderOption[]>(() => {
    const v = this.value();
    if (v == null) return [];
    if (this.valueMode() === 'path') {
      if (!Array.isArray(v)) return [];
      const out: MkCascaderOption[] = [];
      let list: readonly MkCascaderOption[] = this.options();
      for (const step of v) {
        const hit = list.find((o) => o.value === step);
        if (!hit) return [];
        out.push(hit);
        list = hit.children ?? [];
      }
      return out;
    }
    return this.findPath(this.options(), v) ?? [];
  });

  protected readonly displayLabel = computed(() => this.selectedPath().map((o) => o.label).join(this.separator()));

  /**
   * Columns rendered in the panel: the root list, then the children of every
   * opened parent along the active path. The last entry of the path is the
   * cursor — resting on a parent does not open it (click, hover or → does).
   */
  protected readonly columns = computed<readonly MkCascaderOption[][]>(() => {
    const cols: MkCascaderOption[][] = [[...this.options()]];
    const path = this.activePath();
    for (let depth = 0; depth < path.length - 1; depth++) {
      const opt = cols[depth]?.[path[depth]];
      if (!opt?.children?.length) break;
      cols.push([...opt.children]);
    }
    return cols;
  });

  /** The column the keyboard cursor is in. */
  private readonly cursorColumn = computed(() => Math.max(0, Math.min(this.activePath().length - 1, this.columns().length - 1)));

  protected readonly activeId = computed(() => {
    const path = this.activePath();
    const col = this.cursorColumn();
    return path.length ? this.optionId(col, path[col]) : null;
  });

  constructor() {
    afterRenderEffect(() => {
      const id = this.activeId();
      if (!id || !this.open()) return;
      this.panelRef()?.nativeElement.ownerDocument.getElementById(id)?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected optionId(column: number, row: number): string {
    return `${this.panelId}-c${column}-r${row}`;
  }

  protected isOnPath(column: number, row: number): boolean {
    return this.activePath()[column] === row;
  }

  protected isSelected(column: number, option: MkCascaderOption): boolean {
    return this.selectedPath()[column] === option;
  }

  protected isCursor(column: number, row: number): boolean {
    return this.cursorColumn() === column && this.activePath()[column] === row;
  }

  // --- Open / close ------------------------------------------------------------

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    // Start on the committed path (its columns open), else on the first row.
    const sel = this.selectedPath();
    const path = sel.length ? this.indexPath(sel) : [this.firstEnabled(this.options())].filter((i) => i >= 0);
    this.activePath.set(path);
    this.open.set(true);
    afterNextRender(() => this.panelRef()?.nativeElement.focus(), { injector: this.injector });
  }

  protected close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.triggerRef()?.nativeElement.focus();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.openPanel();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && (this.host.nativeElement.contains(related) || this.panelRef()?.nativeElement.contains(related))) return;
    this.close();
    this.onTouched();
  }

  protected onPanelFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related) return;
    if (this.host.nativeElement.contains(related) || this.panelRef()?.nativeElement.contains(related)) return;
    this.close();
    this.onTouched();
  }

  // --- Pointer -----------------------------------------------------------------

  protected onOptionClick(column: number, row: number): void {
    const option = this.columns()[column]?.[row];
    if (!option || option.disabled) return;
    if (option.children?.length) {
      this.expand(column, row);
      if (this.selectParents()) this.commit(column, row);
      return;
    }
    this.setCursor(column, row);
    this.commit(column, row);
  }

  protected onOptionHover(column: number, row: number): void {
    if (this.expandTrigger() !== 'hover') return;
    const option = this.columns()[column]?.[row];
    if (!option || option.disabled) return;
    this.expand(column, row);
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.emit(null);
    this.triggerRef()?.nativeElement.focus();
  }

  // --- Keyboard ----------------------------------------------------------------

  protected onPanelKeydown(event: KeyboardEvent): void {
    const col = this.cursorColumn();
    const column = this.columns()[col] ?? [];
    const row = this.activePath()[col] ?? -1;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const next = this.stepRow(column, row, event.key === 'ArrowDown' ? 1 : -1);
        if (next >= 0) this.setCursor(col, next);
        break;
      }
      case 'Home':
      case 'End': {
        event.preventDefault();
        const next = event.key === 'Home' ? this.firstEnabled(column) : this.lastEnabled(column);
        if (next >= 0) this.setCursor(col, next);
        break;
      }
      case 'ArrowRight':
        event.preventDefault();
        if (row >= 0) this.expand(col, row);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (col > 0) this.activePath.set(this.activePath().slice(0, col));
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = column[row];
        if (!option || option.disabled) break;
        if (option.children?.length && !this.selectParents()) {
          this.expand(col, row);
        } else {
          this.commit(col, row);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
        break;
      case 'Tab':
        this.close();
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.typeaheadSearch(event.key, col, column, row);
        }
    }
  }

  /** Point the cursor at `(column, row)`, trimming any deeper columns. */
  private setCursor(column: number, row: number): void {
    this.activePath.set([...this.activePath().slice(0, column), row]);
  }

  /** Open the children of `(column, row)` and move the cursor onto the first enabled one. */
  private expand(column: number, row: number): void {
    const option = this.columns()[column]?.[row];
    const children = option?.children;
    const first = children?.length ? this.firstEnabled(children) : -1;
    this.activePath.set(first >= 0 ? [...this.activePath().slice(0, column), row, first] : [...this.activePath().slice(0, column), row]);
  }

  private stepRow(column: readonly MkCascaderOption[], from: number, delta: number): number {
    if (!column.length) return -1;
    let i = from;
    for (let s = 0; s < column.length; s++) {
      i = (i + delta + column.length) % column.length;
      if (!column[i].disabled) return i;
    }
    return -1;
  }

  private firstEnabled(list: readonly MkCascaderOption[]): number {
    return list.findIndex((o) => !o.disabled);
  }

  private lastEnabled(list: readonly MkCascaderOption[]): number {
    for (let i = list.length - 1; i >= 0; i--) if (!list[i].disabled) return i;
    return -1;
  }

  private typeaheadSearch(char: string, col: number, column: readonly MkCascaderOption[], from: number): void {
    this.typeahead += char.toLocaleLowerCase();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), 500);
    for (let s = 1; s <= column.length; s++) {
      const i = (from + s) % column.length;
      if (!column[i].disabled && column[i].label.toLocaleLowerCase().startsWith(this.typeahead)) {
        this.setCursor(col, i);
        return;
      }
    }
  }

  // --- Value -------------------------------------------------------------------

  private commit(column: number, row: number): void {
    const cols = this.columns();
    const path: MkCascaderOption[] = [];
    for (let c = 0; c < column; c++) path.push(cols[c][this.activePath()[c]]);
    path.push(cols[column][row]);
    const value = this.valueMode() === 'path' ? path.map((o) => o.value) : path[path.length - 1].value;
    this.emit(value);
    this.close(true);
  }

  private emit(value: unknown): void {
    this.value.set(value);
    this.onChange(value);
    this.change.emit(value);
  }

  /** Row indexes of a path of options. */
  private indexPath(path: readonly MkCascaderOption[]): number[] {
    const out: number[] = [];
    let list: readonly MkCascaderOption[] = this.options();
    for (const opt of path) {
      const i = list.indexOf(opt);
      if (i < 0) break;
      out.push(i);
      list = opt.children ?? [];
    }
    return out;
  }

  /** Depth-first search for the option whose value is `value` (leaf mode). */
  private findPath(list: readonly MkCascaderOption[], value: unknown, trail: MkCascaderOption[] = []): MkCascaderOption[] | null {
    for (const opt of list) {
      const next = [...trail, opt];
      if (opt.value === value) return next;
      if (opt.children?.length) {
        const hit = this.findPath(opt.children, value, next);
        if (hit) return hit;
      }
    }
    return null;
  }

  ngOnDestroy(): void {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
  }

  // --- ControlValueAccessor ----------------------------------------------------
  writeValue(value: unknown): void {
    this.value.set(value ?? null);
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
