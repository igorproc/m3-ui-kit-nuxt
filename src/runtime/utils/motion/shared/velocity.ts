/**
 * @module utils/motion/shared/velocity
 *
 * @remarks
 * Rotational inertia for a morph: the shape banks in proportion to how fast it
 * is currently deforming, the way a car leans through a corner.
 *
 * Tying the swing to *speed* rather than to progress buys three things for
 * free. It peaks where the motion is most violent — early, for any curve with
 * a snap — so the turn reads before the rebound rather than alongside it. It
 * returns to zero as the curve settles, so the shape comes to rest in its
 * canonical orientation instead of accumulating a turn on every morph. And it
 * inherits the curve's own character: a spring's velocity reverses as it
 * springs back, so the bank rocks back with it.
 *
 * The derivative is taken numerically, which keeps this working for a curve
 * the caller wrote by hand as readily as for a spring.
 */

// Types
import type { EasingFn } from './types'

/** Half-window of the central difference, in normalized progress. */
const STEP = 1e-3

/** Grid used to find the peak speed. */
const SAMPLES = 96

/** Central difference, one-sided at the endpoints. */
function derivative(easing: EasingFn, t: number): number {
  const a = Math.max(0, t - STEP)
  const b = Math.min(1, t + STEP)
  return (easing(b) - easing(a)) / (b - a)
}

/**
 * Build a normalized speed profile of an easing.
 *
 * @param easing The curve to differentiate.
 * @returns A function of progress returning speed scaled so its peak magnitude
 *   is `1`. Negative while the curve runs backwards, and `0` at rest.
 */
export function createVelocityProfile(easing: EasingFn): EasingFn {
  let peak = 0
  for (let i = 0; i <= SAMPLES; i++) {
    peak = Math.max(peak, Math.abs(derivative(easing, i / SAMPLES)))
  }

  if (!(peak > 1e-9)) return () => 0

  return (t) => {
    if (t <= 0 || t >= 1) return 0
    return derivative(easing, t) / peak
  }
}
