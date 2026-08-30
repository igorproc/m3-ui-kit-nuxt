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
import { findLegacyThemeOptions, formatLegacyThemeOptions } from './options/legacy'
import { findUndeclaredDefaultPalette } from './options/validate'
import { resolveBreakpoints } from './runtime/utils/viewport/resolveBreakpoints'
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
  // Emit the resolved map, not just the consumer's overrides: the SCSS side keeps its
  // own copy of the defaults, and shipping the full map makes that copy a fallback
  // instead of a second source of truth.
  //
  // Values carry `px` explicitly. The mixins interpolate them verbatim
  // (`@media (min-width: $value)`), and the option type also accepts bare numbers —
  // those would emit `min-width: 1240`, which Sass compiles happily and browsers
  // ignore, breaking the CSS side while the JS side keeps working.
  const breakpointsScss = Object.entries(resolveBreakpoints(options.breakpoints))
    .map(([key, value]) => `  ${key}: ${value}px,`)
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
    theme: {
      default: {
        definition: 'dark',
        palette: '_m3-fallback',
        contrast: 'medium',
      },
      themes: [
        {
          key: '_m3-fallback',
          name: 'Classic Neo',
          definedInScss: true,
          color: '#888888',
        },
      ],
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
    },
  },
  async setup(options, nuxt) {
    const legacyOptions = findLegacyThemeOptions(options as Record<string, unknown>)
    if (legacyOptions.length) {
      throw new Error(
        '[@pr0s1k/primetime-kit] `materialKit` uses options that moved under `theme`:\n'
        + `${formatLegacyThemeOptions(legacyOptions)}\n`
        + 'The old keys are no longer read — leaving them would silently drop your palettes.',
      )
    }

    const undeclared = findUndeclaredDefaultPalette(options)
    if (undeclared) {
      throw new Error(
        `[@pr0s1k/primetime-kit] \`materialKit.theme.default.palette\` is "${undeclared.palette}", `
        + 'which is not declared in `materialKit.theme.themes`.\n'
        + `Declared palettes: ${undeclared.declared.join(', ') || '(none)'}`,
      )
    }

    const resolver = createResolver(import.meta.url)
    const runtime = (path: string) => resolver.resolve('./runtime', path)

    nuxt.options.alias['#kit'] = runtime('.')

    nuxt.options.build.transpile.push('@material/material-color-utilities')

    // Deliberately not global: global registration puts all ~90 components in the
    // entry graph, so a page rendering one button still downloads and parses every
    // chunk. Auto-import resolves `<m-*>` in consumer templates without it.
    addComponentsDir({
      path: runtime('components/ui'),
      extensions: ['vue'],
      pathPrefix: true,
      prefix: 'm',
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
    addImportsDir(runtime('shared/**'))

    injectScssPrelude(nuxt, runtime('assets/stylesheet/additional.scss'))

    // Let Vite's dev server serve the kit's runtime assets when the kit is
    // linked locally via `file:` — its dist lives outside the consumer root.
    nuxt.options.vite.server ||= {}
    nuxt.options.vite.server.fs ||= {}
    nuxt.options.vite.server.fs.allow ||= []
    nuxt.options.vite.server.fs.allow.push(runtime('.'))

    nuxt.options.css.push(runtime('assets/stylesheet/main.scss'))

    // `append: true` on every plugin: `addPlugin` unshifts by default, which would put
    // ours ahead of `@nuxtjs/device` whenever a consumer lists that module before this
    // one. `$device` would then be undefined while `seedViewport` runs, and every
    // mobile visitor would get a desktop-sized SSR render — silently.
    // `material` is universal: `$material` is read during SSR too, unlike the listener.
    addPlugin(runtime('plugins/material'), { append: true })
    addPlugin(runtime('plugins/theme-css'), { append: true })
    addPlugin(runtime('plugins/directives'), { append: true })
    addPlugin({ src: runtime('plugins/vue-final-modal.client'), mode: 'client' }, { append: true })
    addPlugin({ src: runtime('plugins/viewport.client'), mode: 'client' }, { append: true })

    registerThemePipeline(options, nuxt)

    nuxt.options.runtimeConfig.public.materialKit = options as MaterialKitOptions
  },
})
