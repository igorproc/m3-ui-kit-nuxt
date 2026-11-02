/**
 * Public prop surface for `<MButtonSegmented>` (a radio/checkbox-like group).
 *
 * Adds the shared MD3 `color` role (drives the *selected* segment scheme) and
 * the group-level `disabled` state, alongside the segmented-specific `items`
 * and `multiple` props; the selection is `v-model`. Single choice renders a
 * radio group, multiple choice a set of toggle buttons; name the group itself
 * with `aria-label` / `aria-labelledby`, which land on its root.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeColorProps } from '#kit/shared/utils/props'
import type { SegmentedItem, SegmentedValue } from '#kit/composables/button/useSegmentedButton'

/** One segment: the choice shared with `MButtonGroupItem`. */
export type MSegmentedItem = SegmentedItem

export type MSegmentedModelValue = SegmentedValue

/** Segmented button group props — selected scheme defaults to `secondary`. */
export const mSegmentedProps = {
  ...makeColorProps({ color: 'secondary' }),
  /** Disables every segment. */
  disabled: { type: Boolean, default: false },
  /** Segments displayed by the single- or multi-select group. */
  items: { type: Array as PropType<MSegmentedItem[]>, default: () => [] },
  /** Enables selecting more than one segment. */
  multiple: { type: Boolean, default: false },
}

export type MSegmentedProps = ExtractPublicPropTypes<typeof mSegmentedProps>
