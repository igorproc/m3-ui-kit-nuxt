/**
 * Public prop surface for `<MButtonSegmented>` (a radio/checkbox-like group).
 *
 * Adds the shared MD3 `color` role (drives the *selected* segment scheme) and
 * the group-level `disabled` state, alongside the segmented-specific `items`,
 * `modelValue`, and `multiple` props. Accessibility wiring is intentionally
 * out of scope here (separate phase) — only the public prop surface is unified.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps, makeStateProps } from '#shared/utils/props'

export interface MSegmentedItem {
  label?: string
  icon?: string
  value: string | number
  disabled?: boolean
}

export type MSegmentedModelValue = string | number | (string | number)[]

/** Segmented button group props — selected scheme defaults to `secondary`. */
export const mSegmentedProps = {
  ...makeColorProps({ color: 'secondary' }),
  ...makeStateProps(),
  items: { type: Array as PropType<MSegmentedItem[]>, default: () => [] },
  modelValue: { type: [String, Number, Array] as PropType<MSegmentedModelValue>, default: undefined },
  multiple: { type: Boolean, default: false },
}

export type MSegmentedProps = ExtractPublicPropTypes<typeof mSegmentedProps>
