/**
 * Public prop surface for `<MColorInput>` — a compact color field that shows a
 * swatch and opens the shared `MColorPicker` in a popover.
 *
 * A member of the field family: every field axis (variant, shape, label
 * placement, density, `required`, validation by `path`) applies unchanged.
 * Phrases have no defaults — the kit ships no copy it cannot translate.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { fieldDensityProp, mFieldProps } from '#kit/components/ui/text-field/props'
import type { MTextFieldVariant } from '#kit/components/ui/text-field/props'
import type { MColorPickerMessages } from '#kit/components/ui/color-picker/props'
import type { ColorFormat, ColorSwatch } from '#kit/shared/utils/color'

/** Output format, or `auto` to follow the family the user last committed. */
export type ColorInputFormat = ColorFormat | 'auto'

/** Field surface, narrowed from the family axis: the swatch sits inside a box. */
export type MColorInputVariant = Extract<MTextFieldVariant, 'filled' | 'outlined'>

const ALL_FORMATS: ColorFormat[] = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla']

// A colour value is never autocompleted (the field pins `autocomplete="off"`)
// and the field family has no loading state: props that would do nothing are
// left out rather than neutered.
const NEUTERED_KEYS = ['autocomplete', 'loading'] as const
type NeuteredKey = typeof NEUTERED_KEYS[number]
const fieldProps = Object.fromEntries(Object.entries(mFieldProps)
  .filter(([key]) => !NEUTERED_KEYS.includes(key as NeuteredKey))) as Omit<typeof mFieldProps, NeuteredKey>

export const mColorInputProps = {
  ...fieldProps,
  ...fieldDensityProp,
  variant: { type: String as PropType<MColorInputVariant>, default: 'filled' },
  format: { type: String as PropType<ColorInputFormat>, default: 'hex' },
  formats: { type: Array as PropType<ColorFormat[]>, default: () => ALL_FORMATS },
  /** `change` commits on Enter/blur; `input` commits every valid draft live. */
  commit: { type: String as PropType<'change' | 'input'>, default: 'change' },
  /** Whether the swatch opens the picker popover. */
  picker: { type: Boolean, default: true },
  swatches: { type: Array as PropType<ColorSwatch[]>, default: () => [] },
  clearable: { type: Boolean, default: false },
  /** Accessible name of the swatch button that opens the picker — and of the picker it opens. */
  pickerLabel: { type: String, default: undefined },
  /** Names of the picker's parts; see `MColorPicker`'s `messages`. */
  pickerMessages: { type: Object as PropType<MColorPickerMessages>, default: () => ({}) },
  /**
   * What the support line says when a typed value cannot be read — the forms
   * it takes ("#RRGGBB, rgb() or hsl()"). Without it the error shows its glyph.
   */
  formatHint: { type: String, default: undefined },
}

export type MColorInputProps = ExtractPublicPropTypes<typeof mColorInputProps>
