/**
 * @mk-kit/auth/server — sign-in plumbing for a Node app:
 *
 *  - `createOidc()`: OpenID Connect (authorization code + PKCE + nonce) on top
 *    of `openid-client`, returning an {@link MkIdentity};
 *  - `registerOidcRoutes()`: `/auth/login` and `/auth/callback` for Fastify
 *    with the state/nonce/verifier kept in a signed, short-lived cookie;
 *  - `createAccessVerifier()`: verification of the JWT Cloudflare Access puts
 *    on every request that passed its login.
 *
 * The app keeps its own users, sessions and permissions: it receives an
 * identity and decides what to do with it.
 */
import { createHmac, createPublicKey, timingSafeEqual, verify as cryptoVerify } from 'node:crypto';
import * as oidc from 'openid-client';
import { type MkIdentity, identityFromClaims, pkce, randomToken } from './index.js';

export type { MkIdentity };
export { identityFromClaims, pkce, randomToken };

// ---------------------------------------------------------------------------
// OpenID Connect
// ---------------------------------------------------------------------------

export interface OidcOptions {
  /** Issuer URL, e.g. `https://id.example.com` — discovery is read from `<issuer>/.well-known/openid-configuration`. */
  issuer: string;
  clientId: string;
  /** Confidential clients send this at the token endpoint; public clients omit it (PKCE still applies). */
  clientSecret?: string;
  /** Default `['openid', 'email', 'profile']`. */
  scopes?: string[];
  /** Allow a plain-HTTP issuer (tests, LAN-only setups). Never in production. */
  allowInsecure?: boolean;
  /** Fetch userinfo after the token exchange and merge its claims (default `true`). */
  userinfo?: boolean;
}

export interface AuthorizationRequest {
  url: string;
  /** Keep these three until the callback: they bind the response to this request. */
  state: string;
  nonce: string;
  codeVerifier: string;
}

export class Oidc {
  private readonly config: oidc.Configuration;
  private readonly opts: Required<Pick<OidcOptions, 'scopes' | 'userinfo'>> & OidcOptions;

  constructor(config: oidc.Configuration, opts: OidcOptions) {
    this.config = config;
    this.opts = { scopes: ['openid', 'email', 'profile'], userinfo: true, ...opts };
  }

  get issuer(): string {
    return this.config.serverMetadata().issuer;
  }

  /** Where to send the browser. `redirectUri` must be registered at the provider. */
  async authorize(redirectUri: string): Promise<AuthorizationRequest> {
    const { verifier, challenge, method } = await pkce();
    const state = randomToken(24);
    const nonce = randomToken(24);
    const url = oidc.buildAuthorizationUrl(this.config, {
      redirect_uri: redirectUri,
      scope: this.opts.scopes.join(' '),
      code_challenge: challenge,
      code_challenge_method: method,
      state,
      nonce,
    });
    return { url: url.href, state, nonce, codeVerifier: verifier };
  }

  /** Turn the callback URL the browser came back with into an identity. Throws on any mismatch. */
  async callback(callbackUrl: URL, expected: { state: string; nonce: string; codeVerifier: string }): Promise<MkIdentity> {
    const tokens = await oidc.authorizationCodeGrant(this.config, callbackUrl, { pkceCodeVerifier: expected.codeVerifier, expectedState: expected.state, expectedNonce: expected.nonce });
    const claims = { ...(tokens.claims() ?? {}) } as Record<string, unknown>;
    if (this.opts.userinfo && this.config.serverMetadata().userinfo_endpoint && typeof claims['sub'] === 'string') {
      try {
        Object.assign(claims, await oidc.fetchUserInfo(this.config, tokens.access_token, claims['sub']));
      } catch {
        /* userinfo is a bonus; the ID token already carries what we need */
      }
    }
    const identity = identityFromClaims(this.issuer, claims);
    return tokens.id_token ? { ...identity, idToken: tokens.id_token } : identity;
  }

  /**
   * The provider's logout URL when it offers one (RP-initiated logout), else `null`.
   * Pass the session's `idToken` as `idTokenHint`: most providers (Pocket ID among
   * them) only redirect straight back when they can tell whose session ends;
   * without it they show a confirmation page first.
   */
  endSessionUrl(postLogoutRedirectUri?: string, idTokenHint?: string): string | null {
    if (!this.config.serverMetadata().end_session_endpoint) return null;
    return oidc.buildEndSessionUrl(this.config, { ...(postLogoutRedirectUri ? { post_logout_redirect_uri: postLogoutRedirectUri } : {}), ...(idTokenHint ? { id_token_hint: idTokenHint } : {}) }).href;
  }
}

/** Discover the provider and build a client. Do this once at startup. */
export async function createOidc(opts: OidcOptions): Promise<Oidc> {
  const config = await oidc.discovery(new URL(opts.issuer), opts.clientId, opts.clientSecret, undefined, opts.allowInsecure ? { execute: [oidc.allowInsecureRequests] } : undefined);
  return new Oidc(config, opts);
}

// ---------------------------------------------------------------------------
// Signed values (the transient login cookie)
// ---------------------------------------------------------------------------

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

/** Shortest secret `signValue` / `verifyValue` accept: an empty or guessable key lets anyone sign their own cookie. */
const MIN_SECRET_LENGTH = 16;

function assertSecret(secret: string): void {
  if (typeof secret !== 'string' || secret.trim().length < MIN_SECRET_LENGTH) throw new TypeError(`the signing secret must be at least ${MIN_SECRET_LENGTH} characters (use 32 random bytes)`);
}

/** `payload.signature`, payload = base64url(JSON), signature = HMAC-SHA256 — tamper-evident, not encrypted. Throws on a secret shorter than 16 characters. */
export function signValue(secret: string, value: unknown): string {
  assertSecret(secret);
  const payload = b64url(Buffer.from(JSON.stringify(value)));
  const sig = b64url(createHmac('sha256', secret).update(payload).digest());
  return `${payload}.${sig}`;
}

/** The value back, or `null` when missing, tampered with or (when it carries `exp`) expired. Throws on a secret shorter than 16 characters. */
export function verifyValue<T = unknown>(secret: string, signed: string | undefined, now = Date.now()): T | null {
  assertSecret(secret);
  if (!signed) return null;
  const dot = signed.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = signed.slice(0, dot);
  const sig = Buffer.from(signed.slice(dot + 1), 'base64url');
  const expected = createHmac('sha256', secret).update(payload).digest();
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T & { exp?: number };
    if (typeof value?.exp === 'number' && value.exp < now) return null;
    return value;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fastify routes
// ---------------------------------------------------------------------------

/** The subset of Fastify these routes need — typed loosely so the package has no hard Fastify dependency. */
interface RouteRequest {
  url: string;
  headers: Record<string, string | string[] | undefined>;
  query: unknown;
}
interface RouteReply {
  code(status: number): RouteReply;
  header(name: string, value: string): RouteReply;
  redirect(url: string, status?: number): unknown;
  send(body?: unknown): unknown;
}
interface RouteApp {
  get(path: string, handler: (req: RouteRequest, reply: RouteReply) => Promise<unknown>): unknown;
}

export interface OidcRoutesOptions<Req = RouteRequest, Rep = RouteReply> {
  oidc: Oidc;
  /** Secret for the transient cookie (state, nonce, verifier). 32+ random bytes; may rotate freely. Shorter than 16 characters throws. */
  cookieSecret: string;
  /** The absolute callback URL for this request — the host the browser is on, plus `paths.callback`. */
  redirectUri: (req: Req) => string;
  /** Called with a verified identity. Set the app's session, then redirect (`next` is the sanitised return path). */
  onSignedIn: (identity: MkIdentity, ctx: { req: Req; reply: Rep; next: string }) => Promise<unknown>;
  /** Called when the callback fails (provider error, mismatch, expired cookie). Default: 400 with the message. */
  onError?: (error: Error, ctx: { req: Req; reply: Rep }) => Promise<unknown>;
  paths?: { login?: string; callback?: string };
  /** Cookie name (default `mk_oidc`) and whether to mark it `Secure` for a request (default: when the redirect URI is https). */
  cookie?: { name?: string; secure?: (req: Req) => boolean };
  /** How long a login attempt may take before the callback is refused (default 10 minutes). */
  ttlMs?: number;
}

interface Transient {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  exp: number;
}

function cookieValue(header: string | string[] | undefined, name: string): string | undefined {
  const raw = Array.isArray(header) ? header.join(';') : header;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k !== name) continue;
    try {
      return decodeURIComponent(v.join('='));
    } catch {
      /* a malformed escape is no value, not a crash */
    }
  }
  return undefined;
}

const SAFE_NEXT_BASE = 'http://x.invalid';
const SAFE_NEXT_MAX = 2048;

/**
 * Only same-origin paths make sense as a return target. Browsers drop tabs and
 * newlines from a `Location` and read `\` as `/`, so `/\t/evil.example` would
 * leave the site: control characters, whitespace and backslashes are refused
 * outright, the value must start with a single `/`, and it must still resolve
 * to this origin when parsed as a URL. Non-ASCII comes back percent-encoded (a
 * raw `ę` is not a valid `Location` header), and anything longer than 2048
 * characters is refused (it would not fit in the login cookie).
 */
export function safeNext(raw: unknown, fallback = '/'): string {
  if (typeof raw !== 'string' || raw.length > SAFE_NEXT_MAX || !raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (/[\s\x00-\x1f\x7f\\]/.test(raw)) return fallback;
  try {
    const next = raw.replace(/[^\x00-\x7f]+/g, encodeURI);
    if (next.length > SAFE_NEXT_MAX || new URL(next, SAFE_NEXT_BASE).origin !== SAFE_NEXT_BASE) return fallback;
    return next;
  } catch {
    return fallback; // a lone surrogate
  }
}

/**
 * `GET <login>?next=/where` → provider; `GET <callback>?code&state` → `onSignedIn`.
 * Register on a Fastify instance (any object with a compatible `get`).
 */
export function registerOidcRoutes<Req extends RouteRequest = RouteRequest, Rep extends RouteReply = RouteReply>(app: RouteApp, options: OidcRoutesOptions<Req, Rep>): void {
  assertSecret(options.cookieSecret);
  const loginPath = options.paths?.login ?? '/auth/login';
  const callbackPath = options.paths?.callback ?? '/auth/callback';
  const ttl = options.ttlMs ?? 10 * 60_000;
  const secure = (req: Req) => (options.cookie?.secure ? options.cookie.secure(req) : options.redirectUri(req).startsWith('https://'));
  // Over https the cookie is `__Host-`: a sibling subdomain (or a plain-http response
  // for the same host) cannot plant its own signed login cookie and sign the victim
  // in as someone else. The prefix requires `Path=/`.
  const cookieName = (req: Req) => options.cookie?.name ?? (secure(req) ? '__Host-mk_oidc' : 'mk_oidc');
  const setCookie = (req: Req, reply: RouteReply, value: string, maxAge: number) => {
    const name = cookieName(req);
    const attrs = [`${name}=${encodeURIComponent(value)}`, `Path=${name.startsWith('__Host-') ? '/' : callbackPath}`, 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`];
    if (secure(req)) attrs.push('Secure');
    reply.header('Set-Cookie', attrs.join('; '));
  };

  app.get(loginPath, async (req, reply) => {
    const r = req as Req;
    const next = safeNext((req.query as Record<string, unknown> | undefined)?.['next']);
    const auth = await options.oidc.authorize(options.redirectUri(r));
    const transient: Transient = { state: auth.state, nonce: auth.nonce, verifier: auth.codeVerifier, next, exp: Date.now() + ttl };
    setCookie(r, reply, signValue(options.cookieSecret, transient), Math.ceil(ttl / 1000));
    reply.header('Cache-Control', 'no-store');
    return reply.redirect(auth.url, 302);
  });

  app.get(callbackPath, async (req, reply) => {
    const r = req as Req;
    const fail = (e: Error) => (options.onError ? options.onError(e, { req: r, reply: reply as Rep }) : reply.code(400).header('Content-Type', 'text/plain; charset=utf-8').send(`Sign-in failed: ${e.message}`));
    const transient = verifyValue<Transient>(options.cookieSecret, cookieValue(req.headers.cookie, cookieName(r)));
    setCookie(r, reply, '', 0);
    if (!transient) return fail(new Error('the sign-in attempt expired or was tampered with — try again'));
    const callbackUrl = new URL(req.url, options.redirectUri(r));
    let identity: MkIdentity;
    try {
      identity = await options.oidc.callback(callbackUrl, { state: transient.state, nonce: transient.nonce, codeVerifier: transient.verifier });
    } catch (e) {
      return fail(e instanceof Error ? e : new Error(String(e)));
    }
    return options.onSignedIn(identity, { req: r, reply: reply as Rep, next: safeNext(transient.next) });
  });
}

// ---------------------------------------------------------------------------
// Cloudflare Access
// ---------------------------------------------------------------------------

export interface AccessOptions {
  /** Team name (`myteam`) or full domain (`myteam.cloudflareaccess.com`). */
  team: string;
  /** The application's Audience (AUD) tag. */
  aud: string;
  /** Override the certs URL (tests). */
  certsUrl?: string;
  /** How long fetched keys are trusted before a refresh (default 6 h); an unknown `kid` triggers a refresh, at most once a minute. */
  keysTtlMs?: number;
}

/** A token with an unknown `kid` refreshes the keys at most this often, so made-up `kid`s cannot turn every request into a fetch. */
const FORCED_REFRESH_MIN_MS = 60_000;
/** Clock skew allowed on `exp` and `nbf`, in seconds. */
const ACCESS_SKEW_S = 30;

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

/** Verifies the `Cf-Access-Jwt-Assertion` header (or `CF_Authorization` cookie) Cloudflare Access adds after its login. */
export class AccessVerifier {
  readonly issuer: string;
  readonly aud: string;
  private readonly certsUrl: string;
  private readonly ttl: number;
  private keys = new Map<string, ReturnType<typeof createPublicKey>>();
  private fetchedAt = 0;
  private attemptedAt = 0;
  private fetching: Promise<void> | null = null;

  constructor(opts: AccessOptions) {
    const host = opts.team.includes('.') ? opts.team : `${opts.team}.cloudflareaccess.com`;
    this.issuer = `https://${host}`;
    this.aud = opts.aud;
    this.certsUrl = opts.certsUrl ?? `${this.issuer}/cdn-cgi/access/certs`;
    this.ttl = opts.keysTtlMs ?? 6 * 3_600_000;
  }

  private async loadKeys(force = false): Promise<void> {
    if (!this.fetching) {
      const now = Date.now();
      const recent = now - this.attemptedAt < FORCED_REFRESH_MIN_MS;
      if (force ? recent : this.keys.size > 0 && (now - this.fetchedAt < this.ttl || recent)) return;
      this.attemptedAt = now;
      this.fetching = this.fetchKeys().finally(() => (this.fetching = null));
    }
    try {
      await this.fetching;
    } catch (e) {
      if (!this.keys.size) throw e; // keep verifying with the keys we have while the certs endpoint is down or rate-limiting
    }
  }

  private async fetchKeys(): Promise<void> {
    const res = await fetch(this.certsUrl, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`certs endpoint ${res.status}`);
    const body = (await res.json()) as { keys: Jwk[] };
    const next = new Map<string, ReturnType<typeof createPublicKey>>();
    for (const k of body.keys ?? []) {
      try {
        next.set(k.kid, createPublicKey({ key: { kty: k.kty, n: k.n, e: k.e }, format: 'jwk' }));
      } catch {
        /* skip malformed */
      }
    }
    if (next.size) {
      this.keys = next;
      this.fetchedAt = Date.now();
    }
  }

  /** The identity behind a valid token; throws with a reason otherwise. */
  async verify(token: string): Promise<MkIdentity> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('malformed token');
    const header = JSON.parse(b64urlDecode(parts[0]).toString('utf8')) as { alg: string; kid: string };
    if (header.alg !== 'RS256') throw new Error(`unsupported alg ${header.alg}`);
    if (typeof header.kid !== 'string') throw new Error('unknown signing key');
    await this.loadKeys();
    let key = this.keys.get(header.kid);
    if (!key) {
      await this.loadKeys(true);
      key = this.keys.get(header.kid);
      if (!key) throw new Error('unknown signing key');
    }
    if (!cryptoVerify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), key, b64urlDecode(parts[2]))) throw new Error('bad signature');
    const claims = JSON.parse(b64urlDecode(parts[1]).toString('utf8')) as Record<string, unknown> & { exp?: number; nbf?: number; iss?: string; aud?: string | string[] };
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp < now - ACCESS_SKEW_S) throw new Error('token expired');
    if (typeof claims.nbf === 'number' && claims.nbf > now + ACCESS_SKEW_S) throw new Error('token not yet valid');
    if (claims.iss !== this.issuer) throw new Error('wrong issuer');
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!auds.includes(this.aud)) throw new Error('wrong audience');
    const identity = identityFromClaims('cloudflare-access', claims);
    if (!identity.email && typeof claims['common_name'] === 'string') identity.email = claims['common_name'];
    identity.emailVerified = !!identity.email; // Access only issues a token after its own login
    return identity;
  }
}

export function createAccessVerifier(opts: AccessOptions): AccessVerifier {
  return new AccessVerifier(opts);
}

/** The token Access sends: header first, then its cookie. */
export function accessTokenFrom(headers: Record<string, string | string[] | undefined>): string | undefined {
  const h = headers['cf-access-jwt-assertion'];
  if (typeof h === 'string' && h) return h;
  return cookieValue(headers.cookie, 'CF_Authorization');
}

/** Whether a request came through Cloudflare at all (a LAN address must not be trusted when it did). */
export function viaCloudflare(headers: Record<string, string | string[] | undefined>): boolean {
  return !!(headers['cf-ray'] || headers['cf-connecting-ip']);
}
