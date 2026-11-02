/**
 * Public prop surface for `<MTooltip>`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MVariant } from '#kit/shared/types/props'
import type { PopoverPlacement } from '#kit/composables/popover/placement'

/**
 * `plain` is the inverse one-line label; `rich` a card with an optional
 * subhead and longer text. `rich` is not a member of `MVariant`: it is the M3
 * tooltip kind, a surface treatment no other component has. A rich tooltip
 * holds no actions — it stays a `role="tooltip"`.
 */
export type MTooltipVariant = Extract<MVariant, 'plain'> | 'rich'

/** `<MTooltip>` props. */
export const mTooltipProps = {
  text: { type: String, default: '' },
  variant: { type: String as PropType<MTooltipVariant>, default: 'plain' },
  /** Rich only: a title above the text. The `subhead` slot takes precedence. */
  subhead: { type: String, default: undefined },
  /** Side of the trigger it shows on; `start` / `end` follow the writing direction. */
  placement: { type: String as PropType<PopoverPlacement>, default: 'top' },
  /** Never shows while set. */
  disabled: { type: Boolean, default: false },
}

export type MTooltipProps = ExtractPublicPropTypes<typeof mTooltipProps>
