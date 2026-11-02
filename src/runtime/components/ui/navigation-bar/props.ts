/**
 * Public prop surface for `<MNavigationBar>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { NavigationDestination, NavigationItemPlacement } from '#kit/components/fragments/navigation-item/types'

/** A destination of the bar. */
export type MNavigationBarItem = NavigationDestination

/** `top`: icon above the label, destinations share the width (compact windows). `start`: icon beside the label, destinations centred (medium windows). */
export type MNavigationBarIconPlacement = NavigationItemPlacement

export const mNavigationBarProps = {
  items: { type: Array as PropType<MNavigationBarItem[]>, default: () => [] },
  /** Layout of every destination; the app picks it, for example by `useBreakpoint().is.compact`. */
  iconPlacement: { type: String as PropType<MNavigationBarIconPlacement>, default: 'top' },
  /** Name of the <nav> landmark. A lone navigation needs none, so the kit ships none. */
  ariaLabel: { type: String, default: undefined },
}

export type MNavigationBarProps = ExtractPublicPropTypes<typeof mNavigationBarProps>

export interface MNavigationBarEmits {
  /** Every activation of a destination, the already active one included. */
  (event: 'select', id: string, nativeEvent: MouseEvent): void
}
