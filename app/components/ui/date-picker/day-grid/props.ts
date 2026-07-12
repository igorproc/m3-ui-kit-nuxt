/**
 * Public prop surface for the date-picker day grid leaf.
 *
 * Data-only props (no shared color/variant/state surface); resolved in a
 * co-located `props.ts` so `defineProps` consumes a plain imported object.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { DayCell } from '~/composables/date'

export const mDatePickerDayGridProps = {
  weekdays: { type: Array as PropType<string[]>, default: () => [] },
  days: { type: Array as PropType<DayCell[]>, default: () => [] },
}

export type MDatePickerDayGridProps = ExtractPublicPropTypes<typeof mDatePickerDayGridProps>
