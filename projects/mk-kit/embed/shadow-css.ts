/**
 * Rewrites a document-level stylesheet for adoption into a shadow root:
 * `:root` never matches inside one, so token blocks like mk-kit's
 * `:root { --mk-primary: … }` are retargeted to `:host`. Theme opt-ins keep
 * working — `:root:not([data-mk-theme='light'])` becomes
 * `:host:not([data-mk-theme='light'])`, so `<my-widget data-mk-theme="dark">`
 * switches one embedded element to the dark palette.
 *
 * ```ts
 * import themeCss from '@mk-kit/ui/styles.css' with { type: 'text' };
 * mkEmbed({ styles: mkShadowCss(themeCss) });
 * ```
 */
export function mkShadowCss(css: string): string {
  return css.replace(/:root\b/g, ':host');
}
