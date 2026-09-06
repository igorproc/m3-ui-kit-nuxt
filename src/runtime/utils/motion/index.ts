/**
 * @module utils/motion
 *
 * @remarks
 * Motion stated as mathematics: springs and curves that derive their own
 * duration, plus the transitions built from them.
 *
 * - `shared/` — the vocabulary, the spring solver, and the resolver.
 * - `standard/` — Material 3 tokens verbatim, the CSS cubic-bezier solver, and
 *   the transitions that stay inside the spec.
 * - `expressive/` — the transitions tuned past it for the M3 Expressive morph.
 */

export { defineTransition } from './shared/define'
export { MORPH_TRANSITIONS, resolveTransition } from './shared/resolve'
export { prefersReducedMotion } from './shared/reduced-motion'
export { springDuration, springEasing, springOvershoot } from './shared/spring'
export { createVelocityProfile } from './shared/velocity'
export { cubicBezier } from './standard/bezier'
export { M3_EASING, M3_SPRING } from './standard/tokens'
export { bouncy, expressive } from './expressive/transitions'
export { calm, standard } from './standard/transitions'

export type {
  EasingFn,
  MorphTransition,
  MorphTransitionInput,
  MorphTransitionName,
  MorphTransitionOptions,
  SpringSpec,
} from './shared/types'
