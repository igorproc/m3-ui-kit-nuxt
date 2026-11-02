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
  // The app's words; the picker warns in dev for any it was not given.
  prevLabel: { type: String, default: undefined },
  nextLabel: { type: String, default: undefined },
  switchToYearLabel: { type: String, default: undefined },
  switchToDayLabel: { type: String, default: undefined },
}

export type MDatePickerHeaderNavProps = ExtractPublicPropTypes<typeof mDatePickerHeaderNavProps>
