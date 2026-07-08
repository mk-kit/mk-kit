import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  input,
  numberAttribute,
} from '@angular/core';
import type { MkSize } from '../../core/types';
import { MkAvatar } from './avatar';

/**
 * Avatar group — overlaps a set of {@link MkAvatar} children and, when `max`
 * is set, collapses the overflow into a trailing "+N" bubble.
 *
 * ```html
 * <mk-avatar-group [max]="3">
 *   <mk-avatar name="Ada Lovelace" />
 *   <mk-avatar name="Grace Hopper" />
 *   <mk-avatar name="Alan Turing" />
 *   <mk-avatar name="Katherine Johnson" />
 * </mk-avatar-group>
 * ```
 */
@Component({
  selector: 'mk-avatar-group',
  templateUrl: './avatar-group.html',
  styleUrl: './avatar-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-avatar-group',
    role: 'group',
    '[class.mk-avatar-group--sm]': "size() === 'sm'",
    '[class.mk-avatar-group--md]': "size() === 'md'",
    '[class.mk-avatar-group--lg]': "size() === 'lg'",
  },
})
export class MkAvatarGroup {
  /** Maximum avatars to show before collapsing the rest into "+N". */
  readonly max = input(undefined, { transform: numberAttribute });
  /** Size of the overflow bubble (match your avatars' size). */
  readonly size = input<MkSize>('md');

  private readonly items = contentChildren(MkAvatar, { read: ElementRef });

  protected readonly overflowCount = computed(() => {
    const total = this.items().length;
    const max = this.max();
    return max != null && total > max ? total - max : 0;
  });

  constructor() {
    // Overlap the projected avatars and hide any beyond `max`. Projected
    // content lives in the consumer's view, so style it imperatively.
    effect(() => {
      const items = this.items();
      const max = this.max();
      items.forEach((ref, i) => {
        const el = ref.nativeElement as HTMLElement;
        el.style.marginLeft = i === 0 ? '0' : 'calc(var(--_size) * -0.35)';
        el.style.boxShadow =
          '0 0 0 var(--mk-border-width-strong) var(--mk-surface)';
        el.style.zIndex = String(items.length - i);
        el.style.display = max != null && i >= max ? 'none' : '';
      });
    });
  }
}
