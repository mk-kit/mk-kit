import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Axis a {@link MkDivider} is drawn along. */
export type MkDividerOrientation = 'horizontal' | 'vertical';

/**
 * Divider — a themed separator rule. Renders horizontally by default; set
 * `orientation="vertical"` for an inline vertical rule. Project content to
 * label a horizontal divider (the label sits centred between two rules).
 *
 * ```html
 * <mk-divider />
 * <mk-divider>OR</mk-divider>
 * <mk-divider orientation="vertical" />
 * ```
 */
@Component({
  selector: 'mk-divider',
  templateUrl: './divider.html',
  styleUrl: './divider.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mk-divider',
    role: 'separator',
    '[class.mk-divider--vertical]': "orientation() === 'vertical'",
    '[attr.aria-orientation]': 'orientation()',
  },
})
export class MkDivider {
  /** Axis the rule is drawn along. */
  readonly orientation = input<MkDividerOrientation>('horizontal');
}
