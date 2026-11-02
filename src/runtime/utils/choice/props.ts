/**
 * The field props of the selection family — `MCheckbox`, `MSwitch`, `MRadio`,
 * `MRadioGroup` — spread into each component's own `props.ts`, so the four
 * read validity and the support line the same way the field family does.
 */

export const mChoiceFieldProps = {
  /** Validation-adapter field path; also the native `name` when `name` is absent. */
  path: { type: String, default: undefined },
  /** The native `name` the control posts under; falls back to `path`. */
  name: { type: String, default: undefined },
  /** Text under the control; replaced by the error while there is one. */
  helperText: { type: String, default: undefined },
  /** Forces the error look on, with or without a message. */
  error: { type: Boolean, default: false },
  /** The error shown under the control; marks it invalid. */
  errorMessage: { type: String, default: undefined },
  /** Marks the label and the native control; the rule itself lives in the adapter. */
  required: { type: Boolean, default: false },
}

/** Slots that fill the support line; each receives the line's current text. */
export interface MChoiceSupportSlots {
  /** Replaces the helper text. */
  helper?: (scope: { message?: string }) => unknown
  /** Replaces the error text; the glyph is then the slot's own business. */
  error?: (scope: { message?: string }) => unknown
}
