/**
 * Public prop surface for `<MColorPicker>`. Alpha capability is derived from the
 * active `format` (…a variants), not a boolean prop.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { ColorFormat, ColorSwatch } from '~~/shared/utils/color'

const ALL_FORMATS: ColorFormat[] = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla']

export const mColorPickerProps = {
  /** Selectable output formats. A single format hides the selector. */
  formats: { type: Array as PropType<ColorFormat[]>, default: () => ALL_FORMATS },
  /** Palette entries (string or `{ value, label }`). */
  swatches: { type: Array as PropType<ColorSwatch[]>, default: () => [] },
  disabled: { type: Boolean, default: false },
  hideCanvas: { type: Boolean, default: false },
  hideInputs: { type: Boolean, default: false },
  hidePreview: { type: Boolean, default: false },
  hideSwatches: { type: Boolean, default: false },
}

export type MColorPickerProps = ExtractPublicPropTypes<typeof mColorPickerProps>
