/**
 * Public prop surface for `<MRating>`.
 *
 * Only `disabled` comes from the shared state contract (a rating commits
 * instantly, so it has no `loading`); `readonly` from the input contract; the
 * field props (`path`, `label`, the support line) from the selection family.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MAccentColor } from '#kit/shared/types/props'
import type { MIconName } from '#kit/components/ui/icon/props'
import { ICONS } from '#kit/shared/constants/icons'
import { makeReadonlyProps, makeStateProps } from '#kit/shared/utils/props'
import { mChoiceFieldProps } from '#kit/utils/choice/props'
import type { MChoiceSupportSlots } from '#kit/utils/choice/props'

const { disabled } = makeStateProps()

export const mRatingProps = {
  disabled,
  ...makeReadonlyProps(),
  ...mChoiceFieldProps,
  /**
   * How many items. Each takes a 48 cell, so 10 need 480 + gaps: in a narrow
   * column give the scale room or fewer items (W26 — the cell does not shrink).
   */
  length: { type: Number, default: 5 },
  step: { type: Number, default: 1 },
  clearable: { type: Boolean, default: false },
  icon: { type: String as PropType<MIconName>, default: ICONS.ratingStar },
  emptyIcon: { type: String as PropType<MIconName>, default: ICONS.ratingStarEmpty },
  color: { type: String as PropType<MAccentColor>, default: 'primary' },
  /** Visible name above the items; names the slider (`aria-labelledby`). */
  label: { type: String, default: undefined },
  /** Accessible name without a visible label; the kit ships none. */
  ariaLabel: { type: String, default: undefined },
  /** Words the value for assistive tech (`aria-valuetext`), e.g. `(v, n) => `${v} из ${n}``. */
  valueText: { type: Function as PropType<(value: number, length: number) => string>, default: undefined },
}

export type MRatingProps = ExtractPublicPropTypes<typeof mRatingProps>

export interface MRatingSlots extends MChoiceSupportSlots {
  /** Replaces each item. */
  item?: (scope: { index: number, value: number, fill: number, active: boolean, preview: boolean, disabled: boolean }) => unknown
  /** The visible name; replaces `label`. */
  label?: () => unknown
}
