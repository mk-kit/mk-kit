import { MkHarness, MkTestElement, pickBy } from '../harness';

/** `mk-tabs`. */
export class MkTabsHarness extends MkHarness {
  static override readonly hostSelector = 'mk-tabs';

  private tabButtons(): MkTestElement[] {
    return this.qAll('[role="tab"]');
  }

  labels(): string[] {
    return this.tabButtons().map((t) => t.text());
  }

  selectedIndex(): number {
    return this.tabButtons().findIndex((t) => t.attr('aria-selected') === 'true');
  }

  selectedLabel(): string | null {
    const i = this.selectedIndex();
    return i >= 0 ? this.labels()[i] : null;
  }

  /** Select by index, exact label or RegExp. */
  async select(which: number | string | RegExp): Promise<void> {
    await pickBy(this.tabButtons(), which, (t) => t.text(), 'tab').click();
  }

  isDisabled(which: number | string | RegExp): boolean {
    return pickBy(this.tabButtons(), which, (t) => t.text(), 'tab').isDisabled();
  }

  /** The visible tab panel (`mk-tab` host). */
  selectedPanel(): MkTestElement | null {
    const tab = this.tabButtons()[this.selectedIndex()];
    return tab ? this.controlled(tab) : null;
  }

  /** Text of the visible panel. */
  selectedPanelText(): string {
    return this.selectedPanel()?.text() ?? '';
  }
}

/**
 * A `[mkMenuTriggerFor]` trigger and the `mk-menu` panel it opens. The host
 * is matched by the trigger's `aria-haspopup="menu"` (the directive's
 * attribute is an input binding, so it is not in the DOM).
 */
export class MkMenuHarness extends MkHarness {
  static override readonly hostSelector = '[aria-haspopup="menu"]';

  isOpen(): boolean {
    return this.host.attr('aria-expanded') === 'true';
  }

  async open(): Promise<void> {
    if (!this.isOpen()) await this.host.click();
  }

  async close(): Promise<void> {
    if (this.isOpen()) await this.panel()?.sendKeys('Escape');
    if (this.isOpen()) await this.host.click();
  }

  /** The teleported panel (`[role="menu"]`), or `null` while closed. */
  panel(): MkTestElement | null {
    return this.controlled(this.host);
  }

  /** Item texts of the open menu (opens it if needed). Submenu panels excluded. */
  async items(): Promise<string[]> {
    return (await this.itemElements()).map((i) => i.text());
  }

  /** Click an item by index, exact text or RegExp (opens the menu first). */
  async clickItem(which: number | string | RegExp): Promise<void> {
    await pickBy(await this.itemElements(), which, (i) => i.text(), 'menu item').click();
  }

  async isItemDisabled(which: number | string | RegExp): Promise<boolean> {
    return pickBy(await this.itemElements(), which, (i) => i.text(), 'menu item').isDisabled();
  }

  private async itemElements(): Promise<MkTestElement[]> {
    await this.open();
    const panel = this.panel();
    if (!panel) throw new Error('mk-menu panel did not open.');
    return panel.queryAll('[role="menuitem"]');
  }
}
