/**
 * Geometry shared by the CRM demo charts (inline SVG, no chart library).
 */

/** A bar with a rounded data end and a square baseline end, growing rightwards. */
export function horizontalBarPath(x: number, y: number, width: number, height: number, radius = 4): string {
  const r = Math.max(0, Math.min(radius, width, height / 2))
  return `M${x},${y}h${width - r}a${r},${r} 0 0 1 ${r},${r}v${height - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${r - width}z`
}

/** The smallest "round" number (1, 2, 2.5, 5 × 10ⁿ) not below `value`. */
export function niceCeiling(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find(candidate => candidate * magnitude >= value) ?? 10
  return step * magnitude
}

export interface ChartPoint {
  x: number
  y: number
}

export function linePath(points: readonly ChartPoint[]): string {
  return points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join('')
}

/** The line closed down to the baseline: the area under it. */
export function areaPath(points: readonly ChartPoint[], baseline: number): string {
  const first = points[0]
  const last = points.at(-1)
  if (!first || !last) return ''
  return `${linePath(points)}L${last.x.toFixed(1)},${baseline}L${first.x.toFixed(1)},${baseline}Z`
}

/** CSS colour of an M3 role, for SVG `fill` / `stroke`. */
export const roleColor = (role: string) => `var(--md-sys-color-${role})`
