import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkBanner } from './banner';

describe('MkBanner', () => {
  let fixture: ComponentFixture<MkBanner>;
  let banner: MkBanner;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkBanner);
    banner = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('dismiss closes the banner and emits', () => {
    const dismissed = vi.fn();
    banner.dismissed.subscribe(dismissed);
    (banner as any).dismiss();
    expect(banner.open()).toBe(false);
    expect(dismissed).toHaveBeenCalledOnce();
  });

  it('uses role=alert for danger/warning, role=status otherwise', () => {
    fixture.componentRef.setInput('tone', 'danger');
    expect((banner as any).role()).toBe('alert');
    fixture.componentRef.setInput('tone', 'warning');
    expect((banner as any).role()).toBe('alert');
    fixture.componentRef.setInput('tone', 'info');
    expect((banner as any).role()).toBe('status');
  });

  it('scopes the live region to the body, not the whole banner', () => {
    fixture.componentRef.setInput('dismissible', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const region = el.querySelector('[role]')!;
    expect(region.classList.contains('mk-banner__body')).toBe(true);
    expect(region.getAttribute('role')).toBe('status');
    expect(el.querySelector('.mk-banner__box')!.getAttribute('role')).toBeNull();

    // Actions and the dismiss button must sit outside the live region.
    expect(region.querySelector('.mk-banner__actions')).toBeNull();
    expect(region.querySelector('.mk-banner__close')).toBeNull();
    expect(el.querySelector('.mk-banner__close')).toBeTruthy();
  });

  it('hides the icon slot from assistive tech', () => {
    const icon = (fixture.nativeElement as HTMLElement).querySelector(
      '.mk-banner__icon',
    )!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
