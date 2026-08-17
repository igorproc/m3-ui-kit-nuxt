import { hexFromArgb, Scheme, DynamicScheme } from '@material/material-color-utilities'

type TScheme = Scheme | DynamicScheme

export interface ISchemePair {
  light: TScheme
  dark: TScheme
}

/**
 * Flattens a Material color Scheme into `{ 'kebab-token': '#hex' }`.
 * Supports both the legacy `Scheme` and the dynamic `DynamicScheme` shapes.
 */
export const schemeToTokens = (scheme: TScheme): Record<string, string> => {
  const tokens: Record<string, string> = {}

  if (scheme instanceof Scheme) {
    for (const [key, value] of Object.entries(scheme.toJSON())) {
      const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      tokens[token] = hexFromArgb(value as number)
    }
  } else if (scheme instanceof DynamicScheme) {
    for (const color of scheme.colors.allColors) {
      const token = color.name.replace(/_/g, '-')
      tokens[token] = hexFromArgb(color.getArgb(scheme))
    }
  }

  return tokens
}

const buildBlock = (definition: string, key: string, tokens: Record<string, string>): string => {
  let css = `[data-definition="${definition}"][data-palette="${key}"] {\n`
  for (const [token, hex] of Object.entries(tokens)) {
    css += `  --md-sys-color-${token}: ${hex};\n`
  }
  css += `}\n`
  return css
}

/**
 * Renders the `light` + `dark` `[data-definition][data-palette]` CSS blocks for a palette key.
 * Used both at build time (kit module) and at runtime (theme store, custom HEX palette).
 */
export const buildThemeBlocks = (key: string, scheme: ISchemePair | null | undefined): string => {
  if (!scheme?.light || !scheme?.dark) {
    return ''
  }

  return `${buildBlock('light', key, schemeToTokens(scheme.light))}\n${buildBlock('dark', key, schemeToTokens(scheme.dark))}\n`
}
