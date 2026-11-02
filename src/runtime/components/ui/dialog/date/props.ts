/**
 * Public prop surface for `<MDialogDate>` — `<MDatePicker>` in a modal dialog
 * with Cancel and OK. Every prop of the picker reaches it, except the ones that
 * make it a form control (helper, error, `required`, `name`): in a dialog the
 * field that opened it is the form control.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mModalLayerProps } from '#kit/components/ui/overlay/props'
import { mDatePickerProps } from '#kit/components/ui/date-picker/props'
import type { MDatePickerMode } from '#kit/components/ui/date-picker/props'

const FORM_KEYS = ['helperText', 'error', 'errorMessage', 'required', 'name'] as const
type FormKey = typeof FORM_KEYS[number]

const pickerProps = Object.fromEntries(Object.entries(mDatePickerProps)
  .filter(([key]) => !FORM_KEYS.includes(key as FormKey))) as Omit<typeof mDatePickerProps, FormKey>

/** The props `<MDialogDate>` hands to its picker unchanged. */
export const DIALOG_PICKER_KEYS = Object.keys(pickerProps) as Array<keyof typeof pickerProps>

export const mDialogDateProps = {
  ...pickerProps,
  /** How the picker opens, every time it opens, unless `v-model:mode` holds the mode. */
  initialMode: { type: String as PropType<MDatePickerMode>, default: 'picker' },
  /** The mode on screen; bind it to keep the mode between openings. */
  mode: { type: String as PropType<MDatePickerMode>, default: undefined },
  /** Text of the action that drops the draft. No default: the kit ships no copy. */
  cancelLabel: { type: String, default: undefined },
  /** Text of the action that commits the draft. No default: the kit ships no copy. */
  confirmLabel: { type: String, default: undefined },
  ...mModalLayerProps,
}

export type MDialogDateProps = ExtractPublicPropTypes<typeof mDialogDateProps>
