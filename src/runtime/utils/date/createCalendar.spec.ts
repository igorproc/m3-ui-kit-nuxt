import { describe, expect, it } from 'vitest'
import { createCalendar } from './createCalendar'

const day = (year: number, month: number, date: number) => new Date(year, month - 1, date)
const iso = (date: Date | null) => date
  ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  : null

describe('createCalendar', () => {
  describe('first day of the week', () => {
    it.each([
      ['en-US', 0],
      ['de-DE', 1],
      ['ru-RU', 1],
    ])('reads %s as %i', (locale, firstDay) => {
      expect(createCalendar(locale).firstDay).toBe(firstDay)
    })
  })

  describe('month grid', () => {
    it('always has six weeks of seven, so the height never jumps', () => {
      for (const month of [day(2026, 2, 1), day(2026, 8, 1), day(2015, 2, 1)]) {
        const grid = createCalendar('en-US').monthGrid(month)
        expect(grid).toHaveLength(6)
        expect(grid.every(week => week.length === 7)).toBe(true)
      }
    })

    it('draws no day of a neighbouring month', () => {
      const grid = createCalendar('en-US').monthGrid(day(2026, 10, 1)).flat()
      const days = grid.filter(Boolean) as Date[]

      expect(days).toHaveLength(31)
      expect(days.every(date => date.getMonth() === 9)).toBe(true)
    })

    it('starts the week where the locale does', () => {
      // 1 October 2026 is a Thursday.
      expect(createCalendar('en-US').monthGrid(day(2026, 10, 1))[0]!.indexOf(null)).toBe(0)
      expect(createCalendar('en-US').monthGrid(day(2026, 10, 1))[0]!.findIndex(Boolean)).toBe(4)
      expect(createCalendar('de-DE').monthGrid(day(2026, 10, 1))[0]!.findIndex(Boolean)).toBe(3)
    })

    it('handles a leap February', () => {
      const days = createCalendar('en-US').monthGrid(day(2028, 2, 1)).flat().filter(Boolean)
      expect(days).toHaveLength(29)
    })
  })

  describe('keyboard steps', () => {
    const calendar = createCalendar('en-US')

    it('crosses into the next month with an arrow', () => {
      expect(iso(calendar.step(day(2026, 10, 31), 'ArrowRight'))).toBe('2026-11-01')
      expect(iso(calendar.step(day(2026, 10, 1), 'ArrowUp'))).toBe('2026-09-24')
    })

    it('mirrors left and right in RTL', () => {
      expect(iso(calendar.step(day(2026, 10, 14), 'ArrowLeft', { rtl: true }))).toBe('2026-10-15')
    })

    it('keeps the day on a month step, clamped to the month\'s end', () => {
      expect(iso(calendar.step(day(2026, 1, 31), 'PageDown'))).toBe('2026-02-28')
      expect(iso(calendar.step(day(2026, 3, 31), 'PageUp'))).toBe('2026-02-28')
    })

    it('moves a year with Shift', () => {
      expect(iso(calendar.step(day(2028, 2, 29), 'PageDown', { shift: true }))).toBe('2029-02-28')
    })

    it('goes to the start and the end of the locale\'s week', () => {
      expect(iso(calendar.step(day(2026, 10, 14), 'Home'))).toBe('2026-10-11')
      expect(iso(createCalendar('de-DE').step(day(2026, 10, 14), 'End'))).toBe('2026-10-18')
    })
  })

  describe('bounds', () => {
    it('compares by day', () => {
      const calendar = createCalendar('en-US')
      const bounds = { min: new Date(2026, 9, 10, 18), max: day(2026, 10, 20) }

      expect(calendar.isOutside(day(2026, 10, 10), bounds)).toBe(false)
      expect(calendar.isOutside(day(2026, 10, 9), bounds)).toBe(true)
      expect(calendar.isOutside(day(2026, 10, 21), bounds)).toBe(true)
    })
  })

  describe('text', () => {
    it('names months, headlines and days in the locale', () => {
      const date = day(2026, 10, 14)

      expect(createCalendar('en-US').monthYear(date)).toBe('October 2026')
      expect(createCalendar('en-US').headline(date)).toBe('Oct 14, 2026')
      expect(createCalendar('en-US').fullDate(date)).toBe('Wednesday, October 14, 2026')
      expect(createCalendar('de-DE').monthYear(date)).toBe('Oktober 2026')
    })

    it('lists weekday letters from the locale\'s first day', () => {
      expect(createCalendar('en-US').weekdays().map(day => day.narrow).join('')).toBe('SMTWTFS')
      expect(createCalendar('de-DE').weekdays()[0]!.long).toBe('Montag')
    })

    it('reads the numeric layout of a locale', () => {
      expect(createCalendar('en-US').numericLayout()).toEqual({ order: ['month', 'day', 'year'], separator: '/' })
      expect(createCalendar('de-DE').numericLayout()).toEqual({ order: ['day', 'month', 'year'], separator: '.' })
    })
  })

  describe('parse', () => {
    it('reads the locale\'s order with any separator', () => {
      expect(iso(createCalendar('de-DE').parse('14 10 2026'))).toBe('2026-10-14')
      expect(iso(createCalendar('de-DE').parse('14.10.26'))).toBe('2026-10-14')
      expect(iso(createCalendar('en-US').parse('10/14/2026'))).toBe('2026-10-14')
    })

    it('refuses what is not a real date', () => {
      expect(createCalendar('en-US').parse('02/31/2026')).toBeNull()
      expect(createCalendar('en-US').parse('14/10')).toBeNull()
      expect(createCalendar('en-US').parse('not a date')).toBeNull()
    })
  })
})
