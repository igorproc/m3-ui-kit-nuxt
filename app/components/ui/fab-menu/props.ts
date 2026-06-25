/**
 * Public prop surface for `<MFabMenu>`.
 *
 * Composes the shared MD3 `color` role + `variant` (forwarded to the default
 * activator FAB) + `size` + `disabled`/`loading` state with the fab-menu's own
 * `items`, `align`, and icon props. The legacy `surface` color-enum is gone:
 * the low-emphasis activator is now `variant: 'tonal'`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeSizeProps, makeStateProps, makeVariantProps } from '~~/shared/utils/props'

export interface MFabMenuItem {
  label?: string
  icon?: string
  value?: string | number
  action?: () => void
}

export type MFabMenuAlign = 'left' | 'right'

export const mFabMenuProps = {
  ...makeColorProps(),
  ...makeVariantProps({ variant: 'filled' }),
  ...makeSizeProps(),
  ...makeStateProps(),
  items: { type: Array as PropType<MFabMenuItem[]>, default: () => [] },
  /** Edge the FAB and its items align to. @default 'right' */
  align: { type: String as PropType<MFabMenuAlign>, default: 'right' },
  openIcon: { type: String, default: 'asset:ui-test-plus' },
  closeIcon: { type: String, default: 'asset:ui-test-close' },
}

export type MFabMenuProps = ExtractPublicPropTypes<typeof mFabMenuProps>
