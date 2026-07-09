import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  Injector,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import type { MkPlacement } from '../../core/types';
import { mkGetFocusable } from '../../core/a11y/focus-trap';
import { MkAnchoredPanel } from '../../core/overlay/anchored-overlay';

/**
 * A single coach-mark step in a product tour. The `target` is the element the
 * step points at — either a live `HTMLElement` or a CSS selector resolved
 * against the document when the step is shown.
 */
export interface MkTourStep {
  /** Element (or selector) the popover anchors to and highlights. */
  target: string | HTMLElement;
  /** Optional heading shown above the body. */
  title?: string;
  /** The explanatory copy for this step. */
  body: string;
  /** Preferred placement of the popover relative to the target. */
  placement?: MkPlacement;
}

/** Navigation callbacks the popup invokes on the owning {@link MkTourService}. */
export interface MkTourController {
  next(): void;
  prev(): void;
  end(): void;
}

/** Per-step data injected into {@link MkTourPopup} via {@link MK_TOUR_DATA}. */
export interface MkTourData {
  /** The step being shown. */
  step: MkTourStep;
  /** Zero-based index of this step. */
  index: number;
  /** Total number of steps in the tour. */
  total: number;
  /** The resolved target element to anchor against. */
  anchor: HTMLElement;
  /** Navigation handle back to the service. */
  controller: MkTourController;
}

/** DI token carrying the current {@link MkTourData} to the popup. */
export const MK_TOUR_DATA = new InjectionToken<MkTourData>('MK_TOUR_DATA');

/**
 * The floating coach-mark popover for one tour step. Rendered dynamically by
 * {@link MkTourService} (one instance per step) and anchored to the step's
 * target through {@link MkAnchoredPanel}, so it lives in the browser top layer
 * and is never clipped by an ancestor's `overflow`/`transform`.
 */
@Component({
  selector: 'mk-tour-popup',
  templateUrl: './tour-popup.html',
  styleUrl: './tour-popup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel],
  host: {
    class: 'mk-tour',
  },
})
export class MkTourPopup {
  private readonly injector = inject(Injector);
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** The step + navigation data for this popup. */
  protected readonly data = inject(MK_TOUR_DATA);

  /** Whether this is the final step (Next becomes "Done"). */
  protected readonly isLast = computed(
    () => this.data.index >= this.data.total - 1,
  );

  constructor() {
    afterNextRender(() => this.focusInitial(), { injector: this.injector });
  }

  protected next(): void {
    this.data.controller.next();
  }

  protected prev(): void {
    this.data.controller.prev();
  }

  protected skip(): void {
    this.data.controller.end();
  }

  protected onEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.data.controller.end();
  }

  /**
   * Ignore anchored-panel dismisses (outside pointerdown / window blur): a tour
   * should stay put while the user reads it — it ends only via the buttons or
   * Escape.
   */
  protected onDismiss(): void {
    /* intentionally inert */
  }

  private focusInitial(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    (mkGetFocusable(panel)[0] ?? panel).focus();
  }
}
