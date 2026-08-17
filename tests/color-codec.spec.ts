import { describe, expect, it } from 'vitest'
import {
  formatColor,
  formatSupportsAlpha,
  hsvaToRgba,
  isLightColor,
  normalizeSwatch,
  parseColor,
  rgbaToHsla,
  rgbaToHsva,
} from '../src/runtime/shared/utils/color'
import type { RGBA } from '../src/runtime/shared/utils/color'

function rgba(r: number, g: number, b: number, a = 1): RGBA {
  return { r, g, b, a }
}

describe('color codec — parsing', () => {
  it('parses short and full hex, with and without alpha', () => {
    expect(parseColor('#f00')).toEqual({ ok: true, rgba: rgba(255, 0, 0) })
    expect(parseColor('6750A4')).toEqual({ ok: true, rgba: rgba(103, 80, 164) })
    expect(parseColor('#ff000080').ok).toBe(true)
    const withAlpha = parseColor('#ff000080')
    if (withAlpha.ok) expect(withAlpha.rgba.a).toBeCloseTo(0.502, 2)
  })

  it('parses legacy and modern rgb/rgba', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual({ ok: true, rgba: rgba(255, 0, 0) })
    expect(parseColor('rgba(0, 128, 255, 0.5)')).toEqual({ ok: true, rgba: rgba(0, 128, 255, 0.5) })
    expect(parseColor('rgb(255 0 0 / 0.25)')).toEqual({ ok: true, rgba: rgba(255, 0, 0, 0.25) })
  })

  it('parses hsl/hsla back to rgba', () => {
    const red = parseColor('hsl(0, 100%, 50%)')
    expect(red.ok).toBe(true)
    if (red.ok) {
      expect(red.rgba.r).toBe(255)
      expect(red.rgba.g).toBe(0)
      expect(red.rgba.b).toBe(0)
    }
  })

  it('reports empty and invalid inputs', () => {
    expect(parseColor('')).toEqual({ ok: false, error: 'empty' })
    expect(parseColor('   ')).toEqual({ ok: false, error: 'empty' })
    expect(parseColor(null)).toEqual({ ok: false, error: 'empty' })
    expect(parseColor('not-a-color')).toEqual({ ok: false, error: 'invalid-format' })
    expect(parseColor('rgb(1, 2)')).toEqual({ ok: false, error: 'invalid-format' })
  })
})

describe('color codec — formatting', () => {
  it('formats every family from canonical rgba', () => {
    const purple = rgba(103, 80, 164, 0.5)
    expect(formatColor(purple, 'hex')).toBe('#6750a4')
    expect(formatColor(purple, 'hexa')).toBe('#6750a480')
    expect(formatColor(purple, 'rgb')).toBe('rgb(103, 80, 164)')
    expect(formatColor(purple, 'rgba')).toBe('rgba(103, 80, 164, 0.5)')
    expect(formatColor(rgba(255, 0, 0), 'hsl')).toBe('hsl(0, 100%, 50%)')
  })

  it('round-trips hex through parse → format', () => {
    const parsed = parseColor('#3f51b5')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(formatColor(parsed.rgba, 'hex')).toBe('#3f51b5')
  })

  it('knows which formats carry alpha', () => {
    expect(formatSupportsAlpha('hex')).toBe(false)
    expect(formatSupportsAlpha('rgb')).toBe(false)
    expect(formatSupportsAlpha('hexa')).toBe(true)
    expect(formatSupportsAlpha('rgba')).toBe(true)
    expect(formatSupportsAlpha('hsla')).toBe(true)
  })
})

describe('color codec — conversions', () => {
  it('round-trips rgba → hsva → rgba', () => {
    const source = rgba(103, 80, 164, 0.8)
    const back = hsvaToRgba(rgbaToHsva(source))
    expect(back.r).toBeCloseTo(source.r, 0)
    expect(back.g).toBeCloseTo(source.g, 0)
    expect(back.b).toBeCloseTo(source.b, 0)
    expect(back.a).toBeCloseTo(source.a, 2)
  })

  it('derives hsl for a known color', () => {
    const hsl = rgbaToHsla(rgba(255, 0, 0))
    expect(hsl.h).toBeCloseTo(0, 0)
    expect(hsl.s).toBeCloseTo(1, 2)
    expect(hsl.l).toBeCloseTo(0.5, 2)
  })
})

describe('color codec — helpers', () => {
  it('classifies light vs dark for contrast', () => {
    expect(isLightColor(rgba(255, 255, 255))).toBe(true)
    expect(isLightColor(rgba(0, 0, 0))).toBe(false)
  })

  it('normalizes swatch entries', () => {
    expect(normalizeSwatch('#fff')).toEqual({ value: '#fff', label: '#fff' })
    expect(normalizeSwatch({ value: '#fff', label: 'White' })).toEqual({ value: '#fff', label: 'White' })
  })
})
