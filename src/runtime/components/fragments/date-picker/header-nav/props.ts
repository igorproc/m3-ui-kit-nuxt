import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { DatePickerView } from '#kit/composables/date'

export type MDatePickerView = DatePickerView

/** Props of the month row: the month/year toggle and the month arrows. */
export const mDatePickerHeaderNavProps = {
  monthLabel: { type: String, required: true as const },
  /** Id of the month label, which also names the grid. */
  monthLabelId: { type: String, required: true as const },
  /** Id of the year list the toggle opens. */
  yearsId: { type: String, required: true as const },
  view: { type: String as PropType<MDatePickerView>, default: 'calendar' },
  canGoPrev: { type: Boolean, default: true },
  canGoNext: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  prevLabel: { type: String, required: true as const },
  nextLabel: { type: String, required: true as const },
  switchToYearLabel: { type: String, required: true as const },
  switchToDayLabel: { type: String, required: true as const },
}

export type MDatePickerHeaderNavProps = ExtractPublicPropTypes<typeof mDatePickerHeaderNavProps>
