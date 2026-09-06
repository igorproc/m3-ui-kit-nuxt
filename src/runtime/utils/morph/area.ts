/**
 * @module utils/morph/area
 *
 * @remarks
 * Area conservation for a morphing contour. Interpolating two rings point by
 * point does not preserve the region they enclose — a circle crossing to a
 * clover visibly deflates halfway — so the eye reads the shape as a drawing
 * that shrinks rather than a substance that deforms.
 *
 * The signed area of a closed polyline is Green's theorem reduced to the
 * shoelace sum, exact for the polyline the morph actually emits and linear in
 * the point count, so correcting it costs one extra pass per frame.
 */

/**
 * Enclosed area of a closed ring of flat points.
 *
 * @param pts Flat points `[x0,y0, x1,y1, …]` forming a closed ring.
 * @returns The unsigned area.
 */
export function ringArea(pts: Float64Array): number {
  const n = pts.length / 2
  let twice = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    twice += pts[2 * i]! * pts[2 * j + 1]! - pts[2 * j]! * pts[2 * i + 1]!
  }
  return Math.abs(twice) / 2
}

/**
 * Scale a ring about a centre so it encloses `target`.
 *
 * @param pts Flat points, modified in place.
 * @param target Wanted area. Non-positive targets are ignored.
 * @param cx Centre x.
 * @param cy Centre y.
 */
export function scaleToArea(
  pts: Float64Array,
  target: number,
  cx: number,
  cy: number,
): void {
  if (!(target > 0)) return

  const current = ringArea(pts)
  if (!(current > 1e-9)) return

  const k = Math.sqrt(target / current)
  const n = pts.length / 2
  for (let i = 0; i < n; i++) {
    pts[2 * i] = cx + (pts[2 * i]! - cx) * k
    pts[2 * i + 1] = cy + (pts[2 * i + 1]! - cy) * k
  }
}
