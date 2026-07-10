import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { MK_I18N } from '@mkornas/ui/core';
import type { MkSize, MkTone } from '@mkornas/ui/core';

/** Corner placement for a fixed {@link MkFab}. `static` renders it inline. */
export type MkFabPosition =
  | 'bottom-end'
  | 'bottom-start'
  | 'top-end'
  | 'top-start'
  | 'static';

/** A speed-dial action button projected into {@link MkFab}. */
@Directive({
  selector: '[mkFabAction]',
  host: { class: 'mk-fab__action', type: 'button' },
})
export class MkFabAction {}

/**
 * FAB — a floating action button, fixed to a corner (or `static` for inline
 * use). Project the icon as content and set `label` for the accessible name
 * (shown too when `extended`). Add `mkFabAction` buttons to turn it into a
 * speed-dial that reveals them on toggle.
 *
 * ```html
 * <mk-fab label="Create" position="bottom-end">
 *   <svg>…</svg>
 *   <button mkFabAction (click)="newDoc()">Doc</button>
 *   <button mkFabAction (click)="newFolder()">Folder</button>
 * </mk-fab>
 * ```
 */
@Component({
  selector: 'mk-fab',
  templateUrl: './fab.html',
  styleUrl: './fab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-fab',
    '[attr.data-position]': 'position()',
    '[class.mk-fab--extended]': 'extended()',
    '[class.mk-fab--open]': 'open()',
  },
})
export class MkFab {
  private readonly actions = contentChildren(MkFabAction);
  protected readonly i18n = inject(MK_I18N);

  /** Corner placement (or `static` to render inline). */
  readonly position = input<MkFabPosition>('bottom-end');
  /** Semantic tone. */
  readonly tone = input<MkTone>('primary');
  /** Size scale. */
  readonly size = input<MkSize>('md');
  /** Accessible label (and visible text when `extended`). */
  readonly label = input(this.i18n.fabLabel);
  /** Render as a pill with the label beside the icon. */
  readonly extended = input(false, { transform: booleanAttribute });
  /** Disable the button. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Two-way open state of the speed-dial. */
  readonly open = model(false);

  /** Emitted when the FAB is activated (only when it has no actions). */
  readonly action = output<void>();

  protected readonly hasActions = computed(() => this.actions().length > 0);

  protected onClick(): void {
    if (this.disabled()) return;
    if (this.hasActions()) {
      this.open.set(!this.open());
    } else {
      this.action.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.open.set(false);
    }
  }
}
