/**
 * Public prop surface for `<MAvatar>` — a passive identity surface.
 *
 * The avatar renders one fixed-aspect box containing an image, derived
 * initials, an icon or custom content. It carries no interaction, upload,
 * presence or badge semantics: consumers that need an action wrap it with the
 * appropriate button/link component.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MShape } from '#kit/shared/types/props'
import { makeSizeProps } from '#kit/shared/utils/props'

/** MD3 surface presets meaningful for an identity surface. */
export type MAvatarVariant = 'tonal' | 'filled' | 'outlined'

/** Corner shapes that keep an avatar readable as an identity surface. */
export type MAvatarShape = Extract<MShape, 'full' | 'large' | 'medium' | 'small'>

export const mAvatarProps = {
  ...makeSizeProps(),
  /** Image source. An empty or failing source enters the fallback pipeline. */
  src: { type: String, default: undefined },
  /**
   * Alternative text of the image. A non-empty string names the image; `''`
   * marks it decorative; omitting it lets `name` label the avatar root.
   */
  alt: { type: String, default: undefined },
  /** Display name used for derived initials and the accessible label. */
  name: { type: String, default: undefined },
  /** Explicit fallback icon, used when no initials can be derived. */
  icon: { type: String, default: undefined },
  /** MD3 corner shape. */
  shape: { type: String as PropType<MAvatarShape>, default: 'full' },
  /** MD3 surface preset. */
  variant: { type: String as PropType<MAvatarVariant>, default: 'tonal' },
}

export type MAvatarProps = ExtractPublicPropTypes<typeof mAvatarProps>

/** Payload of the `default` slot, which replaces all built-in rendering. */
export interface MAvatarDefaultSlot {
  size: string
  failed: boolean
}

/** Payload of the `fallback` slot, used for a missing or failed image. */
export interface MAvatarFallbackSlot {
  name: string | undefined
  initials: string
  icon: string
  error: Event | undefined
}
