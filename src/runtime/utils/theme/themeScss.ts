import { hexFromArgb } from '@material/material-color-utilities'
import type { DynamicScheme, CustomColorGroup } from '@material/material-color-utilities'
import type { ISchemePair } from './generateScheme'

/** Flattens a `DynamicScheme` into `{ 'kebab-token': '#hex' }` over all MD3 roles. */
export const schemeToTokens = (scheme: DynamicScheme): Record<string, string> => {
  const tokens: Record<string, string> = {}
  for (const color of scheme.colors.allColors) {
    tokens[color.name.replace(/_/g, '-')] = hexFromArgb(color.getArgb(scheme))
  }

  // `shadow` / `scrim` are current MD3 roles that `allColors` doesn't list
  // (only their static accessor was deprecated) — emit them via the methods.
  // `surface-variant` is intentionally NOT emitted: it's deprecated and aliased
  // to `surface-container-highest` in `$theme-color-link`.
  const extras = {
    shadow: scheme.colors.shadow(),
    scrim: scheme.colors.scrim(),
  }
  for (const [name, color] of Object.entries(extras)) {
    tokens[name] = hexFromArgb(color.getArgb(scheme))
  }

  return tokens
}

/** Flattens harmonized semantic colors into `<name>` / `on-<name>` / `<name>-container` / `on-<name>-container`. */
export const semanticToTokens = (groups: CustomColorGroup[], isDark: boolean): Record<string, string> => {
  const tokens: Record<string, string> = {}
  for (const group of groups) {
    const name = group.color.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    const scheme = isDark ? group.dark : group.light
    tokens[name] = hexFromArgb(scheme.color)
    tokens[`on-${name}`] = hexFromArgb(scheme.onColor)
    tokens[`${name}-container`] = hexFromArgb(scheme.colorContainer)
    tokens[`on-${name}-container`] = hexFromArgb(scheme.onColorContainer)
  }

  return tokens
}

const selector = (definition: string, key: string) => `[data-definition="${definition}"][data-palette="${key}"]`

const buildBlock = (selectors: string, definition: 'light' | 'dark', tokens: Record<string, string>): string => {
  let css = `${selectors} {\n`
  css += `  color-scheme: ${definition};\n`
  for (const [token, hex] of Object.entries(tokens)) {
    css += `  --md-sys-color-${token}: ${hex};\n`
  }
  css += `}\n`

  return css
}

/**
 * Renders the `light` + `dark` `[data-definition][data-palette]` CSS blocks for the
 * active palette. Contrast is already baked into the scheme values (no `[data-contrast]`
 * selector). Semantic colors are merged into both blocks.
 *
 * `system` shares the light block and takes the dark one under
 * `prefers-color-scheme: dark`: the server cannot know the reader's scheme, so the
 * stylesheet resolves it and the first paint is already right, without script.
 */
export const buildThemeBlocks = (key: string, scheme: ISchemePair | null | undefined): string => {
  if (!scheme?.light || !scheme?.dark) {
    return ''
  }

  const light = { ...schemeToTokens(scheme.light), ...semanticToTokens(scheme.semantic, false) }
  const dark = { ...schemeToTokens(scheme.dark), ...semanticToTokens(scheme.semantic, true) }

  const lightBlock = buildBlock(`${selector('light', key)},\n${selector('system', key)}`, 'light', light)
  const darkBlock = buildBlock(selector('dark', key), 'dark', dark)
  const systemDarkBlock = buildBlock(selector('system', key), 'dark', dark)

  return `${lightBlock}\n${darkBlock}\n@media (prefers-color-scheme: dark) {\n${systemDarkBlock}}\n`
}
