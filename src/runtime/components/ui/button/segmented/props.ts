/**
 * Public prop surface for `<MButtonSegmented>` (a radio/checkbox-like group).
 *
 * Adds the shared MD3 `color` role (drives the *selected* segment scheme) and
 * the group-level `disabled` state, alongside the segmented-specific `items`,
 * `modelValue`, and `multiple` props. Single choice renders a radio group,
 * multiple choice a set of toggle buttons; name the group itself with
 * `aria-label` / `aria-labelledby`, which land on its root.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeStateProps } from '#kit/shared/utils/props'
import type { MIconName } from '#kit/components/ui/icon/props'

export interface MSegmentedItem {
  label?: string
  /** Accessible name for a segment that shows an icon and no label. */
  ariaLabel?: string
  icon?: MIconName
  value: string | number
  disabled?: boolean
}

export type MSegmentedModelValue = string | number | (string | number)[]

/** Segmented button group props — selected scheme defaults to `secondary`. */
export const mSegmentedProps = {
  ...makeColorProps({ color: 'secondary' }),
  ...makeStateProps(),
  /** Segments displayed by the single- or multi-select group. */
  items: { type: Array as PropType<MSegmentedItem[]>, default: () => [] },
  /** Currently selected segment value or values. */
  modelValue: { type: [String, Number, Array] as PropType<MSegmentedModelValue>, default: undefined },
  /** Enables selecting more than one segment. */
  multiple: { type: Boolean, default: false },
}

export type MSegmentedProps = ExtractPublicPropTypes<typeof mSegmentedProps>
