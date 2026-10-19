import { describe, expect, it } from 'vitest'
import { createClock } from './createClock'

describe('createClock', () => {
  it('reads only a 24-hour HH:mm model', () => {
    const clock = createClock('en-US', 'h23')

    expect(clock.parse('00:00')).toEqual({ hours: 0, minutes: 0 })
    expect(clock.parse('9:05')).toEqual({ hours: 9, minutes: 5 })
    expect(clock.parse('24:00')).toBeNull()
    expect(clock.parse('12:60')).toBeNull()
    expect(clock.parse('noon')).toBeNull()
    expect(clock.format({ hours: 7, minutes: 3 })).toBe('07:03')
  })

  it('shows midnight and noon as 12 with their periods in a 12-hour cycle', () => {
    const clock = createClock('en-US', 'h12')

    expect([clock.faceHour(0), clock.periodOf(0)]).toEqual([12, 'am'])
    expect([clock.faceHour(12), clock.periodOf(12)]).toEqual([12, 'pm'])
    expect(clock.toHours(12, 'am')).toBe(0)
    expect(clock.toHours(12, 'pm')).toBe(12)
    expect(clock.toHours(9, 'pm')).toBe(21)
  })

  it('takes the cycle from the locale only when asked to', () => {
    expect(createClock('en-US', 'auto').cycle).toBe('h12')
    expect(createClock('de-DE', 'auto').cycle).toBe('h23')
    expect(createClock('en-US').cycle).toBe('h23')
  })

  it('reads a typed part strictly, inside the cycle\'s range', () => {
    const h12 = createClock('en-US', 'h12')
    const h23 = createClock('en-US', 'h23')

    expect(h12.readTyped('hours', '0')).toBeNull()
    expect(h12.readTyped('hours', '12')).toBe(12)
    expect(h23.readTyped('hours', '0')).toBe(0)
    expect(h23.readTyped('hours', '75')).toBeNull()
    expect(h23.readTyped('minutes', '5e')).toBeNull()
    expect(h23.readTyped('minutes', '59')).toBe(59)
  })

  it('maps the dial both ways at its edges', () => {
    const clock = createClock('en-US', 'h23')

    expect(clock.angleOf('hours', { hours: 15, minutes: 0 })).toBe(90)
    expect(clock.angleOf('minutes', { hours: 0, minutes: 59 })).toBe(354)
    expect(clock.valueAt('minutes', 357, false, 'am')).toBe(0)
    expect(clock.valueAt('minutes', -3, false, 'am')).toBe(0)
    expect(clock.valueAt('hours', 0, true, 'am')).toBe(12)
    expect(clock.valueAt('hours', 0, false, 'am')).toBe(0)
    expect(createClock('en-US', 'h12').valueAt('hours', 0, false, 'pm')).toBe(12)
  })

  it('puts the hours past noon on the inner ring of a 24-hour face', () => {
    const clock = createClock('en-US', 'h23')
    const numbers = clock.numbers('hours')

    expect(numbers).toHaveLength(24)
    expect(numbers.find(number => number.value === 0)!.label).toBe('00')
    expect(numbers.find(number => number.value === 14)!.inner).toBe(true)
    expect(clock.isInner('hours', { hours: 14, minutes: 0 })).toBe(true)
    expect(clock.isInner('minutes', { hours: 14, minutes: 0 })).toBe(false)
  })

  it('names the periods and the value in the locale\'s words', () => {
    const clock = createClock('en-US', 'h12')

    expect(clock.periods).toEqual({ am: 'AM', pm: 'PM' })
    expect(clock.valueText('hours', { hours: 21, minutes: 0 })).toBe('9 PM')
    expect(clock.valueText('minutes', { hours: 21, minutes: 30 })).toBe('30 minutes')
    expect(createClock('en-US', 'h23').valueText('hours', { hours: 21, minutes: 0 })).toBe('21 hours')
  })

  it('writes the face in the locale\'s digits', () => {
    expect(createClock('ar-EG', 'h23').digits(9, 2)).toBe('٠٩')
  })
})
