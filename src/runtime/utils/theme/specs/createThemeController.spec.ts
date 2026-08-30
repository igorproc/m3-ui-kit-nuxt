import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { createThemeController } from '../createThemeController'
import type { MaterialKitOptions, TDefinition, IPaletteCookie } from '#kit/shared/types/kit'

function setup(config: MaterialKitOptions, palette: IPaletteCookie) {
  const definitionCookie = ref<TDefinition>('dark')
  const contrastCookie = ref('medium')
  const paletteCookie = ref<IPaletteCookie>(palette)
  const preferredColorScheme = ref<'light' | 'dark' | 'no-preference'>('light')

  const controller = createThemeController({
    config: { theme: { default: { palette: 'blue' }, themes: [{ key: 'blue', name: 'Blue', color: '#0061A4' }] }, ...config },
    definitionCookie,
    contrastCookie,
    paletteCookie,
    preferredColorScheme,
  })

  return { controller, definitionCookie, contrastCookie, paletteCookie }
}

const CUSTOM_COOKIE: IPaletteCookie = { isCustom: true, key: '#abcdef', variant: 'vibrant', neutralChroma: 20 }

describe('createThemeController — restrict.customPalette', () => {
  it('sanitizes a hand-set custom cookie to the default palette when locked', () => {
    const { controller } = setup({ restrict: { customPalette: true } }, { ...CUSTOM_COOKIE })

    expect(controller.canCustomizePalette).toBe(false)
    expect(controller.isCustomPalette.value).toBe(false)
    expect(controller.resolvedPalette.value).toBe('blue')
    expect(controller.htmlAttrs.value['data-palette']).toBe('blue')
    expect(controller.customColor.value).toBeNull()
  })

  it('makes custom setters no-ops and does NOT rewrite the cookie when locked', async () => {
    const { controller, paletteCookie } = setup({ restrict: { customPalette: true } }, { ...CUSTOM_COOKIE })
    const before = { ...paletteCookie.value }

    controller.setCustomColor('#111111')
    // Returns before importing the quantizer, so the lock costs no chunk fetch.
    await expect(controller.setColorFromImage({ width: 1, height: 1 } as unknown as CanvasImageSource & { width: number, height: number })).resolves.toBeNull()

    expect(paletteCookie.value).toEqual(before)
  })

  it('falls back to the default palette when the cookie names an undeclared palette', () => {
    const { controller } = setup({ restrict: { customPalette: true } }, { isCustom: false, key: 'not-in-config' })

    expect(controller.resolvedPalette.value).toBe('blue')
  })

  it('keeps chroma/variant setters inside the lock — the cookie never regains isCustom', () => {
    const { controller, paletteCookie } = setup({ restrict: { customPalette: true } }, { ...CUSTOM_COOKIE })

    controller.setVariant('expressive')
    expect(paletteCookie.value.isCustom).toBe(false)
    expect(paletteCookie.value.key).toBe('blue')
    expect(paletteCookie.value.variant).toBe('expressive')

    controller.setNeutralChroma(30)
    expect(paletteCookie.value.isCustom).toBe(false)
    expect(paletteCookie.value.neutralChroma).toBe(30)
  })

  it('leaves an undeclared palette alone when unlocked', () => {
    const { controller } = setup({}, { isCustom: false, key: 'not-in-config' })

    expect(controller.resolvedPalette.value).toBe('not-in-config')
  })

  it('applies a custom palette normally when unlocked (default)', () => {
    const { controller } = setup({}, { ...CUSTOM_COOKIE })

    expect(controller.canCustomizePalette).toBe(true)
    expect(controller.isCustomPalette.value).toBe(true)
    expect(controller.resolvedPalette.value).toBe('_custom')
    expect(controller.customColor.value).toBe('#abcdef')
  })
})

describe('createThemeController — hostile cookies', () => {
  // A seed the generator cannot parse used to throw inside the theme plugin and take
  // the whole SSR render down with a 500.
  it.each(['xyz12', 'nope', 'nonsense', '', '#12345'])('rejects the unparseable seed %o', (key) => {
    const { controller } = setup({}, { isCustom: true, key })

    expect(controller.customColor.value).toBeNull()
    expect(controller.activeTheme.value?.color).toBeUndefined()
  })

  it.each(['#abc', '#abcdef', '#abcdef80', 'abcdef'])('accepts the valid seed %o', (key) => {
    const { controller } = setup({}, { isCustom: true, key })

    expect(controller.customColor.value).toBe(key)
  })

  it('drops a variant that is not a known scheme variant', () => {
    const { controller } = setup({}, { isCustom: false, key: 'blue', variant: 'nope' as never })

    expect(controller.variant.value).toBeNull()
    expect(controller.activeTheme.value?.variant).toBeUndefined()
  })

  it('keeps a known variant', () => {
    const { controller } = setup({}, { isCustom: false, key: 'blue', variant: 'vibrant' })

    expect(controller.variant.value).toBe('vibrant')
    expect(controller.activeTheme.value?.variant).toBe('vibrant')
  })
})

describe('createThemeController — palette attribute commit', () => {
  it('reports the selected palette when no committed palette is provided', () => {
    const { controller } = setup({}, { isCustom: false, key: 'blue' })

    expect(controller.htmlAttrs.value['data-palette']).toBe('blue')
  })

  it('holds the previous palette in the attribute until the CSS is committed', () => {
    const committedPalette = ref('blue')
    const paletteCookie = ref<IPaletteCookie>({ isCustom: false, key: 'blue' })
    const controller = createThemeController({
      config: { theme: { default: { palette: 'blue' }, themes: [{ key: 'blue', name: 'Blue' }, { key: 'red', name: 'Red' }] } },
      definitionCookie: ref<TDefinition>('dark'),
      contrastCookie: ref('medium'),
      paletteCookie,
      preferredColorScheme: ref<'light' | 'dark' | 'no-preference'>('light'),
      committedPalette,
    })

    controller.palette.value = 'red'
    // Selection moved, but the generator has not produced the `red` block yet.
    expect(controller.resolvedPalette.value).toBe('red')
    expect(controller.htmlAttrs.value['data-palette']).toBe('blue')

    committedPalette.value = 'red'
    expect(controller.htmlAttrs.value['data-palette']).toBe('red')
  })
})

describe('createThemeController — drop-in ergonomics', () => {
  it('definition setter flips the resolved head attribute', () => {
    const { controller, definitionCookie } = setup({}, { isCustom: false, key: 'blue' })

    controller.definition.value = 'light'
    expect(definitionCookie.value).toBe('light')
    expect(controller.htmlAttrs.value['data-definition']).toBe('light')
  })

  it('palette setter writes a non-custom cookie', () => {
    const { controller, paletteCookie } = setup({}, { isCustom: false, key: 'blue' })

    controller.palette.value = 'red'
    expect(paletteCookie.value).toEqual({ isCustom: false, key: 'red' })
  })

  it('resolves definition:system via preferredColorScheme', () => {
    const { controller } = setup({}, { isCustom: false, key: 'blue' })

    controller.definition.value = 'system'
    expect(controller.resolvedDefinition.value).toBe('light')
  })
})
