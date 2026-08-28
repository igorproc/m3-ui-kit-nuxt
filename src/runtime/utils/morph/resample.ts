/**
 * @module utils/morph/resample
 *
 * @remarks
 * Arc-length resampling with anchored corners. A cubic's length has no closed
 * form, so speed `|B'(t)|` is integrated with 8-point Gauss-Legendre and the
 * arc-length inversion is a safeguarded Newton step. Corners (tangent breaks
 * above a threshold) are pinned as exact samples; the rest are distributed by
 * arc length between corners. The result is intrinsic to the shape — two
 * congruent rings sample congruently (modulo index rotation, resolved by the
 * plan's circular alignment) regardless of where their `M` point sits.
 */

// Types
import type { CubicPath, SampledPath } from './types'

/** Default angular threshold (22.5°) for a joint to count as a corner. */
export const CORNER_THRESHOLD = Math.PI / 8

// Gauss-Legendre, 8 nodes on [−1, 1]; symmetric, so only the positive half.
const GX = [0.18343464249564978, 0.525532409916329, 0.7966664774136267, 0.9602898564975363]
const GW = [0.362683783378362, 0.31370664587788727, 0.22238103445337448, 0.10122853629037626]

// |B'(t)| of cubic segment k. B'(t) = 3(1−t)²(P₁−P₀)+6(1−t)t(P₂−P₁)+3t²(P₃−P₂).
function speed(p: Float64Array, k: number, t: number): number {
  const i = 6 * k
  const u = 1 - t
  const c0 = 3 * u * u
  const c1 = 6 * u * t
  const c2 = 3 * t * t
  const dx = c0 * (p[i + 2]! - p[i]!) + c1 * (p[i + 4]! - p[i + 2]!) + c2 * (p[i + 6]! - p[i + 4]!)
  const dy = c0 * (p[i + 3]! - p[i + 1]!) + c1 * (p[i + 5]! - p[i + 3]!) + c2 * (p[i + 7]! - p[i + 5]!)
  return Math.hypot(dx, dy)
}

// ∫₀^t1 |B'| of segment k via Gauss-Legendre.
function segLen(p: Float64Array, k: number, t1 = 1): number {
  const half = t1 / 2
  let s = 0
  for (let j = 0; j < 4; j++) {
    s += GW[j]! * (speed(p, k, half + half * GX[j]!) + speed(p, k, half - half * GX[j]!))
  }
  return s * half
}

// Bernstein evaluation of segment k at t → (out[o], out[o+1]).
function point(p: Float64Array, k: number, t: number, out: Float64Array, o: number): void {
  const i = 6 * k
  const u = 1 - t
  const b0 = u * u * u
  const b1 = 3 * u * u * t
  const b2 = 3 * u * t * t
  const b3 = t * t * t
  out[o] = b0 * p[i]! + b1 * p[i + 2]! + b2 * p[i + 4]! + b3 * p[i + 6]!
  out[o + 1] = b0 * p[i + 1]! + b1 * p[i + 3]! + b2 * p[i + 5]! + b3 * p[i + 7]!
}

// Tangent at an endpoint of segment k: outgoing at P₃ (atEnd) or incoming at
// P₀. Falls back to the next control point when the first is degenerate.
function tangent(p: Float64Array, k: number, atEnd: boolean): readonly [number, number] | null {
  const i = 6 * k
  const b = atEnd ? i + 6 : i
  const s = atEnd ? -1 : 1
  for (const j of atEnd ? [4, 2, 0] : [2, 4, 6]) {
    const dx = s * (p[i + j]! - p[b]!)
    const dy = s * (p[i + j + 1]! - p[b + 1]!)
    if (dx * dx + dy * dy > 1e-18) return [dx, dy]
  }
  return null
}

/**
 * Segment-start indices whose tangent discontinuity exceeds the threshold.
 * For closed paths the closing joint is included.
 */
export function detectCorners(path: CubicPath, threshold = CORNER_THRESHOLD): number[] {
  const p = path.pts
  const m = (p.length / 2 - 1) / 3
  const active: number[] = []
  for (let k = 0; k < m; k++) if (segLen(p, k) > 1e-9) active.push(k)
  if (active.length === 0) return []

  const corners = new Set<number>()
  const test = (a: number, b: number): void => {
    const u = tangent(p, a, true)
    const v = tangent(p, b, false)
    if (!u || !v) return
    const ang = Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]))
    if (ang > threshold) corners.add(b)
  }

  for (let j = 0; j + 1 < active.length; j++) test(active[j]!, active[j + 1]!)
  if (path.closed && active.length > 1) test(active[active.length - 1]!, active[0]!)
  return [...corners].sort((a, b) => a - b)
}

// Arc-length inversion: t with ∫₀^t |B'| = s. Newton with a bisection bracket.
function invert(p: Float64Array, k: number, s: number, ls: number): number {
  if (s <= 0) return 0
  if (s >= ls) return 1
  let lo = 0
  let hi = 1
  let t = s / ls
  for (let it = 0; it < 12; it++) {
    const f = segLen(p, k, t) - s
    if (Math.abs(f) < 1e-10 * ls + 1e-14) break
    if (f > 0) hi = t
    else lo = t
    const sp = speed(p, k, t)
    let nt = sp > 1e-12 ? t - f / sp : (lo + hi) / 2
    if (!(nt > lo && nt < hi)) nt = (lo + hi) / 2
    t = nt
  }
  return t
}

/**
 * Sample a cubic subpath at N points equidistant by arc length, anchoring
 * corners (and, for open paths, endpoints) as exact samples. Closed paths
 * distribute N intervals around the loop without duplicating the first point.
 *
 * @param path Source cubic subpath.
 * @param n Number of samples.
 * @param cornerThreshold Angular threshold for corner detection.
 * @returns Flat `Float64Array` of length `2n`.
 */
export function resamplePath(path: CubicPath, n = 96, cornerThreshold = CORNER_THRESHOLD): Float64Array {
  const p = path.pts
  const m = (p.length / 2 - 1) / 3
  const out = new Float64Array(2 * n)

  const fill = (): Float64Array => {
    for (let idx = 0; idx < n; idx++) {
      out[2 * idx] = p[0]!
      out[2 * idx + 1] = p[1]!
    }
    return out
  }
  if (m < 1) return fill()

  const lens = Array.from({ length: m }, () => 0)
  let total = 0
  for (let k = 0; k < m; k++) {
    lens[k] = segLen(p, k)
    total += lens[k]!
  }
  if (total < 1e-12) return fill()

  // Closed rings sample intrinsically (corners only, or the start if a circle);
  // open paths always pin both endpoints.
  const cs = detectCorners(path, cornerThreshold)
  const anchors = path.closed
    ? cs.length > 0
      ? cs
      : [0]
    : [...new Set([0, ...cs, m])].sort((a, b) => a - b)

  const runs: Array<[number, number]> = []
  if (path.closed) {
    for (let j = 0; j < anchors.length; j++) {
      const a = anchors[j]!
      const b = j + 1 < anchors.length ? anchors[j + 1]! : anchors[0]! + m
      runs.push([a, b])
    }
  } else {
    for (let j = 0; j + 1 < anchors.length; j++) runs.push([anchors[j]!, anchors[j + 1]!])
  }

  const runLen = runs.map(([a, b]) => {
    let s = 0
    for (let k = a; k < b; k++) s += lens[k % m]!
    return s
  })

  const intervals = path.closed ? n : n - 1
  if (runs.length > intervals) throw new Error(`morph: n=${n} too small (${runs.length} runs)`)

  // Largest-remainder apportionment: proportional to length, min 1, exact sum.
  const sum = runLen.reduce((a, b) => a + b, 0) || 1
  const ideal = runLen.map(l => (intervals * l) / sum)
  const counts = ideal.map(q => Math.max(1, Math.floor(q)))
  let remainder = intervals - counts.reduce((a, b) => a + b, 0)
  if (remainder > 0) {
    // Quantize the fractional part so quadrature fp-noise never decides a tie —
    // congruent runs must apportion identically in both endpoints.
    const order = ideal
      .map((q, idx) => [Math.round((q - Math.floor(q)) * 1e9), idx] as const)
      .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    for (let j = 0; j < remainder; j++) counts[order[j % counts.length]![1]]!++
  }
  while (remainder < 0) {
    let bi = 0
    for (let idx = 1; idx < counts.length; idx++) if (counts[idx]! > counts[bi]!) bi = idx
    if (counts[bi]! <= 1) break
    counts[bi]!--
    remainder++
  }

  let w = 0
  for (let r = 0; r < runs.length; r++) {
    const [k0, k1] = runs[r]!
    const cnt = counts[r]!
    const lr = runLen[r]!
    const vi = 6 * (k0 % m)
    out[2 * w] = p[vi]!
    out[2 * w + 1] = p[vi + 1]!
    w++
    let seg = k0
    let acc = 0
    for (let j = 1; j < cnt; j++) {
      const target = (lr * j) / cnt
      while (seg < k1 - 1 && acc + lens[seg % m]! < target) {
        acc += lens[seg % m]!
        seg++
      }
      const k = seg % m
      const ls = lens[k]!
      const t = ls > 1e-12 ? invert(p, k, target - acc, ls) : 0
      point(p, k, t, out, 2 * w)
      w++
    }
  }
  if (!path.closed) {
    const vi = 6 * m
    out[2 * w] = p[vi]!
    out[2 * w + 1] = p[vi + 1]!
  }
  return out
}

/**
 * Resample a cubic subpath, carrying its closed flag.
 *
 * @param path Source cubic subpath.
 * @param n Number of samples.
 * @param cornerThreshold Angular threshold for corner detection.
 * @returns The sampled subpath.
 */
export function samplePath(path: CubicPath, n = 96, cornerThreshold = CORNER_THRESHOLD): SampledPath {
  return { pts: resamplePath(path, n, cornerThreshold), closed: path.closed }
}
