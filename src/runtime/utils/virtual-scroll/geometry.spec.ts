import { describe, expect, it } from 'vitest'
import { buildMeasurement, computeRange } from './geometry'

describe('virtual-scroll geometry', () => {
  it('resolves a constant size analytically', () => {
    const measurement = buildMeasurement(100, 20)
    expect(measurement.totalSize).toBe(2000)
    expect(measurement.offsetAt(5)).toBe(100)
    expect(measurement.sizeAt(5)).toBe(20)
    expect(measurement.indexAt(105)).toBe(5)
    expect(measurement.indexAt(2500)).toBe(99)
  })

  it('applies start padding to a constant size', () => {
    const measurement = buildMeasurement(10, 20, 8)
    expect(measurement.offsetAt(0)).toBe(8)
    expect(measurement.offsetAt(1)).toBe(28)
    expect(measurement.totalSize).toBe(8 + 200)
    expect(measurement.indexAt(8)).toBe(0)
    expect(measurement.indexAt(27)).toBe(0)
    expect(measurement.indexAt(28)).toBe(1)
  })

  it('resolves a size function through prefix sums and binary search', () => {
    const sizes = [10, 30, 20, 40]
    const measurement = buildMeasurement(sizes.length, index => sizes[index]!)
    expect(measurement.totalSize).toBe(100)
    expect(measurement.offsetAt(0)).toBe(0)
    expect(measurement.offsetAt(2)).toBe(40)
    expect(measurement.sizeAt(1)).toBe(30)
    // Item boundaries at 0,10,40,60,100.
    expect(measurement.indexAt(0)).toBe(0)
    expect(measurement.indexAt(9)).toBe(0)
    expect(measurement.indexAt(10)).toBe(1)
    expect(measurement.indexAt(59)).toBe(2)
    expect(measurement.indexAt(60)).toBe(3)
  })

  it('expands the visible range by overscan and clamps to count', () => {
    const measurement = buildMeasurement(100, 20)
    // Viewport [200, 300) shows items 10..14; overscan 2 widens to 8..16.
    expect(computeRange(200, 100, measurement, 100, 2)).toEqual({ startIndex: 8, endIndex: 16 })
    // Clamped at the start.
    expect(computeRange(0, 100, measurement, 100, 4)).toEqual({ startIndex: 0, endIndex: 8 })
    // Clamped at the end.
    expect(computeRange(1900, 100, measurement, 100, 4)).toEqual({ startIndex: 91, endIndex: 99 })
  })

  it('returns an empty range for empty or zero-height viewports', () => {
    const measurement = buildMeasurement(0, 20)
    expect(computeRange(0, 100, measurement, 0, 4)).toEqual({ startIndex: 0, endIndex: -1 })
    expect(computeRange(0, 0, buildMeasurement(10, 20), 10, 4)).toEqual({ startIndex: 0, endIndex: -1 })
  })
})
