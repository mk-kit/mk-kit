import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import type { MkSize, MkTone, MkVariant } from '@mk-kit/ui/core';

/**
 * Button — enhances a native `<button>` or `<a>` so semantics and keyboard
 * behaviour come for free. Fully themed via `--mk-*` tokens.
 *
 * ```html
 * <button mkButton tone="primary">Save</button>
 * <button mkButton variant="outline" tone="danger" [loading]="saving()">Delete</button>
 * <a mkButton variant="ghost" href="/docs">Docs</a>
 * ```
 */
@Component({
  selector: 'button[mkButton], a[mkButton]',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-button',
    '[class.mk-button--sm]': "size() === 'sm'",
    '[class.mk-button--md]': "size() === 'md'",
    '[class.mk-button--lg]': "size() === 'lg'",
    '[class.mk-button--solid]': "variant() === 'solid'",
    '[class.mk-button--soft]': "variant() === 'soft'",
    '[class.mk-button--outline]': "variant() === 'outline'",
    '[class.mk-button--ghost]': "variant() === 'ghost'",
    '[class.mk-button--link]': "variant() === 'link'",
    '[attr.data-tone]': 'tone()',
    '[class.mk-button--block]': 'fullWidth()',
    '[class.mk-button--icon]': 'iconOnly()',
    '[class.mk-button--loading]': 'loading()',
    '[class.mk-button--disabled]': 'isDisabled()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.disabled]': 'nativeDisabled()',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.tabindex]': 'linkDisabledTabindex()',
    '(click)': 'onClick($event)',
  },
})
export class MkButton {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isAnchor =
    this.host.nativeElement.tagName.toLowerCase() === 'a';

  /** Visual treatment. */
  readonly variant = input<MkVariant>('solid');
  /** Semantic color tone. */
  readonly tone = input<MkTone>('primary');
  /** Control size. */
  readonly size = input<MkSize>('md');
  /** Shows a spinner and blocks interaction without collapsing layout. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Stretch to fill the container width. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Square, icon-only button (ensure an `aria-label` is provided). */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** Disable the button (native `disabled` for `<button>`, aria for `<a>`). */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  protected readonly nativeDisabled = computed(() =>
    !this.isAnchor && this.isDisabled() ? '' : null,
  );
  protected readonly ariaDisabled = computed(() =>
    this.isAnchor && this.isDisabled() ? 'true' : null,
  );
  protected readonly linkDisabledTabindex = computed(() =>
    this.isAnchor && this.isDisabled() ? '-1' : null,
  );

  protected onClick(event: Event): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
