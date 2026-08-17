/**
 * Public prop surface for `<MDatePicker>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical `propsFactory`-based pattern for the kit. The picker
 * exposes no shared color/variant/state surface, so only its own props live
 * here.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MDatePickerValue = Date | string | number

export const mDatePickerProps = {
  headline: { type: String, default: 'Select date' },
  minDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
  maxDate: { type: [Date, String, Number] as PropType<MDatePickerValue>, default: undefined },
}

export type MDatePickerProps = ExtractPublicPropTypes<typeof mDatePickerProps>
