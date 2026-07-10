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
import { MkToastContainer } from './toast-container';

/** Semantic tones supported by toasts. */
export type MkToastTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/** An optional action button rendered inside a toast. */
export interface MkToastAction {
  /** Button label. */
  label: string;
  /** Invoked when the action is activated. The toast is dismissed afterwards. */
  handler?: () => void;
}

/** Options accepted by {@link MkToastService.show}. */
export interface MkToastConfig {
  /** Optional bold heading. */
  title?: string;
  /** Body message (required). */
  message: string;
  /** Semantic tone. Default `info`. */
  tone?: MkToastTone;
  /** Auto-dismiss delay in ms. `0` keeps the toast until dismissed. Default `5000`. */
  duration?: number;
  /** Show a close button. Default `true`. */
  dismissible?: boolean;
  /** Optional action button. */
  action?: MkToastAction;
}

/** A live toast rendered by the container. */
export interface MkToastItem {
  readonly id: number;
  readonly title?: string;
  readonly message: string;
  readonly tone: MkToastTone;
  readonly duration: number;
  readonly dismissible: boolean;
  readonly action?: MkToastAction;
}

const DEFAULT_DURATION = 5000;
let nextId = 0;

interface ToastTimer {
  handle: ReturnType<typeof setTimeout>;
  remaining: number;
  startedAt: number;
}

/**
 * Toast service — enqueues transient notifications rendered by a single,
 * lazily-mounted {@link MkToastContainer} at the bottom-right of the viewport.
 * Each toast is announced to assistive tech (`assertive` for `danger`, else
 * `polite`) and auto-dismisses after `duration` ms unless it is `0`.
 *
 * ```ts
 * toasts.success('Saved');
 * toasts.show({ title: 'Upload failed', message: 'Retry?', tone: 'danger',
 *   duration: 0, action: { label: 'Retry', handler: () => retry() } });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkToastService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(MkLiveAnnouncer);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _toasts = signal<readonly MkToastItem[]>([]);
  /** Reactive list of currently visible toasts. */
  readonly toasts = this._toasts.asReadonly();

  private readonly timers = new Map<number, ToastTimer>();
  private containerRef?: ComponentRef<MkToastContainer>;

  /** Show a toast, returning its id (usable with {@link dismiss}). */
  show(config: MkToastConfig): number {
    const item: MkToastItem = {
      id: nextId++,
      title: config.title,
      message: config.message,
      tone: config.tone ?? 'info',
      duration: config.duration ?? DEFAULT_DURATION,
      dismissible: config.dismissible ?? true,
      action: config.action,
    };

    if (!this.isBrowser) return item.id;

    this.ensureContainer();
    this._toasts.update((list) => [...list, item]);

    this.announcer.announce(
      item.title ? `${item.title}. ${item.message}` : item.message,
      item.tone === 'danger' ? 'assertive' : 'polite',
    );

    if (item.duration > 0) this.startTimer(item.id, item.duration);
    return item.id;
  }

  /** Show an `info` toast. */
  info(message: string, config: Partial<MkToastConfig> = {}): number {
    return this.show({ ...config, message, tone: 'info' });
  }
  /** Show a `success` toast. */
  success(message: string, config: Partial<MkToastConfig> = {}): number {
    return this.show({ ...config, message, tone: 'success' });
  }
  /** Show a `warning` toast. */
  warning(message: string, config: Partial<MkToastConfig> = {}): number {
    return this.show({ ...config, message, tone: 'warning' });
  }
  /** Show a `danger` toast. */
  danger(message: string, config: Partial<MkToastConfig> = {}): number {
    return this.show({ ...config, message, tone: 'danger' });
  }
  /** Show a `neutral` toast. */
  neutral(message: string, config: Partial<MkToastConfig> = {}): number {
    return this.show({ ...config, message, tone: 'neutral' });
  }

  /** Dismiss a toast by id. */
  dismiss(id: number): void {
    this.clearTimer(id);
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  /** Dismiss every visible toast. */
  clear(): void {
    this.timers.forEach((t) => clearTimeout(t.handle));
    this.timers.clear();
    this._toasts.set([]);
  }

  /** Run a toast action, then dismiss it. */
  runAction(item: MkToastItem): void {
    item.action?.handler?.();
    this.dismiss(item.id);
  }

  /** Pause a toast's auto-dismiss countdown (e.g. on hover/focus). */
  pause(id: number): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    clearTimeout(timer.handle);
    timer.remaining -= Date.now() - timer.startedAt;
  }

  /** Resume a paused countdown. */
  resume(id: number): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    this.startTimer(id, Math.max(timer.remaining, 0));
  }

  private startTimer(id: number, duration: number): void {
    this.timers.set(id, {
      handle: setTimeout(() => this.dismiss(id), duration),
      remaining: duration,
      startedAt: Date.now(),
    });
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer.handle);
    this.timers.delete(id);
  }

  private ensureContainer(): void {
    if (this.containerRef) return;
    const ref = createComponent(MkToastContainer, {
      environmentInjector: this.envInjector,
    });
    this.appRef.attachView(ref.hostView);
    this.document.body.appendChild(ref.location.nativeElement);
    this.containerRef = ref;
  }
}
