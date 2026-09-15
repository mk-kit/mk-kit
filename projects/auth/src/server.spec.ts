import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { SignJWT, exportJWK, generateKeyPair, type KeyLike } from 'jose';
import { createHash, createHmac } from 'node:crypto';
import { AccessVerifier, accessTokenFrom, createOidc, registerOidcRoutes, safeNext, signValue, verifyValue, type MkIdentity, type Oidc } from './server.js';
import { identityFromClaims, pkce } from './index.js';

function signValueUnchecked(secret: string, value: unknown): string {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
}

/** A tiny OpenID provider: discovery, authorize (auto-consent), token (PKCE-checked), userinfo, jwks. */
async function mockProvider() {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  const codes = new Map<string, { challenge: string; nonce: string; redirect: string }>();
  const jwks = { hits: 0, fail: false };
  const idp = Fastify();
  // the token endpoint receives application/x-www-form-urlencoded, which Fastify does not parse by default
  idp.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_req, body, done) => done(null, Object.fromEntries(new URLSearchParams(body as string))));
  let issuer = '';
  idp.get('/.well-known/openid-configuration', async () => ({
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    userinfo_endpoint: `${issuer}/userinfo`,
    jwks_uri: `${issuer}/jwks`,
    end_session_endpoint: `${issuer}/logout`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
  }));
  idp.get<{ Querystring: Record<string, string> }>('/authorize', async (req, reply) => {
    const q = req.query;
    const code = `code-${codes.size + 1}`;
    codes.set(code, { challenge: q.code_challenge, nonce: q.nonce, redirect: q.redirect_uri });
    return reply.redirect(`${q.redirect_uri}?code=${code}&state=${encodeURIComponent(q.state)}`);
  });
  idp.post<{ Body: Record<string, string> }>('/token', async (req, reply) => {
    const body = req.body;
    const c = codes.get(body.code);
    if (!c) return reply.code(400).send({ error: 'invalid_grant' });
    const digest = createHash('sha256').update(body.code_verifier).digest('base64url');
    if (digest !== c.challenge) return reply.code(400).send({ error: 'invalid_grant', error_description: 'pkce' });
    codes.delete(body.code);
    const idToken = await new SignJWT({ nonce: c.nonce, email: 'Anna@Example.com', email_verified: true, name: 'Anna Nowak', groups: ['family'] })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(issuer)
      .setAudience('mk-drive')
      .setSubject('user-1')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    return { access_token: 'at-1', token_type: 'Bearer', id_token: idToken, expires_in: 300 };
  });
  idp.get('/userinfo', async () => ({ sub: 'user-1', email: 'anna@example.com', picture: 'https://example.com/anna.png' }));
  idp.get('/jwks', async (_req, reply) => {
    jwks.hits++;
    return jwks.fail ? reply.code(429).send({}) : { keys: [jwk] };
  });
  await idp.listen({ port: 0, host: '127.0.0.1' });
  const addr = idp.server.address() as { port: number };
  issuer = `http://127.0.0.1:${addr.port}`;
  return { idp, issuer, privateKey: privateKey as KeyLike, jwk, jwks };
}

describe('OIDC end to end against an in-process provider', () => {
  let idp: FastifyInstance;
  let issuer: string;
  let client: Oidc;
  let app: FastifyInstance;
  const signedIn: MkIdentity[] = [];

  beforeAll(async () => {
    const p = await mockProvider();
    idp = p.idp;
    issuer = p.issuer;
    const oidc = await createOidc({ issuer, clientId: 'mk-drive', clientSecret: 's3cret', allowInsecure: true });
    client = oidc;
    app = Fastify();
    registerOidcRoutes(app, {
      oidc,
      cookieSecret: 'cookie-secret-for-tests',
      redirectUri: () => 'http://app.test/auth/callback',
      onSignedIn: async (identity, { reply, next }) => {
        signedIn.push(identity);
        reply.header('Set-Cookie', 'session=yes; Path=/');
        return reply.redirect(next, 303);
      },
    });
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
    await idp.close();
  });

  it('login redirects to the provider with PKCE, state and nonce, and sets the transient cookie', async () => {
    const res = await app.inject({ url: '/auth/login?next=/d/Docs' });
    expect(res.statusCode).toBe(302);
    const url = new URL(res.headers.location as string);
    expect(url.origin).toBe(issuer);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('redirect_uri')).toBe('http://app.test/auth/callback');
    expect(String(res.headers['set-cookie'])).toMatch(/^mk_oidc=.*Path=\/auth\/callback; HttpOnly; SameSite=Lax/);
  });

  it('callback exchanges the code, verifies nonce + PKCE, merges userinfo, and hands over a lower-cased identity', async () => {
    const login = await app.inject({ url: '/auth/login?next=/d/Docs' });
    const cookie = String(login.headers['set-cookie']).split(';')[0];
    // the browser follows the redirect to the provider, which sends it straight back with a code
    const idpRes = await fetch(login.headers.location as string, { redirect: 'manual' });
    const back = new URL(idpRes.headers.get('location')!);
    const cb = await app.inject({ url: back.pathname + back.search, headers: { cookie } });
    expect(cb.statusCode).toBe(303);
    expect(cb.headers.location).toBe('/d/Docs');
    expect(String(cb.headers['set-cookie'])).toContain('session=yes');
    const id = signedIn.at(-1)!;
    expect(id.email).toBe('anna@example.com');
    expect(id.emailVerified).toBe(true);
    expect(id.name).toBe('Anna Nowak');
    expect(id.subject).toBe('user-1');
    expect(id.groups).toEqual(['family']);
    expect(id.picture).toBe('https://example.com/anna.png');
    expect(id.issuer).toBe(issuer);
    expect(id.idToken).toMatch(/^eyJ/);
  });

  it('endSessionUrl carries the return address and, when given, the ID token as the hint', async () => {
    const plain = new URL(client.endSessionUrl('https://app.test/login')!);
    expect(plain.origin + plain.pathname).toBe(`${issuer}/logout`);
    expect(plain.searchParams.get('post_logout_redirect_uri')).toBe('https://app.test/login');
    expect(plain.searchParams.get('id_token_hint')).toBeNull();
    const hinted = new URL(client.endSessionUrl('https://app.test/login', 'eyJ.fake.token')!);
    expect(hinted.searchParams.get('id_token_hint')).toBe('eyJ.fake.token');
    expect(hinted.searchParams.get('post_logout_redirect_uri')).toBe('https://app.test/login');
  });

  it('drops a next that would leave the site after sign-in (encoded tab before a second slash)', async () => {
    const login = await app.inject({ url: '/auth/login?next=%2F%09%2Fevil.example%2Fx' });
    const cookie = String(login.headers['set-cookie']).split(';')[0];
    const back = new URL((await fetch(login.headers.location as string, { redirect: 'manual' })).headers.get('location')!);
    const cb = await app.inject({ url: back.pathname + back.search, headers: { cookie } });
    expect(cb.statusCode).toBe(303);
    expect(cb.headers.location).toBe('/');
  });

  it('checks next again at the callback, so a login cookie signed before an upgrade cannot carry an unsafe one', async () => {
    const login = await app.inject({ url: '/auth/login?next=/d/Docs' });
    const signed = decodeURIComponent(String(login.headers['set-cookie']).split(';')[0].slice('mk_oidc='.length));
    const transient = verifyValue<Record<string, unknown>>('cookie-secret-for-tests', signed)!;
    const cookie = `mk_oidc=${encodeURIComponent(signValue('cookie-secret-for-tests', { ...transient, next: '/\t/evil.example' }))}`;
    const back = new URL((await fetch(login.headers.location as string, { redirect: 'manual' })).headers.get('location')!);
    const cb = await app.inject({ url: back.pathname + back.search, headers: { cookie } });
    expect(cb.statusCode).toBe(303);
    expect(cb.headers.location).toBe('/');
  });

  it('refuses a callback without its cookie, with a wrong state, or with a replayed code', async () => {
    const login = await app.inject({ url: '/auth/login' });
    const cookie = String(login.headers['set-cookie']).split(';')[0];
    const back = new URL((await fetch(login.headers.location as string, { redirect: 'manual' })).headers.get('location')!);
    const noCookie = await app.inject({ url: back.pathname + back.search });
    expect(noCookie.statusCode).toBe(400);
    expect(noCookie.body).toMatch(/expired or was tampered/);
    back.searchParams.set('state', 'forged');
    const badState = await app.inject({ url: back.pathname + back.search, headers: { cookie } });
    expect(badState.statusCode).toBe(400);
    const other = await app.inject({ url: '/auth/login' });
    const otherCookie = String(other.headers['set-cookie']).split(';')[0];
    const otherBack = new URL((await fetch(other.headers.location as string, { redirect: 'manual' })).headers.get('location')!);
    expect((await app.inject({ url: otherBack.pathname + otherBack.search, headers: { cookie: otherCookie } })).statusCode).toBe(303);
    expect((await app.inject({ url: otherBack.pathname + otherBack.search, headers: { cookie: otherCookie } })).statusCode).toBe(400, 'the code was already used');
  });
});

describe('the login cookie over https', () => {
  let idp: FastifyInstance;
  let app: FastifyInstance;

  beforeAll(async () => {
    const p = await mockProvider();
    idp = p.idp;
    const oidc = await createOidc({ issuer: p.issuer, clientId: 'mk-drive', clientSecret: 's3cret', allowInsecure: true });
    app = Fastify();
    registerOidcRoutes(app, {
      oidc,
      cookieSecret: 'cookie-secret-for-tests',
      redirectUri: () => 'https://app.test/auth/callback',
      onSignedIn: async (_identity, { reply, next }) => reply.redirect(next, 303),
    });
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
    await idp.close();
  });

  it('is __Host- prefixed, Secure and on Path=/, so a sibling subdomain cannot plant one', async () => {
    const login = await app.inject({ url: '/auth/login?next=/d/Docs' });
    expect(String(login.headers['set-cookie'])).toMatch(/^__Host-mk_oidc=[^;]+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=600; Secure$/);
    const value = String(login.headers['set-cookie']).split(';')[0].slice('__Host-mk_oidc='.length);
    const back = new URL((await fetch(login.headers.location as string, { redirect: 'manual' })).headers.get('location')!);
    // the same signed value under the unprefixed name (what Domain=… from a sibling would set) is not read
    const planted = await app.inject({ url: back.pathname + back.search, headers: { cookie: `mk_oidc=${value}` } });
    expect(planted.statusCode).toBe(400);
    expect(String(planted.headers['set-cookie'])).toMatch(/^__Host-mk_oidc=; Path=\/;.*Max-Age=0; Secure$/);
    const cb = await app.inject({ url: back.pathname + back.search, headers: { cookie: `__Host-mk_oidc=${value}` } });
    expect(cb.statusCode).toBe(303);
    expect(cb.headers.location).toBe('/d/Docs');
  });
});

describe('helpers', () => {
  it('signValue / verifyValue round-trip, reject tampering and expiry', () => {
    const k = 'a-key-of-sixteen-plus';
    const s = signValue(k, { a: 1, exp: 2000 });
    expect(verifyValue(k, s, 1000)).toEqual({ a: 1, exp: 2000 });
    expect(verifyValue(k, s, 3000)).toBeNull();
    expect(verifyValue('another-key-of-sixteen', s, 1000)).toBeNull();
    expect(verifyValue(k, s.slice(0, -2) + 'xx', 1000)).toBeNull();
    expect(verifyValue(k, undefined)).toBeNull();
  });

  it('refuses an empty or short secret instead of signing with a guessable key', () => {
    // with an empty key anyone can compute the signature
    const forged = signValueUnchecked('', { user: 'admin' });
    expect(() => verifyValue('', forged)).toThrow(/at least 16/);
    expect(() => verifyValue('   \n', forged)).toThrow(/at least 16/);
    expect(() => signValue('short', { a: 1 })).toThrow(/at least 16/);
    const app = { get: () => undefined };
    expect(() => registerOidcRoutes(app, { oidc: {} as Oidc, cookieSecret: '', redirectUri: () => 'https://app.test/auth/callback', onSignedIn: async () => undefined })).toThrow(/at least 16/);
  });

  it('safeNext keeps same-origin paths only', () => {
    expect(safeNext('/d/Docs')).toBe('/d/Docs');
    expect(safeNext('/')).toBe('/');
    expect(safeNext('/d/Docs?view=grid#top')).toBe('/d/Docs?view=grid#top');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext(undefined, '/home')).toBe('/home');
  });

  it('safeNext refuses values a browser would turn into another origin', () => {
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext('/\\evil.example')).toBe('/');
    expect(safeNext('/\t/evil.example')).toBe('/'); // browsers strip the tab → //evil.example
    expect(safeNext('/\n/evil.example')).toBe('/');
    expect(safeNext('/\r/evil.example')).toBe('/');
    expect(safeNext('/\x00/evil.example')).toBe('/');
    expect(safeNext('/\x7f/evil.example')).toBe('/');
    expect(safeNext('/ /evil.example')).toBe('/');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext('https://evil.example', '/home')).toBe('/home');
    expect(safeNext('')).toBe('/');
    expect(safeNext(['/d/Docs'])).toBe('/');
    // `?next=/%09/evil.example` reaches the route decoded
    expect(safeNext(decodeURIComponent('/%09/evil.example'))).toBe('/');
    expect(safeNext('\\/\\/evil.example')).toBe('/');
    expect(safeNext('/\u00a0/evil.example')).toBe('/');
    expect(safeNext('/\u3000/evil.example')).toBe('/');
    expect(safeNext('/\u2028/evil.example')).toBe('/');
    expect(safeNext('/\ufeff/evil.example')).toBe('/');
    expect(safeNext('/' + 'a'.repeat(2048))).toBe('/');
    expect(safeNext('/\ud800')).toBe('/'); // a lone surrogate cannot be encoded
  });

  it('safeNext keeps encoded and dot-segment paths as same-origin paths', () => {
    // encoded slashes and backslashes stay inside the path; the browser does not decode them into a host
    expect(safeNext('/%2f%2fevil.example')).toBe('/%2f%2fevil.example');
    expect(safeNext('/%5c%5cevil.example')).toBe('/%5c%5cevil.example');
    // `/.//x` resolves to the path `//x` on this host; returned as given, never as `//x`
    expect(safeNext('/.//evil.example')).toBe('/.//evil.example');
    // non-ASCII is percent-encoded (a raw `ę` is refused in a Location header), lookalike slashes included
    expect(safeNext('/d/Zdjęcia')).toBe('/d/Zdj%C4%99cia');
    expect(safeNext('/\uff0f\uff0fevil.example')).toBe('/%EF%BC%8F%EF%BC%8Fevil.example');
    expect(safeNext('/\u2215evil.example')).toBe('/%E2%88%95evil.example');
    expect(safeNext('/' + 'a'.repeat(2047))).toHaveLength(2048);
  });

  it('a cookie with a malformed escape reads as absent instead of throwing', () => {
    expect(accessTokenFrom({ cookie: 'CF_Authorization=%E0%A4%A' })).toBeUndefined();
    expect(accessTokenFrom({ cookie: 'CF_Authorization=%zz; CF_Authorization=tok' })).toBe('tok');
  });

  it('pkce produces an S256 challenge of the verifier', async () => {
    const { verifier, challenge, method } = await pkce();
    expect(method).toBe('S256');
    expect(challenge).toBe(createHash('sha256').update(verifier).digest('base64url'));
  });

  it('identityFromClaims derives a name and lower-cases the email', () => {
    const id = identityFromClaims('x', { sub: '1', email: 'Bob@Example.com', given_name: 'Bob', family_name: 'Kowalski' });
    expect(id.email).toBe('bob@example.com');
    expect(id.name).toBe('Bob Kowalski');
    expect(id.emailVerified).toBe(false);
  });
});

describe('Cloudflare Access verifier', () => {
  let idp: FastifyInstance;
  let certsUrl: string;
  let privateKey: KeyLike;
  let jwks: { hits: number; fail: boolean };

  beforeAll(async () => {
    const p = await mockProvider();
    idp = p.idp;
    certsUrl = `${p.issuer}/jwks`;
    privateKey = p.privateKey;
    jwks = p.jwks;
  });
  afterAll(() => idp.close());
  afterEach(() => {
    vi.useRealTimers();
    jwks.fail = false;
  });

  const token = (over: Record<string, unknown> = {}, aud = 'aud-1') =>
    new SignJWT({ email: 'mako@example.com', ...over }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer('https://team.cloudflareaccess.com').setAudience(aud).setSubject('cf-1').setIssuedAt().setExpirationTime('5m').sign(privateKey);

  it('accepts a good token and maps it to an identity', async () => {
    const v = new AccessVerifier({ team: 'team', aud: 'aud-1', certsUrl });
    const id = await v.verify(await token());
    expect(id.issuer).toBe('cloudflare-access');
    expect(id.email).toBe('mako@example.com');
    expect(id.emailVerified).toBe(true);
  });

  it('rejects the wrong audience, a wrong signature and an expired token', async () => {
    const v = new AccessVerifier({ team: 'team.cloudflareaccess.com', aud: 'aud-1', certsUrl });
    await expect(v.verify(await token({}, 'other'))).rejects.toThrow(/audience/);
    const good = await token();
    await expect(v.verify(good.slice(0, -4) + 'AAAA')).rejects.toThrow(/signature/);
    const { privateKey: stranger } = await generateKeyPair('RS256');
    const forged = await new SignJWT({ email: 'x@y.z' }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer('https://team.cloudflareaccess.com').setAudience('aud-1').setExpirationTime('5m').sign(stranger);
    await expect(v.verify(forged)).rejects.toThrow(/signature/);
    const expired = await new SignJWT({ email: 'x@y.z' }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer('https://team.cloudflareaccess.com').setAudience('aud-1').setExpirationTime(Math.floor(Date.now() / 1000) - 120).sign(privateKey);
    await expect(v.verify(expired)).rejects.toThrow(/expired/);
  });

  it('rejects a token that is not valid yet, and one without a kid', async () => {
    const v = new AccessVerifier({ team: 'team', aud: 'aud-1', certsUrl });
    const now = Math.floor(Date.now() / 1000);
    await expect(v.verify(await token({ nbf: now + 600 }))).rejects.toThrow(/not yet valid/);
    expect((await v.verify(await token({ nbf: now + 10 }))).email).toBe('mako@example.com'); // within the skew
    const noKid = await new SignJWT({ email: 'mako@example.com' }).setProtectedHeader({ alg: 'RS256' }).setIssuer('https://team.cloudflareaccess.com').setAudience('aud-1').setExpirationTime('5m').sign(privateKey);
    await expect(v.verify(noKid)).rejects.toThrow(/unknown signing key/);
  });

  it('refreshes keys for an unknown kid at most once a minute', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const v = new AccessVerifier({ team: 'team', aud: 'aud-1', certsUrl });
    await v.verify(await token());
    const before = jwks.hits;
    const madeUp = (kid: string) => new SignJWT({ email: 'x@y.z' }).setProtectedHeader({ alg: 'RS256', kid }).setIssuer('https://team.cloudflareaccess.com').setAudience('aud-1').setExpirationTime('5m').sign(privateKey);
    vi.setSystemTime(Date.now() + 61_000);
    for (let i = 0; i < 20; i++) await expect(v.verify(await madeUp(`nope-${i}`))).rejects.toThrow(/unknown signing key/);
    expect(jwks.hits - before).toBe(1);
    vi.setSystemTime(Date.now() + 61_000);
    await expect(v.verify(await madeUp('nope-again'))).rejects.toThrow(/unknown signing key/);
    expect(jwks.hits - before).toBe(2);
  });

  it('keeps verifying with the keys it has while the certs endpoint fails', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const v = new AccessVerifier({ team: 'team', aud: 'aud-1', certsUrl, keysTtlMs: 1000 });
    await v.verify(await token());
    jwks.fail = true;
    vi.setSystemTime(Date.now() + 120_000); // keys are stale, the refresh gets a 429
    const hits = jwks.hits;
    expect((await v.verify(await token())).email).toBe('mako@example.com');
    expect((await v.verify(await token())).email).toBe('mako@example.com');
    expect(jwks.hits - hits).toBe(1); // and it does not retry on every request
    const fresh = new AccessVerifier({ team: 'team', aud: 'aud-1', certsUrl });
    await expect(fresh.verify(await token())).rejects.toThrow(/certs endpoint 429/);
  });
});
