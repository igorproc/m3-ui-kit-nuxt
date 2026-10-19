/**
 * Public prop surface for `<MOtpInput>`.
 *
 * Deliberately **not** built on `mFieldProps`. A one-time code shares three
 * things with a text field — a label, an error and a name — and it already has
 * all three; what it would inherit besides is one prop it must pin
 * (`autocomplete`), one enum where three of four values are impossible
 * (`labelPlacement`), one type it would override (`variant`) and one whose
 * meaning differs (`placeholder` is a per-cell pattern here, not a hint).
 * The shape axis and the colour roles are shared with the field family through
 * the tokens, which is where a shared look belongs — not through a props
 * factory.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeReadonlyProps, makeStateProps } from '#kit/shared/utils/props'
import type { MTextFieldVariant } from '#kit/components/ui/text-field/props'

export type OtpInputMode = 'numeric' | 'alphanumeric'

/**
 * How a cell is drawn — the field family's `variant`, borrowed whole: each
 * shape states a cell's state with the property it owns. `outlined` moves its
 * edge, `filled` its tone, `underline` its rule.
 */
export type MOtpInputVariant = MTextFieldVariant

/**
 * When typed characters are hidden. `last` shows the newest character for a
 * moment so a typo can be caught; `always` hides each one as it lands. The
 * glyph is the `#mask` slot. Masking is visual only: the value stays in a text
 * input, so a screen reader still speaks it.
 */
export type MOtpInputMask = false | 'last' | 'always'

/**
 * Where the label sits. Only two placements are possible: a code has no single
 * container for a label to float into, so `float` and `inset` are meaningless
 * here. `hidden` keeps the accessible name and drops it from view.
 */
export type MOtpInputLabelPlacement = 'top' | 'hidden'

export const mOtpInputProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  length: { type: Number, default: 6 },
  mode: { type: String as PropType<OtpInputMode>, default: 'numeric' },
  groups: { type: Array as PropType<number[]>, default: () => [] },
  /** Glyph between groups. Empty by default — the gap already separates them. */
  separator: { type: String, default: '' },
  /** Cell drawing. `outlined` has no fill: a filled cell is `variant="filled"`. */
  variant: { type: String as PropType<MOtpInputVariant>, default: 'outlined' },
  /** Hide typed characters (`false` shows them); the glyph is the `#mask` slot. */
  mask: { type: [Boolean, String] as PropType<MOtpInputMask>, default: false },
  /**
   * A per-cell pattern drawn in empty cells: cell `i` shows `placeholder[i]`,
   * or the first character when the pattern is shorter. Never part of the
   * value, never announced.
   */
  placeholder: { type: String, default: undefined },
  /** Marks the code required: `required` on the input and a decorative `*` by the label. */
  required: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  /**
   * The accessible name. Has no default on purpose: the kit does not invent
   * user-facing copy in a language it cannot know. A field with neither this
   * nor a `#label` slot warns in dev — it would ship unnamed.
   */
  label: { type: String, default: undefined },
  labelPlacement: { type: String as PropType<MOtpInputLabelPlacement>, default: 'top' },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
  /** Validation-adapter path: binds the code and its errors, as on every field. */
  path: { type: String, default: undefined },
  name: { type: String, default: undefined },
}

export type MOtpInputProps = ExtractPublicPropTypes<typeof mOtpInputProps>
