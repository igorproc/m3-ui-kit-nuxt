import { describe, expect, it } from 'vitest'
import { ratingValueAt } from './pointer'
import type { RatingItemBox } from './pointer'

// Five 48 cells, gap 4, a 32 glyph centred in each: cell i spans 52i … 52i + 48.
const CELL = 48
const GAP = 4
const INSET = 8

function row(rtl = false, length = 5): RatingItemBox[] {
  const width = length * CELL + (length - 1) * GAP

  return Array.from({ length }, (_, index) => {
    const start = index * (CELL + GAP)
    const left = rtl ? width - start - CELL : start

    return {
      cell: { left, right: left + CELL },
      glyph: { left: left + INSET, right: left + CELL - INSET, width: CELL - 2 * INSET },
    }
  })
}

const ltr = { rtl: false, step: 1, length: 5 }

describe('ratingValueAt', () => {
  it('fills the item under the pointer, from its first edge', () => {
    expect(ratingValueAt(row(), 1, ltr)).toBe(1)
    expect(ratingValueAt(row(), 52 * 2 + 9, ltr)).toBe(3)
    expect(ratingValueAt(row(), 52 * 2 + 47, ltr)).toBe(3)
  })

  it('gives a gap to the item before it', () => {
    expect(ratingValueAt(row(), 50, ltr)).toBe(1)
  })

  it('measures a half step over the glyph the fill clips, not over the cell', () => {
    const half = { ...ltr, step: 0.5 }
    const glyphStart = 52 * 2 + INSET

    expect(ratingValueAt(row(), 52 * 2 + 2, half)).toBe(2.5)
    expect(ratingValueAt(row(), glyphStart + 15, half)).toBe(2.5)
    expect(ratingValueAt(row(), glyphStart + 17, half)).toBe(3)
  })

  it('rounds a quarter step up', () => {
    expect(ratingValueAt(row(), INSET + 9, { ...ltr, step: 0.25 })).toBe(0.5)
  })

  it('reads the row from the right in RTL', () => {
    const rtl = { ...ltr, rtl: true }
    const width = 5 * CELL + 4 * GAP

    expect(ratingValueAt(row(true), width - 1, rtl)).toBe(1)
    expect(ratingValueAt(row(true), 1, rtl)).toBe(5)
    expect(ratingValueAt(row(true), width - INSET - 10, { ...rtl, step: 0.5 })).toBe(0.5)
  })

  it('stays inside the scale past either end', () => {
    expect(ratingValueAt(row(), -20, ltr)).toBe(1)
    expect(ratingValueAt(row(), 400, ltr)).toBe(5)
  })

  it('is zero without items to point at', () => {
    expect(ratingValueAt([], 10, ltr)).toBe(0)
  })
})
