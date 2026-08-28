import { MK_DEFAULT_VALIDATION } from '../i18n/mk-i18n';
import { mkSignalErrorMessage, mkSignalErrorsToValidationErrors } from './signal-forms';

describe('mkSignalErrorsToValidationErrors', () => {
  it('returns null for no errors', () => {
    expect(mkSignalErrorsToValidationErrors([])).toBeNull();
    expect(mkSignalErrorsToValidationErrors(null)).toBeNull();
  });

  it('maps the built-in kinds to the reactive keys and payload shapes', () => {
    expect(
      mkSignalErrorsToValidationErrors([
        { kind: 'required' },
        { kind: 'minLength', minLength: 3 } as never,
        { kind: 'max', max: 10 } as never,
        { kind: 'pattern', pattern: /^a$/ } as never,
        { kind: 'minDate', minDate: new Date(2026, 0, 1) } as never,
      ]),
    ).toEqual({
      required: true,
      minlength: { requiredLength: 3, actualLength: undefined, message: undefined },
      max: { max: 10, actual: undefined, message: undefined },
      pattern: { requiredPattern: '/^a$/', message: undefined },
      mkMinDate: { min: new Date(2026, 0, 1), actual: undefined, message: undefined },
    });
  });

  it('keeps custom kinds with their payload and keeps the first error per key', () => {
    expect(
      mkSignalErrorsToValidationErrors([
        { kind: 'banned', reason: 'x' } as never,
        { kind: 'server', message: 'Taken' },
        { kind: 'compat', context: { requiredLength: 2 } } as never,
        { kind: 'banned', reason: 'later' } as never,
      ]),
    ).toEqual({
      banned: { reason: 'x' },
      server: { message: 'Taken' },
      compat: { requiredLength: 2, message: undefined },
    });
  });
});

describe('mkSignalErrorMessage', () => {
  const strings = MK_DEFAULT_VALIDATION;

  it('renders the first error through the i18n table', () => {
    expect(mkSignalErrorMessage([{ kind: 'required' }, { kind: 'email' }], strings)).toBe('This field is required');
    expect(mkSignalErrorMessage([{ kind: 'minLength', minLength: 8 } as never], strings)).toBe(
      'Must be at least 8 characters',
    );
  });

  it('prefers a per-field override, then the schema message, then the table', () => {
    const errors = [{ kind: 'required', message: 'Enter your email' }];
    expect(mkSignalErrorMessage(errors, strings, { required: 'Needed' })).toBe('Needed');
    expect(mkSignalErrorMessage(errors, strings, { required: (e: { message: string }) => `!${e.message}` })).toBe(
      '!Enter your email',
    );
    expect(mkSignalErrorMessage(errors, strings)).toBe('Enter your email');
  });

  it('falls back to the generic message for unknown kinds and null for none', () => {
    expect(mkSignalErrorMessage([{ kind: 'weird' }], strings)).toBe('This value is not valid');
    expect(mkSignalErrorMessage([], strings)).toBeNull();
  });
});
