import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  makeEnvironmentProviders,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MK_I18N, MK_OVERLAY_DATA, MkOverlayRef } from '@mk-kit/ui/core';
import { MkButton } from '@mk-kit/ui/button';
import { MkIcon } from '@mk-kit/ui/icon';
import { MkDialog, MkDialogService } from '@mk-kit/ui/feedback';

/** Options for {@link provideMkSessionExpiry}. */
export interface MkSessionExpiryConfig {
  /** Epoch ms when the session lapses, or `null` when there is none. Read reactively. */
  expiresAt: () => number | null;
  /** How long before the lapse the dialog appears. Default 2 minutes. */
  warnBeforeMs?: number;
  /** Extend the session (refresh the token). Resolve = extended, reject = nothing to extend. */
  extend: () => Promise<unknown>;
  /** End the session (sign out, navigate). */
  onExpire: () => void;
  /** Read reactively; `false` suspends the watcher (a kiosk / PIN mode, say). */
  enabled?: () => boolean;
}

export const MK_SESSION_EXPIRY_CONFIG = new InjectionToken<MkSessionExpiryConfig>('MK_SESSION_EXPIRY_CONFIG');

/** Data handed to {@link MkSessionExpiryDialog}. */
export interface MkSessionExpiryDialogData {
  expiresAt: number;
  extend: () => Promise<unknown>;
  onExpire: () => void;
}

/**
 * Last call before a session ends: counts down and offers to extend.
 * Reaching zero ends the session, so doing nothing still produces a definite,
 * visible outcome. Opened by {@link MkSessionExpiry}; usable on its own.
 */
@Component({
  selector: 'mk-session-expiry-dialog',
  imports: [MkDialog, MkButton, MkIcon],
  template: `
    <mk-dialog [dialogTitle]="i18n.sessionExpiryTitle" hideClose>
      <div class="mk-session-expiry__body">
        <mk-icon class="mk-session-expiry__icon" name="schedule" [size]="28" />
        <p class="mk-session-expiry__text">{{ i18n.sessionExpiryBody(countdown()) }}</p>
      </div>
      <div mkDialogFooter>
        <button mkButton variant="ghost" tone="neutral" type="button" (click)="signOut()">
          {{ i18n.sessionExpiryLogout }}
        </button>
        <button mkButton tone="primary" type="button" [disabled]="extending()" (click)="extend()">
          {{ extending() ? i18n.sessionExpiryExtending : i18n.sessionExpiryExtend }}
        </button>
      </div>
    </mk-dialog>
  `,
  styles: `
    .mk-session-expiry__body {
      display: flex;
      align-items: flex-start;
      gap: var(--mk-space-3);
    }
    .mk-session-expiry__icon {
      flex: none;
      color: var(--mk-warning);
    }
    .mk-session-expiry__text {
      margin: 0;
      color: var(--mk-text-muted);
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MkSessionExpiryDialog implements OnDestroy {
  protected readonly i18n = inject(MK_I18N);
  private readonly data = inject<MkSessionExpiryDialogData>(MK_OVERLAY_DATA);
  private readonly ref = inject(MkOverlayRef);
  private readonly zone = inject(NgZone);

  protected readonly extending = signal(false);
  private readonly remainingMs = signal(this.data.expiresAt - Date.now());
  /** "1:04" — floored at zero. */
  protected readonly countdown = computed(() => {
    const total = Math.max(0, Math.ceil(this.remainingMs() / 1000));
    const m = Math.floor(total / 60);
    return `${m}:${String(total - m * 60).padStart(2, '0')}`;
  });

  private readonly ticker = this.zone.runOutsideAngular(() =>
    setInterval(() => {
      const left = this.data.expiresAt - Date.now();
      this.zone.run(() => {
        this.remainingMs.set(left);
        if (left <= 0) this.expire();
      });
    }, 1000),
  );

  ngOnDestroy(): void {
    clearInterval(this.ticker);
  }

  protected extend(): void {
    if (this.extending()) return;
    this.extending.set(true);
    this.data.extend().then(
      () => this.ref.close('extended'),
      () => this.expire(),
    );
  }

  protected signOut(): void {
    this.expire();
  }

  private expire(): void {
    clearInterval(this.ticker);
    this.ref.close('expired');
    this.data.onExpire();
  }
}

/**
 * Watches `expiresAt()` and warns BEFORE the session lapses, so a session
 * never ends silently: the dialog offers to extend, or signs out at zero.
 * Re-arms itself whenever `expiresAt()` changes (every token rotation),
 * runs the timer outside the Angular zone and only in the browser. Started
 * automatically by {@link provideMkSessionExpiry}.
 */
@Injectable({ providedIn: 'root' })
export class MkSessionExpiry {
  private readonly config = inject(MK_SESSION_EXPIRY_CONFIG, { optional: true });
  private readonly dialog = inject(MkDialogService);
  private readonly zone = inject(NgZone);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  /** Whether the dialog is currently open. */
  readonly open = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  /** Begin watching. Idempotent; called by the provider's initializer. */
  start(): void {
    if (this.started || !this.config) return;
    this.started = true;
    effect(
      () => {
        this.config!.expiresAt();
        this.config!.enabled?.();
        this.schedule();
      },
      { injector: this.injector },
    );
  }

  private clear(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    this.clear();
    if (!this.isBrowser || !this.config) return;
    if (this.config.enabled && !this.config.enabled()) return;
    const expiresAt = this.config.expiresAt();
    if (expiresAt === null) return;
    const delay = expiresAt - Date.now() - (this.config.warnBeforeMs ?? 120_000);
    if (delay <= 0) {
      this.warn();
      return;
    }
    this.zone.runOutsideAngular(() => {
      this.timer = setTimeout(() => this.zone.run(() => this.warn()), delay);
    });
  }

  private warn(): void {
    if (this.open() || !this.config) return;
    const expiresAt = this.config.expiresAt();
    if (expiresAt === null) return;
    // Already lapsed while the tab was suspended: end it cleanly rather than
    // showing a countdown that starts at zero.
    if (expiresAt <= Date.now()) {
      this.config.onExpire();
      return;
    }
    this.open.set(true);
    const data: MkSessionExpiryDialogData = {
      expiresAt,
      extend: this.config.extend,
      onExpire: this.config.onExpire,
    };
    this.dialog
      .open(MkSessionExpiryDialog, {
        size: 'sm',
        // "Extend" and "sign out" are the only outcomes; a backdrop click
        // would leave a dying session with nothing on screen saying so.
        closeOnBackdropClick: false,
        closeOnEscape: false,
        data,
      })
      .closed$.subscribe(() => {
        this.open.set(false);
        this.schedule();
      });
  }
}

/**
 * Register the session-expiry watcher; it starts with the application.
 *
 * ```ts
 * provideMkSessionExpiry({
 *   expiresAt: () => auth.tokenExpiresAt(),
 *   extend: () => firstValueFrom(auth.refresh()),
 *   onExpire: () => auth.logout(),
 *   warnBeforeMs: 2 * 60_000,
 * })
 * ```
 */
export function provideMkSessionExpiry(config: MkSessionExpiryConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: MK_SESSION_EXPIRY_CONFIG, useValue: config },
    provideEnvironmentInitializer(() => inject(MkSessionExpiry).start()),
  ]);
}
