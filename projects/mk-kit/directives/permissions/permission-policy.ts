import type { Signal } from '@angular/core';

/**
 * Permission policy — the contract the permission directives (`*mkCan`,
 * `*mkCannot`, `[mkCanDisable]`) check against. Provide an implementation
 * once at bootstrap; the directives inject it optionally and, when no policy
 * is provided at all, treat every permission as **granted** — an app that
 * never wires permissions must not have its whole UI hidden.
 *
 * `can` may return a plain `boolean` (static role checks) or a
 * `Signal<boolean>` (live permissions). The directives normalise both, and a
 * signal-returning policy re-evaluates reactively: views appear/disappear and
 * controls enable/disable the moment the underlying permissions change.
 *
 * ```ts
 * // A signal-based policy fed from an auth service:
 * @Injectable()
 * export class AppPermissionPolicy extends MkPermissionPolicy {
 *   private readonly auth = inject(AuthService);
 *
 *   can(permission: string): Signal<boolean> {
 *     // auth.permissions is a Signal<string[]> that updates on login/logout.
 *     return computed(() => this.auth.permissions().includes(permission));
 *   }
 * }
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     { provide: MkPermissionPolicy, useClass: AppPermissionPolicy },
 *   ],
 * });
 * ```
 *
 * A static policy is just as valid:
 *
 * ```ts
 * class StaticPolicy extends MkPermissionPolicy {
 *   can(permission: string): boolean {
 *     return CURRENT_USER.permissions.includes(permission);
 *   }
 * }
 * ```
 */
export abstract class MkPermissionPolicy {
  /**
   * Whether the current user holds `permission`. Return a `Signal<boolean>`
   * to make the verdict live; a plain boolean is treated as static.
   */
  abstract can(permission: string): boolean | Signal<boolean>;
}

/**
 * Resolve a policy verdict to a boolean, unwrapping signal-based results.
 * Call it inside a reactive context (`computed` / `effect`) so a
 * signal-returning policy stays live. A missing policy grants everything.
 */
export function mkPermissionGranted(
  policy: MkPermissionPolicy | null,
  permission: string,
): boolean {
  if (!policy) return true;
  const verdict = policy.can(permission);
  return typeof verdict === 'boolean' ? verdict : verdict();
}
