import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { SignJWT, exportJWK, generateKeyPair, type KeyLike } from 'jose';
import { createHash } from 'node:crypto';
import { AccessVerifier, createOidc, registerOidcRoutes, safeNext, signValue, verifyValue, type MkIdentity, type Oidc } from './server.js';
import { identityFromClaims, pkce } from './index.js';

/** A tiny OpenID provider: discovery, authorize (auto-consent), token (PKCE-checked), userinfo, jwks. */
async function mockProvider() {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  const codes = new Map<string, { challenge: string; nonce: string; redirect: string }>();
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
  idp.get('/jwks', async () => ({ keys: [jwk] }));
  await idp.listen({ port: 0, host: '127.0.0.1' });
  const addr = idp.server.address() as { port: number };
  issuer = `http://127.0.0.1:${addr.port}`;
  return { idp, issuer, privateKey: privateKey as KeyLike, jwk };
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
      cookieSecret: 'cookie-secret',
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

describe('helpers', () => {
  it('signValue / verifyValue round-trip, reject tampering and expiry', () => {
    const s = signValue('k', { a: 1, exp: 2000 });
    expect(verifyValue('k', s, 1000)).toEqual({ a: 1, exp: 2000 });
    expect(verifyValue('k', s, 3000)).toBeNull();
    expect(verifyValue('other', s, 1000)).toBeNull();
    expect(verifyValue('k', s.slice(0, -2) + 'xx', 1000)).toBeNull();
    expect(verifyValue('k', undefined)).toBeNull();
  });

  it('safeNext keeps same-origin paths only', () => {
    expect(safeNext('/d/Docs')).toBe('/d/Docs');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext(undefined, '/home')).toBe('/home');
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

  beforeAll(async () => {
    const p = await mockProvider();
    idp = p.idp;
    certsUrl = `${p.issuer}/jwks`;
    privateKey = p.privateKey;
  });
  afterAll(() => idp.close());

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
});
