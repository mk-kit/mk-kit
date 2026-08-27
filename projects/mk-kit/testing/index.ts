/**
 * `@mk-kit/ui/testing` — component test harnesses.
 *
 * Harnesses drive mk-kit components the way a user does (click the trigger,
 * pick the option, read the label) so specs stay stable when a component's
 * DOM changes. Zero dependencies beyond `@angular/core/testing`; works with
 * zoneless and zone-based TestBeds. Not re-exported from the root
 * `@mk-kit/ui` entry on purpose — it never belongs in an app bundle.
 */
export * from './harness';
export * from './harnesses/form-controls.harness';
export * from './harnesses/navigation.harness';
export * from './harnesses/table.harness';
export * from './harnesses/overlays.harness';
