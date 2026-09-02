import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
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
import type { MkSize } from '@mk-kit/ui/core';
import { mkUniqueId } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkAnchoredPanel } from '@mk-kit/ui/core';
import { mkInjectFieldTouched } from '@mk-kit/ui/core/signal-forms';
import { MkFormField } from '../form-field/form-field';
import { MkTree, type MkTreeNode } from '@mk-kit/ui/navigation';

/**
 * TreeSelect — a form field whose popover contains a hierarchical
 * {@link MkTree}. The trigger shows the selected node's label (or a
 * placeholder); opening it reveals a selectable tree rendered in the top layer
 * via {@link MkAnchoredPanel}, so it is never clipped. Choosing a node sets the
 * value to that node's `value` (or the node itself when `value` is unset),
 * closes the panel and restores focus to the trigger. Implements
 * `ControlValueAccessor` and a two-way `value` model.
 *
 * ```html
 * <mk-tree-select [nodes]="tree" [(value)]="picked" clearable />
 * ```
 */
@Component({
  selector: 'mk-tree-select',
  templateUrl: './tree-select.html',
  styleUrl: './tree-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkTree, MkAnchoredPanel],
  host: {
    class: 'mk-tree-select',
    '[class.mk-tree-select--sm]': "effectiveSize() === 'sm'",
    '[class.mk-tree-select--lg]': "effectiveSize() === 'lg'",
    '[class.mk-tree-select--open]': 'open()',
    '[class.mk-tree-select--invalid]': 'isInvalid()',
    '[class.mk-tree-select--disabled]': 'isDisabled()',
    '(focusout)': 'onFocusOut($event)',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkTreeSelect),
      multi: true,
    },
  ],
})
export class MkTreeSelect implements ControlValueAccessor {
  private readonly field = inject(MkFormField, { optional: true });
  /** Signal Forms: gates `invalid` until the bound field is touched or dirty. */
  private readonly fieldTouched = mkInjectFieldTouched();
  protected readonly i18n = inject(MK_I18N);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** The hierarchical data to render in the panel. */
  readonly nodes = input<readonly MkTreeNode[]>([]);
  /** Two-way selected value (a node's `value`, or the node itself if unset). */
  readonly value = model<unknown | null>(null);
  /** Placeholder shown when nothing is selected. */
  readonly placeholder = input(this.i18n.selectPlaceholder);
  /** Disable the control. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Show a clear button when a value is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Force invalid styling. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Control size. Ignored when nested in an `mk-form-field`. */
  readonly size = input<MkSize>('md');

  protected readonly open = signal(false);
  private readonly cvaDisabled = signal(false);
  private onChange: (value: unknown | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly triggerId = this.field?.controlId ?? mkUniqueId('mk-tree-select');
  readonly panelId = mkUniqueId('mk-tree-select-panel');
  /** Id of the rendered value/placeholder span, appended to `aria-labelledby`. */
  readonly valueId = mkUniqueId('mk-tree-select-value');

  protected readonly effectiveSize = computed<MkSize>(() =>
    this.field ? this.field.size() : this.size(),
  );
  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );
  protected readonly isInvalid = computed(
    () => (this.invalid() && this.fieldTouched()) || (this.field?.hasError() ?? false),
  );
  protected readonly isRequired = computed(() => this.field?.isRequired() ?? false);
  protected readonly labelledBy = computed(() => this.field?.labelId ?? null);
  protected readonly describedBy = computed(
    () => this.field?.describedBy() ?? null,
  );

  /** Label of the selected node (found by walking `nodes` recursively). */
  protected readonly selectedLabel = computed(() => {
    const v = this.value();
    if (v === null || v === undefined) return '';
    return this.findNode(this.nodes(), v)?.label ?? '';
  });

  protected toggle(): void {
    if (this.isDisabled()) return;
    this.open() ? this.close() : this.openPanel();
  }

  protected openPanel(): void {
    if (this.isDisabled() || this.open()) return;
    this.open.set(true);
    // Move focus into the tree once the panel is in the DOM.
    afterNextRender(() => this.focusTree(), { injector: this.injector });
  }

  protected close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.triggerRef()?.nativeElement.focus();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    }
  }

  /**
   * Focus left the teleported panel. The host `(focusout)` never sees this —
   * the panel lives under `document.body` — so Tab-out of the tree is handled
   * here: close unless focus moved back into the field or the panel.
   */
  protected onPanelFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    // Focus fell to a non-focusable spot (body) — keep open; an outside
    // pointerdown is dismissed by the anchored panel itself.
    if (!related) return;
    if (this.host.nativeElement.contains(related)) return;
    if (this.panelRef()?.nativeElement.contains(related)) return;
    this.close();
    this.onTouched();
  }

  /** Handle a selection emitted by the tree (a value) or a node passed directly. */
  protected onPick(selected: unknown): void {
    const value = this.valueOf(selected);
    this.value.set(value);
    this.onChange(value);
    this.close(true);
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.onChange(null);
    this.triggerRef()?.nativeElement.focus();
  }

  protected onFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (related && this.host.nativeElement.contains(related)) return;
    if (related && this.panelRef()?.nativeElement.contains(related)) return;
    this.close();
    this.onTouched();
  }

  /** Resolve the bound value for a node (or pass a primitive value through). */
  private valueOf(node: unknown): unknown {
    if (
      node &&
      typeof node === 'object' &&
      'value' in node &&
      (node as MkTreeNode).value !== undefined
    ) {
      return (node as MkTreeNode).value;
    }
    return node;
  }

  private findNode(
    list: readonly MkTreeNode[],
    value: unknown,
  ): MkTreeNode | null {
    for (const node of list) {
      if (this.valueOf(node) === value) return node;
      if (node.children?.length) {
        const hit = this.findNode(node.children, value);
        if (hit) return hit;
      }
    }
    return null;
  }

  private focusTree(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    const active =
      panel.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]') ??
      panel.querySelector<HTMLElement>('[role="treeitem"]');
    active?.focus();
  }

  // --- ControlValueAccessor -------------------------------------------------
  writeValue(value: unknown | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: unknown | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
