import {
  argbFromHex,
  Hct,
  TonalPalette,
  DynamicScheme,
  Variant,
  customColor,
} from '@material/material-color-utilities'
import type { CustomColorGroup } from '@material/material-color-utilities'
import type {
  MaterialKitOptions,
  TTheme,
  TThemeVariant,
  TThemeContrast,
  TSemanticColors,
} from '../types/kit'

/** defineMaterialKit — type-safe helper for configuring the Material 3 UI Kit. */
export const defineMaterialKit = (options: MaterialKitOptions): MaterialKitOptions => options

export interface ISchemePair {
  light: DynamicScheme
  dark: DynamicScheme
  semantic: CustomColorGroup[]
}

/** Options that let the runtime override build-time theme values. */
export interface IGenerateSchemeOptions {
  contrast?: TThemeContrast
  semanticColors?: TSemanticColors
  semanticBlend?: boolean
}

const VARIANT_MAP: Record<TThemeVariant, Variant> = {
  tonalSpot: Variant.TONAL_SPOT,
  neutral: Variant.NEUTRAL,
  vibrant: Variant.VIBRANT,
  expressive: Variant.EXPRESSIVE,
  monochrome: Variant.MONOCHROME,
  fidelity: Variant.FIDELITY,
  content: Variant.CONTENT,
  rainbow: Variant.RAINBOW,
  fruitSalad: Variant.FRUIT_SALAD,
}

const CONTRAST_MAP: Record<string, number> = { standard: 0, medium: 0.5, high: 1 }

const toContrastLevel = (contrast: TThemeContrast | undefined): number => {
  if (typeof contrast === 'number') return Math.max(-1, Math.min(1, contrast))
  return CONTRAST_MAP[contrast ?? 'standard'] ?? 0
}

const buildScheme = (sourceHct: Hct, isDark: boolean, data: TTheme, level: number): DynamicScheme => {
  const variant = VARIANT_MAP[data.variant ?? data.preset ?? 'tonalSpot']
  const specVersion = data.specVersion ?? '2025'
  const hue = sourceHct.hue

  const custom: Record<string, TonalPalette> = {}
  if (data.neutralChroma != null) {
    custom.neutralPalette = TonalPalette.fromHueAndChroma(hue, data.neutralChroma)
    custom.neutralVariantPalette = TonalPalette.fromHueAndChroma(hue, data.neutralChroma + 4)
  }
  if (data.chroma != null) {
    custom.primaryPalette = TonalPalette.fromHueAndChroma(hue, data.chroma)
    custom.secondaryPalette = TonalPalette.fromHueAndChroma(hue, data.chroma / 3)
    custom.tertiaryPalette = TonalPalette.fromHueAndChroma(hue + 60, data.chroma / 2)
  }

  return new DynamicScheme({
    sourceColorHct: sourceHct,
    variant,
    contrastLevel: level,
    isDark,
    specVersion,
    ...custom,
  })
}

/**
 * Generates the light/dark MCU `DynamicScheme` pair plus harmonized semantic
 * colors for a theme. `opts` lets the runtime override contrast and inject the
 * global semantic seeds. Returns `null` for SCSS-defined or colorless themes.
 */
export const generateScheme = (data: TTheme, opts: IGenerateSchemeOptions = {}): ISchemePair | null => {
  if (data.definedInScss || !data?.color) return null

  const argb = argbFromHex(data.color)
  const sourceHct = Hct.fromInt(argb)
  const level = toContrastLevel(opts.contrast ?? data.contrast)

  const semanticInput: TSemanticColors = { ...(opts.semanticColors ?? {}), ...(data.semanticColors ?? {}) }
  const semantic = Object.entries(semanticInput).map(([name, value]) => {
    const color = typeof value === 'string' ? value : value.color
    const blend = typeof value === 'string'
      ? (opts.semanticBlend ?? true)
      : (value.blend ?? opts.semanticBlend ?? true)
    return customColor(argb, { name, value: argbFromHex(color), blend })
  })

  return {
    light: buildScheme(sourceHct, false, data, level),
    dark: buildScheme(sourceHct, true, data, level),
    semantic,
  }
}
