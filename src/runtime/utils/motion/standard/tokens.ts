/**
 * @module utils/motion/standard/tokens
 *
 * @remarks
 * Verbatim `md.sys.motion.*` values (Google Material 3, token set 34.0.21).
 * Kept as plain numbers so importing them costs nothing and so the SCSS in
 * `assets/stylesheet/base/_animations.scss` and the JS transitions can be
 * checked against one source instead of drifting apart.
 */

// Types
import type { SpringSpec } from '../shared/types'

/** `md.sys.motion.easing.*` control points, in `cubic-bezier(x1, y1, x2, y2)` order. */
export const M3_EASING = {
  linear: [0, 0, 1, 1],
  standard: [0.2, 0, 0, 1],
  standardAccelerate: [0.3, 0, 1, 1],
  standardDecelerate: [0, 0, 0, 1],
  emphasized: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  legacy: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export const M3_DURATION = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
} as const satisfies Record<string, number>

/**
 * `md.sys.motion.spring.*`.
 *
 * `spatial` moves things and is nominally underdamped, though at ζ = 0.9 its
 * overshoot is 0.15% — below the threshold of sight. `effects` is critically
 * damped by definition and never overshoots.
 */
export const M3_SPRING = {
  spatial: {
    fast: { damping: 0.9, stiffness: 1400 },
    default: { damping: 0.9, stiffness: 700 },
    slow: { damping: 0.9, stiffness: 300 },
  },
  effects: {
    fast: { damping: 1, stiffness: 3800 },
    default: { damping: 1, stiffness: 1600 },
    slow: { damping: 1, stiffness: 800 },
  },
} as const satisfies Record<string, Record<string, SpringSpec>>
