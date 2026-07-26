/**
 * Public prop surface for `<MListSubheader>` — a passive list section label.
 *
 * It owns no item registry, selection, expansion, routing or list context, and
 * never collapses or groups items: it is visible structural text only.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

/**
 * Root tag. The neutral `div` default avoids assuming the parent markup;
 * `li` is available when the consumer's list needs a direct list child.
 */
export type MListSubheaderTag = 'div' | 'li' | 'p'

export const mListSubheaderProps = {
  /** Plain-text label; the default slot takes precedence. */
  title: { type: String, default: undefined },
  /** Root element tag. */
  tag: { type: String as PropType<MListSubheaderTag>, default: 'div' },
  /** Pins the label to the block start of the local scroll container (CSS only). */
  sticky: { type: Boolean, default: false },
  /** Aligns the label with item headlines rather than their leading media. */
  inset: { type: Boolean, default: false },
}

export type MListSubheaderProps = ExtractPublicPropTypes<typeof mListSubheaderProps>
