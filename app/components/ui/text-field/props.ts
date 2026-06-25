/**
 * Public prop surface for `<MTextField>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * `variant` is the field's surface-style (MD3 `filled | outlined`); `disabled`
 * is a single-source-of-truth prop via `makeStateProps` (no writable model),
 * and `readonly` comes from `makeReadonlyProps`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeReadonlyProps, makeStateProps, makeVariantProps } from '#shared/utils/props'

export type MTextFieldType = 'text' | 'number' | 'email' | 'password'
export type MTextFieldVariant = 'filled' | 'outlined'

export const mTextFieldProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  ...makeVariantProps({ variant: 'filled' }),
  path: { type: String, default: undefined },
  label: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  type: { type: String as PropType<MTextFieldType>, default: 'text' },
  helperText: { type: String, default: undefined },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
}

export type MTextFieldProps = ExtractPublicPropTypes<typeof mTextFieldProps>
