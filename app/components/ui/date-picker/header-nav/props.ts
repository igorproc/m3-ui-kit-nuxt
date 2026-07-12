/**
 * Public prop surface for the date-picker header/navigation leaf.
 *
 * Presentational props (no shared color/variant/state surface); resolved in a
 * co-located `props.ts` so `defineProps` consumes a plain imported object.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MDatePickerView = 'calendar' | 'year'

export const mDatePickerHeaderNavProps = {
  headlineLabel: { type: String, default: '' },
  selectedLabel: { type: String, default: '' },
  monthYearLabel: { type: String, default: '' },
  view: { type: String as PropType<MDatePickerView>, default: 'calendar' },
  placeholder: { type: Boolean, default: false },
  canGoPrev: { type: Boolean, default: true },
  canGoNext: { type: Boolean, default: true },
}

export type MDatePickerHeaderNavProps = ExtractPublicPropTypes<typeof mDatePickerHeaderNavProps>
