/**
 * @module utils/motion/standard/transitions
 *
 * @remarks
 * Transitions that stay inside the letter of the Material 3 spec: their springs
 * are the published `md.sys.motion.spring.*` values, unmodified. Use them where
 * a morph has to agree with the CSS transitions around it. Neither overshoots
 * enough to be seen — that is the spec, not an oversight.
 */

// Constants
import { M3_SPRING } from './tokens'

// Utilities
import { defineTransition } from '../shared/define'

/** `md.sys.motion.spring.default.effects` — critically damped, arrives and stops. */
export const calm = /* #__PURE__ */ defineTransition({
  spring: M3_SPRING.effects.default,
})

/** `md.sys.motion.spring.default.spatial` — the spec's default movement spring. */
export const standard = /* #__PURE__ */ defineTransition({
  spring: M3_SPRING.spatial.default,
})
