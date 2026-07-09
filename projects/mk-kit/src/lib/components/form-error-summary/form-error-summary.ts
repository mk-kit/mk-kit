import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';

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
 * `alert` region; call `focus()` after a failed submit to move focus here so
 * screen-reader and keyboard users are taken straight to the problems.
 *
 * ```html
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
    '[attr.hidden]': 'errors().length ? null : ""',
    '[attr.aria-labelledby]': 'errors().length ? titleId : null',
  },
})
export class MkFormErrorSummary {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The errors to list. The summary hides itself when this is empty. */
  readonly errors = input<readonly MkFormError[]>([]);
  /** Heading shown above the list. */
  readonly summaryTitle = input<string>('There is a problem');

  readonly titleId = `${this.host.nativeElement.id || 'mk-error-summary'}-title`;

  /** Whether there is anything to show. */
  protected readonly hasErrors = computed(() => this.errors().length > 0);

  /** Move keyboard focus to the summary (call after a failed submit). */
  focus(): void {
    if (this.hasErrors()) this.host.nativeElement.focus();
  }

  /** Focus the field an entry points at (native anchor jump is unreliable). */
  protected focusField(event: Event, fieldId: string): void {
    const target = this.document.getElementById(fieldId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    target.focus({ preventScroll: true });
  }
}
