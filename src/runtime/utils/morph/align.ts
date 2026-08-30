/**
 * @module utils/morph/align
 *
 * @remarks
 * Correspondence and closed-form 2D Procrustes. For a single ring the only
 * freedoms are the traversal direction and — for closed loops — the circular
 * cut point; both are searched, scoring each candidate by the Procrustes
 * residual plus a tiny minimal-rotation tie-break. The optimal similarity
 * `(θ, σ)` comes from `atan2` (no SVD).
 */

// Types
import type { SampledPath } from './types'

/**
 * λ of the minimal-rotation tie-break: `score = res + λ·|θ|/π`. Breaks the
 * residual tie that inversion-symmetric shapes (lines) hit between the two
 * traversal directions, which produce different rotations.
 */
const LAMBDA = 0.05

export interface Similarity {
  theta: number
  sigma: number
  res: number
}

export interface Alignment extends Similarity {
  ca: readonly [number, number]
  cb: readonly [number, number]
  /** A with the chosen correspondence. */
  a: Float64Array
  /** B with the chosen correspondence (direction and circular offset). */
  b: Float64Array
}

export function centroid(p: Float64Array): [number, number] {
  const n = p.length / 2
  let cx = 0
  let cy = 0
  for (let i = 0; i < n; i++) {
    cx += p[2 * i]!
    cy += p[2 * i + 1]!
  }
  return [cx / n, cy / n]
}

export function reversePoints(p: Float64Array): Float64Array {
  const n = p.length / 2
  const out = new Float64Array(2 * n)
  for (let i = 0; i < n; i++) {
    out[2 * i] = p[2 * (n - 1 - i)]!
    out[2 * i + 1] = p[2 * (n - 1 - i) + 1]!
  }
  return out
}

/**
 * Circular re-index of a loop: `out[i] = p[(i + off) mod n]` — same points,
 * different cut.
 */
export function rotatePoints(p: Float64Array, off: number): Float64Array {
  const n = p.length / 2
  const out = new Float64Array(2 * n)
  for (let i = 0; i < n; i++) {
    const j = (i + off) % n
    out[2 * i] = p[2 * j]!
    out[2 * i + 1] = p[2 * j + 1]!
  }
  return out
}

/**
 * Optimal similarity `(θ, σ)` minimizing `Σ|σ·R(θ)·(a−cA) − (b−cB)|²`.
 * `res` is the RMS residual normalized by b's energy (0 → same shape).
 */
export function procrustes(
  a: Float64Array,
  b: Float64Array,
  ca: readonly [number, number],
  cb: readonly [number, number],
): Similarity {
  const n = a.length / 2
  let sxx = 0
  let sxy = 0
  let syx = 0
  let syy = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < n; i++) {
    const ax = a[2 * i]! - ca[0]
    const ay = a[2 * i + 1]! - ca[1]
    const bx = b[2 * i]! - cb[0]
    const by = b[2 * i + 1]! - cb[1]
    sxx += ax * bx
    syy += ay * by
    sxy += ax * by
    syx += ay * bx
    na += ax * ax + ay * ay
    nb += bx * bx + by * by
  }
  const theta = Math.atan2(sxy - syx, sxx + syy)
  const num = Math.cos(theta) * (sxx + syy) + Math.sin(theta) * (sxy - syx)
  let sigma = na > 1e-12 ? num / na : 1
  if (!(sigma > 1e-6)) sigma = 1e-6
  const res2 = Math.max(0, sigma * sigma * na - 2 * sigma * num + nb)
  const res = nb > 1e-12 ? Math.sqrt(res2 / nb) : 0
  return { theta, sigma, res }
}

/**
 * Best index-to-index correspondence between two equal-size rings: tries both
 * traversal directions and, for a closed loop, its N circular offsets. The
 * circular freedom is applied to one cloud — the closed one (B if both are).
 *
 * @param a Source sampled subpath.
 * @param b Target sampled subpath.
 * @returns The chosen alignment and its similarity.
 */
export function alignPair(
  a: SampledPath,
  b: SampledPath,
): Alignment {
  const aPts = a.pts
  const bPts = b.pts
  const ca = centroid(aPts)
  const cb = centroid(bPts)
  const varyA = a.closed && !b.closed
  const base = varyA ? aPts : bPts
  const offs = a.closed || b.closed ? base.length / 2 : 1

  let bestScore = Number.POSITIVE_INFINITY
  let best = base
  let sim: Similarity = { theta: 0, sigma: 1, res: 0 }

  for (let dir = 0; dir < 2; dir++) {
    const walk = dir ? reversePoints(base) : base
    for (let off = 0; off < offs; off++) {
      const cand = off ? rotatePoints(walk, off) : walk
      const s = varyA ? procrustes(cand, bPts, ca, cb) : procrustes(aPts, cand, ca, cb)
      const score = s.res + (LAMBDA * Math.abs(s.theta)) / Math.PI
      if (score < bestScore) {
        bestScore = score
        best = cand
        sim = s
      }
    }
  }

  return varyA
    ? { ca, cb, a: best, b: bPts, ...sim }
    : { ca, cb, a: aPts, b: best, ...sim }
}
