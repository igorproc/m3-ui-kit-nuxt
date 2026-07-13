import { describe, expect, it } from 'vitest'
import { createNumberCodec, precisionFromStep, roundDecimal } from '../shared/utils/number'

describe('number codec', () => {
  it('parses and formats locale decimal/group symbols', () => {
    const codec = createNumberCodec({ locale: 'de-DE', precision: 2 })

    expect(codec.parse('1.234,5')).toEqual({ ok: true, value: 1234.5 })
    expect(codec.format(1234.5)).toBe('1.234,5')
    expect(codec.format(1234.5, 'edit')).toBe('1234,5')
  })

  it('keeps empty and incomplete drafts distinct', () => {
    const codec = createNumberCodec({ locale: 'en-US' })

    expect(codec.parse('')).toEqual({ ok: false, reason: 'empty' })
    expect(codec.parse('-')).toEqual({ ok: false, reason: 'incomplete' })
    expect(codec.parse('12.')).toEqual({ ok: false, reason: 'incomplete' })
    expect(codec.parse('nope')).toEqual({ ok: false, reason: 'invalid' })
  })

  it('derives precision and rounds without common float drift', () => {
    expect(precisionFromStep(0.01)).toBe(2)
    expect(roundDecimal(0.1 + 0.2, 2)).toBe(0.3)
  })
})
