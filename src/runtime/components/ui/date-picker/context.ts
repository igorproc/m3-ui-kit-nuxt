import { createContext } from '#kit/shared/utils/context/createContext'

/**
 * Set by a host that draws the surface itself (`<MDialogDate>`): the picker
 * then drops its own container, so a dialog does not end up with a card
 * inside a card.
 */
export const [useDatePickerHosted, provideDatePickerHosted] = createContext<boolean>('m3:date-picker-hosted', false)
