import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { mkUniqueId } from '../../core/a11y/unique-id';
import { MkNavList } from './nav-list';

/**
 * A single sidebar entry: icon slot (`[mkNavIcon]`), label, optional badge and
 * active state. Renders a link when `href` is set, otherwise a button that
 * emits `action`. If it contains nested `<mk-nav-item>`s it becomes an
 * expandable disclosure (`aria-expanded`). Collapses to an icon in a collapsed
 * list, exposing the label as a tooltip.
 *
 * ```html
 * <mk-nav-item label="Reports" active href="/reports" badge="3">
 *   <svg mkNavIcon>…</svg>
 * </mk-nav-item>
 * <mk-nav-item label="Settings">
 *   <svg mkNavIcon>…</svg>
 *   <mk-nav-item label="Team" href="/team" />
 * </mk-nav-item>
 * ```
 */
@Component({
  selector: 'mk-nav-item',
  templateUrl: './nav-item.html',
  styleUrl: './nav-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-nav-item',
    role: 'listitem',
    '[class.mk-nav-item--active]': 'active()',
    '[class.mk-nav-item--collapsed]': 'collapsed()',
    '[class.mk-nav-item--has-children]': 'hasChildren()',
  },
})
export class MkNavItem {
  private readonly list = inject(MkNavList, { optional: true });

  /** Visible label. Also used as the tooltip when collapsed. */
  readonly label = input('');
  /** Link target. Renders an anchor instead of a button. */
  readonly href = input<string>();
  /** Marks the current page (`aria-current="page"`). */
  readonly active = input(false, { transform: booleanAttribute });
  /** Disable interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Optional badge (count or short text). */
  readonly badge = input<string | number>();
  /** Whether nested children are expanded (two-way). */
  readonly expanded = model(false);

  /** Emitted when a button-style item is activated. */
  readonly action = output<void>();

  /** Nested items projected inside this one. */
  private readonly children = contentChildren(MkNavItem);
  protected readonly hasChildren = computed(() => this.children().length > 0);

  /** Collapsed state inherited from the enclosing `MkNavList`. */
  protected readonly collapsed = computed(() => this.list?.collapsed() ?? false);

  /** Id wiring the disclosure button to its sub-list. */
  protected readonly subId = mkUniqueId('mk-nav-sub');

  protected toggle(): void {
    if (this.disabled()) return;
    this.expanded.update((v) => !v);
  }

  protected activate(): void {
    if (this.disabled()) return;
    this.action.emit();
  }
}
