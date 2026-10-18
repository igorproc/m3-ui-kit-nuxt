/**
 * Public prop surface for `<MFileInput>`.
 *
 * A member of the field family: the visible part is an `<MTextField>` that
 * summarises the chosen files, so every field axis — variant, shape, label
 * placement, density, `required`, validation by `path` — applies unchanged.
 * The value lives in one native `<input type="file">`.
 *
 * No phrase has a default: the kit ships no copy it cannot translate. The
 * browse button, the clear button and the reasons a file is refused all take
 * their words from the app.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { fieldDensityProp, mFieldProps } from '#kit/components/ui/text-field/props'
import type { FileRejectReason } from '#kit/shared/utils/file'

export type MFileInputCapture = boolean | 'user' | 'environment'

/** Why a file was refused, per reason — what the support line says about it. */
export type MFileRejectMessages = Partial<Record<FileRejectReason, string>>

export const mFileInputProps = {
  ...mFieldProps,
  ...fieldDensityProp,
  accept: { type: String, default: undefined },
  multiple: { type: Boolean, default: false },
  capture: { type: [Boolean, String] as PropType<MFileInputCapture>, default: undefined },
  maxFiles: { type: Number, default: undefined },
  maxSize: { type: Number, default: undefined },
  showSize: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  /**
   * Visible text of the browse button. Without it the button is an icon named
   * after the field's label, and dev warns.
   */
  browseLabel: { type: String, default: undefined },
  /** Accessible name of the clear button. */
  clearLabel: { type: String, default: undefined },
  /**
   * What the support line says when a file is refused, per reason (`type`,
   * `size`, `count`). The file's name leads the message; a reason without a
   * message still shows the error glyph.
   */
  rejectMessages: { type: Object as PropType<MFileRejectMessages>, default: undefined },
}

export type MFileInputProps = ExtractPublicPropTypes<typeof mFileInputProps>
