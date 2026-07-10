import {
  ApplicationRef,
  ComponentRef,
  DOCUMENT,
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MkLiveAnnouncer } from '@mkornas/ui/core';
import { MkSnackbarContainer } from './snackbar-container';

/** Semantic tone of a snackbar. `neutral` is the default dark bar. */
export type MkSnackbarTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

/** Why a snackbar closed. */
export type MkSnackbarDismissReason = 'action' | 'timeout' | 'dismiss';

/** Options for {@link MkSnackbarService.open}. */
export interface MkSnackbarConfig {
  /** Semantic tone. Default `neutral`. */
  tone?: MkSnackbarTone;
  /** Auto-dismiss delay in ms. `0` keeps it open until dismissed. Default `5000`. */
  duration?: number;
  /** Show a close (×) button. Default `false` (dismiss via action/timeout). */
  dismissible?: boolean;
  /** Live-region politeness for the announcement. Default `polite`. */
  politeness?: 'polite' | 'assertive';
}

/** The live snackbar model rendered by the container. */
export interface MkSnackbarItem {
  readonly id: number;
  readonly message: string;
  readonly actionLabel?: string;
  readonly tone: MkSnackbarTone;
  readonly dismissible: boolean;
}

const DEFAULT_DURATION = 5000;
let nextId = 0;

/**
 * Handle to an opened snackbar. Await {@link onAction} to react to the action
 * button, or {@link afterDismissed} to run code once it closes.
 */
export class MkSnackbarRef {
  private actionResolve!: () => void;
  private dismissResolve!: (reason: MkSnackbarDismissReason) => void;
  private readonly actionPromise = new Promise<void>((r) => {
    this.actionResolve = r;
  });
  private readonly dismissPromise = new Promise<MkSnackbarDismissReason>((r) => {
    this.dismissResolve = r;
  });

  constructor(
    /** Unique id of the snackbar this ref controls. */
    readonly id: number,
    private readonly service: MkSnackbarService,
  ) {}

  /** Dismiss the snackbar programmatically. */
  dismiss(): void {
    this.service.dismiss(this.id);
  }

  /** Resolves when the action button is activated. */
  onAction(): Promise<void> {
    return this.actionPromise;
  }

  /** Resolves when the snackbar has closed, with the reason it closed. */
  afterDismissed(): Promise<MkSnackbarDismissReason> {
    return this.dismissPromise;
  }

  /** @internal */
  _notifyAction(): void {
    this.actionResolve();
  }
  /** @internal */
  _notifyDismissed(reason: MkSnackbarDismissReason): void {
    this.dismissResolve(reason);
  }
}

/**
 * Snackbar service — shows a single, brief message at the bottom-centre of the
 * viewport with an optional action button, following the Material snackbar
 * model: only one is visible at a time, and opening a new one replaces the
 * current. For stacked, persistent notifications use `MkToastService` instead.
 *
 * ```ts
 * const ref = snackbar.open('Message archived', 'Undo');
 * ref.onAction().then(() => restore());
 *
 * snackbar.open('Changes saved', undefined, { tone: 'success' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkSnackbarService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _active = signal<MkSnackbarItem | null>(null);
  /** The currently visible snackbar, or `null`. */
  readonly active = this._active.asReadonly();

  private readonly refs = new Map<number, MkSnackbarRef>();
  private timer?: ReturnType<typeof setTimeout>;
  private remaining = 0;
  private startedAt = 0;
  private containerRef?: ComponentRef<MkSnackbarContainer>;

  /**
   * Open a snackbar. `action` is the (optional) button label — react to it via
   * the returned ref's {@link MkSnackbarRef.onAction}.
   */
  open(
    message: string,
    action?: string,
    config: MkSnackbarConfig = {},
  ): MkSnackbarRef {
    const id = nextId++;
    const ref = new MkSnackbarRef(id, this);
    if (!this.isBrowser) return ref;

    // Replace any currently-open snackbar (Material single-slot behaviour).
    const current = this._active();
    if (current) this.dismiss(current.id);

    const item: MkSnackbarItem = {
      id,
      message,
      actionLabel: action,
      tone: config.tone ?? 'neutral',
      dismissible: config.dismissible ?? false,
    };

    this.ensureContainer();
    this.refs.set(id, ref);
    this._active.set(item);
    this.announcer.announce(message, config.politeness ?? 'polite');

    const duration = config.duration ?? DEFAULT_DURATION;
    if (duration > 0) this.startTimer(id, duration);
    return ref;
  }

  /** Dismiss the snackbar with the given id (if it is the active one). */
  dismiss(id: number): void {
    this.close(id, 'dismiss');
  }

  /** Run the action for the active snackbar, then close it. */
  runAction(id: number): void {
    this.refs.get(id)?._notifyAction();
    this.close(id, 'action');
  }

  /** Pause the auto-dismiss countdown (e.g. on hover/focus). */
  pause(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remaining -= Date.now() - this.startedAt;
  }

  /** Resume a paused countdown. */
  resume(): void {
    const active = this._active();
    if (!active || this.timer || this.remaining <= 0) return;
    this.startTimer(active.id, this.remaining);
  }

  private close(id: number, reason: MkSnackbarDismissReason): void {
    if (this._active()?.id !== id) return;
    this.clearTimer();
    this._active.set(null);
    const ref = this.refs.get(id);
    this.refs.delete(id);
    ref?._notifyDismissed(reason);
  }

  private startTimer(id: number, duration: number): void {
    this.remaining = duration;
    this.startedAt = Date.now();
    this.timer = setTimeout(() => this.close(id, 'timeout'), duration);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.remaining = 0;
  }

  private ensureContainer(): void {
    if (this.containerRef) return;
    const ref = createComponent(MkSnackbarContainer, {
      environmentInjector: this.envInjector,
    });
    this.appRef.attachView(ref.hostView);
    this.document.body.appendChild(ref.location.nativeElement);
    this.containerRef = ref;
  }
}
