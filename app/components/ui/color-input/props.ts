/**
 * Public prop surface for `<MColorInput>` — a compact color field that shows a
 * swatch and opens the shared `MColorPicker` in a popover.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { ColorFormat, ColorSwatch } from '~~/shared/utils/color'

/** Output format, or `auto` to follow the family the user last committed. */
export type ColorInputFormat = ColorFormat | 'auto'

const ALL_FORMATS: ColorFormat[] = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla']

export const mColorInputProps = {
  format: { type: String as PropType<ColorInputFormat>, default: 'hex' },
  formats: { type: Array as PropType<ColorFormat[]>, default: () => ALL_FORMATS },
  /** `change` commits on Enter/blur; `input` commits every valid draft live. */
  commit: { type: String as PropType<'change' | 'input'>, default: 'change' },
  /** Whether the swatch opens the picker popover. */
  picker: { type: Boolean, default: true },
  swatches: { type: Array as PropType<ColorSwatch[]>, default: () => [] },
  clearable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  label: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  helperText: { type: String, default: undefined },
  variant: { type: String as PropType<'filled' | 'outlined'>, default: 'filled' },
  path: { type: String, default: undefined },
  name: { type: String, default: undefined },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: undefined },
}

export type MColorInputProps = ExtractPublicPropTypes<typeof mColorInputProps>
