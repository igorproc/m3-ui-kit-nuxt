import { usePreferredColorScheme } from '@vueuse/core'

import { THEME_DEFINITIONS, THEME_CONTRASTS, THEME_COOKIE_OPTIONS, CUSTOM_PALETTE_KEY, FALLBACK_PALETTE_KEY } from '#kit/shared/constants/theme'
import { generateScheme } from '#kit/shared/utils/defineKit'
import { buildThemeBlocks } from '#kit/shared/utils/themeScss'
import type { TTheme, TDefinition, TResolvedDefinition, IPaletteCookie } from '#kit/shared/types/kit'

export const useThemeStore = defineStore('themeStore', () => {
  const config = useRuntimeConfig().public.materialKit
  const cookieKeys = config.cookie.theme

  const defaultDefinition = (config.defaultDefinition ?? THEME_DEFINITIONS.DARK) as TDefinition
  const defaultPalette = config.defaultPalette ?? config.defaultTheme ?? FALLBACK_PALETTE_KEY
  const defaultContrast = config.defaultContrast ?? THEME_CONTRASTS.MEDIUM

  // Cookies — trusted as-is, no dictionary validation.
  const definitionCookie = useCookie<TDefinition>(cookieKeys.definition, { default: () => defaultDefinition, ...THEME_COOKIE_OPTIONS })
  const contrastCookie = useCookie<string>(cookieKeys.contrast, { default: () => defaultContrast, ...THEME_COOKIE_OPTIONS })
  const paletteCookie = useCookie<IPaletteCookie>(cookieKeys.palette, { default: () => ({ isCustom: false, key: defaultPalette }), ...THEME_COOKIE_OPTIONS })

  const availableThemes = computed(() => (config.themes ?? []) as TTheme[])

  // Definition — persisted type (light | dark | system) + system resolution.
  // Resolving `system` before paint (anti-flash) is the consuming app's concern.
  const preferredColorScheme = usePreferredColorScheme()
  const systemDefinition = computed<TResolvedDefinition>(() => preferredColorScheme.value === 'dark' ? THEME_DEFINITIONS.DARK : THEME_DEFINITIONS.LIGHT)

  const definition = computed<TDefinition>({
    get: () => definitionCookie.value,
    set(next) {
      definitionCookie.value = next
    },
  })

  const resolvedDefinition = computed<TResolvedDefinition>(() => definition.value === THEME_DEFINITIONS.SYSTEM
    ? systemDefinition.value
    : definition.value as TResolvedDefinition)

  const definitionState = computed(() => ({ type: definition.value, forSystem: systemDefinition.value }))

  const contrast = computed<string>({
    get: () => contrastCookie.value,
    set(next) {
      contrastCookie.value = next
    },
  })

  // Palette — cookie is `{ isCustom, key }`; strings from legacy cookies are normalized.
  const paletteState = computed<IPaletteCookie>(() => {
    const value = paletteCookie.value as IPaletteCookie | string
    return typeof value === 'string' ? { isCustom: false, key: value } : value
  })

  const isCustomPalette = computed(() => paletteState.value.isCustom)
  const customColor = computed(() => isCustomPalette.value ? paletteState.value.key : null)

  const palette = computed<string>({
    get: () => paletteState.value.key,
    set(key) {
      paletteCookie.value = { isCustom: false, key }
    },
  })

  const setCustomColor = (hex: string) => {
    paletteCookie.value = { isCustom: true, key: hex }
  }

  const resolvedPalette = computed(() => isCustomPalette.value ? CUSTOM_PALETTE_KEY : paletteState.value.key)

  const currentTheme = computed(() => isCustomPalette.value
    ? undefined
    : availableThemes.value.find(t => t && t.key === palette.value))

  // Runtime SCSS for a custom (HEX) palette — rendered on the server (no FOUC),
  // reactively rebuilt on the client when the color changes.
  const customThemeCss = computed(() => {
    if (!isCustomPalette.value || !customColor.value) {
      return ''
    }
    const scheme = generateScheme({ key: CUSTOM_PALETTE_KEY, name: 'Custom', color: customColor.value })
    return buildThemeBlocks(CUSTOM_PALETTE_KEY, scheme)
  })

  // Inject into Head
  useHead({
    htmlAttrs: {
      'data-definition': resolvedDefinition,
      'data-palette': resolvedPalette,
      'data-contrast': contrast,
    },
    style: [{ id: 'material-kit-custom-theme', innerHTML: customThemeCss }],
  })

  return {
    definition,
    resolvedDefinition,
    systemDefinition,
    definitionState,
    contrast,
    palette,
    resolvedPalette,
    isCustomPalette,
    customColor,
    setCustomColor,
    availableThemes,
    currentTheme,
  }
})
