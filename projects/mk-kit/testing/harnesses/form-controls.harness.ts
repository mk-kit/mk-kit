import { MkHarness, MkTestElement, pickBy } from '../harness';

/** `button[mkButton]` / `a[mkButton]`. */
export class MkButtonHarness extends MkHarness {
  static override readonly hostSelector = 'button[mkButton], a[mkButton], .mk-button';

  text(): string {
    return this.host.text();
  }

  async click(): Promise<void> {
    await this.host.click();
  }

  async focus(): Promise<void> {
    await this.host.focus();
  }

  isDisabled(): boolean {
    return this.host.isDisabled();
  }

  isLoading(): boolean {
    return this.host.hasClass('mk-button--loading');
  }

  tone(): string | null {
    return this.host.attr('data-tone');
  }

  /** `solid` | `soft` | `outline` | `ghost` | `link`. */
  variant(): string | null {
    const m = Array.from(this.host.native.classList).find((c) =>
      /^mk-button--(solid|soft|outline|ghost|link)$/.test(c),
    );
    return m ? m.replace('mk-button--', '') : null;
  }

  size(): string | null {
    const m = Array.from(this.host.native.classList).find((c) => /^mk-button--(sm|md|lg)$/.test(c));
    return m ? m.replace('mk-button--', '') : null;
  }
}

/** Native `input[mkInput]` / `textarea[mkInput]`. */
export class MkInputHarness extends MkHarness {
  static override readonly hostSelector = '[mkInput], .mk-input';

  value(): string {
    return this.host.prop<string>('value') ?? '';
  }

  /** Replace the value (fires `input` + `change`). */
  async setValue(value: string): Promise<void> {
    await this.host.setValue(value);
  }

  /** Append text one character at a time (keydown / input / keyup). */
  async type(text: string): Promise<void> {
    await this.host.type(text);
  }

  async clear(): Promise<void> {
    await this.host.clear();
  }

  async focus(): Promise<void> {
    await this.host.focus();
  }

  async blur(): Promise<void> {
    await this.host.blur();
  }

  placeholder(): string {
    return this.host.attr('placeholder') ?? '';
  }

  type_(): string {
    return this.host.attr('type') ?? (this.host.native.tagName === 'TEXTAREA' ? 'textarea' : 'text');
  }

  isDisabled(): boolean {
    return this.host.isDisabled();
  }

  isInvalid(): boolean {
    return this.host.hasClass('mk-input--invalid') || this.host.attr('aria-invalid') === 'true';
  }

  isRequired(): boolean {
    return this.host.prop<boolean>('required') === true || this.host.attr('aria-required') === 'true';
  }

  isFocused(): boolean {
    return this.host.isFocused();
  }
}

/** `mk-checkbox`. */
export class MkCheckboxHarness extends MkHarness {
  static override readonly hostSelector = 'mk-checkbox';

  private get input(): MkTestElement {
    return this.host.child('input[type="checkbox"]');
  }

  label(): string {
    return this.q('.mk-checkbox__text')?.text() ?? '';
  }

  isChecked(): boolean {
    return this.input.prop<boolean>('checked') === true;
  }

  isIndeterminate(): boolean {
    return this.input.prop<boolean>('indeterminate') === true;
  }

  isDisabled(): boolean {
    return this.input.isDisabled();
  }

  isRequired(): boolean {
    return this.input.prop<boolean>('required') === true;
  }

  async toggle(): Promise<void> {
    await this.input.click();
  }

  async check(): Promise<void> {
    if (!this.isChecked()) await this.toggle();
  }

  async uncheck(): Promise<void> {
    if (this.isChecked()) await this.toggle();
  }

  async focus(): Promise<void> {
    await this.input.focus();
  }

  async blur(): Promise<void> {
    await this.input.blur();
  }
}

/** `mk-switch`. */
export class MkSwitchHarness extends MkHarness {
  static override readonly hostSelector = 'mk-switch';

  private get control(): MkTestElement {
    return this.host.child('[role="switch"]');
  }

  label(): string {
    return this.q('.mk-switch__label')?.text() ?? '';
  }

  isChecked(): boolean {
    return this.control.attr('aria-checked') === 'true';
  }

  isDisabled(): boolean {
    return this.control.isDisabled();
  }

  async toggle(): Promise<void> {
    await this.control.click();
  }

  async check(): Promise<void> {
    if (!this.isChecked()) await this.toggle();
  }

  async uncheck(): Promise<void> {
    if (this.isChecked()) await this.toggle();
  }

  async focus(): Promise<void> {
    await this.control.focus();
  }
}

/** One `mk-radio` inside a group. */
export class MkRadioHarness extends MkHarness {
  static override readonly hostSelector = 'mk-radio';

  label(): string {
    return this.q('.mk-radio__label')?.text() ?? this.host.text();
  }

  isChecked(): boolean {
    return this.host.attr('aria-checked') === 'true';
  }

  isDisabled(): boolean {
    return this.host.isDisabled();
  }

  async select(): Promise<void> {
    await this.host.click();
  }

  async focus(): Promise<void> {
    await this.host.focus();
  }
}

/** `mk-radio-group`. */
export class MkRadioGroupHarness extends MkHarness {
  static override readonly hostSelector = 'mk-radio-group';

  radios(): Promise<MkRadioHarness[]> {
    return this.loader.within(this.host).getAll(MkRadioHarness);
  }

  async labels(): Promise<string[]> {
    return (await this.radios()).map((r) => r.label());
  }

  /** Label of the checked radio, or `null`. */
  async checkedLabel(): Promise<string | null> {
    return (await this.radios()).find((r) => r.isChecked())?.label() ?? null;
  }

  async checkedIndex(): Promise<number> {
    return (await this.radios()).findIndex((r) => r.isChecked());
  }

  /** Select by index, exact label or RegExp. */
  async select(which: number | string | RegExp): Promise<void> {
    const radios = await this.radios();
    await pickBy(radios, which, (r) => r.label(), 'radio').select();
  }

  isDisabled(): boolean {
    return this.host.hasClass('mk-radio-group--disabled');
  }
}

export interface MkSelectOptionState {
  label: string;
  selected: boolean;
  disabled: boolean;
}

/** `mk-select` — opens the teleported listbox and picks options like a user. */
export class MkSelectHarness extends MkHarness {
  static override readonly hostSelector = 'mk-select';

  private get trigger(): MkTestElement {
    return this.host.child('[role="combobox"]');
  }

  /** Label of the selected option, or `''` when only the placeholder shows. */
  valueText(): string {
    const v = this.q('.mk-select__value');
    return v && !v.hasClass('mk-select__value--placeholder') ? v.text() : '';
  }

  placeholder(): string {
    return this.q('.mk-select__value--placeholder')?.text() ?? '';
  }

  isOpen(): boolean {
    return this.trigger.attr('aria-expanded') === 'true';
  }

  isDisabled(): boolean {
    return this.trigger.isDisabled();
  }

  isInvalid(): boolean {
    return this.trigger.attr('aria-invalid') === 'true';
  }

  async open(): Promise<void> {
    if (!this.isOpen()) await this.trigger.click();
  }

  async close(): Promise<void> {
    if (this.isOpen()) await this.trigger.sendKeys('Escape');
    if (this.isOpen()) await this.trigger.click();
  }

  async focus(): Promise<void> {
    await this.trigger.focus();
  }

  /** Options of the (opened) listbox. Opens it if needed. */
  async options(): Promise<MkSelectOptionState[]> {
    const els = await this.optionElements();
    return els.map((el) => ({
      label: el.text(),
      selected: el.attr('aria-selected') === 'true',
      disabled: el.attr('aria-disabled') === 'true',
    }));
  }

  /** Pick an option by index, exact label or RegExp (opens the list first). */
  async selectOption(which: number | string | RegExp): Promise<void> {
    const els = await this.optionElements();
    await pickBy(els, which, (el) => el.text(), 'option').click();
  }

  private async optionElements(): Promise<MkTestElement[]> {
    await this.open();
    const list = this.controlled(this.trigger);
    if (!list) throw new Error('mk-select listbox did not open.');
    return list.queryAll('[role="option"]');
  }
}

/** `mk-form-field` — label / hint / error around any control. */
export class MkFormFieldHarness extends MkHarness {
  static override readonly hostSelector = 'mk-form-field';

  label(): string {
    return this.q('.mk-form-field__label-text')?.text() ?? '';
  }

  hint(): string | null {
    return this.q('.mk-form-field__hint')?.text() ?? null;
  }

  /** The visible validation message, or `null` when the field is valid/untouched. */
  error(): string | null {
    return this.q('.mk-form-field__error')?.text() ?? null;
  }

  hasError(): boolean {
    return this.error() !== null;
  }

  isRequired(): boolean {
    return !!this.q('.mk-form-field__required');
  }

  /** The control inside the field, as a harness of the given type. */
  control<T extends MkHarness>(type: Parameters<typeof this.loader.get<T>>[0]): Promise<T> {
    return this.loader.within(this.host).get(type);
  }
}
