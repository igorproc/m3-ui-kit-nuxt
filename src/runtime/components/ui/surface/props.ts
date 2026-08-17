/**
 * Public prop surface for `<MSurface>` — a passive M3 surface primitive.
 *
 * `variant` is a narrow surface-preset taxonomy (`plain | filled | elevated |
 * outlined`) distinct from the button/card `MVariant` union: each preset binds
 * a semantic color role, elevation and outline together so consumers never
 * assemble those independently. No interaction/state props are exposed.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { MShape } from '#kit/shared/types/props'

/** MD3 surface presets. Each maps to a fixed color-role/elevation/outline set. */
export type MSurfaceVariant = 'plain' | 'filled' | 'elevated' | 'outlined'

/** `<MSurface>` props — defaults to a flat `plain` surface with no corner shape. */
export const mSurfaceProps = {
  /** Root element tag. Consumer picks semantic tags (`section`, `aside`, …). */
  tag: { type: String, default: 'div' },
  /** MD3 surface preset. */
  variant: { type: String as PropType<MSurfaceVariant>, default: 'plain' },
  /** MD3 system corner shape token. */
  shape: { type: String as PropType<MShape>, default: 'none' },
}

export type MSurfaceProps = ExtractPublicPropTypes<typeof mSurfaceProps>
