import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkOverlayService } from './overlay.service';

/**
 * `autoFocus: false` exists for content-led surfaces — a product sheet, an
 * image preview — where the first focusable element is usually the close
 * button, so focusing it on open reads as "dismiss me" to a screen reader.
 *
 * It must NOT be implemented by turning the focus trap off: Tab containment
 * and focus restore are what make the overlay a modal at all.
 */
@Component({
  standalone: true,
  template: `
    <button type="button" class="first">Close</button>
    <button type="button" class="second">Add</button>
  `,
})
class TwoButtons {}

describe('MkOverlayService autoFocus', () => {
  let service: MkOverlayService;
  let trigger: HTMLButtonElement;
  let restoreLayout: () => void;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MkOverlayService);
    // A real trigger, so focus restore has somewhere to go back to.
    trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    // jsdom never lays out, so every element reports offsetWidth/Height 0 —
    // and mkGetFocusable filters on exactly that to skip hidden controls.
    // Without this stub NOTHING is ever focusable and the default case can't
    // be distinguished from autoFocus:false. Verified against a real browser:
    // the first control does receive focus there.
    const proto = window.HTMLElement.prototype;
    const original = Object.getOwnPropertyDescriptor(proto, 'offsetHeight');
    Object.defineProperty(proto, 'offsetHeight', { configurable: true, value: 10 });
    restoreLayout = () => {
      if (original) Object.defineProperty(proto, 'offsetHeight', original);
      else delete (proto as unknown as Record<string, unknown>)['offsetHeight'];
    };
  });

  afterEach(() => {
    restoreLayout();
    trigger.remove();
  });

  it('focuses the first control by default', async () => {
    const ref = service.open(TwoButtons, {});
    await Promise.resolve(); // the trap focuses in a microtask
    expect(document.activeElement).toBe(document.querySelector('.first'));
    ref.close();
  });

  it('focuses the panel itself when autoFocus is false', async () => {
    const ref = service.open(TwoButtons, { autoFocus: false });
    await Promise.resolve();

    const active = document.activeElement as HTMLElement;
    expect(active).not.toBe(document.querySelector('.first'));
    // The panel takes focus so the trap still has a root to contain Tab from.
    expect(active.contains(document.querySelector('.first'))).toBe(true);
    ref.close();
  });

  it('still restores focus to the trigger on close', async () => {
    const ref = service.open(TwoButtons, { autoFocus: false });
    await Promise.resolve();
    ref.close();
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);
  });
});
