/**
 * Public prop surface for `<MListSubheader>` — a passive list section label.
 *
 * It owns no item registry, selection, expansion, routing or list context, and
 * never collapses or groups items: it is visible structural text only.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MListSubheaderTag = 'div' | 'li' | 'p'

export const mListSubheaderProps = {
  /** Plain-text label; the default slot takes precedence. */
  title: { type: String, default: undefined },
  /**
   * Root tag. Absent, the enclosing list decides: inside a `<MList>` that
   * renders as `ul` the label is an `li`, anywhere else a `div`. An explicit
   * tag always wins.
   */
  tag: { type: String as PropType<MListSubheaderTag>, default: undefined },
  /** Pins the label to the block start of the local scroll container (CSS only). */
  sticky: { type: Boolean, default: false },
  /** Aligns the label with item headlines rather than their leading media. */
  inset: { type: Boolean, default: false },
}

export type MListSubheaderProps = ExtractPublicPropTypes<typeof mListSubheaderProps>

/** Slots of `<MListSubheader>`. */
export interface MListSubheaderSlots {
  /** The label; a heading placed here (`<h3>`) keeps heading navigation and takes the label's type. */
  default?: () => unknown
}
