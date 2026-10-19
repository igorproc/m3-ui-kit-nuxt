import { describe, it, expect } from 'vitest'
import { toLogicalScrollLeft, toPhysicalScrollLeft } from '../logicalScroll'
import type { InlineDirection } from '../logicalScroll'

describe('logical inline scroll', () => {
  it.each<[number, InlineDirection, number]>([
    [0, 'ltr', 0],
    [120, 'ltr', 120],
    [-8, 'ltr', 0],
    [0, 'rtl', 0],
    [-120, 'rtl', 120],
    [8, 'rtl', 0],
  ])('reads scrollLeft %d in %s as logical offset %d', (scrollLeft, direction, logical) => {
    expect(toLogicalScrollLeft(scrollLeft, direction)).toBe(logical)
  })

  it.each<[number, InlineDirection, number]>([
    [0, 'ltr', 0],
    [120, 'ltr', 120],
    [-8, 'ltr', 0],
    [0, 'rtl', 0],
    [120, 'rtl', -120],
    [-8, 'rtl', 0],
  ])('writes logical offset %d in %s as scrollLeft %d', (offset, direction, scrollLeft) => {
    expect(toPhysicalScrollLeft(offset, direction)).toBe(scrollLeft)
  })

  it('round-trips a logical offset through both directions', () => {
    for (const direction of ['ltr', 'rtl'] as const) {
      for (const offset of [0, 1, 250.5, 4800]) {
        expect(toLogicalScrollLeft(toPhysicalScrollLeft(offset, direction), direction)).toBe(offset)
      }
    }
  })
})
