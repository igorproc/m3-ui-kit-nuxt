import { THEME_DEFINITIONS, THEME_PALLETS, THEME_CONTRASTS } from '~~/shared/constants/theme'
import { COOKIE_THEME_KEYS } from '~~/shared/constants/cookie'

export function useThemeChanger() {
  const definitionCookie = useCookie(COOKIE_THEME_KEYS.DEFINITION, { default: () => THEME_DEFINITIONS.LIGHT })
  const contrastCookie = useCookie(COOKIE_THEME_KEYS.CONTRAST, { default: () => THEME_CONTRASTS.MEDIUM })
  const paletteCookie = useCookie(COOKIE_THEME_KEYS.PALETTE)

  const allowedDefinitions = Object.values(THEME_DEFINITIONS)
  const allowedContrasts = Object.values(THEME_CONTRASTS)
  const allowedPalettes = Object.values(THEME_PALLETS).map(palette => palette.key)

  const definition = computed({
    get() {
      const value = definitionCookie.value

      if (!value || !allowedDefinitions.includes(value)) {
        definitionCookie.value = THEME_DEFINITIONS.LIGHT
        return THEME_DEFINITIONS.LIGHT
      }

      return value
    },
    set(next) {
      if (allowedDefinitions.includes(next)) {
        definitionCookie.value = next
      }
    },
  })
  const contrast = computed({
    get() {
      const value = contrastCookie.value

      if (!value || !allowedContrasts.includes(value)) {
        contrastCookie.value = THEME_CONTRASTS.MEDIUM
        return THEME_CONTRASTS.MEDIUM
      }

      return value
    },
    set(next) {
      if (allowedContrasts.includes(next)) {
        contrastCookie.value = next
      }
    },
  })
  const palette = computed({
    get() {
      const value = paletteCookie.value

      if (!value || !allowedPalettes.includes(value)) {
        const fallback = THEME_PALLETS.BROWN.key
        paletteCookie.value = fallback
        return fallback
      }

      return value
    },
    set(next) {
      if (allowedPalettes.includes(next)) {
        paletteCookie.value = next
      }
    },
  })

  const availablePallets = computed(() => {
    return Object.values(THEME_PALLETS)
      .filter(paletteItem => paletteItem.allowedThemes.includes(definition.value))
  })

  return {
    definition,
    contrast,
    palette,
    pallets: availablePallets,
  }
}
