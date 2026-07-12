/**
 * Public prop surface for `<MNavigationDrawer>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MNavigationDrawerSide = 'left' | 'right'

export const mNavigationDrawerProps = {
  side: { type: String as PropType<MNavigationDrawerSide>, default: 'left' },
  clickToClose: { type: Boolean, default: true },
  escToClose: { type: Boolean, default: true },
  containerClass: { type: String, default: undefined },
}

export type MNavigationDrawerProps = ExtractPublicPropTypes<typeof mNavigationDrawerProps>
