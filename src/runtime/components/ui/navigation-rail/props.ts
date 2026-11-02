/**
 * Public prop surface for `<MNavigationRail>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NavigationDestination } from '#kit/components/fragments/navigation-item/types'

/** A destination of the rail. */
export type MNavigationRailItem = NavigationDestination

/**
 * `standard`: expands in place and pushes the content. `modal`: stays collapsed
 * in the grid and expands over the content, behind a scrim. `dismissible`: hidden
 * while collapsed, expands over the content.
 */
export type MNavigationRailMode = 'standard' | 'modal' | 'dismissible'

export const mNavigationRailProps = {
  items: { type: Array as PropType<MNavigationRailItem[]>, default: () => [] },
  mode: { type: String as PropType<MNavigationRailMode>, default: 'standard' },
  /** Name of the <nav> landmark. A lone navigation needs none, so the kit ships none. */
  ariaLabel: { type: String, default: undefined },
}

export type MNavigationRailProps = ExtractPublicPropTypes<typeof mNavigationRailProps>

export interface MNavigationRailEmits {
  /** Every activation of a destination, the already active one included. */
  (event: 'select', id: string, nativeEvent: MouseEvent): void
}

/** Bindings for the consumer's menu button in `#header`; spread them on it. */
export interface MNavigationRailToggleAttrs {
  'aria-expanded': boolean
  'aria-controls': string
  'onClick': () => void
}

export interface MNavigationRailSlots {
  /** Above the destinations: a menu button that takes `toggleAttrs`, a FAB, a logo. */
  header?: (props: { expanded: boolean, toggleAttrs: MNavigationRailToggleAttrs }) => unknown
}
