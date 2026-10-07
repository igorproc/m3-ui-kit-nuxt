/**
 * Public prop surface for `<MIcon>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { ICONS } from '#kit/shared/constants/icons'
import { propsFactory } from '#kit/shared/utils/props/propsFactory'

export type MIconKey = keyof typeof ICONS

export type MIconStyle = 'baseline' | 'outline' | 'round' | 'sharp' | 'twotone'

export type MIconName = MIconKey | (typeof ICONS)[MIconKey] | `${MIconStyle}-${string}` | `${string}:${string}`

export const makeMIconProps = propsFactory({
  /** Glyph: an `ICONS` key (`home`), a bare `ic` name (`round-close`) or a prefixed Iconify name (`mdi:account`). */
  name: { type: String as PropType<MIconName>, required: true as const },
  /** Draws the filled pair of an `ic` outline glyph (`outline-home` → `baseline-home`); other names are drawn as given. */
  filled: { type: Boolean, default: false },
  /** Accessible name: with it the icon is an image for assistive tech, without it the icon is decorative and hidden. */
  label: { type: String, default: undefined },
})

export const mIconProps = makeMIconProps()

export type MIconProps = ExtractPublicPropTypes<typeof mIconProps>
