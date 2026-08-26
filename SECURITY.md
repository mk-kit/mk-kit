# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Use GitHub's private vulnerability reporting for this repository
(**Security → Report a vulnerability**), or email the maintainer at
`kornas.mateusz@gmail.com` with "mk-kit security" in the subject.

Include the affected component or entry point, a minimal reproduction, and
the impact you see (for example: HTML injection through `mk-markdown` input,
a sanitizer bypass in `mk-rich-text`, an overlay that leaks focus). You will
get an acknowledgement within 3 business days.

## Scope

mk-kit is a client-side component library. The classes of issue we treat as
security-relevant:

- Rendering untrusted content unsafely (markdown, rich text, block editor,
  HTML bridges) — these components are designed to escape or drop unsafe
  input, and any bypass is a vulnerability.
- Sanitizer bypasses, `innerHTML` sinks, or `bypassSecurityTrust*` usage.
- Supply-chain issues in the published package (unexpected dependencies,
  build scripts, tampered artefacts).

Issues in your application code, in Angular itself, or in third-party
packages should go to their respective projects.

## Supported versions

Fixes are released for the current major and, for six months after a new
major, the previous one. Releases are published to npm from CI with
provenance attestations; verify with `npm audit signatures`.
