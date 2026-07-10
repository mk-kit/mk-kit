import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnDestroy,
  type OnInit,
  type Signal,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import type { MkSize } from '@mkornas/ui/core';
import { MkRadioGroup } from './radio-group';

/**
 * Radio — a single option within an `mk-radio-group`. Rendered as
 * `role="radio"` with a roving tabindex managed by the parent group, so the
 * whole group is a single Tab stop and Arrow keys move between options.
 *
 * Must be used as a child of `mk-radio-group`.
 *
 * ```html
 * <mk-radio [value]="'pro'">Pro plan</mk-radio>
 * ```
 */
@Component({
  selector: 'mk-radio',
  templateUrl: './radio.html',
  styleUrl: './radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-radio',
    role: 'radio',
    '[class.mk-radio--checked]': 'checked()',
    '[class.mk-radio--disabled]': 'isDisabled()',
    '[class.mk-radio--sm]': "size() === 'sm'",
    '[class.mk-radio--md]': "size() === 'md'",
    '[class.mk-radio--lg]': "size() === 'lg'",
    '[attr.data-tone]': 'group.tone()',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.tabindex]': 'tabindex()',
    '(click)': 'onClick()',
  },
})
export class MkRadio implements OnInit, OnDestroy {
  protected readonly group = inject(MkRadioGroup);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The value contributed to the group when this radio is selected. */
  readonly value = input<unknown>(null);
  /** Disable just this radio. */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly size: Signal<MkSize> = computed(() => this.group.size());
  readonly checked: Signal<boolean> = computed(() =>
    this.group.isChecked(this),
  );
  readonly isDisabled: Signal<boolean> = computed(
    () => this.disabled() || this.group.isDisabled(),
  );

  /** Roving tabindex: the checked radio (or the first enabled one) is tabbable. */
  protected readonly tabindex: Signal<number> = computed(() => {
    if (this.isDisabled()) return -1;
    if (this.group.hasChecked()) return this.checked() ? 0 : -1;
    return this.group.firstEnabled() === this ? 0 : -1;
  });

  ngOnInit(): void {
    this.group.register(this);
  }
  ngOnDestroy(): void {
    this.group.unregister(this);
  }

  /** Focus this radio's host element (used by the group's keyboard nav). */
  focus(): void {
    this.host.nativeElement.focus();
  }

  protected onClick(): void {
    if (this.isDisabled()) return;
    this.group.select(this);
    this.focus();
  }
}
