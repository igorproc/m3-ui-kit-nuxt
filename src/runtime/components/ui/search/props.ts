/**
 * Public prop surface for `<MSearch>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * No phrase has a default: the kit ships no copy it cannot translate, so the
 * hint and the clear button's name come from the app.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mSearchProps = {
  /** No query can be typed or cleared; the bar recedes. */
  disabled: { type: Boolean, default: false },
  /** Hint shown in the empty bar. Not a name: a hint disappears as soon as there is a query. */
  placeholder: { type: String, default: undefined },
  /** Accessible name of the field. A search bar has no visible label, so it needs this (or `aria-labelledby`). */
  ariaLabel: { type: String, default: undefined },
  /** Accessible name of the clear button, shown once there is a query. */
  clearLabel: { type: String, default: undefined },
}

export type MSearchProps = ExtractPublicPropTypes<typeof mSearchProps>

export interface MSearchEmits {
  /** Enter in the field: the query to run. */
  (event: 'submit', query: string): void
  /** The clear button emptied the query. */
  (event: 'clear'): void
}
