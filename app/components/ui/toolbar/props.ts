/**
 * Public prop surface for `<MToolbar>`.
 *
 * The legacy `variant` (`standard | baseline`) describes the toolbar *style*
 * (floating vs. bottom-app-bar), not the MD3 surface taxonomy. Per the prop
 * unification spec it is renamed to `type` to free up `variant` for the shared
 * surface-style contract.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export interface MToolbarItem {
  id: string
  icon?: string
  label?: string
  selected?: boolean
  disabled?: boolean
  component?: unknown
  [key: string]: unknown
}

export type MToolbarLayout = 'horizontal' | 'vertical'
export type MToolbarType = 'standard' | 'baseline'

export const mToolbarProps = {
  items: { type: Array as PropType<MToolbarItem[]>, default: () => [] },
  layout: { type: String as PropType<MToolbarLayout>, default: 'horizontal' },
  type: { type: String as PropType<MToolbarType>, default: 'standard' },
  multiple: { type: Boolean, default: false },
}

export type MToolbarProps = ExtractPublicPropTypes<typeof mToolbarProps>
