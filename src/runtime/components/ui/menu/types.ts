import type { PopoverPlacement } from '#kit/composables/popover/placement'
import type { MenuTriggerAttrs } from '#kit/composables/menu/useMenuControl'
import type { MVariant } from '#kit/shared/types/props'

/** Where `<MMenu>` opens against its anchor; `start` / `end` are logical. */
export type MMenuPlacement = PopoverPlacement

/** M3 Expressive colour: `elevated` is the standard menu, `tonal` the vibrant one. */
export type MMenuVariant = Extract<MVariant, 'elevated' | 'tonal'>

/** What the `#activator` slot binds on the element that opens the menu. */
export type MMenuActivatorProps = MenuTriggerAttrs

export interface MMenuActivatorScope {
  /** Bind on the trigger: id, `aria-haspopup`, `aria-expanded`, `aria-controls`, click and arrow keys. */
  props: MMenuActivatorProps
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}
