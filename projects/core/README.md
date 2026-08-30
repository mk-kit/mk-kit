# @mk-kit/core

The framework-free engines under [`@mk-kit/ui`](https://mk-kit.dev) — pure
TypeScript, zero dependencies, usable from any framework (or none). `@mk-kit/ui`
depends on this package and re-exports every name unchanged, so Angular apps
keep importing from `@mk-kit/ui/*`; install `@mk-kit/core` directly when you
want the engines without the components.

```bash
npm install @mk-kit/core
```

## What's inside

| Module | Exports | What it does |
|---|---|---|
| Anchored positioning | `mkComputeAnchoredPosition`, `MkPlacement`, `MkAnchoredPositionOptions` | Viewport maths for `position: fixed` panels — 12 placements, flip on overflow, clamp, RTL-aware alignment. The engine under every mk-kit dropdown, menu, tooltip and popover. |
| Diff | `mkComputeDiff`, `mkDiffStats` | Line diff with optional per-word highlighting and whitespace-insensitive mode; add/remove/unchanged stats. |
| Markdown | `mkParseMarkdown`, `mkRenderMarkdown`, block/inline types | CommonMark-ish parser (headings, lists, tables, quotes, fenced code with highlighting, inline formatting) and safe HTML renderer. |
| Highlighting | `mkHighlight`, `mkHighlightJson`, `mkEscapeHtml` | Dependency-free JSON tokeniser emitting `<span class="mk-tok-…">` HTML; everything is escaped first. |
| ANSI | `mkParseAnsi`, `mkStripAnsi` | SGR escape-code parser for log output — styled spans in, or plain text out. |
| Dates | `formatDate`, `parseISODate`, `buildMonthMatrix`, `getISOWeek`, `addMonths`, … + `MkDateNames` | Dependency-free local-time calendar helpers; name-producing functions accept a localised `MkDateNames` table. |
| Query | `mkQueryToPredicate`, `mkQueryToText`, `mkQueryCompact`, rule/group types | Filter-rule trees → row predicates for client-side filtering, or human-readable sentences; localisable via `MkQueryTextStrings`. |
| Ids | `mkUniqueId` | Deterministic, SSR-safe id generation for `aria-*` wiring. |

```ts
import { mkComputeDiff, mkQueryToPredicate, mkRenderMarkdown } from '@mk-kit/core';

const rows = data.filter(mkQueryToPredicate(query, fields));
const html = mkRenderMarkdown('# Hello **world**');
```

- **Docs:** <https://mk-kit.dev> · **API:** <https://mk-kit.dev/api>
- **Issues:** <https://github.com/mk-kit/mk-kit/issues>
- MIT © Mateusz Kornaś
