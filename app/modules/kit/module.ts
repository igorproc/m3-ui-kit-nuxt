import { defineNuxtModule, addTemplate } from '@nuxt/kit'

import { generateScheme } from '../../../src/runtime/shared/utils/defineKit'
import { buildThemeBlocks } from '../../../src/runtime/shared/utils/themeScss'
import { COOKIE_THEME_KEYS } from '../../../src/runtime/shared/constants/cookie'

import type { MaterialKitOptions } from '../../../src/runtime/shared/types/kit'

export default defineNuxtModule<MaterialKitOptions>({
  meta: {
    name: 'primetime-material-kit',
    configKey: 'materialKit',
  },
  defaults: {
    cookie: {
      theme: {
        definition: COOKIE_THEME_KEYS.DEFINITION,
        palette: COOKIE_THEME_KEYS.PALETTE,
        contrast: COOKIE_THEME_KEYS.CONTRAST,
      },
    },
    breakpoints: {},
    defaultDefinition: 'dark',
    defaultPalette: '_m3-fallback',
    defaultContrast: 'medium',
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
      for (const theme of options.themes) {
        generatedThemesScss += buildThemeBlocks(theme.key, generateScheme(theme))
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
