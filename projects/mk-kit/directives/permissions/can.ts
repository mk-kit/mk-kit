import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  type Signal,
} from '@angular/core';
import { MkPermissionPolicy, mkPermissionGranted } from './permission-policy';

/**
 * Shared view management for `*mkCan` / `*mkCannot`. Must be called from the
 * directive's constructor (an injection context). Creates the embedded view
 * while the (possibly negated) verdict holds, the `else` template while it
 * does not, and destroys/recreates views when a signal-based policy flips.
 */
function setupPermissionView(
  permission: Signal<string>,
  fallback: Signal<TemplateRef<unknown> | null>,
  negate: boolean,
): void {
  const policy = inject(MkPermissionPolicy, { optional: true });
  const templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  const viewContainer = inject(ViewContainerRef);

  const visible = computed(() => {
    const granted = mkPermissionGranted(policy, permission());
    return negate ? !granted : granted;
  });

  // Tracks the currently rendered template so a change to the *other* branch
  // (e.g. the else template resolving while the view is shown) is a no-op.
  let rendered: TemplateRef<unknown> | null = null;
  effect(() => {
    const next = visible() ? templateRef : fallback();
    if (next === rendered) return;
    rendered = next;
    viewContainer.clear();
    if (next) viewContainer.createEmbeddedView(next);
  });
}

/**
 * Structural directive that renders its template only while the app's
 * {@link MkPermissionPolicy} grants the given permission. With a
 * signal-based policy the check is live — the view is created and destroyed
 * as permissions change. When no policy is provided, everything is granted.
 *
 * ```html
 * <button *mkCan="'posts.delete'" (click)="remove()">Delete</button>
 *
 * <!-- With a fallback template, like *ngIf's else: -->
 * <section *mkCan="'billing.view'; else locked">…</section>
 * <ng-template #locked><mk-empty-state title="No access" /></ng-template>
 * ```
 */
@Directive({ selector: '[mkCan]' })
export class MkCan {
  /** The permission key to check, e.g. `'posts.delete'`. */
  readonly permission = input.required<string>({ alias: 'mkCan' });
  /** Template rendered while the permission is denied (`; else ref`). */
  readonly elseTemplate = input<TemplateRef<unknown> | null>(null, {
    alias: 'mkCanElse',
  });

  constructor() {
    setupPermissionView(this.permission, this.elseTemplate, false);
  }
}

/**
 * The negation of {@link MkCan}: renders its template only while the
 * permission is **denied** — for upsell hints, "ask an admin" notes and the
 * like. With no policy provided everything is granted, so `*mkCannot`
 * renders nothing.
 *
 * ```html
 * <p *mkCannot="'reports.export'">Exporting requires an admin role.</p>
 * ```
 */
@Directive({ selector: '[mkCannot]' })
export class MkCannot {
  /** The permission key to check. */
  readonly permission = input.required<string>({ alias: 'mkCannot' });
  /** Template rendered while the permission is granted (`; else ref`). */
  readonly elseTemplate = input<TemplateRef<unknown> | null>(null, {
    alias: 'mkCannotElse',
  });

  constructor() {
    setupPermissionView(this.permission, this.elseTemplate, true);
  }
}
