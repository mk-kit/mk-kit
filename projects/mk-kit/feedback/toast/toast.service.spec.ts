import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkLiveAnnouncer } from '@mkornas/ui/core';
import { MkToastService } from './toast.service';

describe('MkToastService', () => {
  let svc: MkToastService;
  let announce: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    announce = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: MkLiveAnnouncer, useValue: { announce } },
      ],
    });
    svc = TestBed.inject(MkToastService);
  });

  afterEach(() => {
    svc.clear();
    TestBed.resetTestingModule();
    document.querySelectorAll('mk-toast-container').forEach((el) => el.remove());
  });

  async function render() {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('does not double-announce via MkLiveAnnouncer (the toast element is the live region)', async () => {
    svc.show({ title: 'Saved', message: 'All good', duration: 0 });
    await render();
    expect(announce).not.toHaveBeenCalled();
  });

  it('renders non-danger toasts as polite role=status elements', async () => {
    svc.show({ message: 'Saved', tone: 'success', duration: 0 });
    await render();
    const toast = document.querySelector('mk-toast');
    expect(toast?.getAttribute('role')).toBe('status');
  });

  it('renders danger toasts as role=alert elements', async () => {
    svc.danger('Upload failed', { duration: 0 });
    await render();
    const toast = document.querySelector('mk-toast');
    expect(toast?.getAttribute('role')).toBe('alert');
  });
});
