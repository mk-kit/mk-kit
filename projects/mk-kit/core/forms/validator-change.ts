import { effect, untracked } from '@angular/core';

/**
 * Handle returned by {@link mkValidatorChange}, wiring a component's
 * `registerOnValidatorChange` callback to a set of reactive dependencies.
 */
export interface MkValidatorChangeRef {
  /** Store the callback Angular hands to `registerOnValidatorChange`. */
  register(fn: () => void): void;
  /** Ask the bound control to re-run `validate()` now. */
  notify(): void;
}

/**
 * Re-validates the bound form control whenever a validator's inputs change.
 *
 * A `Validator` whose constraints come from component inputs (`[min]`,
 * `[max]`, `[required]`, …) must tell Angular when those inputs change,
 * otherwise the control keeps the verdict computed under the old constraints.
 * `NgModel`/`FormControlName` pass a callback to `registerOnValidatorChange`
 * for exactly this; call it from an effect over the constraint signals.
 *
 * Must be called from an injection context (i.e. as a field initialiser).
 *
 * ```ts
 * private readonly validatorChange = mkValidatorChange(() => {
 *   this.min();
 *   this.max();
 * });
 *
 * registerOnValidatorChange(fn: () => void): void {
 *   this.validatorChange.register(fn);
 * }
 * ```
 *
 * @param deps Reads every signal the validator depends on.
 */
export function mkValidatorChange(deps: () => void): MkValidatorChangeRef {
  let onChange: () => void = () => {};
  let primed = false;

  effect(() => {
    deps();
    // Skip the effect's initial run: the control validates once on bind
    // anyway, and re-entering validation during setup is wasted work.
    if (!primed) {
      primed = true;
      return;
    }
    // The callback synchronously calls `updateValueAndValidity()`, which reads
    // and writes signals — keep it out of this effect's dependency graph.
    untracked(() => onChange());
  });

  return {
    register(fn: () => void): void {
      onChange = fn;
    },
    notify(): void {
      onChange();
    },
  };
}
