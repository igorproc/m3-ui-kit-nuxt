/**
 * @module utils/morph/plan
 *
 * @remarks
 * Builds the morph plan between two equal-size sampled rings: aligns them,
 * then precomputes A centered and B carried into A's frame so the per-frame
 * interpolation is a handful of multiply-adds.
 */

// Utilities
import { alignPair } from './align'

// Types
import type { MorphPlan, SampledPath } from './types'

/**
 * Build a {@link MorphPlan} between two sampled subpaths of equal length.
 *
 * @param from Source subpath.
 * @param to Target subpath.
 * @returns The precomputed, cacheable plan.
 */
export function buildPlan(from: SampledPath, to: SampledPath): MorphPlan {
  const n = from.pts.length / 2
  if (to.pts.length / 2 !== n) throw new Error('morph: sample count mismatch')

  const al = alignPair(from, to)
  const aC = new Float64Array(2 * n)
  const bT = new Float64Array(2 * n)
  const cos = Math.cos(-al.theta)
  const sin = Math.sin(-al.theta)

  for (let i = 0; i < n; i++) {
    aC[2 * i] = al.a[2 * i]! - al.ca[0]
    aC[2 * i + 1] = al.a[2 * i + 1]! - al.ca[1]
    const bx = al.b[2 * i]! - al.cb[0]
    const by = al.b[2 * i + 1]! - al.cb[1]
    bT[2 * i] = (bx * cos - by * sin) / al.sigma
    bT[2 * i + 1] = (bx * sin + by * cos) / al.sigma
  }

  return {
    n,
    aC,
    bT,
    ca: al.ca,
    cb: al.cb,
    theta: al.theta,
    lnSigma: Math.log(al.sigma),
    closed: from.closed && to.closed,
  }
}
