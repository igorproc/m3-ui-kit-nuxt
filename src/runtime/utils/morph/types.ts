/**
 * @module utils/morph/types
 *
 * @remarks
 * Shared shapes for the deterministic path-morph core. The core morphs a
 * single closed subpath (one ring of cubic segments) — enough for the M3
 * shape set and single-path morph icons. Multi-subpath support can be layered
 * on top later without changing these primitives.
 */

/**
 * A subpath stored as flat cubic control points:
 * `[x0,y0, c1x,c1y, c2x,c2y, x3,y3, …]`. Length is `2 * (3 * segments + 1)`.
 * Straight lines are stored as degenerate cubics so the whole pipeline is
 * uniform.
 */
export interface CubicPath {
  pts: Float64Array
  closed: boolean
}

/** A subpath resampled to N points, flat as `[x0,y0, x1,y1, …]` (length 2N). */
export interface SampledPath {
  pts: Float64Array
  closed: boolean
}

/**
 * Precomputed morph plan between two aligned point clouds of equal size. The
 * similarity `(θ, σ, centroids)` is separated from the residual so it can be
 * interpolated in its natural (polar) space — the source of real rotation and
 * scale instead of a collapsing linear lerp.
 */
export interface MorphPlan {
  /** Number of sample points shared by both endpoints. */
  n: number
  /** Source A centered on its centroid (flat 2N). */
  aC: Float64Array
  /** Target B carried into A's frame: `R(−θ)·(b − cB)/σ` (flat 2N). */
  bT: Float64Array
  /** Centroid of A. */
  ca: readonly [number, number]
  /** Centroid of B. */
  cb: readonly [number, number]
  /** Optimal rotation A→B. */
  theta: number
  /** Natural log of the optimal scale A→B. */
  lnSigma: number
  /** Whether the morphed subpath is a closed loop (appends `Z`). */
  closed: boolean
}
