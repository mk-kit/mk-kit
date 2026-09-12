# Changelog — @mk-kit/auth

## [0.2.0] — 2026-09-12

- `MkIdentity.idToken`: the raw ID token from the provider, set by `Oidc.callback()`. Keep it with the session.
- `Oidc.endSessionUrl(postLogoutRedirectUri?, idTokenHint?)`: pass that token back on logout and providers such as Pocket ID end the session and redirect straight away instead of showing a confirmation page.

## [0.1.0] — 2026-09-10

First release.

- `@mk-kit/auth`: `MkIdentity`, `identityFromClaims()`, `randomToken()`, `pkce()` (WebCrypto).
- `@mk-kit/auth/server`: `createOidc()` (discovery, authorization URL, code exchange with PKCE + nonce, userinfo merge, RP-initiated logout URL), `registerOidcRoutes()` for Fastify with a signed transient cookie, `signValue()` / `verifyValue()`, `safeNext()`, `createAccessVerifier()` / `AccessVerifier` for Cloudflare Access with `accessTokenFrom()` and `viaCloudflare()`.
- Tests run against an in-process OpenID provider (Fastify + jose).
