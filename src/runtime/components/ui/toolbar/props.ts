/**
 * Public prop surface for `<MToolbar>`.
 *
 * Two axes, as in M3 Expressive: `type` is the container — `floating` (a pill
 * beside the content) or `docked` (across the bottom edge, the old bottom app
 * bar) — and `scheme` is the colour role, `standard` or `vibrant`. `scheme` is
 * not `variant`: the kit's `variant` is a surface treatment, while vibrant
 * swaps the colour role of the whole bar.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MIconName } from '#kit/components/ui/icon/props'

/** One action of the toolbar. Anything else goes through the `#item` slot. */
export interface MToolbarItem {
  id: string
  icon?: MIconName
  label?: string
  /** Name of an icon-only item; with a `label`, the label names it. */
  ariaLabel?: string
  disabled?: boolean
  /** Pressed state without a `v-model`: the consumer flips it on `select`. */
  selected?: boolean
}

export type MToolbarOrientation = 'horizontal' | 'vertical'
export type MToolbarType = 'floating' | 'docked'
export type MToolbarScheme = 'standard' | 'vibrant'

export const mToolbarProps = {
  items: { type: Array as PropType<MToolbarItem[]>, default: () => [] },
  /** `vertical` is a floating toolbar only: a docked one lies along the bottom edge. */
  orientation: { type: String as PropType<MToolbarOrientation>, default: 'horizontal' },
  type: { type: String as PropType<MToolbarType>, default: 'floating' },
  scheme: { type: String as PropType<MToolbarScheme>, default: 'standard' },
  multiple: { type: Boolean, default: false },
  /**
   * Items shown in the bar; the rest go into a "more" menu. Unset, every item
   * is shown and a row that does not fit scrolls. No measuring: the server's
   * first frame is already the final one.
   */
  maxVisible: { type: Number as PropType<number | undefined>, default: undefined },
  /** Name of the "more" button. The kit ships none: warns in dev when a menu needs it. */
  moreLabel: { type: String, default: undefined },
  /** Accessible name of the toolbar. The kit ships none: warns in dev when it is missing. */
  ariaLabel: { type: String, default: undefined },
}

export type MToolbarProps = ExtractPublicPropTypes<typeof mToolbarProps>

/** Payload of the `#item` slot. */
export interface MToolbarItemSlot {
  item: MToolbarItem
  index: number
  selected: boolean
  onSelect: () => void
}
