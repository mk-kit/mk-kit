import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkNotificationCenter, MkNotification } from './notification-center';

function sample(): MkNotification[] {
  return [
    { id: 1, title: 'One', read: false },
    { id: 2, title: 'Two', read: true },
    { id: 3, title: 'Three', body: 'hi', read: false },
  ];
}

describe('MkNotificationCenter', () => {
  let fixture: ComponentFixture<MkNotificationCenter>;
  let cmp: MkNotificationCenter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkNotificationCenter);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('computes unreadCount from the unread notifications', () => {
    fixture.componentRef.setInput('notifications', sample());
    fixture.detectChanges();
    expect(cmp.unreadCount()).toBe(2);
  });

  it('markAllRead sets every item read and drops the count to 0', () => {
    fixture.componentRef.setInput('notifications', sample());
    fixture.detectChanges();
    const allRead = vi.fn();
    cmp.markedAllRead.subscribe(allRead);

    cmp.markAllRead();

    expect(cmp.unreadCount()).toBe(0);
    expect(cmp.notifications().every((n) => n.read)).toBe(true);
    expect(allRead).toHaveBeenCalledOnce();
  });

  it('markAllRead is a no-op (no emit) when nothing is unread', () => {
    fixture.componentRef.setInput('notifications', [
      { id: 1, title: 'One', read: true },
    ]);
    fixture.detectChanges();
    const allRead = vi.fn();
    cmp.markedAllRead.subscribe(allRead);

    cmp.markAllRead();

    expect(allRead).not.toHaveBeenCalled();
  });

  it('reading a row marks just that item and emits read + itemClick', () => {
    fixture.componentRef.setInput('notifications', sample());
    fixture.detectChanges();
    const read = vi.fn();
    const clicked = vi.fn();
    cmp.read.subscribe(read);
    cmp.itemClick.subscribe(clicked);

    const target = cmp.notifications()[0];
    (cmp as any).onRowClick(target);

    const list = cmp.notifications();
    expect(list[0].read).toBe(true);
    expect(list[2].read).toBe(false);
    expect(cmp.unreadCount()).toBe(1);
    expect(read).toHaveBeenCalledOnce();
    expect(clicked).toHaveBeenCalledWith(target);
  });

  it('clicking an already-read row emits itemClick but not read', () => {
    fixture.componentRef.setInput('notifications', sample());
    fixture.detectChanges();
    const read = vi.fn();
    const clicked = vi.fn();
    cmp.read.subscribe(read);
    cmp.itemClick.subscribe(clicked);

    (cmp as any).onRowClick(cmp.notifications()[1]);

    expect(read).not.toHaveBeenCalled();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('flags unread rows with visually-hidden text (not color alone)', () => {
    fixture.componentRef.setInput('notifications', sample());
    cmp.openPanel();
    fixture.detectChanges();

    const items = document.querySelectorAll('.mk-notification-center__item');
    expect(items.length).toBe(3);
    expect(
      items[0].querySelector('.mk-visually-hidden')?.textContent,
    ).toContain('Unread');
    expect(items[1].querySelector('.mk-visually-hidden')).toBeNull();
    expect(items[2].querySelector('.mk-visually-hidden')).toBeTruthy();
  });

  it('"Mark all read" uses aria-disabled and stays focusable after activation', () => {
    fixture.componentRef.setInput('notifications', sample());
    cmp.openPanel();
    fixture.detectChanges();

    const markAll = document.querySelector<HTMLButtonElement>(
      '.mk-notification-center__mark-all',
    )!;
    expect(markAll.textContent).toContain('Mark all read');
    expect(markAll.disabled).toBe(false);
    expect(markAll.getAttribute('aria-disabled')).toBe('false');

    markAll.click();
    fixture.detectChanges();

    // Not natively disabled, so keyboard focus is not dropped…
    expect(markAll.disabled).toBe(false);
    expect(markAll.getAttribute('aria-disabled')).toBe('true');
    // …and re-activating while aria-disabled is a guarded no-op.
    const allRead = vi.fn();
    cmp.markedAllRead.subscribe(allRead);
    markAll.click();
    expect(allRead).not.toHaveBeenCalled();
  });

  it('shows the empty state when the panel is open with no notifications', () => {
    // The anchored panel teleports itself into document.body, so query there.
    cmp.openPanel();
    fixture.detectChanges();
    const panel = document.querySelector('.mk-notification-center__panel');
    expect(cmp.unreadCount()).toBe(0);
    expect(panel).toBeTruthy();
    expect(panel!.querySelector('mk-empty-state')).toBeTruthy();
    expect(panel!.querySelector('.mk-notification-center__list')).toBeNull();
  });
});
