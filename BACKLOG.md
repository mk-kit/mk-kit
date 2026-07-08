# Backlog

Future work for `@mk-kit/ui`, deferred from the main line of development.

## Tooling

- **Adopt SCSS as the source preprocessor.** Migrate the component `.css`
  files and `styles/mk-kit.css` to `.scss` and introduce a small set of shared
  mixins/functions to cut the repetition that currently lives in plain CSS:
  - Tone → local-var mapping (the `--_main` / `--_subtle` / … blocks repeated
    across button, button-toggle, etc.) → a `@mixin mk-tone($name)`.
  - Size scales (`sm`/`md`/`lg` height/padding/font blocks) → a size mixin.
  - Focus-ring, reduced-motion, and `:host([hidden])` boilerplate → mixins.
  - The **theme token blocks** in `mk-kit.css` are duplicated across three
    selectors (light `:root`, the `prefers-color-scheme: dark` media query, and
    `[data-mk-theme='dark']`). A SCSS map + `@each` emitting the dark values
    into both dark selectors would remove that duplication (today a token must
    be edited in three places — e.g. the chart palette).
  - Keep the **public contract unchanged**: components must still be themed by
    `--mk-*` CSS custom properties at runtime (SCSS is build-time only; do not
    replace runtime custom properties with SCSS variables).
  - ng-packagr supports SCSS out of the box (`styleUrl: '*.scss'`); the built
    package still ships plain CSS, so consumers are unaffected.
  - Do this as a mechanical, no-visual-change migration with a screenshot diff
    pass to confirm parity in light and dark.
