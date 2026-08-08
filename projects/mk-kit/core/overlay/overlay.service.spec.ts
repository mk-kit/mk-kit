import {
  ApplicationRef,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MkOverlayService } from './overlay.service';

@Component({
  standalone: true,
  template: `<button type="button">Ok</button>`,
})
class PanelStub {}

/** Dispatch a realistic Escape keydown; cancelable so preventDefault works. */
function pressEscape(target: EventTarget = document): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

describe('MkOverlayService — Escape stacking, inert background, pointer events', () => {
  let service: MkOverlayService;
  let appRef: ApplicationRef;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(MkOverlayService);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => {
    service.closeAll();
    document
      .querySelectorAll('.mk-overlay-container')
      .forEach((n) => n.remove());
    // Safety net: no test may leak inert onto shared body children.
    for (const el of Array.from(document.body.children)) {
      el.removeAttribute('inert');
    }
  });

  describe('Escape stacking', () => {
    it('closes only the topmost overlay per keypress, newest first', () => {
      const first = service.open(PanelStub, {});
      const second = service.open(PanelStub, {});
      appRef.tick();

      const event = pressEscape();
      expect(second.closed()).toBe(true);
      expect(first.closed()).toBe(false);
      // The consumed keypress must not also trigger app-level Escape logic.
      expect(event.defaultPrevented).toBe(true);

      pressEscape();
      expect(first.closed()).toBe(true);
      expect(service.openCount).toBe(0);
    });

    it('ignores an Escape an inner widget already consumed (defaultPrevented)', () => {
      const ref = service.open(PanelStub, {});
      appRef.tick();

      // A menu / anchored panel open inside the dialog handles Escape on its
      // own element during bubble and calls preventDefault — simulate that.
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      event.preventDefault();
      document.dispatchEvent(event);

      expect(ref.closed()).toBe(false);
    });

    it('skips overlays with closeOnEscape disabled', () => {
      const stubborn = service.open(PanelStub, { closeOnEscape: false });
      appRef.tick();

      pressEscape();
      expect(stubborn.closed()).toBe(false);
    });
  });

  describe('inert background', () => {
    it('inerts body siblings while a modal is open and restores them on close', () => {
      const sibling = document.createElement('div');
      const popover = document.createElement('div');
      popover.setAttribute('popover', 'manual');
      const toast = document.createElement('mk-toast-container');
      document.body.append(sibling, popover, toast);

      try {
        const ref = service.open(PanelStub, {});
        appRef.tick();

        expect(sibling.hasAttribute('inert')).toBe(true);
        // Live floating surfaces must stay reachable above the dialog.
        expect(popover.hasAttribute('inert')).toBe(false);
        expect(toast.hasAttribute('inert')).toBe(false);
        // The overlay's own container obviously stays live.
        const container = document.querySelector('.mk-overlay-container')!;
        expect(container.hasAttribute('inert')).toBe(false);

        ref.close();
        expect(sibling.hasAttribute('inert')).toBe(false);
      } finally {
        sibling.remove();
        popover.remove();
        toast.remove();
      }
    });

    it('nested modals unwind in order: the inner close keeps the outer inert set', () => {
      const sibling = document.createElement('div');
      document.body.appendChild(sibling);

      try {
        const outer = service.open(PanelStub, {});
        appRef.tick();
        const outerContainer = document.querySelector('.mk-overlay-container')!;

        const inner = service.open(PanelStub, {});
        appRef.tick();
        // The inner modal inerts the outer dialog, but must not re-record the
        // sibling the outer dialog already inerted.
        expect(outerContainer.hasAttribute('inert')).toBe(true);
        expect(sibling.hasAttribute('inert')).toBe(true);

        inner.close();
        expect(outerContainer.hasAttribute('inert')).toBe(false);
        // Still inert: it belongs to the OUTER dialog's record.
        expect(sibling.hasAttribute('inert')).toBe(true);

        outer.close();
        expect(sibling.hasAttribute('inert')).toBe(false);
      } finally {
        sibling.remove();
      }
    });

    it('a backdropless overlay inerts nothing', () => {
      const sibling = document.createElement('div');
      document.body.appendChild(sibling);

      try {
        const ref = service.open(PanelStub, { hasBackdrop: false });
        appRef.tick();
        expect(sibling.hasAttribute('inert')).toBe(false);
        ref.close();
      } finally {
        sibling.remove();
      }
    });
  });

  describe('pointer events without a backdrop', () => {
    it('lets clicks through the container while the panel stays interactive', () => {
      const ref = service.open(PanelStub, { hasBackdrop: false });
      appRef.tick();

      const container = document.querySelector(
        '.mk-overlay-container',
      ) as HTMLElement;
      const panel = container.querySelector('.mk-overlay-panel') as HTMLElement;
      expect(container.style.pointerEvents).toBe('none');
      expect(panel.style.pointerEvents).toBe('auto');
      ref.close();
    });

    it('a backdropped overlay keeps blocking the page', () => {
      const ref = service.open(PanelStub, {});
      appRef.tick();

      const container = document.querySelector(
        '.mk-overlay-container',
      ) as HTMLElement;
      expect(container.style.pointerEvents).not.toBe('none');
      ref.close();
    });
  });

  describe('body scroll lock', () => {
    /** Mock window.scrollY / window.scrollTo the way client sizes are mocked. */
    function mockPageScroll(scrollY: number) {
      const scrollTo = vi.fn();
      Object.defineProperty(window, 'scrollY', {
        value: scrollY,
        configurable: true,
      });
      Object.defineProperty(window, 'scrollTo', {
        value: scrollTo,
        configurable: true,
        writable: true,
      });
      return scrollTo;
    }

    function restorePageScroll() {
      delete (window as any).scrollY;
      delete (window as any).scrollTo;
    }

    it('fixes the body at the saved offset and restores it only when the last overlay closes', () => {
      const scrollTo = mockPageScroll(320);
      try {
        const first = service.open(PanelStub, {});
        const second = service.open(PanelStub, {});
        appRef.tick();

        const body = document.body;
        // iOS-proof lock: overflow:hidden alone is ignored for touch scrolls.
        expect(body.style.position).toBe('fixed');
        expect(body.style.top).toBe('-320px');
        expect(body.style.overflow).toBe('hidden');
        expect(body.style.width).toBe('100%');

        second.close();
        // Reference-counted: the remaining overlay still holds the lock, so
        // the inner close must not restore the page early.
        expect(body.style.position).toBe('fixed');
        expect(scrollTo).not.toHaveBeenCalled();

        first.close();
        expect(body.style.position).toBe('');
        expect(body.style.top).toBe('');
        expect(body.style.overflow).toBe('');
        expect(body.style.width).toBe('');
        // Restoration jumps back instantly so it is invisible to the user.
        expect(scrollTo).toHaveBeenCalledTimes(1);
        expect(scrollTo).toHaveBeenCalledWith({ top: 320, behavior: 'instant' });
      } finally {
        restorePageScroll();
      }
    });

    it('restores the scroll position after an Escape cascade closes the stack', () => {
      const scrollTo = mockPageScroll(48);
      try {
        service.open(PanelStub, {});
        service.open(PanelStub, {});
        appRef.tick();

        pressEscape();
        expect(scrollTo).not.toHaveBeenCalled();

        pressEscape();
        expect(service.openCount).toBe(0);
        expect(document.body.style.position).toBe('');
        expect(scrollTo).toHaveBeenCalledWith({ top: 48, behavior: 'instant' });
      } finally {
        restorePageScroll();
      }
    });

    it('preserves pre-existing inline body styles across a lock/unlock cycle', () => {
      document.body.style.overflow = 'auto';
      try {
        const ref = service.open(PanelStub, {});
        appRef.tick();
        expect(document.body.style.overflow).toBe('hidden');
        ref.close();
        expect(document.body.style.overflow).toBe('auto');
      } finally {
        document.body.style.removeProperty('overflow');
      }
    });
  });

  describe('focus restore', () => {
    it('closing after the trigger was removed does not throw and does not leave focus detached', async () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      const ref = service.open(PanelStub, {});
      appRef.tick();
      await Promise.resolve(); // the trap focuses in a microtask

      trigger.remove();
      expect(() => ref.close()).not.toThrow();
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement?.isConnected).toBe(true);
    });
  });
});
