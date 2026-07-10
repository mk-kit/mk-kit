import {
  DOCUMENT,
  Directive,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
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
    if (!this.enabled()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.mkClickOutside.emit(event as PointerEvent);
    }
  };

  constructor() {
    if (this.isBrowser) {
      this.document.addEventListener('pointerdown', this.onPointerdown, true);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.document.removeEventListener('pointerdown', this.onPointerdown, true);
    }
  }
}
