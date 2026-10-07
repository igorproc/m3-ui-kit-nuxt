/**
 * @module utils/motion/shared/css
 */

// Utilities
import { springDuration, springEasing } from './spring'

// Types
import type { SpringSpec } from './types'

/** A spring stated as a CSS transition timing. */
export interface CssSpring {
  /** `linear(…)` easing sampled from the spring; overshoot is kept. */
  easing: string
  /** Settling time in milliseconds. */
  duration: number
}

/**
 * A spring as a CSS `linear()` easing over its settling time, so a plain CSS
 * transition moves exactly as the closed-form spring does — no per-frame JS.
 * Deterministic, so server and client render the same string.
 *
 * @param spring Damping ratio and stiffness.
 * @param samples Points sampled along the curve; enough that the piecewise
 *   line is indistinguishable from the spring.
 * @returns The easing and its duration.
 */
export function springToCss(spring: SpringSpec, samples = 32): CssSpring {
  const duration = springDuration(spring)
  const easing = springEasing(spring, duration)
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const value = easing(index / samples)
    return String(Math.round(value * 10000) / 10000)
  })

  return { easing: `linear(${points.join(', ')})`, duration }
}

/**
 * `<duration>ms <easing>` of a spring, ready for a `transition` shorthand.
 *
 * @param spring Damping ratio and stiffness.
 */
export function springTiming(spring: SpringSpec): string {
  const { duration, easing } = springToCss(spring)
  return `${duration}ms ${easing}`
}

/**
 * A `transition` shorthand from `[property, timing]` pairs.
 *
 * @param entries Each property with its `<duration> <easing>`.
 */
export function transitionList(entries: Array<[property: string, timing: string]>): string {
  return entries.map(([property, timing]) => `${property} ${timing}`).join(', ')
}
