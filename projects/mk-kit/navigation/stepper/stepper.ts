import { NgTemplateOutlet } from '@angular/common';
import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  viewChildren,
} from '@angular/core';
import { MkStep } from './step';
import { MK_I18N } from '@mk-kit/ui/core';

/** Orientation of the step header rail. */
export type MkStepperOrientation = 'horizontal' | 'vertical';

/**
 * Stepper — walks a user through an ordered sequence of `<mk-step>`s with an
 * accessible header rail (ARIA `tablist` + roving tabindex, Arrow/Home/End
 * navigation) and a single visible panel.
 *
 * In `linear` mode a step is only reachable once every preceding required
 * (non-`optional`) step reports `completed`. Drive completion from your form
 * state and move with the `next()` / `previous()` / `reset()` API or by
 * clicking a reachable header.
 *
 * ```html
 * <mk-stepper #s linear [(selectedIndex)]="index">
 *   <mk-step label="Account" [completed]="accountValid()">…</mk-step>
 *   <mk-step label="Address" [completed]="addressValid()">…</mk-step>
 *   <mk-step label="Review">…</mk-step>
 * </mk-stepper>
 * <button mkButton (click)="s.previous()">Back</button>
 * <button mkButton (click)="s.next()">Next</button>
 * ```
 */
@Component({
  selector: 'mk-stepper',
  imports: [NgTemplateOutlet],
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-stepper',
    '[class.mk-stepper--horizontal]': "orientation() === 'horizontal'",
    '[class.mk-stepper--vertical]': "orientation() === 'vertical'",
  },
})
export class MkStepper {
  protected readonly i18n = inject(MK_I18N);
  /** Step hosts are projected on the server only — see stepper.html. */
  protected readonly isServer = isPlatformServer(inject(PLATFORM_ID));

  /** Projected steps, kept live via a signal content query. */
  readonly steps = contentChildren(MkStep);
  /** Rendered header buttons, used to move focus. */
  protected readonly headerButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('stepBtn');

  /** Zero-based index of the active step (two-way). */
  readonly selectedIndex = model(0);
  /** Header rail orientation. */
  readonly orientation = input<MkStepperOrientation>('horizontal');
  /** Enforce sequential completion before a step becomes reachable. */
  readonly linear = input(false, { transform: booleanAttribute });

  protected readonly isHorizontal = computed(
    () => this.orientation() === 'horizontal',
  );

  /** Emits the newly selected index whenever the active step changes. */
  readonly selectionChange = output<number>();

  constructor() {
    // Keep each step's `active` flag in sync with the clamped selected index.
    effect(() => {
      const steps = this.steps();
      const index = this.clampedIndex();
      steps.forEach((step, i) => step.active.set(i === index));
    });
  }

  private readonly clampedIndex = computed(() => {
    const count = this.steps().length;
    if (count === 0) return 0;
    return Math.min(Math.max(this.selectedIndex(), 0), count - 1);
  });

  /** 1-based label for the header circle. */
  protected stepNumber(index: number): number {
    return index + 1;
  }

  /**
   * Whether a step can be selected. In linear mode every earlier required step
   * must be completed; a completed step is reachable only when `editable`.
   */
  isReachable(index: number): boolean {
    const steps = this.steps();
    if (index < 0 || index >= steps.length) return false;
    if (!this.linear()) return true;
    if (index <= this.clampedIndex()) {
      // Going back is allowed only to editable steps.
      return steps[index].editable() || index === this.clampedIndex();
    }
    for (let i = 0; i < index; i++) {
      if (!steps[i].optional() && !steps[i].completed()) return false;
    }
    return true;
  }

  protected select(index: number): void {
    if (!this.isReachable(index)) return;
    if (index === this.clampedIndex()) return;
    this.selectedIndex.set(index);
    this.selectionChange.emit(index);
  }

  protected focusHeader(index: number): void {
    this.headerButtons()[index]?.nativeElement.focus();
  }

  /** Advance to the next reachable step, if any. */
  next(): void {
    const from = this.clampedIndex();
    const target = from + 1;
    if (target < this.steps().length && this.isReachable(target)) {
      this.select(target);
    }
  }

  /** Return to the previous step, if any. */
  previous(): void {
    const target = this.clampedIndex() - 1;
    if (target >= 0) this.select(target);
  }

  /** Reset to the first step and clear every step's completed flag. */
  reset(): void {
    this.steps().forEach((s) => s.completed.set(false));
    this.selectedIndex.set(0);
    this.selectionChange.emit(0);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const count = this.steps().length;
    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = this.nextFocusable(index, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = this.nextFocusable(index, -1);
        break;
      case 'Home':
        next = this.nextFocusable(-1, 1);
        break;
      case 'End':
        next = this.nextFocusable(count, -1);
        break;
      default:
        return;
    }
    if (next >= 0) {
      event.preventDefault();
      // Automatic activation (as in `mk-tabs`): selection follows focus for
      // reachable steps. `nextFocusable` already skips unreachable ones, so the
      // guard only matters if the step became unreachable in between.
      this.focusHeader(next);
      if (this.isReachable(next)) this.select(next);
    }
  }

  /** Next header index (wrapping) whose step is reachable. */
  private nextFocusable(from: number, step: number): number {
    const count = this.steps().length;
    if (!count) return -1;
    for (let i = 1; i <= count; i++) {
      const idx = (((from + step * i) % count) + count) % count;
      if (this.isReachable(idx)) return idx;
    }
    return -1;
  }
}
