# Changelog — @mk-kit/auth

## [0.2.1] — 2026-09-15

### Security

- **Open redirect after sign-in.** `safeNext()` accepted `/\t/evil.example`:
  browsers strip tabs and newlines from a `Location`, so the `next` of
  `/auth/login?next=%2F%09%2Fevil.example` sent the signed-in user to
  `https://evil.example`. `safeNext()` now refuses any value with a control
  character, whitespace or a backslash, requires a single leading `/`, and
  requires the value to resolve to the same origin when parsed as a URL;
  anything else falls back as before. Non-ASCII is returned percent-encoded
  and values over 2048 characters fall back. The callback checks `next`
  again, so a login cookie signed by 0.2.0 cannot carry an unsafe one.
- **Login cookie planted from a sibling host.** Over https the transient cookie
  is now `__Host-mk_oidc` on `Path=/`, so a response from another subdomain (or
  plain http on the same host) cannot set a signed cookie of its own and sign
  the visitor in to the attacker's account. A sign-in in progress while the app
  upgrades has to start again. Plain-http setups keep `mk_oidc`.
- **Cloudflare Access key refresh.** A token with a made-up `kid` refreshed the
  keys on every request, so anyone could make the app hammer the certs endpoint
  until Cloudflare rate-limited it, and a failed refresh then rejected every
  token. An unknown `kid` now refreshes at most once a minute, and the keys
  already held stay in use while the endpoint fails. Tokens without a `kid`,
  or with an `nbf` in the future (beyond 30 s of skew), are refused.
- **Empty signing secrets.** `signValue()` / `verifyValue()` signed and accepted
  values under an empty key, so an app whose secret came out empty (an empty
  secret file, an unset variable) accepted cookies anyone could sign — including
  a session cookie signed with the same helper. They, and `registerOidcRoutes()`,
  now throw on a secret shorter than 16 characters. **Breaking for a
  misconfigured app:** set a real secret (32 random bytes).
- A cookie with a malformed percent-escape (e.g. `CF_Authorization=%E0%A4%A`)
  made `accessTokenFrom()` and the callback throw; it now reads as absent.

## [0.2.0] — 2026-09-12

- `MkIdentity.idToken`: the raw ID token from the provider, set by `Oidc.callback()`. Keep it with the session.
- `Oidc.endSessionUrl(postLogoutRedirectUri?, idTokenHint?)`: pass that token back on logout and providers such as Pocket ID end the session and redirect straight away instead of showing a confirmation page.

## [0.1.0] — 2026-09-10

First release.

- `@mk-kit/auth`: `MkIdentity`, `identityFromClaims()`, `randomToken()`, `pkce()` (WebCrypto).
- `@mk-kit/auth/server`: `createOidc()` (discovery, authorization URL, code exchange with PKCE + nonce, userinfo merge, RP-initiated logout URL), `registerOidcRoutes()` for Fastify with a signed transient cookie, `signValue()` / `verifyValue()`, `safeNext()`, `createAccessVerifier()` / `AccessVerifier` for Cloudflare Access with `accessTokenFrom()` and `viaCloudflare()`.
- Tests run against an in-process OpenID provider (Fastify + jose).
