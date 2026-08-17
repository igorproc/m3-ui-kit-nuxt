import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MColor } from '#kit/shared/types/props'
import { makeReadonlyProps, makeStateProps } from '#kit/shared/utils/props'

export const mRatingProps = {
  ...makeStateProps(),
  ...makeReadonlyProps(),
  length: { type: Number, default: 5 },
  step: { type: Number, default: 1 },
  clearable: { type: Boolean, default: false },
  icon: { type: String, default: 'round-star' },
  emptyIcon: { type: String, default: 'round-star-outline' },
  color: { type: String as PropType<MColor>, default: 'primary' },
  name: { type: String, default: undefined },
  ariaLabel: { type: String, default: 'Rating' },
}

export type MRatingProps = ExtractPublicPropTypes<typeof mRatingProps>
