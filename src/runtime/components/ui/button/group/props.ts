/**
 * Public prop surface for `<MButtonGroup>` — M3 Expressive's connected button
 * group: buttons joined into one control that picks one value (a radio group)
 * or several (toggle buttons). The buttons are drawn from `items`; name the
 * group with `aria-label` / `aria-labelledby`, which land on its root.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps } from '#kit/shared/utils/props'
import type { MVariant } from '#kit/shared/types/props'
import type { SegmentedItem, SegmentedValue } from '#kit/composables/button/useSegmentedButton'
import type { MButtonDensity } from '../props'

/** One button of the group: the choice shared with `MSegmentedItem`. */
export type MButtonGroupItem = SegmentedItem

export type MButtonGroupModelValue = SegmentedValue

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
  /** Lets more than one button be selected. */
  multiple: { type: Boolean, default: false },
}

export type MButtonGroupProps = ExtractPublicPropTypes<typeof mButtonGroupProps>
