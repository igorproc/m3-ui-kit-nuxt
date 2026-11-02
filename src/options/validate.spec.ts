import { describe, expect, it } from 'vitest'
import { findInvalidSeeds, findUndeclaredDefaultPalette } from './validate'

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

// B2.4b: a seed the generator cannot parse threw at runtime and was swallowed, leaving
// the palette without a single colour token.
describe('palette seed validation', () => {
  it('reports every theme whose colour is not a HEX seed', () => {
    const result = findInvalidSeeds({
      theme: {
        themes: [
          { key: 'blue', name: 'Blue', color: '#0061A4' },
          { key: 'typo', name: 'Typo', color: '#0061G4' },
          { key: 'named', name: 'Named', color: 'teal' },
          { key: 'scss', name: 'Static', definedInScss: true },
        ],
      },
    })

    expect(result).toEqual([{ key: 'typo', color: '#0061G4' }, { key: 'named', color: 'teal' }])
  })

  it('accepts 3, 6 and 8 digit seeds, with or without #', () => {
    const themes = ['#abc', 'abcdef', '#abcdef80'].map(color => ({ key: color, name: color, color }))

    expect(findInvalidSeeds({ theme: { themes } })).toEqual([])
    expect(findInvalidSeeds({})).toEqual([])
  })
})
