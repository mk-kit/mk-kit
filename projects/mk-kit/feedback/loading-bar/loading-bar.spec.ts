import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MK_I18N } from '@mkornas/ui/core';
import { MkLoadingBar } from './loading-bar';
import { MkLoadingBarService } from './loading-bar.service';

@Component({
  imports: [MkLoadingBar],
  template: `<mk-loading-bar />`,
})
class Host {}

describe('MkLoadingBar', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return {
      fixture,
      svc: TestBed.inject(MkLoadingBarService),
      el: (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
        'mk-loading-bar',
      )!,
      i18n: TestBed.inject(MK_I18N),
    };
  }

  afterEach(() => {
    TestBed.inject(MkLoadingBarService).stop();
    TestBed.resetTestingModule();
  });

  it('is hidden from assistive tech while idle', () => {
    const { el } = mount();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('aria-valuenow')).toBeNull();
  });

  it('exposes labelled progressbar semantics while visible', async () => {
    const { fixture, svc, el, i18n } = mount();
    svc.set(42);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('42');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    expect(el.getAttribute('aria-label')).toBe(i18n.loading);
  });

  it('drops the value and hides again after stop()', async () => {
    const { fixture, svc, el } = mount();
    svc.set(42);
    fixture.detectChanges();
    svc.stop();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('aria-valuenow')).toBeNull();
  });
});
