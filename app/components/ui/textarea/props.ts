import type { ExtractPublicPropTypes, PropType } from 'vue'
import { mFieldProps } from '~/components/ui/text-field/props'

export type MTextareaResize = 'vertical' | 'horizontal' | 'both'
export type MTextareaWrap = 'soft' | 'hard' | 'off'

export const mTextareaProps = {
  ...mFieldProps,
  rows: { type: Number, default: 3 },
  maxRows: { type: Number, default: undefined },
  autoGrow: { type: Boolean, default: false },
  resize: { type: String as PropType<MTextareaResize>, default: undefined },
  maxlength: { type: Number, default: undefined },
  counter: { type: [Boolean, Number] as PropType<boolean | number>, default: false },
  spellcheck: { type: Boolean, default: undefined },
  wrap: { type: String as PropType<MTextareaWrap>, default: 'soft' },
}

export type MTextareaProps = ExtractPublicPropTypes<typeof mTextareaProps>
