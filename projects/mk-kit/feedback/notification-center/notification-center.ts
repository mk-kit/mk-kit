import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mkUniqueId } from '@mk-kit/ui/core';
import { mkGetFocusable } from '@mk-kit/ui/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkAnchoredPanel } from '@mk-kit/ui/core';
import { MkBadge } from '@mk-kit/ui/data';
import { MkEmptyState } from '@mk-kit/ui/data';
import { MkIcon } from '@mk-kit/ui/icon';

/** A single notification shown in the {@link MkNotificationCenter} panel. */
export interface MkNotification {
  /** Stable identity, used for `track` and immutable updates. */
  id: unknown;
  /** Headline line, always shown. */
  title: string;
  /** Optional supporting text under the title. */
  body?: string;
  /** Optional relative/absolute timestamp label (e.g. "2m ago"). */
  time?: string;
  /** Whether the user has already read this item. */
  read?: boolean;
}

/**
 * NotificationCenter — a bell trigger with an unread-count badge that opens a
 * dropdown panel listing notifications, each markable as read.
 *
 * The panel renders in the browser top layer through {@link MkAnchoredPanel},
 * so it is never clipped by an ancestor's `overflow`/`transform`. Clicking the
 * bell toggles it; an outside click, Tabbing out or Escape closes it and
 * restores focus to the bell. Clicking a row marks that one read (updating the
 * two-way `notifications` immutably); "Mark all read" clears every unread item.
 *
 * ```html
 * <mk-notification-center
 *   [(notifications)]="items"
 *   (itemClick)="open($event)"
 *   (markedAllRead)="sync()" />
 * ```
 */
@Component({
  selector: 'mk-notification-center',
  templateUrl: './notification-center.html',
  styleUrl: './notification-center.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAnchoredPanel, MkBadge, MkEmptyState, MkIcon],
  host: {
    class: 'mk-notification-center',
  },
})
export class MkNotificationCenter {
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly i18n = inject(MK_I18N);

  /** Stable id linking the trigger to the panel via `aria-controls`. */
  readonly panelId = mkUniqueId('mk-notification-center');
  /** Stable id for the panel's labelling heading. */
  readonly titleId = mkUniqueId('mk-notification-center-title');

  /** Two-way list of notifications rendered in the panel. */
  readonly notifications = model<MkNotification[]>([]);
  /** Heading shown at the top of the panel. */
  readonly panelTitle = input(this.i18n.notificationsTitle);
  /** Message shown by the empty state when there are no notifications. */
  readonly emptyText = input(this.i18n.allCaughtUp);
  /** Max height of the scrollable list (any CSS length). */
  readonly maxHeight = input('24rem');

  /** Emitted with a notification when its row is clicked. */
  readonly itemClick = output<MkNotification>();
  /** Emitted with a notification when it transitions to read. */
  readonly read = output<MkNotification>();
  /** Emitted when every notification is marked read at once. */
  readonly markedAllRead = output<void>();

  private readonly _open = signal(false);
  /** Whether the panel is open. */
  readonly open = this._open.asReadonly();

  /** Count of notifications that are not yet read. */
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length,
  );

  /** Accessible label for the bell trigger. */
  protected readonly triggerLabel = computed(() =>
    this.i18n.notificationsUnread(this.unreadCount()),
  );

  /** Badge text, capped at "99+". */
  protected readonly badgeText = computed(() => {
    const n = this.unreadCount();
    return n > 99 ? '99+' : `${n}`;
  });

  /** Toggle the panel open/closed. */
  toggle(): void {
    this._open() ? this.close() : this.openPanel();
  }

  /** Open the panel, moving focus into it on the next render. */
  openPanel(): void {
    if (!this.isBrowser || this._open()) return;
    this._open.set(true);
    afterNextRender(() => this.focusInitial(), { injector: this.injector });
  }

  /** Close the panel; optionally restore focus to the bell trigger. */
  close(restoreFocus = true): void {
    if (!this._open()) return;
    this._open.set(false);
    if (restoreFocus) this.triggerRef()?.nativeElement.focus();
  }

  /** Mark every notification read and emit {@link markedAllRead}. */
  markAllRead(): void {
    if (this.unreadCount() === 0) return;
    this.notifications.update((list) =>
      list.map((n) => (n.read ? n : { ...n, read: true })),
    );
    this.markedAllRead.emit();
  }

  /** Handle a row click: mark it read (if needed) and emit {@link itemClick}. */
  protected onRowClick(item: MkNotification): void {
    if (!item.read) this.markRead(item);
    this.itemClick.emit(item);
  }

  private markRead(item: MkNotification): void {
    let updated: MkNotification | undefined;
    this.notifications.update((list) =>
      list.map((n) => {
        if (n !== item || n.read) return n;
        updated = { ...n, read: true };
        return updated;
      }),
    );
    if (updated) this.read.emit(updated);
  }

  protected onEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.close(true);
  }

  protected onPanelFocusout(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    if (!related) return;
    const panel = this.panelRef()?.nativeElement;
    const trigger = this.triggerRef()?.nativeElement;
    if (panel?.contains(related) || trigger?.contains(related)) return;
    this.close(false);
  }

  private focusInitial(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;
    (mkGetFocusable(panel)[0] ?? panel).focus();
  }
}
