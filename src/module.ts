import { fileURLToPath } from 'node:url'
import {
  addComponentsDir,
  addImportsDir,
  addPlugin,
  addTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'

import { COOKIE_THEME_KEYS } from './runtime/shared/constants/cookie'
import type { MaterialKitOptions } from './runtime/shared/types/kit'

export type { MaterialKitOptions }

/**
 * Prepends the kit's abstract prelude (functions, mixins, system vars) to every
 * SCSS entry so `g()`, mixins and `$material-kit-*` are in scope, while keeping
 * any prelude the consumer already declared.
 */
function injectScssPrelude(nuxt: any, additionalScss: string) {
  nuxt.options.vite ??= {}
  nuxt.options.vite.css ??= {}
  nuxt.options.vite.css.preprocessorOptions ??= {}
  nuxt.options.vite.css.preprocessorOptions.scss ??= {}

  const scss = nuxt.options.vite.css.preprocessorOptions.scss
  const previous = typeof scss.additionalData === 'string' ? scss.additionalData : ''
  const prelude = `@use "${additionalScss.replace(/\\/g, '/')}" as *;\n`

  scss.additionalData = `${prelude}${previous}`
}

/**
 * Emits the breakpoints config SCSS as a build template and keeps the
 * `~material-kit-config` / `~material-kit-themes` aliases the stylesheet consumes.
 *
 * Dynamic palette CSS is no longer generated at build time: `<MApp>` renders only
 * the active palette at runtime (SSR + reactive). The themes template stays empty
 * so the `@use '~material-kit-themes'` import keeps resolving; static themes
 * (`definedInScss`) live in `assets/stylesheet/themes/base`.
 */
function registerThemePipeline(options: MaterialKitOptions, nuxt: any) {
  const breakpointsScss = Object.entries(options.breakpoints || {})
    .map(([key, value]) => `  ${key}: ${value},`)
    .join('\n')

  const configTemplate = addTemplate({
    filename: 'material-kit-config.scss',
    getContents: () => `\n$material-kit-breakpoints: (\n${breakpointsScss}\n);\n`,
    write: true,
  })
  nuxt.options.alias['~material-kit-config'] = configTemplate.dst

  const themesTemplate = addTemplate({
    filename: 'material-kit-themes.scss',
    getContents: () => '// Dynamic palettes are generated at runtime by <MApp>.\n',
    write: true,
  })
  nuxt.options.alias['~material-kit-themes'] = themesTemplate.dst
}

export default defineNuxtModule<MaterialKitOptions>({
  meta: {
    name: '@pr0s1k/primetime-kit',
    configKey: 'materialKit',
    compatibility: { nuxt: '>=4.0.0' },
  },
  moduleDependencies(nuxt) {
    const kitModulesDir = fileURLToPath(new URL('../node_modules', import.meta.url))
    if (!nuxt.options.modulesDir.includes(kitModulesDir)) {
      nuxt.options.modulesDir.push(kitModulesDir)
    }

    // Validation is opt-in and engine-agnostic: install an adapter at the
    // composable level with `provideValidationAdapter()` instead of forcing a
    // validation library on every consumer. See `./runtime/adapters`.
    return {
      '@pinia/nuxt': {},
      '@nuxtjs/device': {},
      '@nuxt/icon': {
        defaults: { provider: 'server', serverBundle: { collections: ['ic'] } },
      },
    }
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
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const runtime = (path: string) => resolver.resolve('./runtime', path)

    nuxt.options.alias['#kit'] = runtime('.')

    nuxt.options.build.transpile.push('@material/material-color-utilities')

    addComponentsDir({
      path: runtime('components/ui'),
      extensions: ['vue'],
      pathPrefix: true,
      prefix: 'm',
      global: true,
    })

    addComponentsDir({
      path: runtime('components/core'),
      extensions: ['vue'],
      pathPrefix: false,
      prefix: 'core',
    })

    // `/**` forces a deep recursive scan so nested composables (e.g.
    // composables/text-field/useTextField) are auto-imported, matching the
    // layer's `composables/**` behaviour — a bare dir only scans one level.
    addImportsDir(runtime('composables/**'))
    addImportsDir(runtime('store/**'))
    addImportsDir(runtime('shared/**'))

    injectScssPrelude(nuxt, runtime('assets/stylesheet/additional.scss'))

    // Let Vite's dev server serve the kit's runtime assets when the kit is
    // linked locally via `file:` — its dist lives outside the consumer root.
    nuxt.options.vite.server ||= {}
    nuxt.options.vite.server.fs ||= {}
    nuxt.options.vite.server.fs.allow ||= []
    nuxt.options.vite.server.fs.allow.push(runtime('.'))

    nuxt.options.css.push(runtime('assets/stylesheet/main.scss'))

    addPlugin(runtime('plugins/directives'))
    addPlugin({ src: runtime('plugins/vue-final-modal.client'), mode: 'client' })

    registerThemePipeline(options, nuxt)

    nuxt.options.runtimeConfig.public.materialKit = options as MaterialKitOptions
  },
})
