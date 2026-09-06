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

export type OtpInputMode = 'numeric' | 'alphanumeric'

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
  mask: { type: [Boolean, String] as PropType<boolean | string>, default: false },
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
  path: { type: String, default: undefined },
  name: { type: String, default: undefined },
}

export type MOtpInputProps = ExtractPublicPropTypes<typeof mOtpInputProps>
