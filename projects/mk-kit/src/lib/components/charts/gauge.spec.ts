import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkGauge } from './gauge';

describe('MkGauge', () => {
  let fixture: ComponentFixture<MkGauge>;
  let gauge: MkGauge;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkGauge);
    gauge = fixture.componentInstance;
    fixture.componentRef.setInput('value', 60);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('normalises the value to a 0–1 fraction', () => {
    expect((gauge as any).fraction()).toBeCloseTo(0.6);
  });

  it('clamps out-of-range values', () => {
    fixture.componentRef.setInput('value', 200);
    expect((gauge as any).fraction()).toBe(1);
    fixture.componentRef.setInput('value', -50);
    expect((gauge as any).fraction()).toBe(0);
  });

  it('formats the centre text with a unit', () => {
    expect((gauge as any).centerText()).toBe('60');
    fixture.componentRef.setInput('unit', '%');
    expect((gauge as any).centerText()).toBe('60%');
    fixture.componentRef.setInput('valueText', 'A+');
    expect((gauge as any).centerText()).toBe('A+');
  });

  it('renders a track arc, and a value arc only when > 0', () => {
    expect((gauge as any).trackPath()).toContain('A'); // arc command
    expect((gauge as any).valuePath()).toContain('A');
    fixture.componentRef.setInput('value', 0);
    expect((gauge as any).valuePath()).toBe('');
  });
});
