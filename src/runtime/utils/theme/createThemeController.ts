import { computed } from 'vue'
import type { Ref } from 'vue'

import {
  THEME_DEFINITIONS,
  THEME_VARIANTS,
  HEX_SEED_PATTERN,
  CUSTOM_PALETTE_KEY,
  FALLBACK_PALETTE_KEY,
  DEFAULT_SEMANTIC_COLORS,
} from '#kit/shared/constants/theme'
import type {
  MaterialKitOptions,
  TTheme,
  TDefinition,
  TResolvedDefinition,
  TThemeVariant,
  IPaletteCookie,
} from '#kit/shared/types/kit'

/** Neutral chroma shown on the slider while the theme is in `auto` mode. */
const NEUTRAL_CHROMA_DEFAULT = 8

/**
 * Reactive sources the controller derives from. Passed in (not read via Nuxt
 * composables) so the controller is unit-testable without a Nuxt environment.
 */
export interface ThemeControllerDeps {
  config: MaterialKitOptions
  definitionCookie: Ref<TDefinition>
  contrastCookie: Ref<string>
  paletteCookie: Ref<IPaletteCookie>
  preferredColorScheme: Ref<'light' | 'dark' | 'no-preference'>
  /**
   * Palette whose CSS is actually rendered, written by the `theme-css` plugin.
   *
   * `data-palette` follows this rather than the selected palette: the generator is
   * loaded on demand, so on the first switch the selector would otherwise name a
   * palette whose block does not exist yet, leaving the page with no color tokens
   * until the chunk arrives. Optional — without it the attribute tracks the
   * selection directly, which is what the unit tests exercise.
   */
  committedPalette?: Ref<string>
}

/**
 * Pure theme controller: cookies + computed derivations, no Pinia. Enforces the
 * `restrict.customPalette` app lock at resolve time (a hand-set custom cookie is
 * sanitized to the default palette; custom setters become no-ops).
 */
export function createThemeController(deps: ThemeControllerDeps) {
  const { config, definitionCookie, contrastCookie, paletteCookie, preferredColorScheme, committedPalette } = deps

  const defaultPalette = config.theme?.default?.palette ?? FALLBACK_PALETTE_KEY

  // App-level lock: `restrict.customPalette: true` disables runtime custom palettes.
  const allowCustomPalette = !config.restrict?.customPalette

  const availableThemes = computed(() => (config.theme?.themes ?? []) as TTheme[])

  // Global semantic seeds (harmonized per-palette). App override or built-in defaults.
  const semanticColors = config.theme?.semanticColors ?? DEFAULT_SEMANTIC_COLORS
  const semanticBlend = config.theme?.semanticBlend

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

  // Raw cookie state; legacy string cookies are normalized to the object shape.
  const rawPaletteState = computed<IPaletteCookie>(() => {
    const value = paletteCookie.value as IPaletteCookie | string
    return typeof value === 'string' ? { isCustom: false, key: value } : value
  })

  // When custom palettes are locked, only palettes declared in `theme.themes` may
  // be used: a hand-set custom seed — or a key that is not declared — falls back to
  // the default palette, dropping the custom-only overrides with it.
  const paletteState = computed<IPaletteCookie>(() => {
    const state = rawPaletteState.value
    if (allowCustomPalette) return state

    const isDeclared = !state.isCustom && availableThemes.value.some(theme => theme?.key === state.key)
    return isDeclared ? state : { isCustom: false, key: defaultPalette }
  })

  const isCustomPalette = computed(() => paletteState.value.isCustom)

  // Cookies are attacker-controlled, and the generator throws on a seed it cannot
  // parse — `argbFromHex` rejects anything but 3/6/8 hex digits, and a non-string
  // fails even earlier. Rejecting here degrades a corrupt cookie to "no palette
  // applied" instead of letting it take the whole SSR render down.
  const customColor = computed(() => {
    if (!isCustomPalette.value) return null

    const key = paletteState.value.key
    return typeof key === 'string' && HEX_SEED_PATTERN.test(key) ? key : null
  })

  const variant = computed<TThemeVariant | null>(() => {
    const value = paletteState.value.variant
    return value && (THEME_VARIANTS as readonly string[]).includes(value) ? value : null
  })

  // `null` = auto (use the variant's neutral chroma). The writable computed is a
  // slider-safe number (v-model), while `isNeutralAuto` drives the "auto" label.
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
    if (!allowCustomPalette) return
    paletteCookie.value = { ...rawPaletteState.value, isCustom: true, key: hex }
  }
  /**
   * Derives a seed color from an image (via the MCU quantizer) and applies it as a
   * custom palette. Async because the quantizer is loaded on demand — keeping it out
   * of the static graph is what stops the color utilities shipping in every bundle.
   */
  const setColorFromImage = async (image: CanvasImageSource & { width: number, height: number }): Promise<string | null> => {
    if (!allowCustomPalette) return null

    const { seedFromImage } = await import('#kit/utils/color/imageColor')
    const hex = seedFromImage(image)
    if (hex) setCustomColor(hex)

    return hex
  }
  // Spread the sanitized state, not the raw cookie: under the lock the raw value
  // may still claim `isCustom`, and writing it back would let the cookie accumulate
  // state the runtime is required to ignore.
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

  /**
   * Everything needed to render the active palette's CSS, without doing it here.
   *
   * The generator pulls in `@material/material-color-utilities`, so the controller
   * must not import it: the server plugin renders the CSS during SSR, and the client
   * plugin only reloads the generator when the user actually changes the theme.
   */
  const schemeInput = computed(() => ({
    theme: activeTheme.value ?? { key: '', name: '' },
    paletteKey: resolvedPalette.value,
    contrast: contrast.value,
    semanticColors,
    semanticBlend,
  }))

  /**
   * Stable identity of {@link schemeInput}. `schemeInput` allocates a fresh object on
   * every evaluation, so watching it by reference fires during hydration and would
   * pull the generator in on page load — exactly what the split avoids. Watch this
   * string instead: it only changes when the rendered CSS would actually differ.
   */
  const schemeKey = computed(() => JSON.stringify(schemeInput.value))

  /**
   * Head payload consumed by `<MApp>` (the theme's head owner).
   *
   * Only `data-palette` waits for the rendered CSS: light and dark blocks ship
   * together, so `data-definition` can switch freely, and `data-contrast` is not part
   * of any selector — contrast is baked into the generated values.
   */
  const htmlAttrs = computed(() => ({
    'data-definition': resolvedDefinition.value,
    'data-palette': committedPalette?.value || resolvedPalette.value,
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
    /** App-level flag: whether runtime custom palettes are allowed (for UI to hide the picker). */
    canCustomizePalette: allowCustomPalette,
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
    schemeInput,
    schemeKey,
    htmlAttrs,
  }
}
