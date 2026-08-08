import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkProgressBar } from './progress-bar';

@Component({
  imports: [MkProgressBar],
  template: `<mk-progress-bar
    [value]="value()"
    [indeterminate]="indeterminate()"
    [label]="label()"
    [showValue]="showValue()"
  />`,
})
class Host {
  value = signal(40);
  indeterminate = signal(false);
  label = signal<string | undefined>(undefined);
  showValue = signal(false);
}

describe('MkProgressBar', () => {
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
      bar: el.querySelector<HTMLElement>('mk-progress-bar')!,
      fill: el.querySelector<HTMLElement>('.mk-progress-bar__fill')!,
      host: fixture.componentInstance,
    };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('implements the ARIA progressbar pattern', () => {
    const { bar } = mount();
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
  });

  it('drives the fill transform from the value', () => {
    const { fixture, fill, host } = mount();
    expect(fill.style.transform).toBe('scaleX(0.4)');

    host.value.set(75);
    fixture.detectChanges();
    expect(fill.style.transform).toBe('scaleX(0.75)');
  });

  it('clamps out-of-range values into 0–100', () => {
    const { fixture, bar, fill, host } = mount();
    host.value.set(150);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(fill.style.transform).toBe('scaleX(1)');

    host.value.set(-20);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(fill.style.transform).toBe('scaleX(0)');
  });

  it('rounds fractional values', () => {
    const { fixture, bar, host } = mount();
    host.value.set(33.6);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('34');
  });

  it('drops aria-valuenow when indeterminate', () => {
    const { fixture, bar, fill, host } = mount();
    host.indeterminate.set(true);
    fixture.detectChanges();

    // No known completion: the value must be absent, not zero.
    expect(bar.getAttribute('aria-valuenow')).toBeNull();
    expect(bar.classList.contains('mk-progress-bar--indeterminate')).toBe(true);
    // No inline transform either — the CSS keyframes own the fill's motion.
    expect(fill.style.transform).toBe('');
  });

  it('falls back to a generic aria-label when unlabelled', () => {
    const { bar } = mount();
    expect(bar.getAttribute('aria-label')).toBe('Progress');
    expect(bar.getAttribute('aria-labelledby')).toBeNull();
  });

  it('labels itself from the visible caption when one is given', () => {
    const { fixture, el, bar, host } = mount();
    host.label.set('Uploading');
    fixture.detectChanges();

    const labelId = bar.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(bar.getAttribute('aria-label')).toBeNull();
    expect(el.querySelector(`#${labelId}`)?.textContent).toContain('Uploading');
  });

  it('shows the percentage only when asked and only when determinate', () => {
    const { fixture, el, host } = mount();
    expect(el.querySelector('.mk-progress-bar__value')).toBeNull();

    host.showValue.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.mk-progress-bar__value')?.textContent).toContain('40%');

    host.indeterminate.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.mk-progress-bar__value')).toBeNull();
  });
});
