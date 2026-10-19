/**
 * Public prop surface for `<MTextField>`.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * `variant` is the field's surface-style (MD3 `filled | outlined`); `disabled`
 * is a plain prop (no writable model), and `readonly` comes from
 * `makeReadonlyProps`. A field has no `loading` of its own: a composite that
 * loads (the dropdown's options) declares it.
 */
import type { ExtractPublicPropTypes, InputHTMLAttributes, PropType, VNode } from 'vue'
import { makeReadonlyProps, makeVariantProps } from '#kit/shared/utils/props'
import type { MShape } from '#kit/shared/types/props'

/**
 * Native input type. There is no `number`: the model is a string, and the
 * browser's wheel and arrows would change it behind the field's back — a
 * number belongs to `<MNumberInput>`.
 */
export type MTextFieldType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search'
export type MTextFieldVariant = 'filled' | 'outlined' | 'underline'

/**
 * Corner of the field's container, a step of the kit's shape scale — the
 * canonical `shape` axis, narrowed to the steps a field box can carry.
 * `full` on a filled field is capped at `large`: a flat bottom under a full
 * top would dome a short box.
 */
export type MFieldShape = Extract<MShape, 'none' | 'extra-small' | 'medium' | 'large' | 'full'>

/**
 * Where the label sits. Independent of `variant`: the shape draws the boundary,
 * the placement decides where the name of the field lives.
 *
 * - `top` — above the container, permanently readable, never fights an icon.
 *   Costs a line of height, and is the safest default for a long form.
 * - `float` — on the container's top edge (in the outline's notch on
 *   `outlined`), from the first frame. Saves that line. It is a position, not a
 *   transition: a label that moves makes the resting state ambiguous and breaks
 *   autofill, so the placeholder stays visible beneath it.
 * - `inset` — inside the container above the value, always raised, on every
 *   shape. Label and value travel as one block, which reads well in a grid of
 *   many fields.
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
  /** Prevents interaction and applies the disabled visual state. */
  disabled: { type: Boolean, default: false },
  ...makeReadonlyProps(),
  ...makeVariantProps({ variant: 'filled' }),
  // Field variant is its own axis (filled | outlined | underline), narrower
  // than the shared MVariant used by buttons — override the generic prop type.
  variant: { type: String as PropType<MTextFieldVariant>, default: 'filled' },
  /** Corner of the container on the shape scale. Independent of `variant`. */
  shape: { type: String as PropType<MFieldShape>, default: 'extra-small' },
  /** Where the label sits, independent of `variant`. */
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

/**
 * The two elements a field exposes to a composite or a consumer through its
 * `ref`. A popover anchors to `control`, not to the component root: the root's
 * box also holds the label and the support line, so anchoring to it would drop
 * the surface below the helper text. Focus belongs to `input`.
 */
export interface MFieldParts<Input extends HTMLElement = HTMLInputElement> {
  control: HTMLElement | null
  input: Input | null
}

/** What the support line's slots receive. */
export interface MFieldMessageSlotProps {
  /** The error when the field is invalid, the helper text otherwise. */
  message: string | undefined
}

export interface MTextFieldSlots {
  /** Before the value, inside the box — usually a 24rem icon. */
  'prepend'?: () => VNode[]
  /** After the value, inside the box — an icon or an icon button. */
  'append'?: () => VNode[]
  /** Inline content before the value on its row — a composite's chips. */
  'leading-content'?: () => VNode[]
  /** Replaces the error text in the support line; the glyph is then the slot's. */
  'error'?: (props: MFieldMessageSlotProps) => VNode[]
  /** Replaces the helper text in the support line. */
  'helper'?: (props: MFieldMessageSlotProps) => VNode[]
}

export const mTextFieldProps = {
  ...mFieldProps,
  ...fieldDensityProp,
  type: { type: String as PropType<MTextFieldType>, default: 'text' },
  /** Native input attributes/listeners used by composite fields such as comboboxes. */
  inputAttrs: { type: Object as PropType<InputHTMLAttributes>, default: undefined },
  /** Text fixed before the value (`$`, `https://`). Shown and announced with the field, never part of the model. */
  prefix: { type: String, default: undefined },
  /** Text fixed after the value (`@gmail.com`, `kg`). Shown and announced with the field, never part of the model. */
  suffix: { type: String, default: undefined },
}

export type MTextFieldProps = ExtractPublicPropTypes<typeof mTextFieldProps>
