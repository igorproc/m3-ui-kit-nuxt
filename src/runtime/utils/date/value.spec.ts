import { describe, expect, it } from 'vitest'
import { toDate, toDayString, toModelValue } from './value'

describe('date model values', () => {
  it('reads a day string as local midnight, whatever the time zone', () => {
    const date = toDate('2026-10-14')!

    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 9, 14, 0])
  })

  it('reads empty and unreadable values as nothing', () => {
    expect(toDate(null)).toBeNull()
    expect(toDate('')).toBeNull()
    expect(toDate('not a date')).toBeNull()
  })

  it.each([
    ['a day string', '2026-01-01', '2026-10-20'],
    ['a timestamp', 0, new Date(2026, 9, 20).getTime()],
    ['a Date', new Date(2026, 0, 1), new Date(2026, 9, 20)],
    ['nothing yet', null, new Date(2026, 9, 20)],
  ])('writes back in the type the model came in: %s', (_, like, expected) => {
    expect(toModelValue(new Date(2026, 9, 20), like)).toEqual(expected)
  })

  it('writes nothing for no date', () => {
    expect(toModelValue(null, '2026-10-14')).toBeNull()
  })

  it('formats the day a form submits', () => {
    expect(toDayString(new Date(2026, 9, 4))).toBe('2026-10-04')
    expect(toDayString(null)).toBe('')
  })
})
