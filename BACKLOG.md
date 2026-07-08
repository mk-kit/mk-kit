# Backlog

Future work for `@mk-kit/ui`, deferred from the main line of development.

## Tooling

- **Adopt SCSS as the source preprocessor.** _(Started — infra + theme +
  reference component done; remaining component migrations pending.)_

  **Done so far:**
  - `styles/_mixins.scss` with `tone()` / `tone-selectors` / `focus-ring()`.
  - `styles/mk-kit.scss` is now the theme source: the dark tokens live in one
    `$mk-dark` map emitted into both dark selectors via `@each`, removing the
    3-place duplication. Compiled to `styles/mk-kit.css` by `npm run build:theme`
    (run automatically by `build:lib` and `start`). Verified token-identical to
    the previous hand-written CSS.
  - Button migrated to `button.scss` using the tone/focus-ring mixins
    (reference pattern), verified pixel-identical in light + dark.

  **Remaining:**
  - Migrate the other tone-aware components (`button-toggle`, `progress-ring`,
    `timeline`, `stepper` markers, chips/tags/badges…) to `@include mk.tone*`.
  - Add size-scale and `:host([hidden])` mixins and adopt them where the
    `sm/md/lg` height/padding/font blocks repeat.
  - Consider generating the **light** token block from a map too (currently
    literal — it only lives in one place, so lower priority).
  - The original plain-CSS notes below still describe the target end state:
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
