/**
 * Public prop surface for `<MSystemBar>`.
 */
import type { ExtractPublicPropTypes } from 'vue'
import { propsFactory } from '#kit/shared/utils/props/propsFactory'

export const makeMSystemBarProps = propsFactory({
  /** Pins the bar to the top of the viewport when it is a zone of `<m-layout>`. */
  sticky: { type: Boolean, default: true },
})

export const mSystemBarProps = makeMSystemBarProps()

export type MSystemBarProps = ExtractPublicPropTypes<typeof mSystemBarProps>

export interface MSystemBarSlots {
  default?: () => unknown
  prepend?: () => unknown
  append?: () => unknown
}
