/**
 * Delegates to `@mk-kit/core` — the exported names and behaviour are
 * unchanged. `mkQueryOperatorLabel` / `mkQueryToText` accept the full
 * `MkI18nStrings` map as before: it is a structural superset of the
 * package's `MkQueryTextStrings`.
 */
export {
  MK_QUERY_OPERATORS,
  MK_QUERY_TEXT_EN,
  MK_QUERY_UNARY,
  mkCreateQueryGroup,
  mkCreateQueryRule,
  mkIsQueryGroup,
  mkQueryCompact,
  mkQueryIsEmpty,
  mkQueryOperatorLabel,
  mkQueryOperatorsFor,
  mkQueryRuleCount,
  mkQueryRuleIsComplete,
  mkQueryRuleMatches,
  mkQueryToPredicate,
  mkQueryToText,
  type MkQueryTextStrings,
} from '@mk-kit/core';
