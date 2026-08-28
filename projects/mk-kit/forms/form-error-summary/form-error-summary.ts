import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import type { Field, ReadonlyFieldState } from '@angular/forms/signals';
import type { Subscription } from 'rxjs';
import type { MkErrorMessages } from '@mk-kit/ui/core';
import { MK_I18N, mkFirstErrorMessage, mkSignalErrorMessage } from '@mk-kit/ui/core';

/** One field-level error to surface in {@link MkFormErrorSummary}. */
export interface MkFormError {
  /**
   * The `id` of the control (or `mk-form-field`'s `controlId`) the message
   * refers to. Clicking the summary entry focuses this element.
   */
  fieldId: string;
  /** The human-readable error message. */
  message: string;
}

/**
 * FormErrorSummary — an accessible summary of a form's validation errors,
 * shown at the top of the form on a failed submit. Each entry links to its
 * field and focuses it on click. Following the WAI/GOV.UK pattern it is an
 * `alert` region and, when the surrounding form is submitted with errors,
 * focus moves here automatically (opt out with `[autoFocus]="false"`) so
 * screen-reader and keyboard users are taken straight to the problems. The
 * public `focus()` remains for manual flows (e.g. server-side errors).
 *
 * ## Automatic collection
 *
 * Point `form` at a `FormGroup` and the summary walks it itself: one entry per
 * invalid control, worded from the `validation` i18n table (override per key
 * with `errorMessages`). Pass `labels` to name the fields — without an entry
 * the control's path is used. Entries appear once the form is submitted;
 * `showOn="always"` lists them as soon as they exist.
 *
 * Each entry is linked to its field by locating the control in the DOM, so
 * `formControlName` must be a static attribute (`formControlName="email"`,
 * the usual form) rather than a binding.
 *
 * ## Signal Forms
 *
 * Point `field` at a Signal Forms root (`[field]="f"`) instead of `form` and
 * the summary reads `errorSummary()` from the `FieldTree`: one entry per
 * invalid field, keyed by dotted path in `labels` / `errorMessages` like the
 * reactive path. With the default `showOn="submit"` an entry appears once its
 * field is touched — `submit()` marks every field touched, so a failed submit
 * lists them all. Clicking an entry focuses the control bound with
 * `[formField]`. When the summary sits inside the `<form>`, focus also moves
 * to it after the form's `submit` event, as with `ngSubmit`.
 *
 * ```html
 * <form (submit)="save($event)">
 *   <mk-form-error-summary [field]="f" [labels]="{ email: 'Email address' }" />
 *   …
 * </form>
 * ```
 *
 * ```html
 * <!-- automatic -->
 * <form [formGroup]="form" (ngSubmit)="submit()">
 *   <mk-form-error-summary #summary [form]="form"
 *     [labels]="{ email: 'Email address', age: 'Age' }" />
 *   …
 * </form>
 *
 * <!-- manual -->
 * <mk-form-error-summary #summary [errors]="errors()" />
 * …
 * onSubmit() { if (invalid) { this.errors.set(collect()); this.summary.focus(); } }
 * ```
 */
@Component({
  selector: 'mk-form-error-summary',
  templateUrl: './form-error-summary.html',
  styleUrl: './form-error-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'mkFormErrorSummary',
  host: {
    class: 'mk-form-error-summary',
    role: 'alert',
    tabindex: '-1',
    '[attr.hidden]': 'hasErrors() ? null : ""',
    '[attr.aria-labelledby]': 'hasErrors() ? titleId : null',
  },
})
export class MkFormErrorSummary {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly i18n = inject(MK_I18N);
  private readonly parentForm = inject(NgForm, { optional: true });
  private readonly parentFormGroup = inject(FormGroupDirective, {
    optional: true,
  });

  /**
   * Errors to list explicitly. When non-empty this wins over `form`, so a form
   * can mix automatic collection with server-side errors by not setting it.
   */
  readonly errors = input<readonly MkFormError[]>([]);
  /** Collect errors from this control tree instead of passing them in. */
  readonly form = input<AbstractControl | null>(null);
  /**
   * Collect errors from this Signal Forms field (usually the root returned by
   * `form()`) instead of `form`. Entries are keyed by dotted path for `labels`.
   */
  readonly field = input<Field<unknown> | null>(null);
  /** Field names for automatic entries, keyed by control path. */
  readonly labels = input<Readonly<Record<string, string>>>({});
  /** Per-key wording for automatic entries, as on `mk-form-field`. */
  readonly errorMessages = input<MkErrorMessages | null>(null);
  /** When automatic entries appear. Defaults to after the form is submitted. */
  readonly showOn = input<'submit' | 'always'>('submit');
  /** Heading shown above the list. */
  readonly summaryTitle = input<string>(this.i18n.errorSummaryTitle);
  /**
   * Move focus to the summary automatically when the surrounding form is
   * submitted with errors (the WAI/GOV.UK pattern). Disable to drive focus
   * yourself via the public `focus()`.
   */
  readonly autoFocus = input(true, { transform: booleanAttribute });

  readonly titleId = `${this.host.nativeElement.id || 'mk-error-summary'}-title`;

  /** Bumped on every change in the watched control tree. */
  private readonly formTick = signal(0);

  constructor() {
    const bump = () => this.formTick.update((n) => n + 1);
    let sub: Subscription | null = null;

    const injector = inject(Injector);
    const onSubmit = () => {
      bump();
      // After the entries have rendered (and [hidden] cleared), take the
      // user straight to the problems. `focus()` no-ops without errors.
      if (this.autoFocus()) {
        afterNextRender(() => this.focus(), { injector });
      }
    };
    const submit = this.parentFormGroup?.ngSubmit ?? this.parentForm?.ngSubmit;
    const submitSub = submit?.subscribe(onSubmit) ?? null;

    // Signal Forms has no `ngSubmit`; a summary placed inside the `<form>`
    // follows the native submit event instead (`submit()` marks every field
    // touched synchronously, so the entries exist by the next render).
    let nativeForm: HTMLFormElement | null = null;
    afterNextRender(() => {
      if (!this.field()) return;
      nativeForm = this.host.nativeElement.closest('form');
      nativeForm?.addEventListener('submit', onSubmit);
    });

    effect(() => {
      const form = this.form();
      sub?.unsubscribe();
      sub = form ? form.events.subscribe(bump) : null;
    });

    inject(DestroyRef).onDestroy(() => {
      sub?.unsubscribe();
      submitSub?.unsubscribe();
      nativeForm?.removeEventListener('submit', onSubmit);
    });
  }

  /** Whether the surrounding form (if any) has been submitted. */
  private readonly submitted = computed(() => {
    this.formTick();
    return (
      this.parentFormGroup?.submitted || this.parentForm?.submitted || false
    );
  });

  /**
   * Entries collected from `field` (a Signal Forms root), each with the element
   * carrying the field's `[formField]` binding so a click can focus it the way
   * `focusBoundControl()` would.
   */
  private readonly signalEntries = computed<
    readonly { error: MkFormError; element: HTMLElement | null }[]
  >(() => {
    const field = this.field();
    if (!field) return [];
    const root = field();
    const gateOnTouch = this.showOn() === 'submit';
    const labels = this.labels();
    const overrides = this.errorMessages() ?? undefined;
    const seen = new Set<string>();
    const out: { error: MkFormError; element: HTMLElement | null }[] = [];

    for (const err of root.errorSummary()) {
      const state = err.fieldTree();
      const name = state.name();
      if (seen.has(name) || state.disabled() || state.hidden()) continue;
      if (gateOnTouch && !state.touched()) continue;
      seen.add(name);
      const message = mkSignalErrorMessage([err], this.i18n.validation, overrides);
      if (!message) continue;
      const path = signalFieldPath(root, state) ?? '';
      const label = labels[path] ?? path;
      const element = state.formFieldBindings()[0]?.element ?? null;
      const fieldId = element?.id || name;
      out.push({
        error: { fieldId, message: label ? `${label}: ${message}` : message },
        element,
      });
    }
    return out;
  });

  /** Entries collected from `form`, when one is set and they should show. */
  private readonly autoErrors = computed<readonly MkFormError[]>(() => {
    if (this.field()) return this.signalEntries().map((e) => e.error);
    this.formTick();
    const form = this.form();
    if (!form) return [];
    if (this.showOn() === 'submit' && !this.submitted()) return [];

    const labels = this.labels();
    const overrides = this.errorMessages() ?? undefined;
    const out: MkFormError[] = [];

    for (const [path, control] of eachControl(form)) {
      if (control.disabled || !control.invalid || !control.errors) continue;
      const message = mkFirstErrorMessage(
        control.errors,
        this.i18n.validation,
        overrides,
      );
      if (!message) continue;
      const label = labels[path] ?? path;
      out.push({
        fieldId: this.fieldIdFor(path),
        message: label ? `${label}: ${message}` : message,
      });
    }
    return out;
  });

  /** The entries actually rendered — an explicit `errors` list wins. */
  protected readonly shownErrors = computed<readonly MkFormError[]>(() =>
    this.errors().length ? this.errors() : this.autoErrors(),
  );

  /** Whether there is anything to show. */
  protected readonly hasErrors = computed(() => this.shownErrors().length > 0);

  /** Move keyboard focus to the summary (call after a failed submit). */
  focus(): void {
    if (this.hasErrors()) this.host.nativeElement.focus();
  }

  /** Focus the field an entry points at (native anchor jump is unreliable). */
  protected focusField(event: Event, fieldId: string): void {
    const target =
      this.signalEntries().find((e) => e.error.fieldId === fieldId)?.element ??
      this.document.getElementById(fieldId) ??
      this.document.querySelector<HTMLElement>(
        `[formcontrolname="${cssEscape(fieldId)}"]`,
      );
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    focusable(target)?.focus({ preventScroll: true });
  }

  /**
   * Resolves a control path to the id of the element to focus. Reactive forms
   * put `formControlName` in the DOM as a plain attribute, so the control can
   * be located from its path; the element's own `id` (which `mk-form-field`
   * assigns) is preferred so the link's `href` anchor also resolves.
   */
  private fieldIdFor(path: string): string {
    const el = this.document.querySelector<HTMLElement>(
      `[formcontrolname="${cssEscape(path.split('.').pop() ?? path)}"]`,
    );
    return el?.id || path;
  }
}

/** Depth-first walk yielding `[dotted path, control]` for every leaf control. */
function* eachControl(
  control: AbstractControl,
  path = '',
): Generator<[string, AbstractControl]> {
  if (control instanceof FormGroup) {
    for (const [key, child] of Object.entries(control.controls)) {
      yield* eachControl(child, path ? `${path}.${key}` : key);
    }
  } else if (control instanceof FormArray) {
    for (let i = 0; i < control.controls.length; i++) {
      yield* eachControl(control.controls[i], `${path}.${i}`);
    }
  } else if (path) {
    yield [path, control];
  }
}

/**
 * Dotted path of a Signal Forms field under `root` (`'address.city'`,
 * `'contacts.0.name'`), found by walking the field tree along the model's
 * keys; `''` for the root itself, `null` when the field is not under `root`.
 */
function signalFieldPath(
  root: ReadonlyFieldState<unknown>,
  target: ReadonlyFieldState<unknown>,
): string | null {
  const wanted = target.name();
  const walk = (tree: Field<unknown>, path: string): string | null => {
    const state = tree();
    if (state.name() === wanted) return path;
    const value = state.value();
    if (!value || typeof value !== 'object') return null;
    const children = tree as unknown as Record<string, Field<unknown> | undefined>;
    for (const key of Object.keys(value)) {
      const child = children[key];
      if (typeof child !== 'function') continue;
      const found = walk(child, path ? `${path}.${key}` : key);
      if (found !== null) return found;
    }
    return null;
  };
  return walk(root.fieldTree as unknown as Field<unknown>, '');
}

/** Minimal attribute-value escaping for the selectors built above. */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

/** The element itself when focusable, otherwise its first focusable child. */
function focusable(el: HTMLElement): HTMLElement | null {
  if (el.tabIndex >= 0 || /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(el.tagName)) {
    return el;
  }
  return el.querySelector<HTMLElement>(
    'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])',
  );
}
