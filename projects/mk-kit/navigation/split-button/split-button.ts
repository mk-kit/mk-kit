import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { MkSize, MkTone, MkVariant } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkMenu } from '../menu/menu';
import { MkMenuTrigger } from '../menu/menu-trigger';

/**
 * SplitButton — a primary action with an attached menu of alternatives.
 * The main segment emits `action`; the chevron segment is a menu button
 * (`mkMenuTriggerFor`) for the `mk-menu` passed in `[menu]`, with the full
 * keyboard model of the menu trigger (ArrowDown / Enter / Space open and focus
 * the first item, ArrowUp the last, Escape closes).
 *
 * Both segments share `variant`, `tone` and `size`; `disabled` disables both,
 * `loading` shows the main segment's spinner and disables the chevron.
 *
 * ```html
 * <mk-split-button [menu]="saveMenu" tone="primary" (action)="save()">
 *   Save
 * </mk-split-button>
 * <mk-menu #saveMenu>
 *   <mk-menu-item (action)="saveAs()">Save as…</mk-menu-item>
 *   <mk-menu-item (action)="saveTemplate()">Save as template</mk-menu-item>
 * </mk-menu>
 * ```
 */
@Component({
  selector: 'mk-split-button',
  templateUrl: './split-button.html',
  styleUrl: './split-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkButton, MkMenuTrigger],
  host: {
    class: 'mk-split-button',
    role: 'group',
    '[class.mk-split-button--block]': 'fullWidth()',
    '[class.mk-split-button--sm]': "size() === 'sm'",
    '[class.mk-split-button--lg]': "size() === 'lg'",
    '[class.mk-split-button--outline]': "variant() === 'outline'",
  },
})
export class MkSplitButton {
  protected readonly i18n = inject(MK_I18N);

  /** The menu the chevron segment opens. */
  readonly menu = input.required<MkMenu>();
  /** Visual treatment shared by both segments. */
  readonly variant = input<MkVariant>('solid');
  /** Semantic color tone shared by both segments. */
  readonly tone = input<MkTone>('primary');
  /** Control size shared by both segments. */
  readonly size = input<MkSize>('md');
  /** Disable both segments. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Spinner on the main segment; the menu segment is disabled meanwhile. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Stretch to the container width (the main segment grows). */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** `type` of the main segment — `submit` to submit the enclosing form. */
  readonly type = input<'button' | 'submit'>('button');
  /** Accessible name of the chevron segment. */
  readonly menuLabel = input(this.i18n.moreActions);

  /** Emitted when the main segment is activated (not while disabled/loading). */
  readonly action = output<void>();

  protected readonly menuDisabled = computed(() => this.disabled() || this.loading());

  protected onMain(): void {
    if (this.disabled() || this.loading()) return;
    this.action.emit();
  }
}
