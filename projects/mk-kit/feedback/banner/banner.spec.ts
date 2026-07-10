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
});
