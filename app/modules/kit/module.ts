import { defineNuxtModule, addTemplate } from '@nuxt/kit'
import {
  hexFromArgb,
  Scheme,
  DynamicScheme,
} from '@material/material-color-utilities'

import { generateScheme } from '../../../shared/utils/defineKit'
import { COOKIE_THEME_KEYS } from '../../../shared/constants/cookie'

import type { MaterialKitOptions } from '../../../shared/types/kit'

export default defineNuxtModule<MaterialKitOptions>({
  meta: {
    name: 'primetime-material-kit',
    configKey: 'materialKit',
  },
  defaults: {
    cookie: {
      theme: {
        definition: COOKIE_THEME_KEYS.DEFINITION,
        pallete: COOKIE_THEME_KEYS.PALETTE,
        contrast: COOKIE_THEME_KEYS.CONTRAST,
      },
    },
    breakpoints: {},
    defaultTheme: 'light',
    themes: [
      {
        key: '_m3-fallback',
        name: 'Classic Neo',
        definedInScss: true,
        color: '#888888',
      },
    ],
    typography: {
      fontFamily: 'Roboto, sans-serif',
    },
  },
  setup(options, nuxt) {
    // 1. SCSS Pipeline: Inject breakpoints
    const breakpointsScss = Object.entries(options.breakpoints || {})
      .map(([key, value]) => `  ${key}: ${value},`)
      .join('\n')

    const injectedScss = `
$material-kit-breakpoints: (
${breakpointsScss}
);
`

    // 1. SCSS Pipeline: Generate configuration template
    const configTemplate = addTemplate({
      filename: 'material-kit-config.scss',
      getContents: () => injectedScss,
      write: true,
    })

    // Register explicit alias for SCSS
    nuxt.options.alias['~material-kit-config'] = configTemplate.dst

    // 2. Generate dynamic themes
    let generatedThemesScss = ''
    if (options.themes) {
      const getTokens = (s: Scheme | DynamicScheme): Record<string, string> => {
        const tokens: Record<string, string> = {}
        if (s instanceof Scheme) {
          for (const [key, value] of Object.entries(s.toJSON())) {
            const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
            tokens[token] = hexFromArgb(value as number)
          }
        } else if (s instanceof DynamicScheme) {
          for (const color of s.colors.allColors) {
            const token = color.name.replace(/_/g, '-')
            tokens[token] = hexFromArgb(color.getArgb(s))
          }
        }
        return tokens
      }

      for (const theme of options.themes) {
        const scheme = generateScheme(theme)

        if (!scheme?.dark || !scheme.light) {
          continue
        }

        generatedThemesScss += `[data-definition="light"][data-pallet="${theme.key}"] {\n`
        for (const [token, hex] of Object.entries(getTokens(scheme.light))) {
          generatedThemesScss += `  --md-sys-color-${token}: ${hex};\n`
        }
        generatedThemesScss += `}\n\n`

        generatedThemesScss += `[data-definition="dark"][data-pallet="${theme.key}"] {\n`
        for (const [token, hex] of Object.entries(getTokens(scheme.dark))) {
          generatedThemesScss += `  --md-sys-color-${token}: ${hex};\n`
        }
        generatedThemesScss += `}\n\n`
      }
    }

    const themesTemplate = addTemplate({
      filename: 'material-kit-themes.scss',
      getContents: () => generatedThemesScss,
      write: true,
    })
    nuxt.options.alias['~material-kit-themes'] = themesTemplate.dst

    // 3. Runtime Config
    nuxt.options.runtimeConfig.public.materialKit = options as any
  },
})
