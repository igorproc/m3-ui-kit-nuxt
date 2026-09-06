/**
 * @module utils/motion/shared/reduced-motion
 */

// Constants
import { IN_BROWSER } from '#kit/shared/constants/globals'

/**
 * Whether the viewer asked the platform to reduce motion.
 *
 * @returns `true` when `prefers-reduced-motion: reduce` matches. Always `false`
 *   off the browser, where nothing animates anyway.
 */
export function prefersReducedMotion(): boolean {
  return IN_BROWSER && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
