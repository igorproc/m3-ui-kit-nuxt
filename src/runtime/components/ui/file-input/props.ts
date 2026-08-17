import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mFieldProps } from '#kit/components/ui/text-field/props'

export type MFileInputCapture = boolean | 'user' | 'environment'

export const mFileInputProps = {
  ...mFieldProps,
  accept: { type: String, default: undefined },
  multiple: { type: Boolean, default: false },
  capture: { type: [Boolean, String] as PropType<MFileInputCapture>, default: undefined },
  maxFiles: { type: Number, default: undefined },
  maxSize: { type: Number, default: undefined },
  showSize: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
}

export type MFileInputProps = ExtractPublicPropTypes<typeof mFileInputProps>
