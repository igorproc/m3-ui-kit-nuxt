/**
 * Public prop surface for `<MSystemBar>`.
 */
import type { ExtractPublicPropTypes } from 'vue'

export const mSystemBarProps = {
  sticky: { type: Boolean, default: true },
}

export type MSystemBarProps = ExtractPublicPropTypes<typeof mSystemBarProps>
