import { THEME_DEFINITIONS, THEME_CONTRASTS } from '~~/shared/constants/theme'
import type { ITheme } from '~~/kit/types'

export const useThemeStore = defineStore('themeStore', () => {
  const config = useRuntimeConfig().public.materialKit
  const cookieKeys = config.cookie.theme

  // Cookies
  const definitionCookie = useCookie<string>(cookieKeys.defintion, { default: () => THEME_DEFINITIONS.LIGHT, watch: 'shallow' })
  const contrastCookie = useCookie<string>(cookieKeys.contrast, { default: () => THEME_CONTRASTS.MEDIUM, watch: 'shallow' })
  const paletteCookie = useCookie<string>(cookieKeys.pallete, { default: () => 'MEDIUM', watch: 'shallow' })

  const allowedDefinitions = Object.values(THEME_DEFINITIONS)
  const allowedContrasts = Object.values(THEME_CONTRASTS)
  const availableThemes = computed<ITheme[]>(() => config.themes || [])
  const allowedPalettes = computed(() => availableThemes.value.map(t => t.key))

  // State proxies with validation
  const definition = computed({
    get() {
      const value = definitionCookie.value
      if (!value || !allowedDefinitions.includes(value)) {
        definitionCookie.value = THEME_DEFINITIONS.LIGHT
        return THEME_DEFINITIONS.LIGHT
      }
      return value
    },
    set(next: string) {
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
    set(next: string) {
      if (allowedContrasts.includes(next)) {
        contrastCookie.value = next
      }
    },
  })

  const palette = computed({
    get() {
      const value = paletteCookie.value
      if (!value || !allowedPalettes.value.includes(value)) {
        const fallback = config.defaultTheme || availableThemes.value[0]?.key || 'light'
        paletteCookie.value = fallback
        return fallback
      }
      return value
    },
    set(next: string) {
      if (allowedPalettes.value.includes(next)) {
        paletteCookie.value = next
      }
    },
  })

  const currentTheme = computed(() => availableThemes.value.find(t => t.key === palette.value))

  // Inject into Head
  useHead({
    htmlAttrs: {
      'data-definition': definition,
      'data-pallet': palette,
      'data-contrast': contrast,
    },
  })

  return {
    definition,
    contrast,
    palette,
    availableThemes,
    currentTheme,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useThemeStore, import.meta.hot))
}
