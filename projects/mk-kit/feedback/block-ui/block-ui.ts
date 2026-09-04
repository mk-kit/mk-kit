import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  DOCUMENT,
  ElementRef,
  EnvironmentInjector,
  Injectable,
  booleanAttribute,
  createComponent,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  type ComponentRef,
} from '@angular/core';
import { MK_I18N } from '@mk-kit/ui/core';
import { MkSpinner } from '@mk-kit/ui/status';

/**
 * The translucent panel with a spinner that `mkBlockUi` and
 * `MkBlockUiService` drop over a region or the page.
 */
@Component({
  selector: 'mk-block-ui-overlay',
  template: `
    <div class="mk-block-ui__panel">
      <mk-spinner [label]="message() || i18n.loading" />
      @if (message()) {
        <span class="mk-block-ui__message">{{ message() }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: var(--mk-z-sticky, 10);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--mk-block-ui-scrim, color-mix(in srgb, var(--mk-surface) 70%, transparent));
      backdrop-filter: blur(1px);
      border-radius: inherit;
      cursor: progress;
      animation: mk-block-ui-in var(--mk-duration-fast) var(--mk-ease-standard);
    }
    :host(.mk-block-ui--page) {
      position: fixed;
      z-index: var(--mk-z-overlay, 1000);
      border-radius: 0;
    }
    .mk-block-ui__panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--mk-space-3);
      padding: var(--mk-space-4) var(--mk-space-5);
      border-radius: var(--mk-radius-lg);
      background: var(--mk-surface);
      box-shadow: var(--mk-shadow-md);
      color: var(--mk-text);
      font-size: var(--mk-font-size-sm);
    }
    @keyframes mk-block-ui-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      :host { animation: none; backdrop-filter: none; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkSpinner],
  host: { class: 'mk-block-ui', role: 'status', 'aria-live': 'polite' },
})
export class MkBlockUiOverlay {
  protected readonly i18n = inject(MK_I18N);
  readonly message = signal('');
}

/** Mount an overlay into `host`, making the host a positioning context if it has none. */
function mountOverlay(
  document: Document,
  injector: EnvironmentInjector,
  appRef: ApplicationRef,
  host: HTMLElement,
  message: string,
  page: boolean,
): { ref: ComponentRef<MkBlockUiOverlay>; dispose: () => void } {
  const ref = createComponent(MkBlockUiOverlay, { environmentInjector: injector });
  const el = ref.location.nativeElement as HTMLElement;
  if (page) el.classList.add('mk-block-ui--page');
  ref.instance.message.set(message);
  const view = document.defaultView;
  const current = view?.getComputedStyle(host).position ?? '';
  const positioned = !page && current !== '' && current !== 'static';
  const addedPosition = !page && !positioned;
  if (addedPosition) host.style.position = 'relative';
  // Everything already inside becomes inert: no clicks, no Tab stops, no
  // screen-reader traversal — only the status overlay is reachable.
  const inerted: Element[] = [];
  for (const child of Array.from(host.children)) {
    if (!child.hasAttribute('inert')) {
      child.setAttribute('inert', '');
      inerted.push(child);
    }
  }
  host.appendChild(el);
  host.setAttribute('aria-busy', 'true');
  // Attach so later `message` updates render with the app's change detection.
  appRef.attachView(ref.hostView);
  ref.changeDetectorRef.detectChanges();
  return {
    ref,
    dispose: () => {
      appRef.detachView(ref.hostView);
      ref.destroy();
      el.remove();
      for (const child of inerted) child.removeAttribute('inert');
      host.removeAttribute('aria-busy');
      if (addedPosition) host.style.position = '';
    },
  };
}

/**
 * Block UI — cover the host element with a translucent panel and spinner
 * while something loads, so its contents can neither be read nor operated:
 * a card refreshing, a form submitting, a table re-fetching.
 *
 * Children get `inert` (no clicks, no Tab stops) and the host `aria-busy`.
 * `mkBlockUiDelay` (ms) holds the overlay back for quick operations so the
 * screen does not flash.
 *
 * ```html
 * <mk-card [mkBlockUi]="saving()" mkBlockUiMessage="Saving…">…</mk-card>
 * <form [mkBlockUi]="submitting()" [mkBlockUiDelay]="300">…</form>
 * ```
 */
@Directive({
  selector: '[mkBlockUi]',
  host: { '[class.mk-block-ui-host]': 'mkBlockUi()' },
})
export class MkBlockUi {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  /** Block while `true`. */
  readonly mkBlockUi = input(false, { transform: booleanAttribute });
  /** Text under the spinner (also its accessible label). */
  readonly mkBlockUiMessage = input('');
  /** Wait this many ms before showing, to avoid a flash on fast operations. */
  readonly mkBlockUiDelay = input(0, { transform: numberAttribute });

  private mounted: ReturnType<typeof mountOverlay> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const on = this.mkBlockUi();
      const message = this.mkBlockUiMessage();
      const delay = this.mkBlockUiDelay();
      this.cancelTimer();
      if (!on) {
        this.unmount();
        return;
      }
      if (this.mounted) {
        this.mounted.ref.instance.message.set(message);
        return;
      }
      if (delay > 0) this.timer = setTimeout(() => this.mount(message), delay);
      else this.mount(message);
    });
    inject(DestroyRef).onDestroy(() => {
      this.cancelTimer();
      this.unmount();
    });
  }

  private mount(message: string): void {
    this.timer = null;
    this.mounted = mountOverlay(this.document, this.injector, this.appRef, this.host.nativeElement, message, false);
  }

  private unmount(): void {
    this.mounted?.dispose();
    this.mounted = null;
  }

  private cancelTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

/**
 * Block the whole page. Reference-counted: every `block()` returns a release
 * function, and the overlay disappears once all of them have been called.
 *
 * ```ts
 * const release = this.blockUi.block('Exporting…');
 * try { await this.api.export(); } finally { release(); }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MkBlockUiService {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);
  private mounted: ReturnType<typeof mountOverlay> | null = null;
  private readonly _count = signal(0);

  /** Number of active blocks. */
  readonly count = this._count.asReadonly();

  /** Show the page overlay (or update its message); call the returned function to release. */
  block(message = ''): () => void {
    if (typeof this.document.body === 'undefined') return () => {};
    this._count.update((n) => n + 1);
    if (this.mounted) this.mounted.ref.instance.message.set(message);
    else this.mounted = mountOverlay(this.document, this.injector, this.appRef, this.document.body, message, true);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this._count.update((n) => Math.max(0, n - 1));
      if (this._count() === 0) {
        this.mounted?.dispose();
        this.mounted = null;
      }
    };
  }

  /** True while the page is blocked. */
  isBlocked(): boolean {
    return this._count() > 0;
  }
}
