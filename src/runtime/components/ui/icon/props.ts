/**
 * Public prop surface for `<MIcon>`.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mIconProps = {
  /** Iconify name. Names without a collection prefix resolve to the `ic` collection. */
  name: { type: String, required: true },
}

export type MIconProps = ExtractPublicPropTypes<typeof mIconProps>
