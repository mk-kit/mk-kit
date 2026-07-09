import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Status presets supported by {@link MkResult}. */
export type MkResultStatus =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | '404'
  | '403'
  | '500';

/** Built-in icon glyph chosen for a status. */
export type MkResultIconVariant = 'check' | 'x' | 'alert' | 'info' | 'search';

/** Tone colour applied to the status icon. */
export type MkResultTone = 'success' | 'danger' | 'warning' | 'info' | 'muted';

/**
 * Result — a centred, full-page status state: a success confirmation, an error,
 * an empty 404/403/500 page. Renders a large status icon (chosen from
 * `status`), a title, a muted subtitle, projected body content, and a row of
 * action buttons at the bottom.
 *
 * Slots: `[mkResultIcon]` (custom icon, overrides the built-in glyph),
 * `[mkResultTitle]` (custom heading, used when `resultTitle` is unset), default
 * content (extra body), `[mkResultActions]` (buttons).
 *
 * ```html
 * <mk-result status="success" resultTitle="Payment complete"
 *   subtitle="Your order is on its way.">
 *   <button mkButton mkResultActions>Back home</button>
 * </mk-result>
 * ```
 */
@Component({
  selector: 'mk-result',
  templateUrl: './result.html',
  styleUrl: './result.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-result',
    role: 'status',
    '[attr.data-status]': 'status()',
    '[attr.data-tone]': 'tone()',
  },
})
export class MkResult {
  /** Status preset that selects the built-in icon glyph and its tone colour. */
  readonly status = input<MkResultStatus>('info');
  /** Main heading rendered as an `<h2>` (falls back to the `[mkResultTitle]` slot). */
  readonly resultTitle = input<string>('');
  /** Supporting muted sentence under the title. */
  readonly subtitle = input<string>('');

  /** Built-in glyph for the current status. */
  protected readonly iconName = computed<MkResultIconVariant>(() => {
    switch (this.status()) {
      case 'success':
        return 'check';
      case 'error':
      case '500':
        return 'x';
      case 'warning':
      case '403':
        return 'alert';
      case '404':
        return 'search';
      default:
        return 'info';
    }
  });

  /** Tone colour applied to the status icon. */
  protected readonly tone = computed<MkResultTone>(() => {
    switch (this.status()) {
      case 'success':
        return 'success';
      case 'error':
      case '500':
        return 'danger';
      case 'warning':
      case '403':
        return 'warning';
      case '404':
        return 'muted';
      default:
        return 'info';
    }
  });
}
