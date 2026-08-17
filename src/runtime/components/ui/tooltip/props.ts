/**
 * Public prop surface for `<MTooltip>`.
 */
import type { ExtractPublicPropTypes } from 'vue'

/** `<MTooltip>` props. */
export const mTooltipProps = {
  text: { type: String, default: '' },
}

export type MTooltipProps = ExtractPublicPropTypes<typeof mTooltipProps>
