import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  inject,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';

/** Semantic tones supported by {@link MkAlert}. */
export type MkAlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/** Visual treatments supported by {@link MkAlert}. */
export type MkAlertVariant = 'soft' | 'solid' | 'outline';

/**
 * Alert — an inline banner that communicates a contextual status message.
 * Fully themed via `--mk-*` tokens using the same tone/local-var pattern as
 * the Button. Danger/warning alerts use `role="alert"` (assertive), all other
 * tones use `role="status"` (polite).
 *
 * ```html
 * <mk-alert tone="success" title="Saved">Your changes were saved.</mk-alert>
 *
 * <mk-alert tone="danger" variant="outline" dismissible (dismissed)="hide()">
 *   <svg mkAlertIcon>…</svg>
 *   Could not reach the server.
 * </mk-alert>
 * ```
 */
@Component({
  selector: 'mk-alert',
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-alert',
    '[attr.data-tone]': 'tone()',
    '[class.mk-alert--soft]': "variant() === 'soft'",
    '[class.mk-alert--solid]': "variant() === 'solid'",
    '[class.mk-alert--outline]': "variant() === 'outline'",
    '[attr.role]': 'role()',
  },
})
export class MkAlert {
  /** Localised strings (override globally via `provideMkI18n`). */
  protected readonly i18n = inject(MK_I18N);
  /** Semantic color tone. */
  readonly tone = input<MkAlertTone>('info');
  /** Visual treatment. */
  readonly variant = input<MkAlertVariant>('soft');
  /** Optional bold heading rendered above the message. */
  readonly title = input<string>();
  /** When set, renders a keyboard-accessible close button that emits `dismissed`. */
  readonly dismissible = input(false, { transform: booleanAttribute });

  /** Emitted when the user activates the close button. */
  readonly dismissed = output<void>();

  /** Assertive roles for urgent tones, polite `status` otherwise. */
  protected readonly role = computed(() =>
    this.tone() === 'danger' || this.tone() === 'warning' ? 'alert' : 'status',
  );

  protected onDismiss(): void {
    this.dismissed.emit();
  }
}
