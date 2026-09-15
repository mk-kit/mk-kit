import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MkAlert } from '@mk-kit/ui';

const SERVER_OIDC = `import { createOidc, registerOidcRoutes } from '@mk-kit/auth/server';

const oidc = await createOidc({
  issuer: process.env.APP_OIDC_ISSUER,          // https://id.example.com
  clientId: process.env.APP_OIDC_CLIENT_ID,
  clientSecret: process.env.APP_OIDC_CLIENT_SECRET,
});

registerOidcRoutes(app, {
  oidc,
  cookieSecret: process.env.APP_COOKIE_SECRET,  // signs the ten-minute login cookie
  redirectUri: () => process.env.APP_PUBLIC_URL + '/auth/callback',  // not the Host header
  onSignedIn: async (identity, { reply, next }) => {
    // your rule: who is allowed in — an unverified email proves nothing
    const user = identity.emailVerified ? users.byEmail(identity.email) : undefined;
    if (!user) return reply.redirect('/login?reason=no-account', 303);
    reply.header('Set-Cookie', sessions.create(user));
    return reply.redirect(next, 303);
  },
});`;

const IDENTITY = `interface MkIdentity {
  issuer: string;          // who vouched
  subject: string;         // stable id at that issuer
  email: string;           // lower-cased
  emailVerified: boolean;
  name: string;            // name, or given + family, or username, or the email's local part
  picture?: string;
  groups?: string[];       // when the provider sends them
  claims: Record<string, unknown>;
}`;

const SERVER_ACCESS = `import { accessTokenFrom, createAccessVerifier, viaCloudflare } from '@mk-kit/auth/server';

const access = createAccessVerifier({ team: 'myteam', aud: process.env.APP_ACCESS_AUD });

app.addHook('onRequest', async (req, reply) => {
  const token = accessTokenFrom(req.headers);
  if (token) req.identity = await access.verify(token);      // throws with a reason
  else if (viaCloudflare(req.headers)) return reply.code(401).send();
});`;

const LOGIN_BUTTON = `@if (meta().sso; as sso) {
  <a mkButton fullWidth [href]="'/auth/login?next=' + encodeURIComponent(returnTo)">
    Sign in with {{ sso.name }}
  </a>
}`;

/**
 * Documentation page for `@mk-kit/auth`: OpenID Connect sign-in and Cloudflare
 * Access verification for the server side of a self-hosted app.
 */
@Component({
  selector: 'docs-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MkAlert],
  template: `
    <div class="docs-page docs-container">
      <h1>Sign-in</h1>
      <p class="docs-lead">
        <code class="docs-inline">&#64;mk-kit/auth</code> is the sign-in plumbing
        for self-hosted apps: OpenID Connect (authorization code with PKCE and a
        nonce) with ready-made Fastify routes, and verification of the token
        Cloudflare Access adds after its own login. It hands your server an
        <em>identity</em>; your app keeps its own users, sessions and
        permissions. Framework-free root, Fastify-shaped
        <code class="docs-inline">/server</code> entry, no Angular in it.
      </p>

      <pre class="auth-code"><code>npm install &#64;mk-kit/auth</code></pre>

      <h2>The shape</h2>
      <p>
        One identity provider, many apps. Each app is an OpenID Connect client of
        the provider and owns two routes: <code class="docs-inline">/auth/login</code>
        sends the browser to the provider, <code class="docs-inline">/auth/callback</code>
        gets the verified identity back and turns it into whatever session the app
        already uses. Signing in once at the provider (a passkey, say) signs you
        into every app without another prompt.
      </p>
      <ul>
        <li>
          The provider says <strong>who you are</strong>. The app decides
          <strong>whether that person may come in</strong> — a users table, an
          allow-list of emails, a group claim. Unknown identities are refused,
          never auto-created.
        </li>
        <li>
          Works with any provider that speaks OpenID Connect: Pocket ID, Authelia,
          Authentik, Keycloak, Google. Discovery, JWKS and PKCE come from
          <code class="docs-inline">openid-client</code>.
        </li>
        <li>
          Behind a Cloudflare Tunnel, Cloudflare Access can log in through the
          same provider, so the edge and the apps agree on one account.
        </li>
      </ul>

      <h2>Server: OpenID Connect</h2>
      <pre class="auth-code"><code>{{ serverOidc }}</code></pre>
      <p>
        <code class="docs-inline">GET /auth/login?next=/where</code> starts the
        flow; the callback verifies state, nonce and PKCE, exchanges the code,
        merges <code class="docs-inline">userinfo</code> and calls
        <code class="docs-inline">onSignedIn</code> with:
      </p>
      <pre class="auth-code"><code>{{ identity }}</code></pre>
      <p>
        The transient cookie is <code class="docs-inline">HttpOnly; SameSite=Lax</code>,
        <code class="docs-inline">__Host-</code> prefixed over https (so another
        subdomain cannot plant one), signed with
        <code class="docs-inline">cookieSecret</code> and expires after ten
        minutes. A same-origin <code class="docs-inline">next</code> path is kept;
        anything a browser could read as another host falls back to
        <code class="docs-inline">/</code>.
        <code class="docs-inline">onError</code> lets you send a failed attempt
        back to your sign-in page with a reason instead of the default plain-text 400.
      </p>

      <h2>Server: Cloudflare Access</h2>
      <pre class="auth-code"><code>{{ serverAccess }}</code></pre>
      <p>
        Keys are fetched from the team's <code class="docs-inline">certs</code>
        endpoint, cached for six hours and refreshed when an unknown
        <code class="docs-inline">kid</code> shows up, at most once a minute. The verifier returns the
        same <code class="docs-inline">MkIdentity</code> as the OIDC flow, so one
        code path maps either to a local user.
      </p>

      <h2>The sign-in button</h2>
      <p>
        The client needs nothing from the package: expose whether SSO is
        configured (and the provider's display name) in whatever metadata call
        the app already makes, and render a plain link.
      </p>
      <pre class="auth-code"><code>{{ loginButton }}</code></pre>

      <h2>Registering the app at the provider</h2>
      <ol>
        <li>Create an OpenID Connect client named after the app.</li>
        <li>
          Callback URL: <code class="docs-inline">https://&lt;app&gt;/auth/callback</code>
          — one per origin the app is reached on (a LAN address too, if any).
        </li>
        <li>Confidential client with one secret, PKCE on. Skip the consent screen for your own apps.</li>
        <li>
          Put issuer, client id and secret in the app's environment. The mk apps
          use <code class="docs-inline">&lt;APP&gt;_OIDC_ISSUER</code>,
          <code class="docs-inline">_CLIENT_ID</code>,
          <code class="docs-inline">_CLIENT_SECRET</code>,
          <code class="docs-inline">_NAME</code> (the button text) and, where
          there is no users table, <code class="docs-inline">_OIDC_EMAILS</code>
          as the allow-list.
        </li>
      </ol>
      <mk-alert tone="info">
        A random <code class="docs-inline">cookieSecret</code> per start is fine
        when it only signs the ten-minute login cookie. If you also sign your
        session cookie with it, keep it — an environment variable or a file in
        the data directory — or every restart signs everyone out.
      </mk-alert>

      <h2>What it deliberately does not do</h2>
      <p>
        Sessions, users, roles and permissions are the app's. So is the decision
        of what to do with an identity nobody knows. The package never creates
        accounts, never stores tokens and never talks to the provider except
        during a sign-in.
      </p>
      <p>
        Source and README:
        <a href="https://github.com/mk-kit/mk-kit/tree/main/projects/auth" target="_blank" rel="noopener">projects/auth</a>
        · the first app built on it: <a href="https://github.com/mkornas/mk-drive" target="_blank" rel="noopener">mk-drive</a>.
      </p>
    </div>
  `,
  styles: `
    .auth-code {
      margin: var(--mk-space-3) 0 var(--mk-space-5);
      padding: var(--mk-space-4) var(--mk-space-5);
      overflow: auto;
      background: var(--mk-code-bg);
      border: 1px solid var(--mk-border);
      border-radius: var(--mk-radius-md);
      font-family: var(--mk-font-mono);
      font-size: var(--mk-font-size-sm);
      line-height: var(--mk-line-height-normal);
    }
  `,
})
export class AuthPage {
  protected readonly serverOidc = SERVER_OIDC;
  protected readonly identity = IDENTITY;
  protected readonly serverAccess = SERVER_ACCESS;
  protected readonly loginButton = LOGIN_BUTTON;
}
