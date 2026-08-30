/**
 * @module utils/morph/serialize
 *
 * @remarks
 * In flight each subpath is emitted as a polyline `M x y L x y …` rounded to
 * two decimals — invisible at icon scale and cheaper than `toFixed`. The
 * frame's only allocation. At rest the caller snaps back to the target's
 * canonical `d` (real curves), so the polyline is never seen static.
 */

const fmt = (v: number): string => String(Math.round(v * 100) / 100)

/**
 * Serialize a flat point buffer to a polyline `d` attribute.
 *
 * @param pts Flat points `[x0,y0, x1,y1, …]`.
 * @param closed Append `Z` when the subpath is a closed loop.
 * @returns The `d` string.
 */
export function serialize(pts: Float64Array, closed: boolean): string {
  const n = pts.length / 2
  let d = `M${fmt(pts[0]!)} ${fmt(pts[1]!)}`
  for (let i = 1; i < n; i++) d += `L${fmt(pts[2 * i]!)} ${fmt(pts[2 * i + 1]!)}`
  if (closed) d += 'Z'
  return d
}
