# @mk-kit/auth

**Sign-in plumbing for self-hosted apps.** OpenID Connect (authorization code
with PKCE and nonce) with ready-made Fastify routes, and verification of the
JWT Cloudflare Access adds after its own login. The package hands your app an
*identity*; your app keeps its own users, sessions and permissions.

```bash
npm install @mk-kit/auth
```

Works with any OpenID provider — Pocket ID, Authelia, Authentik, Keycloak,
Google — because it is plain OIDC on [`openid-client`](https://github.com/panva/openid-client).

## Server: OIDC in ten lines

```ts
import { createOidc, registerOidcRoutes } from '@mk-kit/auth/server';

const oidc = await createOidc({ issuer: 'https://id.example.com', clientId: 'my-app', clientSecret: process.env.OIDC_SECRET });

registerOidcRoutes(app, {
  oidc,
  cookieSecret: process.env.COOKIE_SECRET!,          // signs the transient state/nonce/verifier cookie
  redirectUri: (req) => `${origin(req)}/auth/callback`, // must be registered at the provider
  onSignedIn: async (identity, { reply, next }) => {
    const user = users.byEmail(identity.email);       // your rule: who is allowed in
    if (!user) return reply.code(403).send('no account for ' + identity.email);
    reply.header('Set-Cookie', sessions.create(user)); // your session
    return reply.redirect(next, 303);
  },
});
```

`GET /auth/login?next=/where` sends the browser to the provider; `GET /auth/callback`
verifies state, nonce and PKCE, exchanges the code, merges `userinfo`, and calls
`onSignedIn` with:

```ts
interface MkIdentity {
  issuer: string;          // who vouched
  subject: string;         // stable id at that issuer
  email: string;           // lower-cased
  emailVerified: boolean;
  name: string;            // name, or given + family, or username, or the email's local part
  picture?: string;
  groups?: string[];       // when the provider sends them
  claims: Record<string, unknown>;
}
```

The transient cookie is `HttpOnly; SameSite=Lax; Path=<callback>`, signed with
`cookieSecret`, and expires after ten minutes. A same-origin `next` is kept;
anything else falls back to `/`.

## Server: Cloudflare Access

```ts
import { accessTokenFrom, createAccessVerifier, viaCloudflare } from '@mk-kit/auth/server';

const access = createAccessVerifier({ team: 'myteam', aud: process.env.ACCESS_AUD! });

app.addHook('onRequest', async (req, reply) => {
  const token = accessTokenFrom(req.headers);
  if (token) req.identity = await access.verify(token);          // throws with a reason
  else if (viaCloudflare(req.headers)) return reply.code(401).send();
});
```

Keys are fetched from the team's `certs` endpoint, cached for six hours, and
refreshed at once when an unknown `kid` shows up (rotation).

## Framework-free root

`@mk-kit/auth` exports the `MkIdentity` type, `identityFromClaims()`,
`randomToken()` and `pkce()` on WebCrypto — usable in a browser or a worker.

## What it deliberately does not do

Sessions, users, roles and permissions are the app's. So is the decision what
to do with an unknown email — refuse it (the default in every mk-kit app), or
create an account.
