import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import type { MkSize } from '@mkornas/ui/core';
import { MkIconRegistry } from './icon-registry';

/**
 * Icon — renders a registered SVG by `name`, or your own projected `<svg>`.
 * The glyph inherits the current text colour (`currentColor`) and scales to the
 * `size` box, so it composes cleanly inside buttons, inputs and menus.
 *
 * Decorative by default (`aria-hidden`); pass `label` to expose it as an image
 * to assistive tech.
 *
 * ```html
 * <mk-icon name="search" />
 * <mk-icon name="trash" size="lg" label="Delete" />
 * <button mkButton iconOnly aria-label="Menu"><mk-icon name="menu" /></button>
 * <mk-icon><svg viewBox="0 0 24 24">…custom…</svg></mk-icon>
 * ```
 */
@Component({
  selector: 'mk-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Icons style their inner <svg> (from innerHTML or projection), which never
  // receives emulated-encapsulation attributes — so scope every rule under
  // `.mk-icon` and disable encapsulation, matching Angular Material's mat-icon.
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'mk-icon',
    '[style.width]': 'dimension()',
    '[style.height]': 'dimension()',
    '[style.fontSize]': 'dimension()',
    '[attr.role]': "label() ? 'img' : null",
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class MkIcon {
  private readonly registry = inject(MkIconRegistry);

  /** Name of a registered icon (see {@link MkIconRegistry}). */
  readonly name = input<string>('');
  /** Size: `sm`/`md`/`lg`, or a pixel number for a custom dimension. */
  readonly size = input<MkSize | number>('md');
  /** Accessible name. When set the icon becomes `role="img"`; otherwise hidden. */
  readonly label = input<string>('');

  /** CSS length for the icon box (width = height = font-size). */
  protected readonly dimension = computed(() => {
    const s = this.size();
    if (typeof s === 'number') return `${s}px`;
    return s === 'sm' ? '1rem' : s === 'lg' ? '1.5rem' : '1.25rem';
  });

  /** Sanitized SVG for the named icon, or `null` (falls back to projection). */
  protected readonly svg = computed(() =>
    this.name() ? this.registry.get(this.name()) : null,
  );
}
