import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { Calendar } from '#kit/composables/date/createCalendar'

/** Props of the year list shown in place of the day grid. */
export const mDatePickerYearGridProps = {
  id: { type: String, required: true as const },
  years: { type: Array as PropType<number[]>, required: true as const },
  /** The year on screen — where the list opens and the tab stop rests. */
  shownYear: { type: Number, required: true as const },
  /** The chosen date's year, marked as selected. */
  selectedYear: { type: Number, default: undefined },
  /** This year, known on the client only. */
  currentYear: { type: Number, default: undefined },
  calendar: { type: Object as PropType<Calendar>, required: true as const },
  disabled: { type: Boolean, default: false },
  /** Names the list by the month on screen, like the day grid. */
  labelledBy: { type: String, default: undefined },
}

export type MDatePickerYearGridProps = ExtractPublicPropTypes<typeof mDatePickerYearGridProps>
