import { createContext } from '#kit/shared/utils/context/createContext'

/**
 * Set by a host that draws the surface itself (`<MColorInput>`'s popover): the
 * picker then drops its own fill, corner and shadow, so the popover does not
 * end up with a card inside a card.
 */
export const [useColorPickerHosted, provideColorPickerHosted] = createContext<boolean>('m3:color-picker-hosted', false)
