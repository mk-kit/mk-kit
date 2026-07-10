import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkTreemap, mkSquarify, type MkTreemapItem } from './treemap';

describe('mkSquarify', () => {
  const W = 400;
  const H = 300;
  const EPS = 1e-6;

  const items = [
    { value: 6 },
    { value: 6 },
    { value: 4 },
    { value: 3 },
    { value: 2 },
    { value: 2 },
    { value: 1 },
  ];

  it('returns exactly one rect per item, in input order', () => {
    const rects = mkSquarify(items, 0, 0, W, H);
    expect(rects).toHaveLength(items.length);
    rects.forEach((r, i) => expect(r.index).toBe(i));
  });

  it('keeps every rect within the given bounds', () => {
    const rects = mkSquarify(items, 0, 0, W, H);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-EPS);
      expect(r.y).toBeGreaterThanOrEqual(-EPS);
      expect(r.w).toBeGreaterThanOrEqual(-EPS);
      expect(r.h).toBeGreaterThanOrEqual(-EPS);
      expect(r.x + r.w).toBeLessThanOrEqual(W + EPS);
      expect(r.y + r.h).toBeLessThanOrEqual(H + EPS);
    }
  });

  it('tiles the whole area (total rect area ≈ W*H)', () => {
    const rects = mkSquarify(items, 0, 0, W, H);
    const area = rects.reduce((s, r) => s + r.w * r.h, 0);
    expect(area).toBeCloseTo(W * H, 3);
  });

  it('gives a larger value a larger area', () => {
    const rects = mkSquarify([{ value: 1 }, { value: 9 }], 0, 0, W, H);
    const areaOf = (r: { w: number; h: number }) => r.w * r.h;
    expect(areaOf(rects[1])).toBeGreaterThan(areaOf(rects[0]));
  });

  it('respects a non-zero origin offset', () => {
    const rects = mkSquarify(items, 10, 20, W, H);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(10 - EPS);
      expect(r.y).toBeGreaterThanOrEqual(20 - EPS);
      expect(r.x + r.w).toBeLessThanOrEqual(10 + W + EPS);
      expect(r.y + r.h).toBeLessThanOrEqual(20 + H + EPS);
    }
  });

  it('handles an empty input', () => {
    expect(mkSquarify([], 0, 0, W, H)).toHaveLength(0);
  });
});

describe('MkTreemap', () => {
  let fixture: ComponentFixture<MkTreemap>;
  let host: HTMLElement;

  const items: MkTreemapItem[] = [
    { label: 'Ads', value: 40 },
    { label: 'SEO', value: 25 },
    { label: 'Email', value: 15 },
    { label: 'Social', value: 10 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkTreemap);
    host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders one tile <rect> per item', () => {
    const rects = host.querySelectorAll('.mk-treemap__rect');
    expect(rects.length).toBe(items.length);
  });

  it('exposes a screen-reader row per item', () => {
    const rows = host.querySelectorAll('.mk-chart__sr-table tbody tr');
    expect(rows.length).toBe(items.length);
  });

  it('exposes each item\'s rounded share of the total in the SR table', () => {
    // Total = 90 → Ads 40/90 ≈ 44%, SEO 25/90 ≈ 28%.
    const rows = host.querySelectorAll('.mk-chart__sr-table tbody tr');
    const shareOf = (row: Element) => row.querySelectorAll('td')[1].textContent?.trim();
    expect(shareOf(rows[0])).toBe('44%');
    expect(shareOf(rows[1])).toBe('28%');
  });
});
