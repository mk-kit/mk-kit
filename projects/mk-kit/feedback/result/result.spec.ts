import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkResult } from './result';

describe('MkResult', () => {
  let fixture: ComponentFixture<MkResult>;
  let cmp: MkResult;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkResult);
    cmp = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('renders the title and subtitle', () => {
    fixture.componentRef.setInput('resultTitle', 'Payment complete');
    fixture.componentRef.setInput('subtitle', 'Your order is on its way.');
    fixture.detectChanges();
    expect(el.querySelector('.mk-result__title')?.textContent).toContain(
      'Payment complete',
    );
    expect(el.querySelector('.mk-result__subtitle')?.textContent).toContain(
      'Your order is on its way.',
    );
  });

  it('renders the title as an h2', () => {
    fixture.componentRef.setInput('resultTitle', 'Done');
    fixture.detectChanges();
    expect(el.querySelector('h2.mk-result__title')).toBeTruthy();
  });

  it('omits the title element when resultTitle is unset', () => {
    fixture.detectChanges();
    expect(el.querySelector('.mk-result__title')).toBeNull();
  });

  it('maps each status to the correct icon variant', () => {
    const cases: Array<[string, string]> = [
      ['success', 'check'],
      ['error', 'x'],
      ['500', 'x'],
      ['warning', 'alert'],
      ['403', 'alert'],
      ['404', 'search'],
      ['info', 'info'],
    ];
    for (const [status, icon] of cases) {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      expect((cmp as any).iconName()).toBe(icon);
    }
  });

  it('maps each status to the correct tone', () => {
    const cases: Array<[string, string]> = [
      ['success', 'success'],
      ['error', 'danger'],
      ['500', 'danger'],
      ['warning', 'warning'],
      ['403', 'warning'],
      ['404', 'muted'],
      ['info', 'info'],
    ];
    for (const [status, tone] of cases) {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      expect((cmp as any).tone()).toBe(tone);
    }
  });

  it('defaults to the info status', () => {
    fixture.detectChanges();
    expect((cmp as any).iconName()).toBe('info');
    expect((cmp as any).tone()).toBe('info');
    expect(el.getAttribute('data-status')).toBe('info');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('renders the built-in svg icon', () => {
    fixture.componentRef.setInput('status', 'success');
    fixture.detectChanges();
    expect(el.querySelector('.mk-result__icon-default svg')).toBeTruthy();
  });
});
