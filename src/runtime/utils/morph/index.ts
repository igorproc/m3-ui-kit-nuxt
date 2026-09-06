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
  /**
   * Hold the contour's enclosed area across the morph, so it reads as a
   * constant-volume substance rather than a drawing that deflates halfway.
   * @default false
   */
  preserveArea?: boolean
  /**
   * Return the canonical target `d` once `t` reaches `1 - 1e-4`.
   *
   * Set `false` for an easing that overshoots: a spring crosses `1` early and
   * springs back, and snapping on the crossing would freeze the morph on its
   * target and swallow the whole rebound. With it off the caller settles on the
   * canonical geometry itself when time runs out.
   * @default true
   */
  snapEnd?: boolean
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
  const { samples = 96, cornerThreshold, preserveArea = false, snapEnd = true } = options

  const from = samplePath(parsePath(fromD), samples, cornerThreshold)
  const to = samplePath(parsePath(toD), samples, cornerThreshold)
  const plan = buildPlan(from, to)
  const out = allocOutput(plan)

  return (t) => {
    if (t <= EPSILON) return fromD
    if (snapEnd && t >= 1 - EPSILON) return toD
    if (!snapEnd && t === 1) return toD
    interpPolar(plan, t, out, preserveArea)
    return serialize(out, plan.closed)
  }
}
