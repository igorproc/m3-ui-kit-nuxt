/**
 * @module utils/motion/expressive/transitions
 *
 * @remarks
 * Transitions past the spec's letter, tuned for the M3 Expressive shape morph:
 * a hard early impulse, a visible overshoot, a long viscous settle, and a
 * rotation carried alongside so the eye reads a vortex instead of points
 * sliding along straight chords.
 *
 * The two spring dials produce everything else. For `expressive`
 * (ζ = 0.6, k = 380) that works out to a ~610 ms transition whose speed peaks
 * near 60 ms, overshoots the target by 9.5% at ~200 ms, and settles from there.
 */

// Utilities
import { defineTransition } from '../shared/define'

/** Default morph transition: springy impulse, visible overshoot, quarter turn. */
export const expressive = /* #__PURE__ */ defineTransition({
  spring: { damping: 0.6, stiffness: 380 },
  rotate: 60,
  preserveArea: true,
  hold: 100,
})

/** Exaggerated variant — ~20% overshoot and a full quarter-plus turn. */
export const bouncy = /* #__PURE__ */ defineTransition({
  spring: { damping: 0.45, stiffness: 600 },
  rotate: 90,
  preserveArea: true,
  hold: 120,
})
