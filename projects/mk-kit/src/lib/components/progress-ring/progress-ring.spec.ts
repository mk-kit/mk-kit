import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkProgressRing } from './progress-ring';

describe('MkProgressRing', () => {
  let fixture: ComponentFixture<MkProgressRing>;
  let ring: MkProgressRing;
  let hostEl: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkProgressRing);
    ring = fixture.componentInstance;
    hostEl = fixture.nativeElement;
  });

  it('computes fraction and percent from value/max', () => {
    fixture.componentRef.setInput('value', 30);
    fixture.componentRef.setInput('max', 120);
    fixture.detectChanges();
    expect((ring as any).fraction()).toBe(0.25);
    expect((ring as any).percent()).toBe(25);
  });

  it('clamps the value into range', () => {
    fixture.componentRef.setInput('value', 150);
    fixture.detectChanges();
    expect((ring as any).clampedValue()).toBe(100);
  });

  it('exposes determinate progressbar aria attributes', () => {
    fixture.componentRef.setInput('value', 40);
    fixture.detectChanges();
    expect(hostEl.getAttribute('role')).toBe('progressbar');
    expect(hostEl.getAttribute('aria-valuenow')).toBe('40');
    expect(hostEl.getAttribute('aria-valuemax')).toBe('100');
  });

  it('drops aria-valuenow when indeterminate', () => {
    fixture.componentRef.setInput('indeterminate', true);
    fixture.detectChanges();
    expect(hostEl.getAttribute('aria-valuenow')).toBeNull();
  });

  it('reveals the arc via a proportional dash offset', () => {
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    // Empty ring: the whole circumference is offset (nothing drawn).
    expect((ring as any).dashOffset()).toBeCloseTo((ring as any).circumference());
  });
});
