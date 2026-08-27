/** Site-wide integration settings for the docs/marketing site. */
export const SITE = {
  /** AZ Widgets tenant slug (contact form, consent banner, analytics). */
  azTenant: 'mk-kit',
  /** Fallback recipient when the contact widget is unavailable. */
  contactEmail: 'kornas.mateusz@gmail.com',
  /** Licence key service (mk-kit/keys — Cloudflare Worker). */
  keysUrl: 'https://keys.mk-kit.dev',
  /**
   * Stripe Payment Links per plan. Empty = not on sale yet: the pricing cards
   * fall back to the waitlist / contact forms. Fill in once the products exist.
   */
  stripe: {
    developer: '',
    team: '',
  },
} as const;
