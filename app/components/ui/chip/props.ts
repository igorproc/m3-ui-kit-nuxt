/**
 * Public prop surface for `<MChip>`.
 *
 * `type` is the MD3 chip taxonomy (assist | filter | input | suggestion) — NOT
 * a surface `variant`. Chips have no async action, so only `disabled` (not
 * `loading`) is taken from the shared state contract.
 *
 * `value` is the opt-in into `<MChipGroup>` selection. A chip without `value`
 * stays standalone even inside a group, which keeps assist/input/suggestion
 * chips usable as plain design elements next to selectable ones.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import { makeStateProps } from '~~/shared/utils/props'

export type MChipType = 'assist' | 'filter' | 'input' | 'suggestion'

const { disabled } = makeStateProps()

export const mChipProps = {
  disabled,
  type: { type: String as PropType<MChipType>, default: 'assist' },
  /** Selection value inside a `<MChipGroup>`. Undefined keeps the chip standalone. */
  value: { type: null as unknown as PropType<unknown>, default: undefined },
}

export type MChipProps = ExtractPublicPropTypes<typeof mChipProps>
