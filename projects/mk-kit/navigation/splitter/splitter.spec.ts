import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkSplitter } from './splitter';

describe('MkSplitter', () => {
  let fixture: ComponentFixture<MkSplitter>;
  let sp: MkSplitter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(MkSplitter);
    sp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  const key = (k: string) =>
    (sp as any).onKeydown(new KeyboardEvent('keydown', { key: k }));

  it('clamps an out-of-range size for rendering', () => {
    fixture.componentRef.setInput('max', 80);
    sp.size.set(95);
    expect((sp as any).clampedSize()).toBe(80);
  });

  it('ArrowRight / ArrowLeft resize by step (horizontal)', () => {
    fixture.componentRef.setInput('step', 10);
    sp.size.set(50);
    key('ArrowRight');
    expect(sp.size()).toBe(60);
    key('ArrowLeft');
    expect(sp.size()).toBe(50);
  });

  it('Home / End jump to min / max', () => {
    fixture.componentRef.setInput('min', 15);
    fixture.componentRef.setInput('max', 85);
    key('Home');
    expect(sp.size()).toBe(15);
    key('End');
    expect(sp.size()).toBe(85);
  });

  it('respects orientation for the resize keys', () => {
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput('step', 5);
    sp.size.set(50);
    key('ArrowDown');
    expect(sp.size()).toBe(55);
    key('ArrowLeft'); // ignored in vertical mode
    expect(sp.size()).toBe(55);
  });

  it('does not resize when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    sp.size.set(50);
    key('End');
    expect(sp.size()).toBe(50);
  });
});
