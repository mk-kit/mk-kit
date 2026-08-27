import type { ComponentFixture } from '@angular/core/testing';

/**
 * Filters every harness lookup accepts. `selector` narrows the host elements
 * considered (e.g. a class or attribute your template sets); `text` matches
 * the host's trimmed text content — a string must match exactly, a RegExp
 * is tested.
 */
export interface MkHarnessFilters {
  selector?: string;
  text?: string | RegExp;
}

/** Constructor shape of every harness class: a static `hostSelector`. */
export interface MkHarnessType<T extends MkHarness> {
  new (host: MkTestElement, loader: MkHarnessLoader): T;
  readonly hostSelector: string;
}

/** Keys accepted by `MkTestElement.sendKeys` besides printable characters. */
export type MkTestKey =
  | 'Enter'
  | 'Escape'
  | 'Tab'
  | 'Backspace'
  | 'Delete'
  | ' '
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown';

const NO_OP = async (): Promise<void> => {};

/**
 * A DOM element wrapped for tests: reads are synchronous, every interaction
 * dispatches the same events a user would and then settles change detection
 * (`fixture.detectChanges()` + `whenStable()`), so the next read sees the
 * updated view.
 */
export class MkTestElement {
  constructor(
    /** The underlying element — reach for it when a harness has no getter. */
    readonly native: HTMLElement,
    /** Flush change detection after an interaction. */
    readonly settle: () => Promise<void> = NO_OP,
  ) {}

  /** Trimmed text content with whitespace collapsed. */
  text(): string {
    return (this.native.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  attr(name: string): string | null {
    return this.native.getAttribute(name);
  }

  hasClass(name: string): boolean {
    return this.native.classList.contains(name);
  }

  /** Read a DOM property (`value`, `checked`, `open`, …). */
  prop<T = unknown>(name: string): T {
    return (this.native as unknown as Record<string, T>)[name];
  }

  matches(selector: string): boolean {
    return this.native.matches(selector);
  }

  isFocused(): boolean {
    return this.native.ownerDocument.activeElement === this.native;
  }

  /** Native `disabled`, `aria-disabled="true"` or a `--disabled` host class. */
  isDisabled(): boolean {
    const el = this.native as HTMLElement & { disabled?: boolean };
    return (
      el.disabled === true ||
      el.getAttribute('aria-disabled') === 'true' ||
      Array.from(el.classList).some((c) => c.endsWith('--disabled'))
    );
  }

  query(selector: string): MkTestElement | null {
    const el = this.native.querySelector<HTMLElement>(selector);
    return el ? new MkTestElement(el, this.settle) : null;
  }

  queryAll(selector: string): MkTestElement[] {
    return Array.from(this.native.querySelectorAll<HTMLElement>(selector)).map(
      (el) => new MkTestElement(el, this.settle),
    );
  }

  /** Like `query`, but throws a readable error when nothing matches. */
  child(selector: string): MkTestElement {
    const el = this.query(selector);
    if (!el) throw new Error(`Expected "${selector}" inside <${this.describe()}>.`);
    return el;
  }

  /** pointerdown → mousedown → focus → pointerup → mouseup → click, like a user. */
  async click(): Promise<void> {
    const el = this.native;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.focus();
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.click();
    await this.settle();
  }

  async hover(): Promise<void> {
    for (const type of ['pointerenter', 'mouseenter', 'pointerover', 'mouseover']) {
      this.native.dispatchEvent(new MouseEvent(type, { bubbles: type.endsWith('over') }));
    }
    this.native.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    await this.settle();
  }

  async leave(): Promise<void> {
    for (const type of ['pointerleave', 'mouseleave', 'pointerout', 'mouseout']) {
      this.native.dispatchEvent(new MouseEvent(type, { bubbles: type.endsWith('out') }));
    }
    await this.settle();
  }

  async focus(): Promise<void> {
    this.native.focus();
    if (!this.isFocused()) this.native.dispatchEvent(new FocusEvent('focus'));
    await this.settle();
  }

  async blur(): Promise<void> {
    this.native.blur();
    this.native.dispatchEvent(new FocusEvent('blur'));
    this.native.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await this.settle();
  }

  /**
   * Type into an input/textarea/contenteditable character by character —
   * keydown, `value` append, `input`, keyup — then settle. Use `setValue`
   * to replace the value in one go.
   */
  async type(text: string): Promise<void> {
    const el = this.native as HTMLInputElement;
    el.focus();
    for (const ch of text) {
      const down = new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true });
      el.dispatchEvent(down);
      if (!down.defaultPrevented) {
        if (el.isContentEditable) el.textContent = (el.textContent ?? '') + ch;
        else el.value = (el.value ?? '') + ch;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ch, inputType: 'insertText' }));
      }
      el.dispatchEvent(new KeyboardEvent('keyup', { key: ch, bubbles: true }));
    }
    await this.settle();
  }

  /** Set the value of an input/textarea/select and fire `input` + `change`. */
  async setValue(value: string): Promise<void> {
    const el = this.native as HTMLInputElement;
    el.focus();
    el.value = value;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await this.settle();
  }

  async clear(): Promise<void> {
    const el = this.native as HTMLInputElement;
    el.focus();
    el.value = '';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
    await this.settle();
  }

  /** Dispatch keydown/keyup for each key. Printable single characters are also typed. */
  async sendKeys(...keys: Array<MkTestKey | (string & {})>): Promise<void> {
    for (const key of keys) {
      const mods = parseKey(key);
      const down = new KeyboardEvent('keydown', { ...mods, bubbles: true, cancelable: true });
      this.native.dispatchEvent(down);
      if (!down.defaultPrevented && mods.key.length === 1 && !mods.ctrlKey && !mods.metaKey) {
        const el = this.native as HTMLInputElement;
        if ('value' in el && typeof el.value === 'string' && !el.isContentEditable && isTextField(el)) {
          el.value += mods.key;
          el.dispatchEvent(new InputEvent('input', { bubbles: true, data: mods.key, inputType: 'insertText' }));
        }
      }
      this.native.dispatchEvent(new KeyboardEvent('keyup', { ...mods, bubbles: true }));
    }
    await this.settle();
  }

  /** Dispatch any event on the element and settle. */
  async dispatch(event: Event): Promise<void> {
    this.native.dispatchEvent(event);
    await this.settle();
  }

  private describe(): string {
    const el = this.native;
    const id = el.id ? `#${el.id}` : '';
    const cls = el.classList.length ? `.${Array.from(el.classList).slice(0, 2).join('.')}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  }
}

/** `Control+a`, `Shift+Tab`, `Enter`, `a` → KeyboardEventInit. */
function parseKey(key: string): KeyboardEventInit & { key: string } {
  const parts = key.split('+');
  const k = parts.pop() ?? key;
  const has = (m: string) => parts.some((p) => p.toLowerCase() === m);
  return {
    key: k,
    ctrlKey: has('control') || has('ctrl'),
    metaKey: has('meta') || has('cmd'),
    shiftKey: has('shift'),
    altKey: has('alt'),
  };
}

function isTextField(el: HTMLElement): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (!(el instanceof HTMLInputElement)) return false;
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color'].includes(el.type);
}

/**
 * Finds harnesses under a root element. Create one with
 * `MkHarnessLoader.fromFixture(fixture)`; use `.document()` for content that
 * mk-kit teleports into `document.body` (dialogs, toasts, menus, select
 * panels) and `.within(el)` to scope lookups.
 */
export class MkHarnessLoader {
  constructor(
    readonly root: Element,
    readonly settle: () => Promise<void>,
  ) {}

  /**
   * Loader rooted at the fixture's host element. Every interaction runs
   * `fixture.detectChanges()` and awaits `fixture.whenStable()` afterwards,
   * so it works in zoneless and zone-based TestBeds alike.
   */
  static fromFixture(fixture: ComponentFixture<unknown>): MkHarnessLoader {
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return new MkHarnessLoader(fixture.nativeElement as Element, settle);
  }

  /** Same settle function, rooted at `document.body` — for overlays. */
  document(): MkHarnessLoader {
    return new MkHarnessLoader(this.root.ownerDocument.body, this.settle);
  }

  within(root: Element | MkTestElement): MkHarnessLoader {
    return new MkHarnessLoader(root instanceof MkTestElement ? root.native : root, this.settle);
  }

  /** Wrap the root element itself. */
  rootElement(): MkTestElement {
    return new MkTestElement(this.root as HTMLElement, this.settle);
  }

  element(selector: string): MkTestElement {
    const el = this.root.querySelector<HTMLElement>(selector) ?? (this.root.matches(selector) ? (this.root as HTMLElement) : null);
    if (!el) throw new Error(`No element matches "${selector}" under <${this.root.tagName.toLowerCase()}>.`);
    return new MkTestElement(el, this.settle);
  }

  elements(selector: string): MkTestElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>(selector)).map((el) => new MkTestElement(el, this.settle));
  }

  /** First matching harness; throws when there is none. */
  async get<T extends MkHarness>(type: MkHarnessType<T>, filters: MkHarnessFilters = {}): Promise<T> {
    const [first] = await this.getAll(type, filters);
    if (!first) {
      throw new Error(
        `No ${type.name} found (host "${type.hostSelector}"${filters.selector ? `, selector "${filters.selector}"` : ''}${
          filters.text ? `, text ${String(filters.text)}` : ''
        }) under <${this.root.tagName.toLowerCase()}>.`,
      );
    }
    return first;
  }

  async getOrNull<T extends MkHarness>(type: MkHarnessType<T>, filters: MkHarnessFilters = {}): Promise<T | null> {
    const [first] = await this.getAll(type, filters);
    return first ?? null;
  }

  async has<T extends MkHarness>(type: MkHarnessType<T>, filters: MkHarnessFilters = {}): Promise<boolean> {
    return (await this.getAll(type, filters)).length > 0;
  }

  async getAll<T extends MkHarness>(type: MkHarnessType<T>, filters: MkHarnessFilters = {}): Promise<T[]> {
    await this.settle();
    const hosts = new Set<HTMLElement>();
    for (const part of type.hostSelector.split(',')) {
      const sel = part.trim();
      if (this.root.matches(sel)) hosts.add(this.root as HTMLElement);
      for (const el of Array.from(this.root.querySelectorAll<HTMLElement>(sel))) hosts.add(el);
    }
    const out: T[] = [];
    for (const host of hosts) {
      if (filters.selector && !host.matches(filters.selector)) continue;
      const el = new MkTestElement(host, this.settle);
      if (filters.text !== undefined && !matchText(el.text(), filters.text)) continue;
      out.push(new type(el, this));
    }
    // Document order.
    out.sort((a, b) => (a.host.native.compareDocumentPosition(b.host.native) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    return out;
  }
}

export function matchText(actual: string, expected: string | RegExp): boolean {
  return typeof expected === 'string' ? actual === expected : expected.test(actual);
}

/**
 * Base class of every mk-kit harness. Subclasses declare `hostSelector`
 * and expose user-level actions (`click()`, `selectOption()`, …) and reads
 * (`isChecked()`, `text()`), so specs never depend on the component's DOM.
 */
export abstract class MkHarness {
  static readonly hostSelector: string = '';

  constructor(
    /** The component's host element. */
    readonly host: MkTestElement,
    protected readonly loader: MkHarnessLoader,
  ) {}

  protected settle(): Promise<void> {
    return this.loader.settle();
  }

  /** Query inside the host. */
  protected q(selector: string): MkTestElement | null {
    return this.host.query(selector);
  }

  protected qAll(selector: string): MkTestElement[] {
    return this.host.queryAll(selector);
  }

  /** Query the whole document — for panels teleported to `document.body`. */
  protected qDocument(selector: string): MkTestElement | null {
    const el = this.host.native.ownerDocument.querySelector<HTMLElement>(selector);
    return el ? new MkTestElement(el, this.host.settle) : null;
  }

  /** Element referenced by an `aria-controls` / `aria-owns` id on `from`. */
  protected controlled(from: MkTestElement, attribute = 'aria-controls'): MkTestElement | null {
    const id = from.attr(attribute);
    if (!id) return null;
    const el = this.host.native.ownerDocument.getElementById(id);
    return el ? new MkTestElement(el, this.host.settle) : null;
  }
}

/** Resolve "by index or by label" arguments shared by option-style harnesses. */
export function pickBy<T>(items: T[], which: number | string | RegExp, label: (item: T) => string, what: string): T {
  const item =
    typeof which === 'number'
      ? items[which]
      : items.find((i) => matchText(label(i), which));
  if (!item) {
    throw new Error(
      `No ${what} ${typeof which === 'number' ? `at index ${which}` : `matching ${String(which)}`}. Available: ${items
        .map((i) => JSON.stringify(label(i)))
        .join(', ') || '(none)'}.`,
    );
  }
  return item;
}
