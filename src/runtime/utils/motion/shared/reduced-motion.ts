/**
 * @module utils/motion/shared/reduced-motion
 */

// Constants
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { M3_DURATION } from '../standard/tokens'

// Types
import type { MorphTransition } from './types'

/** The media query of the preference; `useReducedMotion` subscribes to the same one. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Whether the viewer asked the platform to reduce motion, read at call time —
 * for code that acts on it once (a scroll), with or without a component.
 *
 * @returns `true` when `prefers-reduced-motion: reduce` matches. Always `false`
 *   off the browser, where nothing animates anyway.
 */
export function prefersReducedMotion(): boolean {
  return IN_BROWSER && window.matchMedia?.(REDUCED_MOTION_QUERY).matches === true
}

export function reduceTransition(transition: MorphTransition): MorphTransition {
  const duration = transition.duration > M3_DURATION.short4 ? M3_DURATION.short2 : transition.duration
  return { ...transition, duration, rotate: 0 }
}
