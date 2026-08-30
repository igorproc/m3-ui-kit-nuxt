/**
 * @module utils/morph/parse
 *
 * @remarks
 * Minimal, deterministic SVG path parser for the morph core. Handles the
 * command set our generated shape assets and single-path morph icons use —
 * absolute `M L H V C Z` — and stores every segment as a cubic (lines become
 * degenerate cubics) so downstream sampling is uniform. Anything else (a
 * second subpath, relative commands, arcs) throws loudly: these are internal
 * authored assets, so a silent approximation would hide an authoring mistake.
 */

// Types
import type { CubicPath } from './types'

/** A command letter or a signed decimal/exponent number token. */
const TOKEN = /[a-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi

const isCommand = (token: string): boolean => /[a-z]/i.test(token)

/**
 * Parse a single-subpath SVG path string into a {@link CubicPath}.
 *
 * @param d The `d` attribute value (absolute `M L H V C Z` commands).
 * @returns Flat cubic control points plus the closed flag.
 */
export function parsePath(d: string): CubicPath {
  const tokens = d.match(TOKEN)
  if (!tokens || tokens.length === 0) throw new Error('morph: empty path')

  const anchors: number[] = []
  let i = 0
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  let closed = false
  let started = false

  const hasNumber = (): boolean => i < tokens.length && !isCommand(tokens[i]!)

  const num = (): number => {
    const value = Number(tokens[i++])
    if (Number.isNaN(value)) throw new Error('morph: malformed number in path')
    return value
  }

  const lineTo = (x: number, y: number): void => {
    // A straight edge as a cubic with collinear controls at the thirds.
    anchors.push(
      cx + (x - cx) / 3,
      cy + (y - cy) / 3,
      cx + (2 * (x - cx)) / 3,
      cy + (2 * (y - cy)) / 3,
      x,
      y,
    )
    cx = x
    cy = y
  }

  while (i < tokens.length) {
    const command = tokens[i]!
    if (!isCommand(command)) throw new Error(`morph: expected a command, got '${command}'`)
    i++

    switch (command) {
      case 'M': {
        if (started) throw new Error('morph: multi-subpath paths are not supported yet')
        cx = num()
        cy = num()
        sx = cx
        sy = cy
        anchors.push(cx, cy)
        started = true
        // Extra coordinate pairs after an M are implicit line-tos (SVG spec).
        while (hasNumber()) lineTo(num(), num())
        break
      }
      case 'L':
        while (hasNumber()) lineTo(num(), num())
        break
      case 'H':
        while (hasNumber()) lineTo(num(), cy)
        break
      case 'V':
        while (hasNumber()) lineTo(cx, num())
        break
      case 'C':
        while (hasNumber()) {
          const c1x = num()
          const c1y = num()
          const c2x = num()
          const c2y = num()
          const x = num()
          const y = num()
          anchors.push(c1x, c1y, c2x, c2y, x, y)
          cx = x
          cy = y
        }
        break
      case 'Z':
      case 'z':
        closed = true
        break
      default:
        throw new Error(`morph: unsupported command '${command}' (only absolute M L H V C Z)`)
    }
  }

  if (!started) throw new Error('morph: path has no move command')

  // Materialize the closing edge so the ring is a full loop of cubics.
  if (closed && (cx !== sx || cy !== sy)) lineTo(sx, sy)

  return { pts: new Float64Array(anchors), closed }
}
