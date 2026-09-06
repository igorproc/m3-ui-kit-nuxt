/**
 * @module utils/motion/standard/bezier
 *
 * @remarks
 * CSS-identical cubic-bezier easing. A CSS timing function is a parametric
 * curve, so evaluating it at a given *time* means inverting `x(u)` first;
 * Newton-Raphson does that in a few steps, with bisection as the fallback when
 * the derivative is too flat to trust.
 *
 * Import this only when you need a curve stated as control points — the kit's
 * own transitions are springs, so nothing pulls this solver into a bundle that
 * does not ask for it by name.
 */

// Types
import type { EasingFn } from '../shared/types'

const NEWTON_ITERATIONS = 8
const NEWTON_MIN_SLOPE = 1e-3
const SUBDIVISION_EPSILON = 1e-7
const SUBDIVISION_ITERATIONS = 12

/** `x(u)` of a unit cubic bezier with control abscissas `x1`, `x2`. */
const sampleCurve = (u: number, a: number, b: number, c: number): number =>
  ((a * u + b) * u + c) * u

/** `dx/du`. */
const sampleSlope = (u: number, a: number, b: number, c: number): number =>
  (3 * a * u + 2 * b) * u + c

/**
 * Build an easing from CSS `cubic-bezier(x1, y1, x2, y2)` control points.
 *
 * @param x1 First control point abscissa, clamped to `[0, 1]`.
 * @param y1 First control point ordinate.
 * @param x2 Second control point abscissa, clamped to `[0, 1]`.
 * @param y2 Second control point ordinate.
 * @returns The easing function.
 *
 * @example
 * ```ts
 * const emphasizedDecelerate = cubicBezier(0.05, 0.7, 0.1, 1)
 * ```
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFn {
  const px1 = Math.min(Math.max(x1, 0), 1)
  const px2 = Math.min(Math.max(x2, 0), 1)

  const cx = 3 * px1
  const bx = 3 * (px2 - px1) - cx
  const ax = 1 - cx - bx

  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  // A straight line needs no solving.
  if (px1 === y1 && px2 === y2) return t => t

  function solve(x: number): number {
    let u = x

    for (let i = 0; i < NEWTON_ITERATIONS; i++) {
      const slope = sampleSlope(u, ax, bx, cx)
      if (Math.abs(slope) < NEWTON_MIN_SLOPE) break
      u -= (sampleCurve(u, ax, bx, cx) - x) / slope
    }

    let lo = 0
    let hi = 1
    if (u >= lo && u <= hi && Math.abs(sampleCurve(u, ax, bx, cx) - x) < SUBDIVISION_EPSILON) {
      return u
    }

    u = x
    for (let i = 0; i < SUBDIVISION_ITERATIONS; i++) {
      const value = sampleCurve(u, ax, bx, cx)
      if (Math.abs(value - x) < SUBDIVISION_EPSILON) break
      if (value > x) hi = u
      else lo = u
      u = (hi + lo) / 2
    }

    return u
  }

  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return sampleCurve(solve(t), ay, by, cy)
  }
}
