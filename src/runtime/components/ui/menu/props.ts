/**
 * Public prop surface for `<MMenu>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { UiMenuOrigin } from './types'

export const mMenuProps = {
  closeOnBackdrop: { type: Boolean, default: true },
  absolute: { type: Boolean, default: false },
  origin: { type: String as PropType<UiMenuOrigin>, default: 'top left' },
  matchWidth: { type: Boolean, default: false },
}

export type MMenuProps = ExtractPublicPropTypes<typeof mMenuProps>
