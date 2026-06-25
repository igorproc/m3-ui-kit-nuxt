/**
 * Public prop surface for `<MDivider>`.
 *
 * `inset` replaces the legacy `variant: full | inset` taxonomy (which was not an
 * MD3 surface-style); `orientation` keeps the horizontal/vertical direction.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'

export type MDividerOrientation = 'horizontal' | 'vertical'

/** `<MDivider>` props. */
export const mDividerProps = {
  orientation: { type: String as PropType<MDividerOrientation>, default: 'horizontal' },
  inset: { type: Boolean, default: false },
}

export type MDividerProps = ExtractPublicPropTypes<typeof mDividerProps>
