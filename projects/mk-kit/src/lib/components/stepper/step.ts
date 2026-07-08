import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  model,
  signal,
} from '@angular/core';
import { mkUniqueId } from '../../core/a11y/unique-id';

/**
 * A single step + its content panel. Declared inside `<mk-stepper>`; the
 * projected content becomes the step body while `label` (and optional
 * `description`) render in the step header.
 *
 * `completed` is a two-way model so a parent can gate a `linear` stepper:
 * `<mk-step label="Details" [(completed)]="detailsValid()">`.
 *
 * ```html
 * <mk-stepper linear>
 *   <mk-step label="Account" [completed]="form.valid">…</mk-step>
 *   <mk-step label="Payment" optional>…</mk-step>
 * </mk-stepper>
 * ```
 */
@Component({
  selector: 'mk-step',
  templateUrl: './step.html',
  styleUrl: './step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-step',
    role: 'tabpanel',
    '[id]': 'panelId',
    '[attr.aria-labelledby]': 'headerId',
    '[attr.hidden]': "active() ? null : ''",
    '[attr.tabindex]': 'active() ? 0 : null',
  },
})
export class MkStep {
  /** Title shown in the step header. */
  readonly label = input('');
  /** Optional secondary line under the label. */
  readonly description = input('');
  /** Marks the step optional (skippable in a `linear` stepper). */
  readonly optional = input(false, { transform: booleanAttribute });
  /** Whether the step is complete (two-way; drives `linear` gating + the ✓). */
  readonly completed = model(false);
  /** Show the error state in the header (e.g. failed validation). */
  readonly hasError = input(false, { transform: booleanAttribute });
  /** Allow returning to this step after it is completed. */
  readonly editable = input(true, { transform: booleanAttribute });

  /** Stable id for the header button (wires `aria-labelledby`). */
  readonly headerId = mkUniqueId('mk-step');
  /** Stable id for the panel (wires `aria-controls`). */
  readonly panelId = mkUniqueId('mk-step-panel');

  /** Whether this step is currently selected. Set by the parent `MkStepper`. */
  readonly active = signal(false);
}
