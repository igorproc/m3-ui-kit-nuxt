/**
 * Public prop surface for `<MProgress>` and its `linear` / `circular` leaves.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * Note: `type` (`linear | circular`) is the progress *kind*, not an MD3
 * surface-style `variant`. `size` keeps the progress-specific scale
 * (`small | medium | large`), distinct from the shared `MSize`.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { ProgressSize, ProgressVariant } from '#kit/composables/progress/useProgress'

/** Geometry/behaviour props shared by the `linear` + `circular` leaf renderers. */
export const mProgressLeafProps = {
  value: { type: Number, default: 0 },
  indeterminate: { type: Boolean, default: false },
  size: { type: String as PropType<ProgressSize>, default: 'medium' },
  showTrack: { type: Boolean, default: true },
  ariaLabel: { type: String, default: 'Progress' },
  expressive: { type: Boolean, default: false },
}

/** Base `<MProgress>` props — adds the `type` switch over the leaf props. */
export const mProgressProps = {
  ...mProgressLeafProps,
  type: { type: String as PropType<ProgressVariant>, default: 'linear' },
}

export type MProgressLeafProps = ExtractPublicPropTypes<typeof mProgressLeafProps>
export type MProgressProps = ExtractPublicPropTypes<typeof mProgressProps>
