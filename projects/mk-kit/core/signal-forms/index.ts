// The Signal Forms bridge for mk-kit controls. Its own entry point because it
// is the one thing in `core` that imports a VALUE from `@angular/forms/signals`
// (the FORM_FIELD token), which drags `@angular/forms` into every app that
// touches `@mk-kit/ui/core` — including pages with no form on them. Form
// controls import it from here; apps rarely need it directly.
export * from './signal-field';
