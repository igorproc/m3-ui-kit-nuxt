import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { createThemeController } from '../createThemeController'
import { DEFAULT_SEMANTIC_COLORS } from '#kit/shared/constants/theme'
import type { IPaletteCookie, MaterialKitOptions, TDefinition } from '#kit/shared/types/kit'

const THEMES = [
  { key: 'blue', name: 'Blue', color: '#0061A4' },
  { key: 'crisp', name: 'Crisp', color: '#006E1C', contrast: 'high' as const },
]

function setup(config: MaterialKitOptions = {}, cookies: { palette?: IPaletteCookie, contrast?: string | null, definition?: TDefinition } = {}) {
  const definitionCookie = ref<TDefinition>(cookies.definition ?? 'dark')
  const contrastCookie = ref<string | null>(cookies.contrast ?? null)
  const paletteCookie = ref<IPaletteCookie>(cookies.palette ?? { isCustom: false, key: 'blue' })
  const controller = createThemeController({
    config: { ...config, theme: { themes: THEMES, ...config.theme, default: { palette: 'blue', ...config.theme?.default } } },
    definitionCookie,
    contrastCookie,
    paletteCookie,
    preferredColorScheme: ref<'light' | 'dark' | 'no-preference'>('no-preference'),
  })

  return { controller, contrastCookie, paletteCookie }
}

// Q3-А: the cookie (a user's choice) wins, then the palette's own contrast, then the default.
describe('createThemeController — contrast priority', () => {
  it('takes the palette\'s own contrast while the user has chosen none', () => {
    const { controller } = setup({}, { palette: { isCustom: false, key: 'crisp' } })

    expect(controller.contrast.value).toBe('high')
    expect(controller.schemeInput.value.contrast).toBe('high')
    expect(controller.htmlAttrs.value['data-contrast']).toBe('high')
  })

  it('lets the user\'s cookie win over the palette\'s contrast', () => {
    const { controller } = setup({}, { palette: { isCustom: false, key: 'crisp' }, contrast: 'medium' })

    expect(controller.contrast.value).toBe('medium')
  })

  it('falls back to theme.default.contrast, then to standard', () => {
    expect(setup({ theme: { default: { contrast: 'medium' } } }).controller.contrast.value).toBe('medium')
    expect(setup().controller.contrast.value).toBe('standard')
  })

  it('writes a chosen contrast to the cookie', () => {
    const { controller, contrastCookie } = setup({}, { palette: { isCustom: false, key: 'crisp' } })

    controller.setContrast('standard')

    expect(contrastCookie.value).toBe('standard')
    expect(controller.contrast.value).toBe('standard')
  })
})

// Q5-А: the app's seeds are extra seeds over the built-in ones; `false` removes one.
describe('createThemeController — semantic colours', () => {
  it('keeps the built-in seeds when the app adds its own', () => {
    const { controller } = setup({ theme: { semanticColors: { danger: '#b00020' } } })

    expect(controller.schemeInput.value.semanticColors).toEqual({ ...DEFAULT_SEMANTIC_COLORS, danger: '#b00020' })
  })

  it('lets the app replace or remove a built-in seed', () => {
    const { controller } = setup({ theme: { semanticColors: { success: '#00c853', info: false } } })

    expect(controller.schemeInput.value.semanticColors).toMatchObject({ success: '#00c853', warning: DEFAULT_SEMANTIC_COLORS.warning, info: false })
  })
})

// B2.4a: a palette nobody can render used to leave the page with no colour tokens at all.
describe('createThemeController — unrenderable palettes fall back to the default', () => {
  it('falls back from an undeclared palette key', () => {
    const { controller } = setup({}, { palette: { isCustom: false, key: 'not-in-config' } })

    expect(controller.resolvedPalette.value).toBe('blue')
    expect(controller.activeTheme.value?.color).toBe('#0061A4')
  })

  it('falls back from a custom cookie whose seed cannot be parsed', () => {
    const { controller } = setup({}, { palette: { isCustom: true, key: 'nope' } })

    expect(controller.isCustomPalette.value).toBe(false)
    expect(controller.resolvedPalette.value).toBe('blue')
    expect(controller.activeTheme.value?.color).toBe('#0061A4')
  })

  it('refuses to store a custom seed it could not render', () => {
    const { controller, paletteCookie } = setup()

    controller.setCustomColor('not-a-colour')
    expect(paletteCookie.value).toEqual({ isCustom: false, key: 'blue' })

    controller.setCustomColor('#abcdef')
    expect(paletteCookie.value).toMatchObject({ isCustom: true, key: '#abcdef' })
  })
})

// Q1-Б: `system` is resolved by the stylesheet (`prefers-color-scheme`), not by script,
// so the server's first paint already matches the reader's setting.
describe('createThemeController — system definition', () => {
  it('leaves data-definition as system for the stylesheet to resolve', () => {
    const { controller } = setup({}, { definition: 'system' })

    expect(controller.htmlAttrs.value['data-definition']).toBe('system')
  })

  it.each(['light', 'dark'] as const)('names an explicit %s definition as it is', (definition) => {
    const { controller } = setup({}, { definition })

    expect(controller.htmlAttrs.value['data-definition']).toBe(definition)
  })
})
