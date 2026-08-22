import { usePreferredColorScheme } from '@vueuse/core'

import { THEME_DEFINITIONS, THEME_CONTRASTS, THEME_COOKIE_OPTIONS, CUSTOM_PALETTE_KEY, FALLBACK_PALETTE_KEY, DEFAULT_SEMANTIC_COLORS } from '#kit/shared/constants/theme'
import { generateScheme } from '#kit/shared/utils/setup/defineKit'
import { buildThemeBlocks } from '#kit/shared/utils/theme/themeScss'
import { seedFromImage } from '#kit/shared/utils/color/imageColor'
import type { TTheme, TDefinition, TResolvedDefinition, TThemeVariant, IPaletteCookie } from '#kit/shared/types/kit'

/** Neutral chroma shown on the slider while the theme is in `auto` mode. */
const NEUTRAL_CHROMA_DEFAULT = 8

export const useThemeStore = defineStore('themeStore', () => {
  const config = useRuntimeConfig().public.materialKit
  const cookieKeys = config.cookie.theme

  const defaultDefinition = (config.defaultDefinition ?? THEME_DEFINITIONS.DARK) as TDefinition
  const defaultPalette = config.defaultPalette ?? config.defaultTheme ?? FALLBACK_PALETTE_KEY
  const defaultContrast = (config.defaultContrast ?? THEME_CONTRASTS.MEDIUM) as string

  // Cookies — trusted as-is, no dictionary validation.
  const definitionCookie = useCookie<TDefinition>(cookieKeys.definition, { default: () => defaultDefinition, ...THEME_COOKIE_OPTIONS })
  const contrastCookie = useCookie<string>(cookieKeys.contrast, { default: () => defaultContrast, ...THEME_COOKIE_OPTIONS })
  const paletteCookie = useCookie<IPaletteCookie>(cookieKeys.palette, { default: () => ({ isCustom: false, key: defaultPalette }), ...THEME_COOKIE_OPTIONS })

  const availableThemes = computed(() => (config.themes ?? []) as TTheme[])

  // Global semantic seeds (harmonized per-palette). App override or built-in defaults.
  const semanticColors = config.semanticColors ?? DEFAULT_SEMANTIC_COLORS
  const semanticBlend = config.semanticBlend

  // Definition — persisted type (light | dark | system) + system resolution.
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
  const setContrast = (next: string) => {
    contrastCookie.value = next
  }

  // Palette — cookie is `{ isCustom, key, neutralChroma?, variant? }`; legacy strings are normalized.
  const paletteState = computed<IPaletteCookie>(() => {
    const value = paletteCookie.value as IPaletteCookie | string
    return typeof value === 'string' ? { isCustom: false, key: value } : value
  })

  const isCustomPalette = computed(() => paletteState.value.isCustom)
  const customColor = computed(() => isCustomPalette.value ? paletteState.value.key : null)
  const variant = computed(() => paletteState.value.variant ?? null)

  // `null` = auto (use the variant's neutral chroma). The writable computed is a
  // slider-safe number (v-model), while `isNeutralAuto` drives the "auto" label
  // and the raw nullable value feeds scheme generation.
  const isNeutralAuto = computed(() => paletteState.value.neutralChroma == null)
  const neutralChroma = computed<number>({
    get: () => paletteState.value.neutralChroma ?? NEUTRAL_CHROMA_DEFAULT,
    set: value => setNeutralChroma(value),
  })

  const palette = computed<string>({
    get: () => paletteState.value.key,
    set(key) {
      paletteCookie.value = { isCustom: false, key }
    },
  })

  const setCustomColor = (hex: string) => {
    paletteCookie.value = { ...paletteState.value, isCustom: true, key: hex }
  }
  /** Derives a seed color from an image (via MCU quantizer) and applies it as a custom palette. */
  const setColorFromImage = (image: CanvasImageSource & { width: number, height: number }): string | null => {
    const hex = seedFromImage(image)
    if (hex) setCustomColor(hex)
    return hex
  }
  const setNeutralChroma = (value: number | null) => {
    paletteCookie.value = { ...paletteState.value, neutralChroma: value }
  }
  const setVariant = (value: TThemeVariant | null) => {
    paletteCookie.value = { ...paletteState.value, variant: value }
  }

  const resolvedPalette = computed(() => isCustomPalette.value ? CUSTOM_PALETTE_KEY : paletteState.value.key)

  const currentTheme = computed(() => isCustomPalette.value
    ? undefined
    : availableThemes.value.find(t => t && t.key === palette.value))

  // The theme whose CSS is generated for the active palette (custom HEX or a predefined config).
  const activeTheme = computed<TTheme | undefined>(() => {
    const base = isCustomPalette.value
      ? { key: CUSTOM_PALETTE_KEY, name: 'Custom', color: customColor.value ?? undefined }
      : currentTheme.value
    if (!base) return undefined

    // Runtime overrides win over the theme's build-time config. Use the raw
    // nullable chroma: `null` (auto) must fall through to the variant's default.
    return {
      ...base,
      ...(paletteState.value.neutralChroma != null ? { neutralChroma: paletteState.value.neutralChroma } : {}),
      ...(variant.value != null ? { variant: variant.value } : {}),
    }
  })

  // Active-palette SCSS — server-rendered (no FOUC), rebuilt on the client when state changes.
  // Only the active palette's light+dark blocks are emitted; contrast is baked into the values.
  const themeCss = computed(() => {
    const scheme = generateScheme(activeTheme.value ?? { key: '', name: '' }, {
      contrast: contrast.value,
      semanticColors,
      semanticBlend,
    })
    return buildThemeBlocks(resolvedPalette.value, scheme)
  })

  // Head payload consumed by <MApp> (the theme's head owner).
  const htmlAttrs = computed(() => ({
    'data-definition': resolvedDefinition.value,
    'data-palette': resolvedPalette.value,
    'data-contrast': contrast.value,
  }))

  return {
    definition,
    resolvedDefinition,
    systemDefinition,
    definitionState,
    contrast,
    setContrast,
    palette,
    resolvedPalette,
    isCustomPalette,
    customColor,
    setCustomColor,
    setColorFromImage,
    neutralChroma,
    isNeutralAuto,
    setNeutralChroma,
    variant,
    setVariant,
    availableThemes,
    currentTheme,
    activeTheme,
    themeCss,
    htmlAttrs,
  }
})
