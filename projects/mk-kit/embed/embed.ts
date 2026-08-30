import {
  ApplicationRef,
  CSP_NONCE,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  type EnvironmentProviders,
  type Provider,
  type Type,
  createComponent,
  provideZonelessChangeDetection,
  reflectComponentType,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { MK_OVERLAY_ROOT } from '@mk-kit/ui/core';

/** Options for {@link mkEmbed}. */
export interface MkEmbedInit {
  /**
   * CSS text adopted into every element's shadow root (and the overlay host).
   * Pass the mk-kit theme through {@link mkShadowCss} so its `:root` token
   * blocks target `:host`; append your own widget CSS after it. Shared as
   * constructable stylesheets when the browser supports them (one parse for
   * any number of instances), `<style>` elements otherwise.
   */
  styles?: string | readonly string[];
  /**
   * Stylesheet URLs loaded as `<link rel="stylesheet">` into every shadow
   * root (and the overlay host) — an alternative to inlining `styles` when
   * the theme lives on a CDN. Loaded per shadow root by the browser's cache,
   * so the network cost is paid once.
   */
  styleUrls?: readonly string[];
  /**
   * CSP nonce applied to every style and link element this app creates —
   * including Angular's own component styles (provided as `CSP_NONCE`) and
   * the `<style>` fallback when constructable stylesheets are unavailable.
   * For host pages with a `style-src` policy that forbids `'unsafe-inline'`.
   */
  nonce?: string;
  /**
   * Extra providers for the shared application — `provideMkI18n(…)`,
   * `provideMkExtendedIcons()`, `provideHttpClient()`, your services.
   */
  providers?: Array<Provider | EnvironmentProviders>;
  /**
   * Mount mk-kit overlays (dialogs, anchored panels, toasts, tours) inside a
   * page-level shadow host that carries the same `styles`, instead of bare
   * `document.body`. Default `true`; set `false` to keep the application
   * default (overlays styled by the page's own stylesheets).
   */
  overlays?: boolean;
}

/**
 * Creates an embed application: a factory for custom elements that render
 * mk-kit-based Angular components behind shadow DOM.
 *
 * - **Lazy**: `element()` only defines the tag; the Angular application is
 *   created on the first element actually connected to a document.
 * - **Shared**: every element of one `mkEmbed()` call runs in one zoneless
 *   `ApplicationRef` with one provider set.
 * - **Isolated but themable**: the host page's CSS cannot reach the widget
 *   internals, while `--mk-*` custom properties still inherit through the
 *   shadow boundary — set them on the element (or any ancestor) to theme it.
 * - **Styled**: Angular routes each component's own styles into the shadow
 *   root it renders in; the `styles` option supplies the token/theme layer.
 *
 * ```ts
 * import { mkEmbed, mkShadowCss } from '@mk-kit/ui/embed';
 * import themeCss from '@mk-kit/ui/styles.css' with { type: 'text' };
 *
 * mkEmbed({ styles: mkShadowCss(themeCss) })
 *   .element('acme-reviews', ReviewsWidget)
 *   .element('acme-signup', SignupWidget);
 * ```
 *
 * ```html
 * <acme-reviews product-id="42" style="--mk-primary: #7c3aed"></acme-reviews>
 * ```
 *
 * Inputs are exposed as dash-cased attributes (string values go through the
 * input's `transform`, so `booleanAttribute` / `numberAttribute` inputs coerce
 * as usual) and as camel-cased element properties (any value); outputs become
 * bubbling, composed `CustomEvent`s named after the output, with the emitted
 * value as `detail`.
 */
export function mkEmbed(init: MkEmbedInit = {}): MkEmbedApp {
  return new MkEmbedApp(init);
}

/** One shared embed application. Create it with {@link mkEmbed}. */
export class MkEmbedApp {
  /** @internal Adopted into every shadow root this app renders in. */
  readonly _mkStyles: MkEmbedStyles;

  private readonly init: MkEmbedInit;
  private appPromise: Promise<ApplicationRef> | null = null;
  private appRef: ApplicationRef | null = null;
  private overlayHost: HTMLElement | null = null;
  private overlayInner: HTMLElement | null = null;
  private destroyed = false;

  constructor(init: MkEmbedInit = {}) {
    this.init = init;
    const styles = init.styles == null ? [] : typeof init.styles === 'string' ? [init.styles] : [...init.styles];
    this._mkStyles = new MkEmbedStyles(styles, init.styleUrls ?? [], init.nonce);
  }

  /**
   * Defines `tag` as a custom element rendering `component`. Chainable; a
   * no-op when the tag is already defined (hot reload, duplicate script) or
   * outside a browser.
   */
  element(tag: string, component: Type<unknown>): this {
    if (typeof customElements === 'undefined') return this;
    if (customElements.get(tag)) return this;
    customElements.define(tag, createElementClass(this, component));
    return this;
  }

  /** Resolves when the shared application is running (created on demand). */
  ready(): Promise<void> {
    return this._mkApplication().then(() => undefined);
  }

  /** Resolves when the application has no pending change detection. */
  async whenStable(): Promise<void> {
    await this._mkApplication().then((app) => app.whenStable());
  }

  /**
   * Destroys the shared application, every mounted component and the overlay
   * host. Defined tags remain registered (the platform cannot undefine them)
   * but render nothing afterwards.
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.appRef?.destroy();
    this.appRef = null;
    this.appPromise = null;
    this.overlayHost?.remove();
    this.overlayHost = null;
    this.overlayInner = null;
  }

  /** @internal */
  _mkApplication(): Promise<ApplicationRef> {
    if (this.destroyed) return Promise.reject(new Error('This MkEmbedApp was destroyed.'));
    if (typeof document === 'undefined') {
      return Promise.reject(
        new Error('mkEmbed needs a browser — on the server, defining elements is a no-op and nothing should await ready().'),
      );
    }
    this.appPromise ??= createApplication({
      providers: [
        provideZonelessChangeDetection(),
        ...(this.init.nonce ? [{ provide: CSP_NONCE, useValue: this.init.nonce }] : []),
        ...(this.init.overlays === false
          ? []
          : [{ provide: MK_OVERLAY_ROOT, useValue: () => this.overlayRootElement() }]),
        ...(this.init.providers ?? []),
      ],
    }).then((ref) => (this.appRef = ref));
    return this.appPromise;
  }

  /** @internal The running application — only valid once `ready()` resolved. */
  get _mkAppRef(): ApplicationRef {
    if (!this.appRef) throw new Error('The embed application is not running yet.');
    return this.appRef;
  }

  /**
   * Lazily builds the page-level overlay host: a shadow root carrying the
   * embed styles, with an inner container the overlay services append to.
   */
  private overlayRootElement(): HTMLElement {
    if (this.overlayInner) return this.overlayInner;
    const appRef = this._mkAppRef;
    const doc = document;
    const host = doc.createElement('mk-embed-overlays');
    const shadow = host.attachShadow({ mode: 'open' });
    this._mkStyles.adopt(shadow);
    const inner = doc.createElement('div');
    shadow.appendChild(inner);
    doc.body.appendChild(host);

    // Register this shadow root as an Angular styles host: creating one
    // component with an ATTACHED host element inside it makes Angular mirror
    // every component stylesheet here — including components created detached
    // and appended later (toast / snackbar containers) and anchored panels
    // teleported in from other roots. The anchor lives until destroy().
    const anchorHost = doc.createElement('div');
    inner.appendChild(anchorHost);
    const anchor = createComponent(MkEmbedStyleAnchor, {
      environmentInjector: appRef.injector,
      hostElement: anchorHost,
    });
    appRef.attachView(anchor.hostView);

    this.overlayHost = host;
    this.overlayInner = inner;
    return inner;
  }
}

/** Invisible component whose only job is registering a shadow styles host. */
@Component({
  selector: 'mk-embed-style-anchor',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MkEmbedStyleAnchor {}

/**
 * The embed styles, parsed once and shared: constructable stylesheets where
 * supported, cloned `<style>` elements otherwise, plus `<link>` elements for
 * `styleUrls`. The nonce lands on every element this class creates.
 */
class MkEmbedStyles {
  private sheets: CSSStyleSheet[] | null | undefined;

  constructor(
    private readonly css: readonly string[],
    private readonly urls: readonly string[],
    private readonly nonce?: string,
  ) {}

  adopt(root: ShadowRoot): void {
    const doc = root.host.ownerDocument;
    for (const url of this.urls) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      if (this.nonce) link.setAttribute('nonce', this.nonce);
      root.appendChild(link);
    }
    if (!this.css.length) return;
    if (this.sheets === undefined) {
      try {
        this.sheets = this.css.map((text) => {
          const sheet = new CSSStyleSheet();
          sheet.replaceSync(text);
          return sheet;
        });
      } catch {
        this.sheets = null;
      }
    }
    if (this.sheets) {
      try {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...this.sheets];
        return;
      } catch {
        // Fall through to <style> elements.
      }
    }
    for (const text of this.css) {
      const el = doc.createElement('style');
      el.textContent = text;
      if (this.nonce) el.setAttribute('nonce', this.nonce);
      root.appendChild(el);
    }
  }
}

/** `pageSize` → `page-size` (the attribute name of an input). */
function dasherize(name: string): string {
  return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

interface OutputLike {
  subscribe?: (next: (value: unknown) => void) => { unsubscribe(): void };
}

/** Builds the custom-element class wrapping one Angular component. */
function createElementClass(app: MkEmbedApp, component: Type<unknown>): CustomElementConstructor {
  const mirror = reflectComponentType(component);
  if (!mirror) {
    throw new Error('mkEmbed: the provided class is not an Angular component.');
  }
  const inputs = mirror.inputs;
  const outputs = mirror.outputs;
  const attrToInput = new Map<string, string>();
  for (const { templateName } of inputs) attrToInput.set(dasherize(templateName), templateName);

  class MkEmbeddedElement extends HTMLElement {
    static readonly observedAttributes = [...attrToInput.keys()];

    private _mkRef: ComponentRef<unknown> | null = null;
    private readonly _mkValues = new Map<string, unknown>();
    private _mkSubs: { unsubscribe(): void }[] = [];
    private _mkEpoch = 0;
    private _mkStylesAdopted = false;
    private _mkResolveReady!: () => void;

    /** Resolves once the Angular component is mounted in the shadow root. */
    readonly mkReady: Promise<void> = new Promise((resolve) => (this._mkResolveReady = resolve));

    /** The mounted Angular component instance, or `null` before/after. */
    get mkComponent(): unknown {
      return this._mkRef?.instance ?? null;
    }

    connectedCallback(): void {
      const epoch = ++this._mkEpoch;
      void app._mkApplication().then(() => {
        if (epoch !== this._mkEpoch || !this.isConnected || this._mkRef) return;
        this._mkMount();
      });
    }

    disconnectedCallback(): void {
      const epoch = ++this._mkEpoch;
      queueMicrotask(() => {
        // Moving an element fires disconnect + connect in one task — only
        // tear down when it is still detached by the end of the microtask.
        if (epoch === this._mkEpoch && !this.isConnected) this._mkUnmount();
      });
    }

    attributeChangedCallback(name: string, _prev: string | null, value: string | null): void {
      const input = attrToInput.get(name);
      if (input) this._mkApplyInput(input, value);
    }

    /** @internal Shared by attribute changes and property setters. */
    _mkApplyInput(name: string, value: unknown): void {
      this._mkValues.set(name, value);
      this._mkRef?.setInput(name, value);
    }

    /** @internal */
    _mkLastValue(name: string): unknown {
      return this._mkValues.get(name);
    }

    private _mkMount(): void {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      if (!this._mkStylesAdopted) {
        app._mkStyles.adopt(shadow);
        this._mkStylesAdopted = true;
      }
      // An inner host element (rather than rendering into the shadow root
      // directly) is what routes the component's styles into this shadow
      // root: Angular resolves the style host from the host element's root
      // node at creation time.
      const host = this.ownerDocument.createElement('div');
      shadow.appendChild(host);
      const appRef = app._mkAppRef;
      const ref = createComponent(component, {
        environmentInjector: appRef.injector,
        hostElement: host,
      });
      for (const [name, value] of this._mkValues) ref.setInput(name, value);
      for (const { propName, templateName } of outputs) {
        const source = (ref.instance as Record<string, unknown>)[propName] as OutputLike | undefined;
        if (source && typeof source.subscribe === 'function') {
          this._mkSubs.push(
            source.subscribe((detail: unknown) => {
              this.dispatchEvent(new CustomEvent(templateName, { detail, bubbles: true, composed: true }));
            }),
          );
        }
      }
      appRef.attachView(ref.hostView);
      // First render happens before mkReady resolves — attachView alone only
      // schedules it for the next zoneless flush.
      ref.changeDetectorRef.detectChanges();
      this._mkRef = ref;
      this._mkResolveReady();
    }

    private _mkUnmount(): void {
      for (const sub of this._mkSubs) sub.unsubscribe();
      this._mkSubs = [];
      const host = this._mkRef?.location.nativeElement as HTMLElement | undefined;
      this._mkRef?.destroy();
      host?.remove();
      this._mkRef = null;
    }
  }

  // Property accessors for every input that does not collide with a native
  // element property (`title`, `hidden`, `dir`, …) or with the wrapper's own
  // surface — collisions stay reachable through the dash-cased attribute.
  for (const { templateName } of inputs) {
    if (templateName in MkEmbeddedElement.prototype) continue;
    Object.defineProperty(MkEmbeddedElement.prototype, templateName, {
      configurable: true,
      enumerable: true,
      get(this: MkEmbeddedElement) {
        return this._mkLastValue(templateName);
      },
      set(this: MkEmbeddedElement, value: unknown) {
        this._mkApplyInput(templateName, value);
      },
    });
  }

  return MkEmbeddedElement;
}
