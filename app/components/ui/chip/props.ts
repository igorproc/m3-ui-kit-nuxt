/**
 * Public prop surface for `<MChip>`.
 *
 * `type` is the MD3 chip taxonomy (assist | filter | input | suggestion) — NOT
 * a surface `variant`. Chips have no async action, so only `disabled` (not
 * `loading`) is taken from the shared state contract.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '~~/shared/utils/props'

export type MChipType = 'assist' | 'filter' | 'input' | 'suggestion'

const { disabled } = makeStateProps()

export const mChipProps = {
  disabled,
  type: { type: String as PropType<MChipType>, default: 'assist' },
}

export type MChipProps = ExtractPublicPropTypes<typeof mChipProps>
