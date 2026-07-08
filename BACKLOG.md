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

  **Also done:**
  - **All** component styles migrated from `.css` to `.scss` (73 files) with
    their `styleUrl`s updated — a mechanical, no-visual-change pass.
  - Adopted `mk.tone-selectors` in the components whose `[data-tone]` blocks
    matched the shared pattern: `badge`, `tag`, `chip`, `button-toggle-group`
    (Button was the reference). Verified pixel-identical in the browser.

  **Also done:**
  - Adopted `mk.focus-ring()` across every component (48 focus blocks in 39
    files), passing the negative-offset variants (`calc(-1 * …)` /
    `calc(… * -1)`) as the mixin arg. Verified byte-identical compiled output.

  **Also done:**
  - Added a `mk.control-size($size, $padding)` mixin (height + padding +
    font-size triple) and adopted it in the control inputs whose size blocks
    matched exactly: `button`, `select`, `input`, `autocomplete` (8 blocks).
    Padding is a parameter (varies per component); size-scoped `border-radius`
    stays with the caller. Verified byte-identical compiled output.

  **Remaining (optional):**
  - The single-`--_main`-var controls (`radio`, `switch`, `slider`, `checkbox`)
    keep literal one-line `[data-tone]` blocks — a full 6-var `tone()` there
    would add inert vars; leave as-is or add a focused `tone-main()` mixin.
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
