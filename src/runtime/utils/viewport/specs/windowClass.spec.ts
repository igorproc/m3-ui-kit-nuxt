import { describe, expect, it } from 'vitest'
import { DEFAULT_BREAKPOINTS } from '../../../shared/constants/breakpoints'
import { resolveBreakpoints } from '../resolveBreakpoints'
import { resolveWindowClass } from '../windowClass'
import type { WindowClassFlags } from '../windowClass'

const active = (flags: WindowClassFlags) => Object.entries(flags).filter(([, on]) => on).map(([name]) => name)

describe('resolveWindowClass', () => {
  // The classes follow the ranges m-layout carves by (`tablet-xs`, `desktop-xs`,
  // `desktop`), not M3's own 600 / 840 / 1600: a navigation chosen by class must
  // never disagree with the zones the layout keeps.
  it.each([
    [320, ['compact']],
    [767, ['compact']],
    [768, ['medium', 'expanded']],
    [1199, ['medium', 'expanded']],
    [1200, ['large']],
    [1919, ['large']],
    [1920, ['extraLarge']],
    [2560, ['extraLarge']],
  ])('a %ipx window is %j', (width, classes) => {
    expect(active(resolveWindowClass(width, resolveBreakpoints()))).toEqual(classes)
  })

  it('has no boundary at 600 or 840: medium and expanded are one kit range', () => {
    const at = (width: number) => resolveWindowClass(width, resolveBreakpoints())

    expect(at(600).compact).toBe(true)
    expect(at(840)).toEqual(at(1000))
    expect(at(1000).medium).toBe(at(1000).expanded)
  })

  it('moves with configured breakpoints', () => {
    const breakpoints = resolveBreakpoints({ 'tablet-xs': 600, 'desktop-xs': 1024, 'desktop': 1600 })

    expect(active(resolveWindowClass(599, breakpoints))).toEqual(['compact'])
    expect(active(resolveWindowClass(600, breakpoints))).toEqual(['medium', 'expanded'])
    expect(active(resolveWindowClass(1024, breakpoints))).toEqual(['large'])
    expect(active(resolveWindowClass(1600, breakpoints))).toEqual(['extraLarge'])
  })

  it('marks exactly one kit range at every width', () => {
    for (let width = 0; width <= 2400; width += 7) {
      const flags = resolveWindowClass(width, resolveBreakpoints())
      const ranges = [flags.compact, flags.medium, flags.large, flags.extraLarge].filter(Boolean)

      expect(ranges, String(width)).toHaveLength(1)
    }
  })

  it('reads the default thresholds the layout reads', () => {
    expect(resolveWindowClass(DEFAULT_BREAKPOINTS['tablet-xs'] - 1, resolveBreakpoints()).compact).toBe(true)
    expect(resolveWindowClass(DEFAULT_BREAKPOINTS['desktop-xs'], resolveBreakpoints()).large).toBe(true)
  })
})
