import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MkDialog } from './dialog';

@Component({
  imports: [MkDialog],
  template: `
    <div class="mk-overlay-panel mk-dialog-panel" role="dialog" style="position: relative">
      <mk-dialog dialogTitle="Report" [draggable]="draggable()" [resizable]="resizable()">
        <p>Body</p>
      </mk-dialog>
    </div>
  `,
})
class Host {
  readonly draggable = signal(true);
  readonly resizable = signal(true);
}

const Pointer = typeof PointerEvent === 'undefined' ? MouseEvent : PointerEvent;

describe('MkDialog drag / resize', () => {
  let fixture: ComponentFixture<Host>;
  const root = () => fixture.nativeElement as HTMLElement;
  const panel = () => root().querySelector<HTMLElement>('.mk-overlay-panel')!;
  const header = () => root().querySelector<HTMLElement>('.mk-dialog__header')!;
  const grip = () => root().querySelector<HTMLButtonElement>('.mk-dialog__grip')!;
  const resizer = () => root().querySelector<HTMLButtonElement>('.mk-dialog__resizer')!;

  function pointer(el: HTMLElement, type: string, x: number, y: number) {
    el.dispatchEvent(new Pointer(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0 }));
  }
  function key(el: HTMLElement, k: string, init: KeyboardEventInit = {}) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
  }
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(Host);
    await settle();
    // jsdom has no layout: give the panel a place and a size.
    // A layout would include the applied `translate`; mirror that here.
    panel().getBoundingClientRect = () => {
      const [tx = 0, ty = 0] = panel().style.translate.split(' ').map((v) => parseFloat(v) || 0);
      const w = parseFloat(panel().style.width) || 400;
      const h = parseFloat(panel().style.height) || 300;
      const left = 300 + tx;
      const top = 200 + ty;
      return { left, top, width: w, height: h, right: left + w, bottom: top + h, x: left, y: top, toJSON: () => ({}) } as DOMRect;
    };
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  it('marks the panel and shows the grips only when enabled', async () => {
    expect(panel().classList.contains('mk-dialog-panel--draggable')).toBe(true);
    expect(panel().classList.contains('mk-dialog-panel--resizable')).toBe(true);
    expect(grip()).toBeTruthy();
    expect(resizer()).toBeTruthy();
    fixture.componentInstance.draggable.set(false);
    fixture.componentInstance.resizable.set(false);
    await settle();
    expect(panel().classList.contains('mk-dialog-panel--draggable')).toBe(false);
    expect(root().querySelector('.mk-dialog__grip')).toBeNull();
    expect(root().querySelector('.mk-dialog__resizer')).toBeNull();
  });

  it('moves the panel with a header drag, clamped to the viewport, and resets on double-click', () => {
    pointer(header(), 'pointerdown', 100, 100);
    expect(panel().classList.contains('mk-dialog-panel--dragging')).toBe(true);
    pointer(header(), 'pointermove', 140, 130);
    expect(panel().style.translate).toBe('40px 30px');
    // Far beyond the right/bottom edge → clamped so the panel stays on screen.
    pointer(header(), 'pointermove', 2000, 2000);
    expect(panel().style.translate).toBe('300px 300px');
    pointer(header(), 'pointerup', 2000, 2000);
    expect(panel().classList.contains('mk-dialog-panel--dragging')).toBe(false);
    expect(panel().classList.contains('mk-dialog-panel--moved')).toBe(true); // entrance animation stays off

    header().dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(panel().style.translate).toBe('');
  });

  it('ignores drags that start on a control in the header', () => {
    const close = root().querySelector<HTMLElement>('.mk-dialog__close')!;
    pointer(close, 'pointerdown', 10, 10);
    pointer(header(), 'pointermove', 50, 50);
    expect(panel().style.translate).toBe('');
  });

  it('moves with the arrow keys on the grip (Shift = larger steps) and resets on Home', () => {
    grip().focus();
    key(grip(), 'ArrowRight');
    key(grip(), 'ArrowDown', { shiftKey: true });
    expect(panel().style.translate).toBe('8px 32px');
    key(grip(), 'ArrowLeft');
    expect(panel().style.translate).toBe('0px 32px');
    key(grip(), 'Home');
    expect(panel().style.translate).toBe('');
  });

  it('resizes from the corner grip by pointer and keyboard within limits', () => {
    pointer(resizer(), 'pointerdown', 700, 500);
    pointer(resizer(), 'pointermove', 750, 540);
    expect(panel().style.width).toBe('450px');
    expect(panel().style.height).toBe('340px');
    pointer(resizer(), 'pointermove', -2000, -2000);
    expect(panel().style.width).toBe('240px');
    expect(panel().style.height).toBe('160px');
    pointer(resizer(), 'pointermove', 5000, 5000);
    expect(panel().style.width).toBe('1000px');
    expect(panel().style.height).toBe('800px');
    pointer(resizer(), 'pointerup', 5000, 5000);

    key(resizer(), 'Home');
    expect(panel().style.width).toBe('');
    expect(panel().style.height).toBe('');
    key(resizer(), 'ArrowRight');
    expect(panel().style.width).toBe('416px'); // preset rect (400) + 16
    key(resizer(), 'ArrowUp', { shiftKey: true });
    expect(panel().style.height).toBe('236px'); // 300 - 64
  });
});
