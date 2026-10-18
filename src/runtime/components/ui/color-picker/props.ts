/**
 * Public prop surface for `<MColorPicker>`. Alpha capability is derived from the
 * active `format` (…a variants), not a boolean prop.
 *
 * Every phrase comes from `messages`, without a default: the kit ships no copy
 * it cannot translate. Channel letters (R, G, B, A, H, S, L) are notation, not
 * phrases, and stay.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { ColorFormat, ColorSwatch } from '#kit/shared/utils/color'

const ALL_FORMATS: ColorFormat[] = ['hex', 'hexa', 'rgb', 'rgba', 'hsl', 'hsla']

/** Accessible names of the picker's parts, and the hint an unreadable value gets. */
export interface MColorPickerMessages {
  /** The 2-D field's horizontal axis. */
  saturation?: string
  /** The 2-D field's vertical axis. */
  brightness?: string
  hue?: string
  alpha?: string
  /** The value field (hex) and its format selector. */
  value?: string
  format?: string
  /** The group of channel fields (R, G, B / H, S, L). */
  channels?: string
  swatches?: string
  /** Shown when a typed value cannot be read: which forms it takes ("#RRGGBB, rgb() or hsl()"). */
  formatHint?: string
}

export const mColorPickerProps = {
  /** Selectable output formats. A single format hides the selector. */
  formats: { type: Array as PropType<ColorFormat[]>, default: () => ALL_FORMATS },
  /** Palette entries (string or `{ value, label }`). */
  swatches: { type: Array as PropType<ColorSwatch[]>, default: () => [] },
  disabled: { type: Boolean, default: false },
  /** Shows and announces the color, takes no change: every part stays focusable. */
  readonly: { type: Boolean, default: false },
  hideCanvas: { type: Boolean, default: false },
  hideInputs: { type: Boolean, default: false },
  hidePreview: { type: Boolean, default: false },
  hideSwatches: { type: Boolean, default: false },
  /** Names the picker as a whole (a group of controls). */
  label: { type: String, default: undefined },
  messages: { type: Object as PropType<MColorPickerMessages>, default: () => ({}) },
}

export type MColorPickerProps = ExtractPublicPropTypes<typeof mColorPickerProps>
