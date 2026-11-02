/**
 * Contracts of the private navigation item shared by `<MNavigationBar>`,
 * `<MNavigationRail>` and `<MNavigationDrawer>`.
 */
import type { MIconName } from '#kit/components/ui/icon/props'

/** Fields every navigation destination shares — in the bar, the rail and the drawer. */
export interface NavigationDestination {
  id: string
  label: string
  icon: MIconName
  /**
   * Glyph of the active destination. Without it an `ic` outline icon turns to
   * its filled pair (`outline-home` → `baseline-home`); set it for a glyph that
   * has no such pair.
   */
  activeIcon?: MIconName
  /** Cannot be chosen; leaves the Tab order. */
  disabled?: boolean
  /** A count, or `true` for a dot. Drawn for the eye only: its meaning goes in `badgeLabel`. */
  badge?: number | true
  /** What the badge means ("3 unread"), read after the destination's name. */
  badgeLabel?: string
}

/** The component that hosts the item: each draws the pill by its own tokens. */
export type NavigationItemHost = 'bar' | 'rail' | 'drawer'

/** `top`: the icon in the pill, the label under it. `start`: icon and label side by side in the pill. */
export type NavigationItemPlacement = 'top' | 'start'

export interface NavigationItemProps {
  host: NavigationItemHost
  placement: NavigationItemPlacement
  label: string
  icon?: MIconName
  activeIcon?: MIconName
  active?: boolean
  disabled?: boolean
  /** On the icon in the bar and the rail; trailing text in the drawer. */
  badge?: number | string | true
  badgeLabel?: string
  /** Fades the label in when the placement changes (a rail toggled after it rendered). */
  fadeLabel?: boolean
}
