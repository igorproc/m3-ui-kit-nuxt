import { describe, it, expect } from 'vitest'
import { seedFromPixels, argbPixelsFromImageData } from '#kit/utils/color/imageColor'

describe('argbPixelsFromImageData', () => {
  it('converts opaque RGBA bytes to ARGB ints and skips transparent pixels', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, // opaque red
      0, 255, 0, 128, // semi-transparent → skipped
      0, 0, 255, 255, // opaque blue
    ])
    expect(argbPixelsFromImageData(data)).toEqual([
      (255 << 24) | (255 << 16),
      (255 << 24) | 255,
    ])
  })
})

describe('seedFromPixels', () => {
  it('returns null for no pixels', () => {
    expect(seedFromPixels([])).toBeNull()
  })

  it('derives a seed HEX from a dominant color', () => {
    const red = (255 << 24) | (200 << 16) | (20 << 8) | 40
    const seed = seedFromPixels(Array.from({ length: 200 }, () => red))
    expect(seed).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
