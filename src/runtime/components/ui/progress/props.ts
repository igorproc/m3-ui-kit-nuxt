/**
 * Public prop surface for `<MProgress>` and its `linear` / `circular` leaves.
 *
 * Resolved here (not in the SFC) so `defineProps` receives a plain imported
 * object — the canonical pattern for the kit's `propsFactory`-based components.
 *
 * Note: `type` (`linear | circular`) is the progress *kind*, not an MD3
 * surface-style `variant`. `density` is the kit's three-step scale.
 */
import type { ExtractPublicPropTypes, PropType } from 'vue'
import type { ProgressDensity, ProgressShape, ProgressVariant } from '#kit/composables/progress/useProgress'

export type MProgressDensity = ProgressDensity
export type MProgressShape = ProgressShape

/** Geometry/behaviour props shared by the `linear` + `circular` leaf renderers. */
export const mProgressLeafProps = {
  value: { type: Number, default: 0 },
  /** The value of a finished task; `value` is a share of it. */
  max: { type: Number, default: 100 },
  /** The value read out by assistive tech, when a number alone says too little ("3 of 7 files"). */
  valueText: { type: String, default: undefined },
  indeterminate: { type: Boolean, default: false },
  /** Linear: bar 2 · 4 · 8 thick. Circular: ring 24 · 40 · 48 across. */
  density: { type: String as PropType<MProgressDensity>, default: 'default' },
  showTrack: { type: Boolean, default: true },
  /**
   * Accessible name of the progressbar. No default: copy the kit would invent
   * cannot be in the app's language. `aria-labelledby` works as well, and so
   * does the default slot: a caption beside the indicator that names it.
   */
  ariaLabel: { type: String, default: undefined },
  /** `wavy` is the M3 Expressive wavy indicator. */
  shape: { type: String as PropType<MProgressShape>, default: 'flat' },
}

/** Base `<MProgress>` props — adds the `type` switch over the leaf props. */
export const mProgressProps = {
  ...mProgressLeafProps,
  type: { type: String as PropType<ProgressVariant>, default: 'linear' },
}

export type MProgressLeafProps = ExtractPublicPropTypes<typeof mProgressLeafProps>
export type MProgressProps = ExtractPublicPropTypes<typeof mProgressProps>
