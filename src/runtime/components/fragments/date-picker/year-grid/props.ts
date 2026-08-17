/**
 * Public prop surface for the date-picker year grid leaf.
 *
 * Data-only props (no shared color/variant/state surface); resolved in a
 * co-located `props.ts` so `defineProps` consumes a plain imported object.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export const mDatePickerYearGridProps = {
  years: { type: Array as PropType<number[]>, default: () => [] },
  selectedYear: { type: Number, default: 0 },
  currentYear: { type: Number, default: 0 },
}

export type MDatePickerYearGridProps = ExtractPublicPropTypes<typeof mDatePickerYearGridProps>
