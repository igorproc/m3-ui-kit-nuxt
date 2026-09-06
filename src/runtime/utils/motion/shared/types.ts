/**
 * @module utils/motion/shared/types
 *
 * @remarks
 * Vocabulary of a **transition** — a mathematically defined change over time,
 * not a table of hand-tuned constants. A transition is fully described by a
 * timing curve plus the side channels a morph carries alongside the shape
 * (rotation, area conservation, rest). Everything else — duration included —
 * is derived from those numbers.
 */

/**
 * Maps linear progress `[0, 1]` to eased progress. May leave `[0, 1]` when the
 * curve overshoots (an underdamped spring passes its target and returns).
 */
export type EasingFn = (t: number) => number

/** Damped harmonic oscillator, unit mass. The two dials of a spring. */
export interface SpringSpec {
  /**
   * Damping ratio ζ. `1` settles without overshoot; below `1` the curve passes
   * its target and springs back — overshoot is `e^(−πζ/√(1−ζ²))`.
   */
  damping: number
  /** Stiffness `k`. The natural frequency is `ω₀ = √k`. */
  stiffness: number
}

/** A transition with every field resolved — what the morph loop actually runs. */
export interface MorphTransition {
  /** Timing curve. */
  easing: EasingFn
  /** Milliseconds from start to settle. */
  duration: number
  /**
   * Peak degrees the shape banks while it deforms. The angle follows the
   * curve's *speed*, so it swells where the motion is most violent and unwinds
   * to zero as the curve settles: the shape comes to rest square, never
   * accumulating a turn across a sequence of morphs. Applied to the rendered
   * element, never to the path geometry, so the morph still lands on the
   * canonical target `d`.
   */
  rotate: number
  /**
   * Hold the contour's enclosed area on the `from → to` interpolation, so the
   * shape reads as a constant-volume substance instead of deflating mid-flight.
   */
  preserveArea: boolean
  /** Milliseconds to rest on the target before a cycle advances. */
  hold: number
  /** Whether {@link easing} can leave `[0, 1]`. Endpoint snapping is skipped when it can. */
  overshoots: boolean
}

/** Everything optional — what a caller passes to build or tweak a transition. */
export interface MorphTransitionOptions extends Partial<MorphTransition> {
  /**
   * Build the curve from a spring instead of supplying {@link MorphTransition.easing}.
   * When `duration` is omitted it is derived from the spring's settling time.
   */
  spring?: SpringSpec
}

/** Names of the transitions shipped with the kit. */
export type MorphTransitionName = 'calm' | 'standard' | 'expressive' | 'bouncy'

/** Anything accepted where a transition is expected. */
export type MorphTransitionInput = MorphTransitionName | MorphTransitionOptions
