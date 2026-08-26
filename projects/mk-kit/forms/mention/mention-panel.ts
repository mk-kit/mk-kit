import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type Signal,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MK_I18N, MkAnchoredPanel } from '@mk-kit/ui/core';
import type { MkMentionOption } from './mention';

/**
 * Suggestion listbox for {@link MkMention}. Created dynamically by the
 * directive and wired imperatively right after creation: the directive hands
 * it read-only signals (options, active index, caret anchor point) plus plain
 * callbacks, so the panel re-renders reactively without `setInput` churn.
 *
 * The `<ul>` is promoted to the top layer by `mkAnchoredPanel` and positioned
 * at the caret point; this host element stays empty in place.
 *
 * Not intended for direct use — the public API is the `[mkMention]` directive.
 */
@Component({
  selector: 'mk-mention-panel',
  templateUrl: './mention-panel.html',
  styleUrl: './mention-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
})
export class MkMentionPanel {
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);

  // Wired by MkMention immediately after creation, before first render.
  options: Signal<readonly MkMentionOption[]> = signal([]);
  activeIndex: Signal<number> = signal(0);
  /** Caret point (viewport px) the panel is anchored to. */
  anchorPoint: Signal<{ x: number; y: number }> = signal({ x: 0, y: 0 });
  loading: Signal<boolean> = signal(false);
  listId = '';
  /**
   * The mention control itself — passed as the anchored panel's element
   * anchor so pointerdowns inside the control don't count as "outside"
   * dismissals (the point anchor still wins for positioning).
   */
  anchorEl: HTMLElement | undefined = undefined;
  onPick: (index: number) => void = () => {};
  onHover: (index: number) => void = () => {};
  onDismiss: () => void = () => {};

  private readonly panel = viewChild(MkAnchoredPanel);
  /** The teleported listbox element (used for the blur containment guard). */
  readonly list = viewChild<ElementRef<HTMLUListElement>>('list');

  constructor() {
    // Follow the caret: mkAnchoredPanel only repositions on scroll/resize by
    // itself, so re-run positioning whenever the anchor point moves.
    effect(() => {
      this.anchorPoint();
      untracked(() => this.panel()?.position());
    });
  }

  optionId(index: number): string {
    return `${this.listId}-opt-${index}`;
  }

  protected pick(event: Event, index: number): void {
    // Keep focus (and the software keyboard) in the textarea.
    event.preventDefault();
    this.onPick(index);
  }
}
