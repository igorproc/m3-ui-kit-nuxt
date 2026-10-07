/**
 * Public prop surface for `<MDivider>`.
 *
 * `inset` replaces the legacy `variant: full | inset` taxonomy (which was not an
 * MD3 surface-style); `orientation` keeps the horizontal/vertical direction.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MDividerOrientation = 'horizontal' | 'vertical'

/**
 * Which end of the line steps in, along the line's own axis and in the writing
 * direction: `start`, `end`, or `center` (both ends, M3's middle inset).
 */
export type MDividerInset = 'start' | 'center' | 'end'

/** `<MDivider>` props. */
export const mDividerProps = {
  orientation: { type: String as PropType<MDividerOrientation>, default: 'horizontal' },
  /**
   * Absent: the line runs the full length. `true` is retired (read as
   * `'start'`) and still accepted for one release.
   */
  inset: { type: [Boolean, String] as PropType<MDividerInset | boolean>, default: undefined },
}

export type MDividerProps = ExtractPublicPropTypes<typeof mDividerProps>
