import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkAlert } from './alert';

@Component({
  imports: [MkAlert],
  template: `<mk-alert
    [tone]="tone()"
    [title]="title()"
    [dismissible]="dismissible()"
    (dismissed)="dismissedCount = dismissedCount + 1"
    >Something happened</mk-alert
  >`,
})
class Host {
  tone = signal<'info' | 'success' | 'warning' | 'danger'>('info');
  title = signal<string | undefined>(undefined);
  dismissible = signal(false);
  dismissedCount = 0;
}

describe('MkAlert', () => {
  function mount() {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      el,
      alert: el.querySelector<HTMLElement>('mk-alert')!,
      host: fixture.componentInstance,
    };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders the projected message', () => {
    const { alert } = mount();
    expect(alert.textContent).toContain('Something happened');
  });

  it('renders the optional title only when set', () => {
    const { fixture, el, host } = mount();
    expect(el.querySelector('.mk-alert__title')).toBeNull();

    host.title.set('Heads up');
    fixture.detectChanges();
    expect(el.querySelector('.mk-alert__title')?.textContent).toContain('Heads up');
  });

  it('is a polite status for informational tones', () => {
    const { fixture, alert, host } = mount();
    expect(alert.getAttribute('role')).toBe('status');

    host.tone.set('success');
    fixture.detectChanges();
    expect(alert.getAttribute('role')).toBe('status');
  });

  it('escalates to an assertive alert for warning and danger', () => {
    const { fixture, alert, host } = mount();
    host.tone.set('warning');
    fixture.detectChanges();
    expect(alert.getAttribute('role')).toBe('alert');

    host.tone.set('danger');
    fixture.detectChanges();
    expect(alert.getAttribute('role')).toBe('alert');
  });

  it('exposes the tone for styling', () => {
    const { fixture, alert, host } = mount();
    host.tone.set('danger');
    fixture.detectChanges();
    expect(alert.getAttribute('data-tone')).toBe('danger');
  });

  it('shows a labelled close button only when dismissible', () => {
    const { fixture, el, host } = mount();
    expect(el.querySelector('.mk-alert__close')).toBeNull();

    host.dismissible.set(true);
    fixture.detectChanges();

    const close = el.querySelector<HTMLButtonElement>('.mk-alert__close')!;
    expect(close).toBeTruthy();
    expect(close.getAttribute('aria-label')).toBeTruthy();
  });

  it('emits dismissed when the close button is activated', () => {
    const { fixture, el, host } = mount();
    host.dismissible.set(true);
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.mk-alert__close')!.click();
    fixture.detectChanges();
    expect(host.dismissedCount).toBe(1);
  });
});
