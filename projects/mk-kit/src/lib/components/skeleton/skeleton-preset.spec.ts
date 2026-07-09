import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkSkeletonPreset } from './skeleton-preset';

describe('MkSkeletonPreset', () => {
  let fixture: ComponentFixture<MkSkeletonPreset>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkSkeletonPreset);
  });

  afterEach(() => fixture.destroy());

  const skeletons = () =>
    fixture.nativeElement.querySelectorAll('mk-skeleton').length;

  it('announces loading to assistive tech', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('aria-busy')).toBe('true');
    expect(host.getAttribute('aria-label')).toBe('Loading');
  });

  it('renders one skeleton per list row plus internals', () => {
    fixture.componentRef.setInput('preset', 'list');
    fixture.componentRef.setInput('rows', 4);
    fixture.detectChanges();
    // Each list row = 1 avatar + 2 line skeletons.
    expect(skeletons()).toBe(4 * 3);
  });

  it('renders a table header + body grid', () => {
    fixture.componentRef.setInput('preset', 'table');
    fixture.componentRef.setInput('rows', 3);
    fixture.componentRef.setInput('columns', 5);
    fixture.detectChanges();
    // header (5) + 3 rows × 5 cells.
    expect(skeletons()).toBe(5 + 3 * 5);
  });

  it('paragraph renders a title + a text block', () => {
    fixture.componentRef.setInput('preset', 'paragraph');
    fixture.detectChanges();
    expect(skeletons()).toBe(2);
  });
});
