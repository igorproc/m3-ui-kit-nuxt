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
import type { ExtractPublicPropTypes, InputHTMLAttributes, PropType } from 'vue'
import { makeReadonlyProps, makeStateProps, makeVariantProps } from '#kit/shared/utils/props'

export type MTextFieldType = 'text' | 'number' | 'email' | 'password'
export type MTextFieldVariant = 'filled' | 'outlined' | 'plain'

export const mFieldProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  ...makeVariantProps({ variant: 'filled' }),
  // Field variant is its own 3-value axis (filled | outlined | plain), narrower
  // than the shared MVariant used by buttons — override the generic prop type.
  variant: { type: String as PropType<MTextFieldVariant>, default: 'filled' },
  path: { type: String, default: undefined },
  name: { type: String, default: undefined },
  label: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  helperText: { type: String, default: undefined },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  autocomplete: { type: String, default: undefined },
}

export const mTextFieldProps = {
  ...mFieldProps,
  type: { type: String as PropType<MTextFieldType>, default: 'text' },
  /** Native input attributes/listeners used by composite fields such as comboboxes. */
  inputAttrs: { type: Object as PropType<InputHTMLAttributes>, default: undefined },
  /**
   * Force the floating label into its raised position regardless of the text
   * value. Composite fields (e.g. a multiple combobox) set this while chips
   * occupy the field but the text draft is empty, so the label does not drop
   * back onto them on blur.
   */
  populated: { type: Boolean, default: false },
}

export type MTextFieldProps = ExtractPublicPropTypes<typeof mTextFieldProps>
