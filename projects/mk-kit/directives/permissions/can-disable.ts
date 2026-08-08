import {
  Directive,
  ElementRef,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { MkPermissionPolicy, mkPermissionGranted } from './permission-policy';

/**
 * Disables the host while the app's {@link MkPermissionPolicy} denies the
 * given permission — the "keep it visible but inert" alternative to `*mkCan`
 * for buttons, inputs and menu items.
 *
 * While denied, the host gets `aria-disabled="true"`, and — when the element
 * supports it (button, input, select, textarea, fieldset…) — its native
 * `disabled` property is set too. Non-disableable elements (links, custom
 * menu items) get `aria-disabled` only; pair it with CSS / a click guard as
 * needed. The directive owns the disabled state: it also re-enables the host
 * when the permission is granted. With a signal-based policy the state flips
 * live; with no policy provided, everything is granted.
 *
 * ```html
 * <button [mkCanDisable]="'posts.delete'" (click)="remove()">Delete</button>
 * <a [mkCanDisable]="'billing.view'" routerLink="/billing">Billing</a>
 * ```
 */
@Directive({
  selector: '[mkCanDisable]',
  host: {
    '[attr.aria-disabled]': "denied() ? 'true' : null",
  },
})
export class MkCanDisable {
  private readonly policy = inject(MkPermissionPolicy, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The permission key to check, e.g. `'posts.delete'`. */
  readonly permission = input.required<string>({ alias: 'mkCanDisable' });

  /** Whether the permission is currently denied. */
  protected readonly denied = computed(
    () => !mkPermissionGranted(this.policy, this.permission()),
  );

  constructor() {
    const el = this.host.nativeElement as HTMLElement & { disabled?: boolean };
    effect(() => {
      const denied = this.denied();
      // Only elements with a native `disabled` member (form controls) get the
      // property; everything else relies on `aria-disabled` alone.
      if ('disabled' in el) el.disabled = denied;
    });
  }
}
