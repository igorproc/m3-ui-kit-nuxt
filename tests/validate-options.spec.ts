import { describe, expect, it } from 'vitest'
import { findUndeclaredDefaultPalette } from '../src/options/validate'

describe('default palette validation', () => {
  it('accepts a default that is declared', () => {
    const result = findUndeclaredDefaultPalette({
      theme: {
        themes: [{ key: 'blue', name: 'Blue' }, { key: 'forest', name: 'Forest' }],
        default: { palette: 'forest' },
      },
    })

    expect(result).toBeNull()
  })

  it('reports a default that is missing from themes, listing what is declared', () => {
    const result = findUndeclaredDefaultPalette({
      theme: {
        themes: [{ key: 'blue', name: 'Blue' }, { key: 'forest', name: 'Forest' }],
        default: { palette: 'forrest' },
      },
    })

    expect(result).toEqual({ palette: 'forrest', declared: ['blue', 'forest'] })
  })

  it('reports an empty theme list rather than passing silently', () => {
    const result = findUndeclaredDefaultPalette({ theme: { default: { palette: 'blue' } } })

    expect(result).toEqual({ palette: 'blue', declared: [] })
  })

  it('stays quiet when no default palette is configured', () => {
    expect(findUndeclaredDefaultPalette({ theme: { themes: [{ key: 'blue', name: 'Blue' }] } })).toBeNull()
    expect(findUndeclaredDefaultPalette({})).toBeNull()
  })
})
