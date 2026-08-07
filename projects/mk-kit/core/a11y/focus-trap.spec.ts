import { MkFocusTrap, mkGetFocusable } from './focus-trap';

/**
 * jsdom never lays out, so every element reports offsetWidth/Height 0 — and
 * mkGetFocusable filters on exactly that to skip display:none controls. Stub
 * a height so elements read as "has a box", the way they do in a browser.
 */
function stubLayout(): () => void {
  const proto = window.HTMLElement.prototype;
  const original = Object.getOwnPropertyDescriptor(proto, 'offsetHeight');
  Object.defineProperty(proto, 'offsetHeight', {
    configurable: true,
    value: 10,
  });
  return () => {
    if (original) Object.defineProperty(proto, 'offsetHeight', original);
    else delete (proto as unknown as Record<string, unknown>)['offsetHeight'];
  };
}

describe('mkGetFocusable', () => {
  let restoreLayout: () => void;
  let root: HTMLElement;

  beforeEach(() => {
    restoreLayout = stubLayout();
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    root.remove();
    restoreLayout();
  });

  it('excludes visibility:hidden elements so Tab-wrap never lands on one', () => {
    root.innerHTML = `
      <button type="button" class="visible">A</button>
      <button type="button" class="hidden" style="visibility:hidden">B</button>
      <button type="button" class="collapsed" style="visibility:collapse">C</button>
    `;
    const found = mkGetFocusable(root);
    expect(found.map((el) => el.className)).toEqual(['visible']);
  });

  it('keeps ordinary elements focusable in jsdom (visibility defaults to visible)', () => {
    root.innerHTML = `
      <button type="button">A</button>
      <input type="text" />
    `;
    expect(mkGetFocusable(root).length).toBe(2);
  });
});

describe('MkFocusTrap focus restore', () => {
  let restoreLayout: () => void;
  let root: HTMLElement;

  beforeEach(() => {
    restoreLayout = stubLayout();
    root = document.createElement('div');
    root.innerHTML = `<button type="button">Inside</button>`;
    document.body.appendChild(root);
  });

  afterEach(() => {
    root.remove();
    restoreLayout();
  });

  it('restores focus to the trigger when it is still connected', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const trap = new MkFocusTrap(root);
    trap.activate();
    await Promise.resolve(); // the trap focuses in a microtask

    trap.release();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('does not throw when the trigger was disconnected while trapped', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const trap = new MkFocusTrap(root);
    trap.activate();
    await Promise.resolve();

    trigger.remove();
    expect(() => trap.release()).not.toThrow();
    // Focus must not be left pointing at the detached trigger.
    expect(document.activeElement).not.toBe(trigger);
    expect(document.activeElement?.isConnected).toBe(true);
  });
});
