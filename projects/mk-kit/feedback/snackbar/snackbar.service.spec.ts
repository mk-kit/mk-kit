import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkLiveAnnouncer } from '@mkornas/ui/core';
import { MkSnackbarService } from './snackbar.service';

describe('MkSnackbarService', () => {
  let svc: MkSnackbarService;
  let announce: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    announce = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: MkLiveAnnouncer, useValue: { announce } },
      ],
    });
    svc = TestBed.inject(MkSnackbarService);
  });

  afterEach(() => {
    const active = svc.active();
    if (active) svc.dismiss(active.id);
    TestBed.resetTestingModule();
    document.querySelectorAll('mk-snackbar-container').forEach((el) => el.remove());
  });

  async function render() {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('does not double-announce via MkLiveAnnouncer (the snackbar element is the live region)', async () => {
    svc.open('Message archived', 'Undo', { duration: 0 });
    await render();
    expect(announce).not.toHaveBeenCalled();
  });

  it('renders neutral snackbars as polite role=status elements', async () => {
    svc.open('Changes saved', undefined, { duration: 0 });
    await render();
    const bar = document.querySelector('mk-snackbar');
    expect(bar?.getAttribute('role')).toBe('status');
  });

  it('renders danger snackbars as role=alert elements', async () => {
    svc.open('Sync failed', undefined, { tone: 'danger', duration: 0 });
    await render();
    const bar = document.querySelector('mk-snackbar');
    expect(bar?.getAttribute('role')).toBe('alert');
  });
});
