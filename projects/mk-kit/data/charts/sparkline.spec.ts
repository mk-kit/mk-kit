import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkSparkline } from './sparkline';

describe('MkSparkline', () => {
  let fixture: ComponentFixture<MkSparkline>;
  let spark: MkSparkline;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkSparkline);
    spark = fixture.componentInstance;
    fixture.componentRef.setInput('width', 100);
    fixture.componentRef.setInput('height', 40);
  });

  it('produces one point per datum spanning the width', () => {
    fixture.componentRef.setInput('data', [1, 2, 3, 4]);
    fixture.detectChanges();
    const pts = (spark as any).points();
    expect(pts.length).toBe(4);
    expect(pts[0].x).toBeLessThan(pts[3].x);
  });

  it('inverts the y axis (larger value → smaller y)', () => {
    fixture.componentRef.setInput('data', [1, 5]);
    fixture.detectChanges();
    const pts = (spark as any).points();
    expect(pts[1].y).toBeLessThan(pts[0].y);
  });

  it('summarises the trend in the accessible label', () => {
    fixture.componentRef.setInput('data', [1, 2, 3]);
    fixture.detectChanges();
    const label = (spark as any).resolvedLabel();
    expect(label).toContain('up');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe(label);
  });

  it('handles empty data without throwing', () => {
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect((spark as any).points()).toEqual([]);
    expect((spark as any).resolvedLabel()).toContain('no data');
  });
});
