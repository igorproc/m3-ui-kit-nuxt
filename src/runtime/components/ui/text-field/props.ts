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
export type MTextFieldVariant = 'filled' | 'outlined' | 'underline'
export type MTextFieldRounded = 'sharp' | 'small' | 'medium' | 'large' | 'pill'

/**
 * Where the label sits. Independent of `variant`: the shape draws the boundary,
 * the placement decides where the name of the field lives.
 *
 * - `top` — above the container, permanently readable, never fights an icon.
 *   Costs a line of height, and is the safest default for a long form.
 * - `float` — inside the container, resting on its top edge. Saves that line.
 *   It does not animate on focus: a label that moves makes the resting state
 *   ambiguous and breaks autofill.
 * - `inset` — inside the container above the value, always raised. Label and
 *   value travel as one block, which reads well in a grid of many fields.
 * - `hidden` — present for assistive tech only. For a control whose purpose is
 *   obvious and singular (a search box), never inside a form.
 *
 * The spec's two-column `inline` placement is deliberately absent: its value is
 * that every row's label column is the same width, and a single field has
 * nothing to align with. A fixed column picked per field just eats width and
 * squeezes the control. It belongs to a field group, and comes back with one.
 */
export type MFieldLabelPlacement = 'top' | 'float' | 'inset' | 'hidden'

/**
 * How tall the field is. Height and vertical padding only — type size, colour
 * and behaviour are the same in all three, so numbers stay on one line when
 * fields of different densities sit side by side.
 *
 * `compact` is floored so a hit target never drops under the 24px WCAG 2.5.8
 * minimum, which is why this is a choice and not something derived from the
 * space available: a 320px field is a thumb target in onboarding and a mouse
 * target in a settings sidebar, at the same width.
 *
 * Not part of {@link mFieldProps}: a textarea has no fixed height — it is
 * `rows` tall — so the axis would be a prop that changes almost nothing there.
 * The single-line fields declare it themselves.
 */
export type MFieldDensity = 'compact' | 'default' | 'comfortable'

/** Vertical scale, for the fields that actually have a height to scale. */
export const fieldDensityProp = {
  density: { type: String as PropType<MFieldDensity>, default: 'default' as MFieldDensity },
}

export const mFieldProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  ...makeVariantProps({ variant: 'filled' }),
  // Field variant is its own axis (filled | outlined | underline), narrower
  // than the shared MVariant used by buttons — override the generic prop type.
  variant: { type: String as PropType<MTextFieldVariant>, default: 'filled' },
  // Corner radius tier, pulled from the shape scale. Independent of `variant`.
  rounded: { type: String as PropType<MTextFieldRounded>, default: 'small' },
  // Label placement, independent of `variant`. `float` keeps the shipped look.
  labelPlacement: { type: String as PropType<MFieldLabelPlacement>, default: 'float' },
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
  ...fieldDensityProp,
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
