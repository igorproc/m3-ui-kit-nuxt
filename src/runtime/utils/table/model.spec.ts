import { describe, expect, it } from 'vitest'
import { getTablePageRange, nextTableSort, resolveTableBody, tableAriaSort } from './model'

type Row = { id: number, name: string, age: number }

describe('resolveTableBody', () => {
  it.each([
    // loading, error,            rows, message,   refreshing
    [false, undefined, 3, null, false],
    [false, undefined, 0, 'empty', false],
    [true, undefined, 0, 'loading', false],
    [true, undefined, 3, null, true],
    [false, true, 0, 'error', false],
    [false, 'Could not load', 0, 'error', false],
    [false, 'Page 3 failed', 3, 'error', false],
    [true, 'Could not load', 0, 'loading', false],
    [true, true, 3, null, true],
    [false, false, 0, 'empty', false],
    [false, '', 2, null, false],
  ] as const)('loading %s, error %s, %i rows → %s (refreshing %s)', (loading, error, rowCount, message, refreshing) => {
    expect(resolveTableBody({ loading, error, rowCount })).toEqual({ message, refreshing })
  })
})

describe('getTablePageRange', () => {
  it('spans the rows of a middle page', () => {
    expect(getTablePageRange(2, 10, 42)).toEqual({ start: 11, end: 20, total: 42, page: 2, pageCount: 5, pageSize: 10 })
  })

  it('ends the last page at the total', () => {
    expect(getTablePageRange(5, 10, 42)).toMatchObject({ start: 41, end: 42, page: 5 })
  })

  it('clamps a page beyond the count and below the first', () => {
    expect(getTablePageRange(9, 10, 42)).toMatchObject({ page: 5, start: 41, end: 42 })
    expect(getTablePageRange(0, 10, 42)).toMatchObject({ page: 1, start: 1, end: 10 })
  })

  it('has no rows and no pages for an empty source', () => {
    expect(getTablePageRange(3, 10, 0)).toEqual({ start: 0, end: 0, total: 0, page: 1, pageCount: 0, pageSize: 10 })
  })

  it('treats a page size below one as one', () => {
    expect(getTablePageRange(2, 0, 3)).toMatchObject({ start: 2, end: 2, pageSize: 1, pageCount: 3 })
  })
})

describe('nextTableSort', () => {
  it('cycles a column through ascending, descending and none', () => {
    const asc = nextTableSort<Row>(null, 'name')
    expect(asc).toEqual({ key: 'name', direction: 'asc' })

    const desc = nextTableSort<Row>(asc, 'name')
    expect(desc).toEqual({ key: 'name', direction: 'desc' })

    expect(nextTableSort<Row>(desc, 'name')).toBeNull()
  })

  it('starts another column ascending', () => {
    expect(nextTableSort<Row>({ key: 'name', direction: 'desc' }, 'age')).toEqual({ key: 'age', direction: 'asc' })
  })
})

describe('tableAriaSort', () => {
  it('names the direction of the sorted column only', () => {
    const sort = { key: 'name', direction: 'desc' } as const
    expect(tableAriaSort<Row>(sort, 'name')).toBe('descending')
    expect(tableAriaSort<Row>({ key: 'name', direction: 'asc' }, 'name')).toBe('ascending')
    expect(tableAriaSort<Row>(sort, 'age')).toBe('none')
    expect(tableAriaSort<Row>(null, 'name')).toBe('none')
  })
})
