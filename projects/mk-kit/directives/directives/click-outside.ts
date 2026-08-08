import {
  DOCUMENT,
  Directive,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Emits when a pointer press lands outside the host element — the building block
 * for dismissing menus, popovers and custom dropdowns. Listens on the document
 * in the capture phase so it fires before the target handles the event.
 *
 * ```html
 * <div class="panel" (mkClickOutside)="close()">…</div>
 * ```
 */
@Directive({
  selector: '[mkClickOutside]',
  exportAs: 'mkClickOutside',
})
export class MkClickOutside {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Disable the listener without removing the directive. */
  readonly enabled = input(true, {
    alias: 'mkClickOutsideEnabled',
    transform: booleanAttribute,
  });

  /** Emits the originating event when a pointerdown occurs outside the host. */
  readonly mkClickOutside = output<PointerEvent>();

  private readonly onPointerdown = (event: Event): void => {
    // Defensive: the listener detaches on the effect flush after `enabled`
    // flips false, so also ignore any event racing in before that.
    if (!this.enabled()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.mkClickOutside.emit(event as PointerEvent);
    }
  };

  constructor() {
    // The document listener exists only while `enabled()` — an idle directive
    // must not run its handler (and wake change detection) on every pointer
    // press on the page. Effect cleanup also detaches it on destroy.
    effect((onCleanup) => {
      if (!this.isBrowser || !this.enabled()) return;
      this.document.addEventListener('pointerdown', this.onPointerdown, true);
      onCleanup(() =>
        this.document.removeEventListener('pointerdown', this.onPointerdown, true),
      );
    });
  }
}
