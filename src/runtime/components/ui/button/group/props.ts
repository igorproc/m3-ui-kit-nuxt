/**
 * Public prop surface for `<MButtonGroup>` — M3 Expressive's connected button
 * group: buttons joined into one control that picks one value (a radio group)
 * or several (toggle buttons). The buttons are drawn from `items`; name the
 * group with `aria-label` / `aria-labelledby`, which land on its root.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps } from '#kit/shared/utils/props'
import type { MVariant } from '#kit/shared/types/props'
import type { MButtonDensity } from '../props'

export interface MButtonGroupItem {
  value: string | number
  label?: string
  /** Leading icon; alone, the button is an icon button and needs `ariaLabel`. */
  icon?: string
  /** Accessible name for a button that shows an icon and no label. */
  ariaLabel?: string
  disabled?: boolean
}

export type MButtonGroupModelValue = string | number | (string | number)[]

/** Connected groups are built from toggle buttons, which M3 has in every variant but `text`. */
export type MButtonGroupVariant = Extract<MVariant, 'filled' | 'tonal' | 'elevated' | 'outlined'>

export const mButtonGroupProps = {
  ...makeColorProps(),
  variant: { type: String as PropType<MButtonGroupVariant>, default: 'filled' },
  /** Height, padding and icon step of every button. */
  density: { type: String as PropType<MButtonDensity>, default: 'default' },
  /** Disables the whole group. */
  disabled: { type: Boolean, default: false },
  /** Buttons of the group, in reading order. */
  items: { type: Array as PropType<MButtonGroupItem[]>, default: () => [] },
  /** Selected value, or values with `multiple`. */
  modelValue: { type: [String, Number, Array] as PropType<MButtonGroupModelValue>, default: undefined },
  /** Lets more than one button be selected. */
  multiple: { type: Boolean, default: false },
}

export type MButtonGroupProps = ExtractPublicPropTypes<typeof mButtonGroupProps>
