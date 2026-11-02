/**
 * What `<MMenu>` gives the items and groups slotted into it: its control's
 * item bag, and a count of its groups — a menu made of groups draws no
 * surface of its own around them.
 */
import { createContext } from '#kit/shared/utils/context/createContext'
import { menuItemAttrs } from '#kit/composables/menu/useMenuControl'
import type { MenuItemAttrs, MenuItemState } from '#kit/composables/menu/useMenuControl'

export interface MenuContext {
  getItemAttrs: (item?: MenuItemState) => MenuItemAttrs
  /** Counts a group in; the returned function counts it out. */
  registerGroup: () => () => void
}

const STANDALONE: MenuContext = {
  getItemAttrs: menuItemAttrs,
  registerGroup: () => () => {},
}

export const [useMenuContext, provideMenuContext] = createContext<MenuContext>('m3:menu', STANDALONE)
