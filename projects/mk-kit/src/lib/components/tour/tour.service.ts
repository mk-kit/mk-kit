import {
  ApplicationRef,
  ComponentRef,
  DOCUMENT,
  EnvironmentInjector,
  Injectable,
  Injector,
  PLATFORM_ID,
  computed,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  MK_TOUR_DATA,
  MkTourPopup,
  type MkTourData,
  type MkTourStep,
} from './tour-popup';

/** Inline styles overwritten on the highlighted target; restored on teardown. */
interface MkTargetSnapshot {
  el: HTMLElement;
  position: string;
  zIndex: string;
  boxShadow: string;
  borderRadius: string;
  transition: string;
}

/**
 * Product-onboarding tour service — walks the user through a sequence of
 * {@link MkTourStep}s. For each step it scrolls the target into view, dims the
 * page behind a scrim, highlights the target with a bright ring, and anchors a
 * coach-mark popover ({@link MkTourPopup}) to it in the browser top layer via
 * `MkAnchoredPanel`.
 *
 * ```ts
 * const tour = inject(MkTourService);
 * await tour.start([
 *   { target: '#new-btn', title: 'Create', body: 'Start a project here.' },
 *   { target: '#inbox', body: 'Your notifications land here.', placement: 'left' },
 * ]);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkTourService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _steps = signal<readonly MkTourStep[]>([]);
  private readonly _index = signal(-1);
  private readonly _running = signal(false);

  /** Zero-based index of the current step, or `-1` when no tour is running. */
  readonly index = this._index.asReadonly();
  /** Whether a tour is currently active. */
  readonly running = this._running.asReadonly();
  /** Total number of steps in the active tour. */
  readonly total = computed(() => this._steps().length);
  /** The current step, or `null`. */
  readonly currentStep = computed<MkTourStep | null>(() => {
    const i = this._index();
    return i >= 0 ? (this._steps()[i] ?? null) : null;
  });

  private popupRef?: ComponentRef<MkTourPopup>;
  private scrim?: HTMLElement;
  private snapshot?: MkTargetSnapshot;
  private endResolve?: () => void;
  private endPromise = Promise.resolve();
  /** Element focused before start(); focus is restored to it on end(). */
  private previouslyFocused: HTMLElement | null = null;

  /**
   * Begin a tour at step 0. Returns a promise that resolves when the tour ends
   * (finished, skipped, or Escaped).
   */
  start(steps: MkTourStep[]): Promise<void> {
    if (!this.isBrowser || steps.length === 0) return Promise.resolve();
    // Restart cleanly if one is already running.
    if (this._running()) this.end();

    this.endPromise = new Promise<void>((resolve) => {
      this.endResolve = resolve;
    });
    this.previouslyFocused = this.document
      .activeElement as HTMLElement | null;
    this._steps.set([...steps]);
    this._running.set(true);
    this.document.addEventListener('keydown', this.onKeydown, true);
    this.ensureScrim();
    this.showStep(0, 1);
    return this.endPromise;
  }

  /** Resolves when the active (or next) tour ends. */
  afterEnd(): Promise<void> {
    return this.endPromise;
  }

  /** Advance to the next step, or finish on the last step. */
  next(): void {
    if (!this._running()) return;
    this.showStep(this._index() + 1, 1);
  }

  /** Return to the previous step (no-op at the first step). */
  prev(): void {
    if (!this._running() || this._index() <= 0) return;
    this.showStep(this._index() - 1, -1);
  }

  /** End the tour and clean up all DOM, highlight, and listeners. */
  end(): void {
    if (!this._running()) return;
    this._running.set(false);
    this.teardownStep();
    this.removeScrim();
    this.document.removeEventListener('keydown', this.onKeydown, true);
    this._index.set(-1);
    this._steps.set([]);
    // Return focus to wherever the user was before the tour started
    // (Done/Skip/Escape all funnel through here).
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
    const resolve = this.endResolve;
    this.endResolve = undefined;
    resolve?.();
  }

  private readonly onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.end();
    }
  };

  /**
   * Render the step at `index`. Missing targets are skipped by continuing in
   * `dir` (+1 forward, -1 back); if none remain the tour ends.
   */
  private showStep(index: number, dir: 1 | -1): void {
    this.teardownStep();
    const steps = this._steps();

    let i = index;
    let target: HTMLElement | null = null;
    while (i >= 0 && i < steps.length) {
      target = this.resolveTarget(steps[i].target);
      if (target) break;
      i += dir;
    }
    if (!target || i < 0 || i >= steps.length) {
      this.end();
      return;
    }

    this._index.set(i);
    this.highlight(target);
    target.scrollIntoView?.({ block: 'center', inline: 'center', behavior: 'smooth' });

    const data: MkTourData = {
      step: steps[i],
      index: i,
      total: steps.length,
      anchor: target,
      controller: {
        next: () => this.next(),
        prev: () => this.prev(),
        end: () => this.end(),
      },
    };

    const ref = createComponent(MkTourPopup, {
      environmentInjector: this.envInjector,
      elementInjector: Injector.create({
        parent: this.envInjector,
        providers: [{ provide: MK_TOUR_DATA, useValue: data }],
      }),
    });
    this.appRef.attachView(ref.hostView);
    this.document.body.appendChild(ref.location.nativeElement);
    this.popupRef = ref;
  }

  /** Destroy the current popup and restore the current target's styles. */
  private teardownStep(): void {
    if (this.popupRef) {
      this.appRef.detachView(this.popupRef.hostView);
      this.popupRef.destroy();
      this.popupRef.location.nativeElement.remove();
      this.popupRef = undefined;
    }
    this.unhighlight();
  }

  private resolveTarget(target: string | HTMLElement): HTMLElement | null {
    if (typeof target !== 'string') {
      return target.isConnected ? target : null;
    }
    return this.document.querySelector<HTMLElement>(target);
  }

  /** Raise the target above the scrim and draw a bright ring around it. */
  private highlight(el: HTMLElement): void {
    const style = el.style;
    this.snapshot = {
      el,
      position: style.position,
      zIndex: style.zIndex,
      boxShadow: style.boxShadow,
      borderRadius: style.borderRadius,
      transition: style.transition,
    };
    el.classList.add('mk-tour-target');
    if (getComputedStyle(el).position === 'static') {
      style.position = 'relative';
    }
    style.setProperty('z-index', 'calc(var(--mk-z-overlay, 1000) + 1)');
    style.boxShadow =
      '0 0 0 3px var(--mk-primary), 0 0 0 6px var(--mk-primary-contrast)';
    if (!style.borderRadius) style.borderRadius = 'var(--mk-radius-md)';
    style.transition = 'box-shadow var(--mk-duration-fast, 140ms) ease';
  }

  private unhighlight(): void {
    const snap = this.snapshot;
    if (!snap) return;
    const { el } = snap;
    el.classList.remove('mk-tour-target');
    el.style.position = snap.position;
    el.style.zIndex = snap.zIndex;
    el.style.boxShadow = snap.boxShadow;
    el.style.borderRadius = snap.borderRadius;
    el.style.transition = snap.transition;
    this.snapshot = undefined;
  }

  private ensureScrim(): void {
    if (this.scrim) return;
    const scrim = this.document.createElement('div');
    scrim.className = 'mk-tour-scrim';
    scrim.style.cssText =
      'position:fixed;inset:0;background:var(--mk-overlay-scrim,rgba(0,0,0,0.45));animation:mk-overlay-fade var(--mk-duration-fast,140ms) var(--mk-ease-out,ease);';
    scrim.style.setProperty('z-index', 'var(--mk-z-overlay, 1000)');
    this.document.body.appendChild(scrim);
    this.scrim = scrim;
  }

  private removeScrim(): void {
    this.scrim?.remove();
    this.scrim = undefined;
  }
}
