import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { DateGridAttrs, DateGridCell, DateGridCellAttrs } from '#kit/composables/date/useDateGridControl'

/** Props of the day grid: the weeks and the bags of `useDateGridControl`. */
export const mDatePickerDayGridProps = {
  weekdays: { type: Array as PropType<{ narrow: string, long: string }[]>, required: true as const },
  weeks: { type: Array as PropType<DateGridCell[][]>, required: true as const },
  gridAttrs: { type: Object as PropType<DateGridAttrs>, required: true as const },
  getCellAttrs: { type: Function as PropType<(cell: DateGridCell) => DateGridCellAttrs>, required: true as const },
}

export type MDatePickerDayGridProps = ExtractPublicPropTypes<typeof mDatePickerDayGridProps>
