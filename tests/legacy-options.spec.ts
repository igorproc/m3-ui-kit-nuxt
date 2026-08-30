import { describe, expect, it } from 'vitest'
import { findLegacyThemeOptions, formatLegacyThemeOptions } from '../src/options/legacy'

describe('legacy materialKit options', () => {
  it('detects flat theme keys that moved under `theme`', () => {
    const found = findLegacyThemeOptions({
      themes: [{ key: 'blue', name: 'Blue' }],
      defaultPalette: 'blue',
      breakpoints: {},
    })

    expect(found).toEqual(['themes', 'defaultPalette'])
  })

  it('accepts the current config shape', () => {
    const found = findLegacyThemeOptions({
      theme: { themes: [{ key: 'blue', name: 'Blue' }], default: { palette: 'blue' } },
      breakpoints: {},
      cookie: { theme: {} },
    })

    expect(found).toEqual([])
  })

  it('ignores keys explicitly set to undefined', () => {
    expect(findLegacyThemeOptions({ themes: undefined })).toEqual([])
  })

  it('formats a migration map naming both sides', () => {
    const message = formatLegacyThemeOptions(['themes', 'defaultContrast'])

    expect(message).toContain('materialKit.themes → materialKit.theme.themes')
    expect(message).toContain('materialKit.defaultContrast → materialKit.theme.default.contrast')
  })
})
