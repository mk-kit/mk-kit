import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkRangeSlider } from './range-slider';

describe('MkRangeSlider', () => {
  let fixture: ComponentFixture<MkRangeSlider>;
  let rs: MkRangeSlider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkRangeSlider);
    rs = fixture.componentInstance;
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.componentRef.setInput('step', 10);
    rs.value.set([20, 80]);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const key = (thumb: 0 | 1, k: string) =>
    (rs as any).onKeydown(thumb, new KeyboardEvent('keydown', { key: k }));

  it('moves the low thumb with the keyboard and notifies the form', () => {
    const onChange = vi.fn();
    rs.registerOnChange(onChange);
    key(0, 'ArrowRight');
    expect(rs.value()).toEqual([30, 80]);
    expect(onChange).toHaveBeenCalledWith([30, 80]);
  });

  it('prevents the thumbs from crossing', () => {
    rs.value.set([40, 50]);
    key(0, 'PageUp'); // big step would push low past high
    expect(rs.value()[0]).toBeLessThanOrEqual(rs.value()[1]);
    rs.value.set([40, 50]);
    key(1, 'PageDown'); // push high below low
    expect(rs.value()[1]).toBeGreaterThanOrEqual(rs.value()[0]);
  });

  it('Home/End respect the neighbouring thumb', () => {
    rs.value.set([30, 70]);
    key(0, 'Home');
    expect(rs.value()[0]).toBe(0);
    key(1, 'End');
    expect(rs.value()[1]).toBe(100);
  });

  it('writeValue normalises a reversed pair', () => {
    rs.writeValue([80, 20]);
    expect(rs.value()).toEqual([20, 80]);
  });
});
