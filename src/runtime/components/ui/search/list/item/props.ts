/**
 * Public prop surface for `<MSearchListItem>` — one result in the view of
 * `<MSearch>`. The row is an `<MListItem>`, so it reads like a row of
 * `<MDropdown>`; the search's engine makes it an option.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mSearchListItemProps = {
  /** Handed to the search's `select` when the row is chosen. Defaults to `title`. */
  value: { type: null, default: undefined },
  /** What a chosen row writes into the query. Defaults to `headline`. */
  title: { type: String, default: undefined },
  headline: { type: String, default: '' },
  supportingText: { type: String, default: '' },
  /** Shown, but neither the pointer nor the keyboard can choose it. */
  disabled: { type: Boolean, default: false },
  /**
   * The row can be taken out of the list (a recent query): a removal mark for
   * the pointer and Delete for the keyboard both emit `remove`. The app removes it.
   */
  removable: { type: Boolean, default: false },
}

export type MSearchListItemProps = ExtractPublicPropTypes<typeof mSearchListItemProps>

export interface MSearchListItemEmits {
  /** The removal mark was pressed, or Delete with the row active. */
  (event: 'remove'): void
}

export interface MSearchListItemSlots {
  leading?: () => unknown
  headline?: () => unknown
  supporting?: () => unknown
  /** After the text, before the removal mark: a count, a shortcut. */
  trailing?: () => unknown
  /** Between the headline and the supporting text. */
  default?: () => unknown
}
