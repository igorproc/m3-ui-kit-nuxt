import { describe, expect, it } from 'vitest'
import { createPaginationRange, normalizePage } from './index'
import type { PaginationRangeItem } from './index'

const flat = (range: PaginationRangeItem[]) => range.map(item => item.type === 'page' ? item.page : `…${item.key}`)

describe('createPaginationRange', () => {
  it('renders every page when the length fits', () => {
    expect(flat(createPaginationRange(1, 5, 7))).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps both ends and one ellipsis near the start', () => {
    expect(flat(createPaginationRange(1, 10, 7))).toEqual([1, 2, 3, 4, 5, '…end', 10])
  })

  it('centers the window with two ellipses in the middle', () => {
    expect(flat(createPaginationRange(5, 10, 7))).toEqual([1, '…start', 4, 5, 6, '…end', 10])
  })

  it('keeps both ends and one ellipsis near the end', () => {
    expect(flat(createPaginationRange(10, 10, 7))).toEqual([1, '…start', 6, 7, 8, 9, 10])
  })

  it('never emits an ellipsis that hides a single page', () => {
    const range = createPaginationRange(4, 10, 7)

    expect(range.every(item => item.type !== 'ellipsis' || item.key !== 'start')).toBe(true)
    expect(flat(range)).toEqual([1, 2, 3, 4, 5, '…end', 10])
  })

  it('always produces exactly totalVisible slots for long lists', () => {
    for (const page of [1, 25, 50, 75, 100]) {
      expect(createPaginationRange(page, 100, 9)).toHaveLength(9)
    }
  })

  it('returns no items for zero length', () => {
    expect(createPaginationRange(1, 0, 7)).toEqual([])
  })

  it('clamps totalVisible up to the minimum slot count', () => {
    expect(createPaginationRange(3, 20, 2)).toHaveLength(5)
  })
})

describe('normalizePage', () => {
  it('clamps into [1, length]', () => {
    expect(normalizePage(0, 10)).toBe(1)
    expect(normalizePage(99, 10)).toBe(10)
    expect(normalizePage(4, 10)).toBe(4)
  })

  it('normalizes zero length and non-finite input to 1', () => {
    expect(normalizePage(5, 0)).toBe(1)
    expect(normalizePage(Number.NaN, 10)).toBe(1)
    expect(normalizePage(3.7, 10)).toBe(3)
  })
})
