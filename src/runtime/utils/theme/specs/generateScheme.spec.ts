import { describe, it, expect } from 'vitest'
import { generateScheme } from '#kit/utils/theme/generateScheme'
import { buildThemeBlocks, schemeToTokens } from '#kit/utils/theme/themeScss'

const SEED = '#6750a4'

describe('generateScheme', () => {
  it('returns null for SCSS-defined or colorless themes', () => {
    expect(generateScheme({ key: 'x', name: 'x', definedInScss: true, color: SEED })).toBeNull()
    expect(generateScheme({ key: 'x', name: 'x' })).toBeNull()
  })

  it('emits the full 2025-spec role set including *-dim', () => {
    const scheme = generateScheme({ key: 't', name: 't', color: SEED })!
    const tokens = schemeToTokens(scheme.light)
    expect(tokens.primary).toBeDefined()
    expect(tokens['surface-container-high']).toBeDefined()
    expect(tokens['primary-dim']).toBeDefined()
    // Current roles the kit uses but `allColors` omits (methods, not the list).
    expect(tokens.shadow).toBeDefined()
    expect(tokens.scrim).toBeDefined()
    // Deprecated `surface-variant` is intentionally not emitted (aliased in the link).
    expect(tokens['surface-variant']).toBeUndefined()
  })

  it('changes role tones with the contrast level', () => {
    const standard = generateScheme({ key: 't', name: 't', color: SEED }, { contrast: 'standard' })!
    const high = generateScheme({ key: 't', name: 't', color: SEED }, { contrast: 'high' })!
    expect(JSON.stringify(schemeToTokens(standard.light))).not.toBe(JSON.stringify(schemeToTokens(high.light)))
  })

  it('changes surface tint with neutralChroma', () => {
    const grey = generateScheme({ key: 't', name: 't', color: SEED, neutralChroma: 0 })!
    const tinted = generateScheme({ key: 't', name: 't', color: SEED, neutralChroma: 32 })!
    expect(schemeToTokens(grey.light).surface).not.toBe(schemeToTokens(tinted.light).surface)
  })

  it('accepts every named variant without throwing', () => {
    for (const variant of ['tonalSpot', 'expressive', 'vibrant', 'neutral', 'monochrome', 'fidelity', 'content', 'rainbow', 'fruitSalad'] as const) {
      const scheme = generateScheme({ key: 't', name: 't', color: SEED, variant })
      expect(scheme?.light).toBeDefined()
    }
  })

  it('generates harmonized semantic roles', () => {
    const scheme = generateScheme(
      { key: 't', name: 't', color: SEED },
      { semanticColors: { success: '#2e7d32', warning: '#ed6c02', info: '#0288d1' } },
    )!
    expect(scheme.semantic).toHaveLength(3)
    const css = buildThemeBlocks('t', scheme)
    expect(css).toContain('--md-sys-color-success:')
    expect(css).toContain('--md-sys-color-on-warning-container:')
    expect(css).toContain('--md-sys-color-info-container:')
  })

  // Q5-А: a seed set to `false` is removed, globally or for one theme.
  it('drops a semantic seed set to false', () => {
    const global = generateScheme({ key: 't', name: 't', color: SEED }, { semanticColors: { success: '#2e7d32', info: false } })!
    expect(global.semantic.map(group => group.color.name)).toEqual(['success'])

    const perTheme = generateScheme(
      { key: 't', name: 't', color: SEED, semanticColors: { success: false } },
      { semanticColors: { success: '#2e7d32', warning: '#ed6c02' } },
    )!
    expect(perTheme.semantic.map(group => group.color.name)).toEqual(['warning'])
  })
})

describe('buildThemeBlocks', () => {
  it('emits only light + dark blocks for the active palette', () => {
    const scheme = generateScheme({ key: 't', name: 't', color: SEED })!
    const css = buildThemeBlocks('brand', scheme)
    expect(css).toContain('[data-definition="light"][data-palette="brand"]')
    expect(css).toContain('[data-definition="dark"][data-palette="brand"]')
    expect(css).not.toContain('data-contrast')
  })

  it('declares color-scheme matching each definition', () => {
    const scheme = generateScheme({ key: 't', name: 't', color: SEED })!
    const [light, dark] = buildThemeBlocks('brand', scheme).split('[data-definition="dark"]')
    expect(light).toContain('color-scheme: light;')
    expect(light).not.toContain('color-scheme: dark;')
    expect(dark).toContain('color-scheme: dark;')
  })

  // Q1-Б: `system` is resolved by the stylesheet, so the first paint follows the reader.
  it('resolves the system definition with prefers-color-scheme', () => {
    const scheme = generateScheme({ key: 't', name: 't', color: SEED })!
    const css = buildThemeBlocks('brand', scheme)
    const lightBlock = css.slice(0, css.indexOf('}'))
    const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))

    expect(lightBlock).toContain('[data-definition="system"][data-palette="brand"]')
    expect(media).toContain('[data-definition="system"][data-palette="brand"]')
    expect(media).toContain('color-scheme: dark;')
    expect(media).toContain(`--md-sys-color-primary: ${schemeToTokens(scheme.dark).primary};`)
  })

  it('returns empty string for a null scheme', () => {
    expect(buildThemeBlocks('t', null)).toBe('')
  })
})
