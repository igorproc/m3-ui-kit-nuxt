import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { useProgress } from './useProgress'
import type { UseProgressProps } from './useProgress'
import { CIRCULAR_PROGRESS } from './circularTokens'

const geometry = (props: Partial<UseProgressProps> = {}) =>
  useProgress(reactive({ value: 0, indeterminate: false, density: 'default', shape: 'flat', max: 100, ...props }))

describe('useProgress', () => {
  it.each([
    [-20, 0],
    [40, 40],
    [140, 100],
  ])('clamps %i to %i', (value, clamped) => {
    expect(geometry({ value }).clampedValue.value).toBe(clamped)
  })

  it.each([
    [100 / 3, 100, 33],
    [3, 7, 3],
    [1 / 3, 1, 0.33],
    [2.54, 10, 2.5],
    [333.3, 1000, 333],
  ])('reads %d of %d as %d', (value, max, now) => {
    expect(geometry({ value, max }).valueNow.value).toBe(now)
  })

  // Server and browser compute the trigonometry to different last digits; an
  // unrounded `d` breaks hydration of the expressive ring.
  it('writes the wavy ring with at most three decimals', () => {
    const d = geometry({ shape: 'wavy' }).circularPath.value
    const numbers = d.match(/-?\d+(\.\d+)?/g)!

    expect(numbers.length).toBeGreaterThan(200)
    expect(numbers.every(n => (n.split('.')[1] ?? '').length <= 3)).toBe(true)
  })

  it('swings the wavy ring by the Compose amplitude around the radius', () => {
    const { radius, box, wave } = CIRCULAR_PROGRESS
    const d = geometry({ shape: 'wavy' }).circularPath.value
    const points = Array.from(d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g), ([, x, y]) => Math.hypot(Number(x) - box / 2, Number(y) - box / 2))

    expect(Math.max(...points)).toBeCloseTo(radius + wave.amplitude, 1)
    expect(Math.min(...points)).toBeCloseTo(radius - wave.amplitude, 1)
  })

  it('measures the wavy ring longer than the flat one', () => {
    const flat = geometry().totalPathLength.value
    const wavy = geometry({ shape: 'wavy' }).totalPathLength.value

    expect(flat).toBeCloseTo(2 * Math.PI * CIRCULAR_PROGRESS.radius)
    expect(wavy).toBeGreaterThan(flat)
  })

  it.each([
    ['compact', 'flat', 3],
    ['default', 'flat', 4],
    ['comfortable', 'flat', 4],
    ['default', 'wavy', 4],
  ] as const)('strokes %s (%s) at %i', (density, shape, width) => {
    expect(geometry({ density, shape }).strokeWidth.value).toBe(width)
  })

  it('leaves the unfilled share of the ring as the dash offset', () => {
    const { dashOffset, totalPathLength } = geometry({ value: 75 })

    expect(dashOffset.value).toBeCloseTo(totalPathLength.value * 0.25)
  })

  it('keeps a quarter arc while indeterminate', () => {
    const { dashOffset, totalPathLength } = geometry({ indeterminate: true, value: 90 })

    expect(dashOffset.value).toBeCloseTo(totalPathLength.value * 0.25)
  })

  it('grows the gap with a small value instead of opening it in full', () => {
    const { trackDashOffset, totalPathLength } = geometry({ value: 1 })
    const valueLength = totalPathLength.value / 100

    expect(trackDashOffset.value).toBeCloseTo(-2 * valueLength)
  })

  it('draws the whole track with nothing done', () => {
    const { trackLength, trackDashOffset, totalPathLength } = geometry({ value: 0 })

    expect(trackLength.value).toBeCloseTo(totalPathLength.value)
    expect(trackDashOffset.value).toBeCloseTo(0)
  })
})
