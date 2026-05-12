import { defineNuxtModule, addTemplate } from '@nuxt/kit'
import { themeFromSourceColor, argbFromHex, hexFromArgb } from '@material/material-color-utilities'

import type { MaterialKitOptions } from '../../../shared/types/kit'
import { COOKIE_THEME_KEYS } from '../../../shared/constants/cookie'

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
    themes: [],
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
      for (const theme of options.themes) {
        if (!theme.definedInScss && theme.color) {
          const t = themeFromSourceColor(argbFromHex(theme.color))

          // light
          generatedThemesScss += `[data-definition="light"][data-pallet="${theme.key}"] {\n`
          for (const [key, value] of Object.entries(t.schemes.light.toJSON())) {
            const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
            generatedThemesScss += `  --md-sys-color-${token}: ${hexFromArgb(value)};\n`
          }
          generatedThemesScss += `}\n\n`

          // dark
          generatedThemesScss += `[data-definition="dark"][data-pallet="${theme.key}"] {\n`
          for (const [key, value] of Object.entries(t.schemes.dark.toJSON())) {
            const token = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
            generatedThemesScss += `  --md-sys-color-${token}: ${hexFromArgb(value)};\n`
          }
          generatedThemesScss += `}\n\n`
        }
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
