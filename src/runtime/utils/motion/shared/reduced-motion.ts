/**
 * @module utils/motion/shared/reduced-motion
 */

// Constants
import { IN_BROWSER } from '#kit/shared/constants/globals'
import { M3_DURATION } from '../standard/tokens'

// Types
import type { MorphTransition } from './types'

/**
 * Whether the viewer asked the platform to reduce motion.
 *
 * @returns `true` when `prefers-reduced-motion: reduce` matches. Always `false`
 *   off the browser, where nothing animates anyway.
 */
export function prefersReducedMotion(): boolean {
  return IN_BROWSER && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function reduceTransition(transition: MorphTransition): MorphTransition {
  const duration = transition.duration > M3_DURATION.short4 ? M3_DURATION.short2 : transition.duration
  return { ...transition, duration, rotate: 0 }
}
