/**
 * Public prop surface for `<MNavigationDrawer>` — the modal drawer on top of the
 * shared modal layer.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mModalLayerProps } from '#kit/components/ui/overlay/props'
import type { MOverlayEmits } from '#kit/components/ui/overlay/props'
import type { NavigationDestination } from '#kit/components/fragments/navigation-item/types'
import type { MIconName } from '#kit/components/ui/icon/props'

/** A destination of the drawer. */
export interface MNavigationDrawerItem extends Omit<NavigationDestination, 'icon' | 'badge'> {
  icon?: MIconName
  /** Trailing text at the end of the row: a count or a short note. */
  badge?: string | number
  /**
   * Section heading. Consecutive destinations with the same section form a
   * group under that heading; a divider separates the groups.
   */
  section?: string
}

/** Edge the drawer is pinned to, in the reading direction: `start` is the right edge in RTL. */
export type MNavigationDrawerSide = 'start' | 'end'

export const mNavigationDrawerProps = {
  ...mModalLayerProps,
  side: { type: String as PropType<MNavigationDrawerSide>, default: 'start' },
  /** Destinations drawn as M3 drawer items, before the default slot. */
  items: { type: Array as PropType<MNavigationDrawerItem[]>, default: () => [] },
  /** Extra class on the drawer container (the overlay panel). */
  containerClass: { type: String, default: undefined },
}

export type MNavigationDrawerProps = ExtractPublicPropTypes<typeof mNavigationDrawerProps>

/** Payload of `#activator`: spread `props` on the trigger. */
export interface MNavigationDrawerActivatorSlot {
  isOpen: boolean
  open: () => unknown
  close: () => unknown
  toggle: () => unknown
  props: {
    'aria-haspopup'?: string
    'aria-expanded': boolean
    'aria-controls': string
    'onClick': () => void
  }
}

export interface MNavigationDrawerEmits extends MOverlayEmits {
  /** Every activation of a destination, the current one included. */
  (event: 'select', id: string, nativeEvent: MouseEvent): void
}

export interface MNavigationDrawerSlots {
  default?: () => unknown
  header?: () => unknown
  activator?: (props: MNavigationDrawerActivatorSlot) => unknown
}
