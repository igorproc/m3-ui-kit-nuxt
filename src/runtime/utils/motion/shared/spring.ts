/**
 * @module utils/motion/expressive/spring
 *
 * @remarks
 * A spring stated as a closed-form solution, not a per-frame integrator: the
 * position of a damped harmonic oscillator released at `0` toward `1` with no
 * initial velocity has an exact expression, so the curve can be sampled at any
 * `t` — forwards, backwards, or out of order — and is identical on server and
 * client.
 *
 * Two dials describe the whole motion:
 * - `stiffness` — how hard it pulls toward the target (`ω₀ = √k`).
 * - `damping` — how hard it brakes. At `1` it arrives and stops; below `1` it
 *   passes the target by `e^(−πζ/√(1−ζ²))` and springs back.
 *
 * The duration is a *consequence* of those two numbers, not a third dial —
 * see {@link springDuration}.
 */

// Types
import type { EasingFn, SpringSpec } from './types'

/** Residual amplitude counted as settled. */
const SETTLE_EPSILON = 1e-3

/** Fixed-point iterations for the critically damped settling time. */
const CRITICAL_ITERATIONS = 8

/**
 * Time for a spring to settle within 0.1% of its target.
 *
 * The envelope of the response decays as `e^(−ζω₀t)` scaled by the mode's
 * amplitude, so the settling time follows in closed form for the underdamped
 * and overdamped cases. The critically damped case solves `e^(−u)(1+u) = ε`
 * by fixed-point iteration, which converges in a handful of steps.
 *
 * @param spring Damping ratio and stiffness.
 * @param epsilon Residual treated as settled.
 * @returns Duration in milliseconds, rounded to whole milliseconds.
 */
export function springDuration(
  spring: SpringSpec,
  epsilon: number = SETTLE_EPSILON,
): number {
  const { damping: zeta, stiffness } = spring
  const w0 = Math.sqrt(Math.max(stiffness, 1e-6))

  if (zeta < 1) {
    const decay = zeta * w0
    const amplitude = 1 / Math.sqrt(1 - zeta * zeta)
    return Math.round((Math.log(amplitude / epsilon) / decay) * 1000)
  }

  if (zeta === 1) {
    let u = 1
    for (let i = 0; i < CRITICAL_ITERATIONS; i++) u = Math.log((1 + u) / epsilon)
    return Math.round((u / w0) * 1000)
  }

  const root = Math.sqrt(zeta * zeta - 1)
  const slow = -w0 * (zeta - root)
  const fast = -w0 * (zeta + root)
  const amplitude = Math.abs(fast / (slow - fast))
  return Math.round((Math.log(amplitude / epsilon) / Math.abs(slow)) * 1000)
}

/**
 * Build an easing from a spring.
 *
 * The returned function takes normalized progress `[0, 1]` over
 * {@link springDuration} (or an explicit `duration`) and returns the spring's
 * position — which exceeds `1` while it overshoots. `t = 1` is forced to
 * exactly `1` so a morph lands on its canonical target.
 *
 * @param spring Damping ratio and stiffness.
 * @param duration Milliseconds the normalized `[0, 1]` spans. Defaults to the settling time.
 * @returns The easing function.
 */
export function springEasing(spring: SpringSpec, duration?: number): EasingFn {
  const { damping: zeta, stiffness } = spring
  const w0 = Math.sqrt(Math.max(stiffness, 1e-6))
  const seconds = (duration ?? springDuration(spring)) / 1000

  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    const decay = zeta * w0
    return (t) => {
      if (t >= 1) return 1
      const time = t * seconds
      return 1 - Math.exp(-decay * time)
        * (Math.cos(wd * time) + (decay / wd) * Math.sin(wd * time))
    }
  }

  if (zeta === 1) {
    return (t) => {
      if (t >= 1) return 1
      const time = t * seconds
      return 1 - Math.exp(-w0 * time) * (1 + w0 * time)
    }
  }

  const root = Math.sqrt(zeta * zeta - 1)
  const slow = -w0 * (zeta - root)
  const fast = -w0 * (zeta + root)
  return (t) => {
    if (t >= 1) return 1
    const time = t * seconds
    return 1 - (slow * Math.exp(fast * time) - fast * Math.exp(slow * time)) / (slow - fast)
  }
}

/**
 * Peak overshoot of a spring as a fraction of the travelled distance.
 *
 * @param spring Damping ratio and stiffness.
 * @returns `0` when critically or overdamped, else `e^(−πζ/√(1−ζ²))`.
 */
export function springOvershoot(spring: SpringSpec): number {
  const zeta = spring.damping
  if (zeta >= 1) return 0
  return Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta))
}
