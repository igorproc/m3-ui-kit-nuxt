import {
  argbFromHex,
  Hct,
  SchemeTonalSpot,
  SchemeMonochrome,
  SchemeVibrant,
  SchemeNeutral,
  SchemeFidelity,
} from '@material/material-color-utilities'
import type { MaterialKitOptions, TTheme } from '../types/kit'

/**
 * defineMaterialKit — Type-safe helper for configuring the Material 3 UI Kit.
 */
export const defineMaterialKit = (options: MaterialKitOptions): MaterialKitOptions => options

export const generateScheme = (data: TTheme) => {
  if (data.definedInScss || !data?.color) {
    return null
  }
  let lightScheme
  let darkScheme

  const argb = argbFromHex(data.color)
  const sourceHct = Hct.fromInt(argb)

  switch (data?.preset || '') {
    case 'monochrome':
      // Chroma принудительно обнуляется (0.0), чистый серый/черный/белый контраст (Стиль Gemini)
      lightScheme = new SchemeMonochrome(sourceHct, false, 0.0)
      darkScheme = new SchemeMonochrome(sourceHct, true, 0.0)
      break
    case 'vibrant':
      // Максимально выкрученная Chroma (идеально для игровых UI)
      lightScheme = new SchemeVibrant(sourceHct, false, 0.0)
      darkScheme = new SchemeVibrant(sourceHct, true, 0.0)
      break
    case 'neutral':
      // Слегка подкрашенный серый (Chroma понижена, но не равна 0)
      lightScheme = new SchemeNeutral(sourceHct, false, 0.0)
      darkScheme = new SchemeNeutral(sourceHct, true, 0.0)
      break
    case 'fidelity':
      // Схема, которая помещает исходный цвет в primaryContainer
      lightScheme = new SchemeFidelity(sourceHct, false, 0.0)
      darkScheme = new SchemeFidelity(sourceHct, true, 0.0)
      break
    case 'tonalSpot':
    default:
      // Классический Material Design 3 (стандартная умеренная Chroma)
      lightScheme = new SchemeTonalSpot(sourceHct, false, 0.0)
      darkScheme = new SchemeTonalSpot(sourceHct, true, 0.0)
      break
  }

  return {
    light: lightScheme,
    dark: darkScheme,
  }
}
