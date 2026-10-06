/**
 * Public prop surface for `<MNavigationDrawer>` — the modal drawer on top of the
 * shared modal layer.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mModalLayerProps } from '#kit/components/ui/overlay/props'

export type MNavigationDrawerSide = 'left' | 'right'

export const mNavigationDrawerProps = {
  ...mModalLayerProps,
  side: { type: String as PropType<MNavigationDrawerSide>, default: 'left' },
  /** Extra class on the drawer container (the overlay panel). */
  containerClass: { type: String, default: undefined },
}

export type MNavigationDrawerProps = ExtractPublicPropTypes<typeof mNavigationDrawerProps>
