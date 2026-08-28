/**
 * @module utils/morph
 *
 * @remarks
 * Deterministic, icon-agnostic SVG path morphing. Given two single-subpath
 * `d` strings it returns a `(t) => d` interpolator that rotates and scales
 * between them (closed-form Procrustes + polar interpolation) instead of the
 * collapsing linear point-lerp of naive morphs. Pure and SSR-safe: no DOM
 * measurement, fixed sampling, same output on server and client.
 *
 * @example
 * ```ts
 * import { createPathInterpolator } from '#kit/utils/morph'
 *
 * const at = createPathInterpolator(circleD, squareD, { samples: 96 })
 * path.setAttribute('d', at(0.5))
 * ```
 */

// Utilities
import { parsePath } from './parse'
import { samplePath } from './resample'
import { buildPlan } from './plan'
import { allocOutput, interpPolar } from './interpolate'
import { serialize } from './serialize'

/** Endpoint snap window: within this of 0/1 return the canonical curve `d`. */
const EPSILON = 1e-4

export interface PathInterpolatorOptions {
  /**
   * Number of arc-length samples per endpoint. Higher is smoother mid-flight
   * but heavier to build and serialize.
   * @default 96
   */
  samples?: number
  /**
   * Angular threshold (radians) for a joint to count as an anchored corner.
   * @default Math.PI / 8
   */
  cornerThreshold?: number
}

/**
 * Build a morph interpolator between two single-subpath `d` strings.
 *
 * At `t ≤ 1e-4` / `t ≥ 1 − 1e-4` it returns the original canonical `d` (real
 * curves), so binding it never pops from curves to polyline at the endpoints.
 *
 * @param fromD Source path `d`.
 * @param toD Target path `d`.
 * @param options Sampling configuration.
 * @returns A `(t) => d` function.
 */
export function createPathInterpolator(
  fromD: string,
  toD: string,
  options: PathInterpolatorOptions = {},
): (t: number) => string {
  const { samples = 96, cornerThreshold } = options

  const from = samplePath(parsePath(fromD), samples, cornerThreshold)
  const to = samplePath(parsePath(toD), samples, cornerThreshold)
  const plan = buildPlan(from, to)
  const out = allocOutput(plan)

  return (t) => {
    if (t <= EPSILON) return fromD
    if (t >= 1 - EPSILON) return toD
    interpPolar(plan, t, out)
    return serialize(out, plan.closed)
  }
}
