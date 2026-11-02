/**
 * Public prop surface for `<MSearchList>` — a group of results in the view of
 * `<MSearch>` ("Recent", "Deals"). With a title it is a named group the screen
 * reader announces; without one it only holds rows.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mSearchListProps = {
  /** The group's subheader, and its accessible name. */
  title: { type: String, default: undefined },
}

export type MSearchListProps = ExtractPublicPropTypes<typeof mSearchListProps>

export interface MSearchListSlots {
  /** The rows: `<MSearchListItem>`. */
  default?: () => unknown
  /** The subheader's content, in place of `title`. */
  title?: () => unknown
}
