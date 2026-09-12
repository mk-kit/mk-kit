/**
 * @mk-kit/auth — the framework-free part: the identity every sign-in method
 * produces, and the small random/PKCE helpers, on WebCrypto so they run in
 * Node, Bun, Deno, workers and browsers alike.
 */

/** Who signed in, as told by an identity provider. The app maps this to its own user. */
export interface MkIdentity {
  /** The issuer that vouched for this identity (an OIDC issuer URL, or `cloudflare-access`). */
  issuer: string;
  /** Stable per-issuer id (`sub`). */
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  /** Group names, when the issuer sends them. */
  groups?: string[];
  /** Every claim the issuer sent, for anything not modelled above. */
  claims: Record<string, unknown>;
  /** The raw ID token from an OpenID provider — keep it with the session and pass it back as `id_token_hint` on logout, so the provider ends its session without asking. Absent for Cloudflare Access. */
  idToken?: string;
}

const enc = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** `n` random bytes as base64url — for `state`, `nonce`, session ids. */
export function randomToken(n = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(n)));
}

/** A PKCE verifier and its S256 challenge (RFC 7636). */
export async function pkce(): Promise<{ verifier: string; challenge: string; method: 'S256' }> {
  const verifier = randomToken(48);
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(verifier));
  return { verifier, challenge: base64url(digest), method: 'S256' };
}

/** The claims-to-identity mapping shared by every provider. */
export function identityFromClaims(issuer: string, claims: Record<string, unknown>): MkIdentity {
  const str = (k: string) => (typeof claims[k] === 'string' ? (claims[k] as string) : '');
  const groups = Array.isArray(claims['groups']) ? (claims['groups'] as unknown[]).filter((g): g is string => typeof g === 'string') : undefined;
  const name = str('name') || [str('given_name'), str('family_name')].filter(Boolean).join(' ') || str('preferred_username') || str('email').split('@')[0];
  return {
    issuer,
    subject: str('sub'),
    email: str('email').trim().toLowerCase(),
    emailVerified: claims['email_verified'] === true,
    name,
    ...(str('picture') ? { picture: str('picture') } : {}),
    ...(groups ? { groups } : {}),
    claims,
  };
}
