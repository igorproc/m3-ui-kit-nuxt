import { describe, expect, it } from 'vitest'
import { createPathInterpolator } from '#kit/utils/morph'
import { parsePath } from '#kit/utils/morph/parse'
import { samplePath } from '#kit/utils/morph/resample'
import { M3_SHAPES } from '#kit/assets/icon/shapes'

const { circle, square, diamond } = M3_SHAPES

const centroidOf = (d: string): [number, number] => {
  const nums = d.match(/-?\d*\.?\d+/g)!.map(Number)
  let cx = 0
  let cy = 0
  const count = nums.length / 2
  for (let i = 0; i < count; i++) {
    cx += nums[2 * i]!
    cy += nums[2 * i + 1]!
  }
  return [cx / count, cy / count]
}

describe('createPathInterpolator', () => {
  it('returns the canonical d at both endpoints', () => {
    const at = createPathInterpolator(circle, square)
    expect(at(0)).toBe(circle)
    expect(at(1)).toBe(square)
    expect(at(1e-6)).toBe(circle)
    expect(at(1 - 1e-6)).toBe(square)
  })

  it('is deterministic across calls and builds', () => {
    const a = createPathInterpolator(circle, diamond)
    const b = createPathInterpolator(circle, diamond)
    expect(a(0.37)).toBe(b(0.37))
  })

  it('emits a closed polyline mid-flight with the requested sample count', () => {
    const at = createPathInterpolator(circle, square, { samples: 64 })
    const mid = at(0.5)
    expect(mid.endsWith('Z')).toBe(true)
    expect(mid.match(/L/g)!.length).toBe(63)
  })

  it('keeps the shape centered while morphing (no collapse toward a chord)', () => {
    const at = createPathInterpolator(square, diamond)
    const [cx, cy] = centroidOf(at(0.5))
    // Both shapes are centered on the 380 viewBox (~190).
    expect(cx).toBeGreaterThan(160)
    expect(cx).toBeLessThan(220)
    expect(cy).toBeGreaterThan(160)
    expect(cy).toBeLessThan(220)
  })

  it('rejects unsupported path syntax', () => {
    expect(() => parsePath('M0 0 a 5 5 0 0 1 10 10')).toThrow()
    expect(() => parsePath('')).toThrow()
  })
})

describe('samplePath', () => {
  it('samples every M3 shape to exactly N points as a closed ring', () => {
    for (const d of Object.values(M3_SHAPES)) {
      const sampled = samplePath(parsePath(d), 96)
      expect(sampled.closed).toBe(true)
      expect(sampled.pts.length).toBe(2 * 96)
      expect(sampled.pts.every(Number.isFinite)).toBe(true)
    }
  })
})
