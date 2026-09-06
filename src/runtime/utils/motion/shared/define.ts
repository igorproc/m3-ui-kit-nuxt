/**
 * @module utils/motion/shared/define
 *
 * @remarks
 * Builds a fully resolved {@link MorphTransition} from partial options. This is
 * the seam for custom motion: give it a spring, or a curve, or neither, and
 * every remaining field is derived rather than guessed.
 */

// Constants
import { M3_SPRING } from '../standard/tokens'

// Utilities
import { springDuration, springEasing } from './spring'

// Types
import type { MorphTransition, MorphTransitionOptions } from './types'

/** Duration for a curve supplied without one — `md.sys.motion.duration.medium2`. */
const CURVE_DURATION = 300

/**
 * Resolve partial transition options into a runnable transition.
 *
 * Precedence: an explicit `easing` wins over `spring`; an explicit `duration`
 * wins over the spring's settling time. With neither curve nor spring, the M3
 * `spatial.default` spring drives the transition.
 *
 * @param options Anything the caller wants to pin down.
 * @returns The resolved transition.
 *
 * @example
 * ```ts
 * const punchy = defineTransition({
 *   spring: { damping: 0.5, stiffness: 300 },
 *   rotate: 90,
 *   preserveArea: true,
 * })
 * ```
 */
export function defineTransition(options: MorphTransitionOptions = {}): MorphTransition {
  const {
    rotate = 0,
    preserveArea = false,
    hold = 0,
  } = options

  const channels = { rotate, preserveArea, hold }

  if (options.easing) {
    return {
      easing: options.easing,
      duration: options.duration ?? CURVE_DURATION,
      overshoots: options.overshoots ?? false,
      ...channels,
    }
  }

  const spring = options.spring ?? M3_SPRING.spatial.default
  const duration = options.duration ?? springDuration(spring)

  return {
    easing: springEasing(spring, duration),
    duration,
    overshoots: options.overshoots ?? spring.damping < 1,
    ...channels,
  }
}
