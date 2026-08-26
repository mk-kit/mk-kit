import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MkButtonToggle, MkButtonToggleGroup } from '../button-toggle';
import { MkInput } from '../input';
import { MkSize } from '@mk-kit/ui/core';

/** One translatable locale offered by {@link MkI18nInput}. */
export interface MkI18nLocale {
  /** Value key in the bound record, e.g. `pl`. */
  code: string;
  /** Short switcher label, e.g. `PL`. */
  label: string;
  /** Longer name for the accessible label, e.g. `Polish`. */
  name?: string;
}

/** The bound value: one string per locale code. */
export type MkI18nValue = Record<string, string>;

/**
 * I18nInput — one field that edits the same text in several languages.
 *
 * The common alternative is stacking one input per language, which grows the
 * form linearly with locale count and buries the field the author actually
 * cares about. This shows a single input and a compact switcher, and marks
 * which locales already have content so nothing is silently left untranslated.
 *
 * Binds a `Record<code, string>`, so it drops into reactive forms as one
 * control instead of a nested group:
 *
 * ```html
 * <mk-form-field label="Name">
 *   <mk-i18n-input formControlName="name" [locales]="locales" />
 * </mk-form-field>
 * ```
 *
 * ```ts
 * locales = [
 *   { code: 'en', label: 'EN', name: 'English' },
 *   { code: 'pl', label: 'PL', name: 'Polish' },
 * ];
 * ```
 */
@Component({
  selector: 'mk-i18n-input',
  templateUrl: './i18n-input.html',
  styleUrl: './i18n-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MkButtonToggle, MkButtonToggleGroup, MkInput],
  host: { class: 'mk-i18n-input' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MkI18nInput),
      multi: true,
    },
  ],
})
export class MkI18nInput implements ControlValueAccessor {
  /** Locales offered, in switcher order. The first is the initial tab. */
  readonly locales = input<readonly MkI18nLocale[]>([]);
  /** Render a textarea instead of a single-line input. */
  readonly multiline = input(false, { transform: booleanAttribute });
  /** Textarea rows (ignored unless `multiline`). */
  readonly rows = input(3, { transform: numberAttribute });
  /** Placeholder for the active locale's input. */
  readonly placeholder = input('');
  /** Control size, forwarded to the input and the switcher. */
  readonly size = input<MkSize>('md');
  /**
   * Locale codes that must be filled. They get a marker in the switcher while
   * empty, so a missing translation is visible without switching to it.
   */
  readonly requiredLocales = input<readonly string[]>([]);
  /** Disable the whole control. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly value = signal<MkI18nValue>({});
  private readonly cvaDisabled = signal(false);
  protected readonly activeCode = signal<string | null>(null);

  /** The locale currently being edited — the first one until switched. */
  protected readonly active = computed(() => {
    const list = this.locales();
    const code = this.activeCode();
    return list.find((l) => l.code === code) ?? list[0] ?? null;
  });

  protected readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  /** Text for the active locale. */
  protected readonly activeText = computed(() => {
    const code = this.active()?.code;
    return code ? (this.value()[code] ?? '') : '';
  });

  /** Locale codes that currently hold text — drives the switcher markers. */
  protected readonly filled = computed(() => {
    const v = this.value();
    return new Set(
      Object.keys(v).filter((code) => (v[code] ?? '').trim().length > 0),
    );
  });

  /** True when a required locale is still empty. */
  protected missing(code: string): boolean {
    return this.requiredLocales().includes(code) && !this.filled().has(code);
  }

  protected onSwitch(code: string): void {
    this.activeCode.set(code);
  }

  protected onInput(text: string): void {
    const code = this.active()?.code;
    if (!code) return;
    const next = { ...this.value(), [code]: text };
    this.value.set(next);
    this.onChange(next);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  /** Accessible label for a switcher item, e.g. "Polish — missing". */
  protected switcherAria(locale: MkI18nLocale): string {
    const base = locale.name ?? locale.label;
    return this.missing(locale.code) ? `${base} (empty)` : base;
  }

  // ── ControlValueAccessor ────────────────────────────────────────────────
  private onChange: (value: MkI18nValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: MkI18nValue | null): void {
    this.value.set(value ?? {});
  }

  registerOnChange(fn: (value: MkI18nValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
