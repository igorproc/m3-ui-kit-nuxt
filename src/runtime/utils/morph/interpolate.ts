/**
 * @module utils/morph/interpolate
 *
 * @remarks
 * Polar interpolation: the similarity is interpolated in its natural space
 * (angle linear, scale log-linear, centroid lerp) and applied to the residual
 * blend in the aligned frame —
 *   `P(t) = c(t) + σᵗ·R(t·θ)·[(1−t)·aC + t·bT]`
 * — so a rotating shape actually rotates instead of collapsing along chords.
 * Exact at `t = 0` and `t = 1`. Writes into a preallocated buffer (no
 * per-frame allocation).
 */

// Types
import type { MorphPlan } from './types'

/** Allocate the output buffer for a plan (flat `2n`). */
export function allocOutput(plan: MorphPlan): Float64Array {
  return new Float64Array(2 * plan.n)
}

/**
 * Interpolate the plan at `t` into `out`.
 *
 * @param plan The morph plan.
 * @param t Progress (0→1; may exceed for overshoot).
 * @param out Preallocated buffer of length `2 * plan.n`.
 */
export function interpPolar(plan: MorphPlan, t: number, out: Float64Array): void {
  const { n, aC, bT, ca, cb, theta, lnSigma } = plan
  const s = Math.exp(lnSigma * t)
  const ang = theta * t
  const cos = Math.cos(ang) * s
  const sin = Math.sin(ang) * s
  const cx = ca[0] + (cb[0] - ca[0]) * t
  const cy = ca[1] + (cb[1] - ca[1]) * t

  for (let i = 0; i < n; i++) {
    const px = aC[2 * i]! + (bT[2 * i]! - aC[2 * i]!) * t
    const py = aC[2 * i + 1]! + (bT[2 * i + 1]! - aC[2 * i + 1]!) * t
    out[2 * i] = cx + px * cos - py * sin
    out[2 * i + 1] = cy + px * sin + py * cos
  }
}
