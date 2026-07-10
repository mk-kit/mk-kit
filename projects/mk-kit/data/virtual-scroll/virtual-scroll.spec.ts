import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkVirtualScroll } from './virtual-scroll';

describe('MkVirtualScroll', () => {
  let fixture: ComponentFixture<MkVirtualScroll>;
  let vs: MkVirtualScroll;
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkVirtualScroll);
    vs = fixture.componentInstance;
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('itemHeight', 40);
    fixture.componentRef.setInput('overscan', 2);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('sizes the total scroll height to all items', () => {
    expect((vs as any).totalHeight()).toBe(1000 * 40);
  });

  it('renders only a window of items, not the whole list', () => {
    (vs as any).viewportHeight.set(400); // 10 rows visible
    (vs as any).scrollTop.set(0);
    const visible = (vs as any).visibleItems() as { index: number }[];
    // 10 visible + 2*overscan = ~14, far fewer than 1000.
    expect(visible.length).toBeLessThan(20);
    expect(visible[0].index).toBe(0);
  });

  it('windows around the scroll position with the correct offset', () => {
    (vs as any).viewportHeight.set(400);
    (vs as any).scrollTop.set(4000); // 100 rows down
    const visible = (vs as any).visibleItems() as { index: number; item: unknown }[];
    expect(visible[0].index).toBe(100 - 2); // start - overscan
    expect((vs as any).offset()).toBe((100 - 2) * 40);
    expect(visible[0].item).toBe(items[98]);
  });
});
