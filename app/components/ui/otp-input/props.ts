import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeReadonlyProps, makeStateProps } from '~~/shared/utils/props'

export type OtpInputMode = 'numeric' | 'alphanumeric'

export const mOtpInputProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  length: { type: Number, default: 6 },
  mode: { type: String as PropType<OtpInputMode>, default: 'numeric' },
  groups: { type: Array as PropType<number[]>, default: () => [] },
  separator: { type: String, default: '–' },
  mask: { type: [Boolean, String] as PropType<boolean | string>, default: false },
  autofocus: { type: Boolean, default: false },
  label: { type: String, default: 'One-time code' },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
  path: { type: String, default: undefined },
  name: { type: String, default: undefined },
}

export type MOtpInputProps = ExtractPublicPropTypes<typeof mOtpInputProps>
