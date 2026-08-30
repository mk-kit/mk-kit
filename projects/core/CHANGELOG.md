# Changelog

All notable changes to **`@mk-kit/core`**. The format follows
[Keep a Changelog](https://keepachangelog.com/); versions are published to npm
when `projects/core/package.json` changes on `main` (tag `core-v<version>`).

## [0.1.0] — 2026-08-30

First release — the framework-free engines extracted from `@mk-kit/ui`
(which now depends on this package and re-exports every name unchanged):

- **Anchored positioning** — `mkComputeAnchoredPosition` with `MkPlacement`
  (12 placements), flip-on-overflow, viewport clamping and RTL-aware
  alignment.
- **Diff** — `mkComputeDiff` (line diff, optional per-word highlighting,
  whitespace-insensitive mode) and `mkDiffStats`.
- **Markdown** — `mkParseMarkdown` / `mkRenderMarkdown` with typed block and
  inline models; fenced code runs through the highlighter.
- **Highlighting** — `mkHighlight`, `mkHighlightJson`, `mkEscapeHtml`.
- **ANSI** — `mkParseAnsi` / `mkStripAnsi` for SGR escape codes.
- **Dates** — the calendar helpers (`formatDate`, `parseISODate`,
  `buildMonthMatrix`, `getISOWeek`, `startOfWeek`, `addMonths`, …) and the
  `MkDateNames` localisation table they accept.
- **Query engine** — rule/group tree types, `mkQueryToPredicate`,
  `mkQueryToText` (localisable via the new `MkQueryTextStrings` /
  `MK_QUERY_TEXT_EN`), `mkQueryCompact`, completeness/count helpers.
- **Ids** — `mkUniqueId`.
