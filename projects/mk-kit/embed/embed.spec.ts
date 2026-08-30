import { Component, inject, input, numberAttribute, output } from '@angular/core';
import { MkButton } from '@mk-kit/ui/button';
import { mkBodyLevelAncestor } from '@mk-kit/ui/core';
import { MkToastService } from '@mk-kit/ui/feedback';

import { MkEmbedApp, mkEmbed } from './embed';
import { mkShadowCss } from './shadow-css';

@Component({
  selector: 'mk-embed-demo',
  imports: [MkButton],
  styles: `
    .mk-embed-demo-probe {
      color: rgb(1, 2, 3);
    }
  `,
  template: `
    <button mkButton class="mk-embed-demo-probe" (click)="pressed.emit(count())">{{ label() }}</button>
    <p class="count">{{ count() }}</p>
  `,
})
class DemoWidget {
  readonly label = input('hello');
  readonly count = input(0, { transform: numberAttribute });
  readonly pressed = output<number>();
}

@Component({
  selector: 'mk-embed-toaster',
  template: `<p>toaster</p>`,
})
class ToasterWidget {
  private readonly toasts = inject(MkToastService);
  notify(): void {
    this.toasts.success('embedded toast');
  }
}

/** Unique tag per test — custom elements cannot be undefined. */
let tagSeq = 0;
function nextTag(): string {
  return `mk-embed-spec-${++tagSeq}`;
}

async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
}

interface EmbeddedElement extends HTMLElement {
  mkReady: Promise<void>;
  mkComponent: unknown;
  label?: string;
  count?: number;
}

describe('@mk-kit/ui/embed', () => {
  let app: MkEmbedApp | null = null;
  const created: HTMLElement[] = [];

  function mountTag(embedApp: MkEmbedApp, component: unknown = DemoWidget): { tag: string; el: EmbeddedElement } {
    const tag = nextTag();
    embedApp.element(tag, component as never);
    const el = document.createElement(tag) as EmbeddedElement;
    created.push(el);
    return { tag, el };
  }

  afterEach(() => {
    app?.destroy();
    app = null;
    for (const el of created.splice(0)) el.remove();
    document.querySelectorAll('mk-embed-overlays').forEach((host) => host.remove());
  });

  it('mounts the component in a shadow root once connected', async () => {
    app = mkEmbed();
    const { el } = mountTag(app);
    document.body.appendChild(el);
    await el.mkReady;

    expect(el.shadowRoot).not.toBeNull();
    const button = el.shadowRoot!.querySelector('button');
    expect(button?.textContent?.trim()).toBe('hello');
    // Host page CSS cannot reach it; the internals are behind the boundary.
    expect(document.body.contains(button)).toBe(false);
  });

  it("routes the component's own styles into the shadow root", async () => {
    app = mkEmbed();
    const { el } = mountTag(app);
    document.body.appendChild(el);
    await el.mkReady;

    const styles = [...el.shadowRoot!.querySelectorAll('style')].map((s) => s.textContent ?? '');
    expect(styles.some((s) => s.includes('mk-embed-demo-probe'))).toBe(true);
    // mk-kit component styles (MkButton) arrive the same way.
    expect(styles.some((s) => s.includes('mk-button'))).toBe(true);
  });

  it('adopts the provided theme styles into the shadow root', async () => {
    app = mkEmbed({ styles: mkShadowCss(':root { --mk-test-token: 7px; }') });
    const { el } = mountTag(app);
    document.body.appendChild(el);
    await el.mkReady;

    const shadow = el.shadowRoot!;
    const adopted = (shadow.adoptedStyleSheets?.length ?? 0) > 0;
    const inline = [...shadow.querySelectorAll('style')].some((s) => s.textContent?.includes('--mk-test-token'));
    expect(adopted || inline).toBe(true);
  });

  it('bridges attributes (with input transforms) and properties to inputs', async () => {
    app = mkEmbed();
    const { el } = mountTag(app);
    el.setAttribute('label', 'from-attr');
    el.setAttribute('count', '7');
    document.body.appendChild(el);
    await el.mkReady;
    await app.whenStable();

    const shadow = el.shadowRoot!;
    expect(shadow.querySelector('button')?.textContent?.trim()).toBe('from-attr');
    expect(shadow.querySelector('.count')?.textContent).toBe('7');

    el.setAttribute('label', 'updated');
    (el as unknown as { count: number }).count = 12;
    await app.whenStable();
    expect(shadow.querySelector('button')?.textContent?.trim()).toBe('updated');
    expect(shadow.querySelector('.count')?.textContent).toBe('12');
  });

  it('re-emits outputs as bubbling composed CustomEvents', async () => {
    app = mkEmbed();
    const { el } = mountTag(app);
    el.setAttribute('count', '3');
    document.body.appendChild(el);
    await el.mkReady;
    await app.whenStable();

    const events: CustomEvent[] = [];
    // Listen on body: the event must bubble out of the shadow tree (composed).
    document.body.addEventListener('pressed', (e) => events.push(e as CustomEvent), { once: true });
    el.shadowRoot!.querySelector('button')!.click();
    await app.whenStable();

    expect(events.length).toBe(1);
    expect(events[0].detail).toBe(3);
  });

  it('destroys the component when disconnected, but survives a same-task move', async () => {
    app = mkEmbed();
    const { el } = mountTag(app);
    document.body.appendChild(el);
    await el.mkReady;

    // Move: disconnect + reconnect within one task keeps the instance.
    const target = document.createElement('div');
    document.body.appendChild(target);
    created.push(target);
    target.appendChild(el);
    await flushMicrotasks();
    expect(el.shadowRoot!.querySelector('button')).not.toBeNull();
    expect(el.mkComponent).not.toBeNull();

    // Real removal tears the component down.
    el.remove();
    await flushMicrotasks();
    expect(el.shadowRoot!.querySelector('button')).toBeNull();
    expect(el.mkComponent).toBeNull();
  });

  it('confines overlays to a themed shadow host instead of document.body', async () => {
    app = mkEmbed({ styles: ':host { --mk-test: 1; }' });
    const { el } = mountTag(app, ToasterWidget);
    document.body.appendChild(el);
    await el.mkReady;

    (el.mkComponent as ToasterWidget).notify();
    await app.whenStable();

    const overlayHost = document.querySelector('mk-embed-overlays');
    expect(overlayHost).not.toBeNull();
    const container = overlayHost!.shadowRoot!.querySelector('mk-toast-container');
    expect(container).not.toBeNull();
    expect(container?.textContent).toContain('embedded toast');
    // Nothing landed on the bare page.
    expect(document.querySelector('body > mk-toast-container')).toBeNull();
    // The toast container's component styles were mirrored into the host too.
    const styles = [...overlayHost!.shadowRoot!.querySelectorAll('style')].map((s) => s.textContent ?? '');
    expect(styles.some((s) => s.includes('mk-toast'))).toBe(true);
  });

  it('destroy() tears down the application and the overlay host', async () => {
    app = mkEmbed();
    const { el } = mountTag(app, ToasterWidget);
    document.body.appendChild(el);
    await el.mkReady;
    (el.mkComponent as ToasterWidget).notify();
    await app.whenStable();
    expect(document.querySelector('mk-embed-overlays')).not.toBeNull();

    app.destroy();
    app = null;
    expect(document.querySelector('mk-embed-overlays')).toBeNull();
  });

  it('loads styleUrls as <link> elements in the shadow root, nonce applied', async () => {
    app = mkEmbed({ styleUrls: ['https://cdn.example.com/theme.css'], nonce: 'test-nonce' });
    const { el } = mountTag(app);
    document.body.appendChild(el);
    await el.mkReady;

    const link = el.shadowRoot!.querySelector('link[rel="stylesheet"]');
    expect(link?.getAttribute('href')).toBe('https://cdn.example.com/theme.css');
    expect(link?.getAttribute('nonce')).toBe('test-nonce');
  });

  it('threads the CSP nonce into Angular component styles', async () => {
    app = mkEmbed({ nonce: 'test-nonce' });
    const { el } = mountTag(app);
    document.body.appendChild(el);
    await el.mkReady;

    const styles = [...el.shadowRoot!.querySelectorAll('style')];
    expect(styles.length).toBeGreaterThan(0);
    expect(styles.every((s) => s.getAttribute('nonce') === 'test-nonce')).toBe(true);
  });

  it('element() is idempotent per tag and ignores non-browser platforms gracefully', () => {
    app = mkEmbed();
    const tag = nextTag();
    app.element(tag, DemoWidget);
    // A second call with the same tag must not throw (hot reload).
    expect(() => app!.element(tag, DemoWidget)).not.toThrow();
  });
});

describe('mkShadowCss', () => {
  it('retargets :root blocks to :host, variants included', () => {
    const css = ":root { --a: 1; }\n:root:not([data-mk-theme='light']) { --a: 2; }\n.mk-x { color: red; }";
    const out = mkShadowCss(css);
    expect(out).toContain(':host { --a: 1; }');
    expect(out).toContain(":host:not([data-mk-theme='light']) { --a: 2; }");
    expect(out).toContain('.mk-x { color: red; }');
    expect(out).not.toContain(':root');
  });
});

describe('mkBodyLevelAncestor', () => {
  it('resolves body children across shadow boundaries', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.appendChild(inner);
    const deep = document.createElement('span');
    inner.appendChild(deep);

    expect(mkBodyLevelAncestor(deep, document.body)).toBe(host);
    expect(mkBodyLevelAncestor(host, document.body)).toBe(host);

    const detached = document.createElement('div');
    expect(mkBodyLevelAncestor(detached, document.body)).toBeNull();
    host.remove();
  });
});
