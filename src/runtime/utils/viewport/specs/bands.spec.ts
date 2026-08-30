import { describe, it, expect } from 'vitest'
import { sortBreakpoints, resolveBandsFromSorted } from '../bands'

// Docs-like config: mobile-xs is a real bucket (320), not a degenerate 0-floor.
const BREAKPOINTS = {
  'mobile-xs': 320,
  'mobile': 600,
  'tablet-xs': 905,
  'tablet': 1240,
  'desktop-xs': 1440,
  'desktop': 1920,
}

// Mirrors what `createBreakpoints` does: sort once, then band per width.
const resolveBands = (width: number, breakpoints: Record<string, number> = BREAKPOINTS) =>
  resolveBandsFromSorted(width, sortBreakpoints(breakpoints))

describe('breakpoint bands', () => {
  it('keeps mobileXs as a real is-bucket (camelCased key present)', () => {
    const { is } = resolveBands(200, BREAKPOINTS)
    expect('mobileXs' in is).toBe(true)
    // width 200 ∈ [0, 320] → the floor bucket is active
    expect(is.mobileXs).toBe(true)
    expect(is.mobile).toBe(false)
  })

  it('marks exactly the active bucket (prev < width <= value)', () => {
    const { is } = resolveBands(500, BREAKPOINTS)
    // 500 ∈ (320, 600] → mobile
    expect(is.mobile).toBe(true)
    expect(is.mobileXs).toBe(false)
    expect(is.tabletXs).toBe(false)
  })

  it('more/less are strict (dead-zone exactly on a breakpoint value)', () => {
    const { more, less } = resolveBands(600, BREAKPOINTS)
    expect(more.mobile).toBe(false)
    expect(less.mobile).toBe(false)

    const wide = resolveBands(700, BREAKPOINTS)
    expect(wide.more.mobile).toBe(true)
    expect(wide.less.mobile).toBe(false)
  })

  it('emits every reserved key in all three maps (camelCased)', () => {
    const { is, more, less } = resolveBands(800, BREAKPOINTS)
    const keys = ['desktop', 'desktopXs', 'tablet', 'tabletXs', 'mobile', 'mobileXs']
    for (const key of keys) {
      expect(key in is).toBe(true)
      expect(key in more).toBe(true)
      expect(key in less).toBe(true)
    }
  })

  it('includes consumer-defined breakpoints in all three maps', () => {
    const { is, more, less } = resolveBands(250, { ...BREAKPOINTS, watch: 200 })
    expect('watch' in is).toBe(true)
    expect(more.watch).toBe(true) // 250 > 200
    expect(less.watch).toBe(false)
  })
})
